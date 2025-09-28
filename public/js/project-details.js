// Project Details JavaScript
console.log('📋 Project Details page loaded')

let currentProject = null
let currentTasks = []
let currentFilter = 'all'
let editingTaskId = null

document.addEventListener('DOMContentLoaded', function () {
  // Check authentication
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  if (!token) {
    window.location.href = 'auth.html'
    return
  }

  // Get project ID from URL
  const urlParams = new URLSearchParams(window.location.search)
  const projectId = urlParams.get('id')

  if (!projectId) {
    showNotification('No project specified', 'error')
    setTimeout(() => (window.location.href = 'dashboard.html'), 2000)
    return
  }

  console.log('Project ID:', projectId) // Debug log

  // Initialize page
  initializePage(projectId)

  function initializePage(projectId) {
    // Display welcome message
    const welcomeElement = document.getElementById('welcomeUser')
    if (user.username) {
      welcomeElement.textContent = `Welcome, ${user.username}!`
    }

    // Load project data
    loadProject(projectId)

    // Set up event listeners
    setupEventListeners()
  }

  function setupEventListeners() {
    console.log('Setting up event listeners') // Debug log

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout)

    // Add task buttons
    const addTaskBtn = document.getElementById('addTaskBtn')
    if (addTaskBtn) {
      addTaskBtn.addEventListener('click', () => {
        console.log('Add task button clicked') // Debug log
        openTaskModal()
      })
    }

    // Edit project button
    const editProjectBtn = document.getElementById('editProjectBtn')
    if (editProjectBtn) {
      editProjectBtn.addEventListener('click', editProject)
    }

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        console.log('Filter clicked:', e.target.dataset.filter) // Debug log
        filterTasks(e.target.dataset.filter)
      })
    })

    // Modal event listeners
    setupModalListeners()
  }

  function setupModalListeners() {
    console.log('Setting up modal listeners') // Debug log

    // Task modal
    const taskModal = document.getElementById('taskModal')
    const deleteModal = document.getElementById('deleteModal')

    if (!taskModal || !deleteModal) {
      console.error('Modals not found in DOM')
      return
    }

    // Close modal buttons
    document.querySelectorAll('.modal-close, .cancel-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        console.log('Close modal clicked') // Debug log
        e.preventDefault()
        closeModals()
      })
    })

    // Click outside modal to close
    taskModal.addEventListener('click', (e) => {
      if (e.target === taskModal) {
        console.log('Clicked outside task modal') // Debug log
        closeModals()
      }
    })

    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) {
        console.log('Clicked outside delete modal') // Debug log
        closeModals()
      }
    })

    // Task form submission
    const taskForm = document.getElementById('taskForm')
    if (taskForm) {
      taskForm.addEventListener('submit', (e) => {
        console.log('Task form submitted') // Debug log
        handleTaskSubmission(e)
      })
    }

    // Delete confirmation
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn')
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', (e) => {
        console.log('Confirm delete clicked') // Debug log
        e.preventDefault()
        confirmDeleteTask()
      })
    }
  }

  function loadProject(projectId) {
    try {
      console.log('Loading project:', projectId) // Debug log

      // Load from localStorage (temporary until backend)
      const userProjects = JSON.parse(
        localStorage.getItem('userProjects') || '[]'
      )
      const project = userProjects.find((p) => p.id === projectId)

      console.log('Found project:', project) // Debug log

      if (!project) {
        showNotification('Project not found', 'error')
        setTimeout(() => (window.location.href = 'dashboard.html'), 2000)
        return
      }

      currentProject = project

      // Load tasks for this project
      loadTasks(projectId)

      // Display project information
      displayProjectInfo(project)
    } catch (error) {
      console.error('Error loading project:', error)
      showNotification('Error loading project', 'error')
    }
  }

  function loadTasks(projectId) {
    console.log('Loading tasks for project:', projectId) // Debug log

    // Load tasks from localStorage
    const allTasks = JSON.parse(localStorage.getItem('projectTasks') || '{}')
    currentTasks = allTasks[projectId] || []

    console.log('Loaded tasks:', currentTasks) // Debug log

    // If project has initial tasks but no stored tasks, convert them
    if (
      currentTasks.length === 0 &&
      currentProject.tasks &&
      currentProject.tasks.length > 0
    ) {
      console.log('Converting initial tasks:', currentProject.tasks) // Debug log

      currentTasks = currentProject.tasks.map((taskTitle, index) => ({
        id: `task_${Date.now()}_${index}`,
        title: taskTitle,
        description: '',
        status: 'pending',
        priority: 'medium',
        assignee: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))

      // Save converted tasks
      saveTasks()
    }

    displayTasks()
    updateTaskStats()
  }

  function displayProjectInfo(project) {
    console.log('Displaying project info:', project) // Debug log

    document.getElementById('projectTitle').textContent = project.title
    document.getElementById('projectGame').textContent = project.game
    document.getElementById('projectDescription').textContent =
      project.description
    document.getElementById('projectCategory').textContent = formatCategory(
      project.category
    )
    document.getElementById('projectPriority').textContent = formatPriority(
      project.priority
    )
    document.getElementById('projectDuration').textContent = formatDuration(
      project.estimatedDuration
    )
    document.getElementById('projectCreated').textContent = formatDate(
      project.createdAt
    )

    // Update page title
    document.title = `${project.title} - Game Task Planner`
  }

  function displayTasks() {
    console.log('Displaying tasks, filter:', currentFilter) // Debug log
    const container = document.getElementById('tasksContainer')

    if (!container) {
      console.error('Tasks container not found')
      return
    }

    // Filter tasks based on current filter
    const filteredTasks = currentTasks.filter((task) => {
      if (currentFilter === 'all') return true
      return task.status === currentFilter
    })

    console.log('Filtered tasks:', filteredTasks) // Debug log

    if (filteredTasks.length === 0) {
      container.innerHTML = `
                <div class="empty-tasks">
                    <div class="empty-icon">📝</div>
                    <h3>${
                      currentFilter === 'all'
                        ? 'No tasks yet'
                        : `No ${currentFilter} tasks`
                    }</h3>
                    <p>${
                      currentFilter === 'all'
                        ? 'Add your first task to get started!'
                        : `No tasks match the ${currentFilter} filter.`
                    }</p>
                    ${
                      currentFilter === 'all'
                        ? '<button class="action-btn primary empty-add-task">Add Task</button>'
                        : ''
                    }
                </div>
            `

      // Re-add event listener for empty state button
      if (currentFilter === 'all') {
        const emptyAddBtn = container.querySelector('.empty-add-task')
        if (emptyAddBtn) {
          emptyAddBtn.addEventListener('click', () => {
            console.log('Empty state add task clicked') // Debug log
            openTaskModal()
          })
        }
      }

      return
    }

    // Display tasks
    container.innerHTML = filteredTasks
      .map((task) => createTaskCard(task))
      .join('')

    // Add event listeners to task cards
    filteredTasks.forEach((task) => {
      const taskCard = container.querySelector(`[data-task-id="${task.id}"]`)

      if (!taskCard) {
        console.error('Task card not found for task:', task.id)
        return
      }

      // Task card click (for editing)
      taskCard.addEventListener('click', (e) => {
        if (!e.target.closest('.task-action-btn')) {
          console.log('Task card clicked for editing:', task.id) // Debug log
          openTaskModal(task)
        }
      })

      // Action buttons
      const editBtn = taskCard.querySelector('.edit-task-btn')
      const deleteBtn = taskCard.querySelector('.delete-task-btn')
      const toggleBtn = taskCard.querySelector('.toggle-status-btn')

      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          console.log('Edit button clicked for task:', task.id) // Debug log
          openTaskModal(task)
        })
      }

      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          console.log('Delete button clicked for task:', task.id) // Debug log
          openDeleteModal(task.id)
        })
      }

      if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          console.log('Toggle status clicked for task:', task.id) // Debug log
          toggleTaskStatus(task.id)
        })
      }
    })
  }

  function createTaskCard(task) {
    const statusIcon = {
      pending: '⏳',
      'in-progress': '🔄',
      completed: '✅',
    }

    const priorityClass = `badge-priority ${task.priority}`
    const statusClass = `badge-status ${task.status}`
    const cardClass =
      task.status === 'completed'
        ? 'task-card completed'
        : task.status === 'in-progress'
        ? 'task-card in-progress'
        : 'task-card'

    return `
            <div class="${cardClass}" data-task-id="${task.id}">
                <div class="task-header">
                    <h4 class="task-title ${
                      task.status === 'completed' ? 'completed' : ''
                    }">${task.title}</h4>
                    <div class="task-actions">
                        <button class="task-action-btn toggle-status-btn" title="${
                          task.status === 'completed'
                            ? 'Mark as pending'
                            : 'Mark as completed'
                        }">
                            ${statusIcon[task.status]}
                        </button>
                        <button class="task-action-btn edit-task-btn" title="Edit task">✏️</button>
                        <button class="task-action-btn delete-task-btn" title="Delete task">🗑️</button>
                    </div>
                </div>
                ${
                  task.description
                    ? `<p class="task-description">${task.description}</p>`
                    : ''
                }
                <div class="task-meta">
                    <div class="task-badges">
                        <span class="task-badge ${priorityClass}">${task.priority}</span>
                        <span class="task-badge ${statusClass}">${task.status.replace('-', ' ')}</span>
                    </div>
                    <div class="task-assignee">
                        ${
                          task.assignee
                            ? `Assigned to: ${
                                task.assignee === 'me' ? 'Me' : task.assignee
                              }`
                            : 'Unassigned'
                        }
                    </div>
                </div>
            </div>
        `
  }

  function updateTaskStats() {
    const total = currentTasks.length
    const completed = currentTasks.filter(
      (t) => t.status === 'completed'
    ).length
    const inProgress = currentTasks.filter(
      (t) => t.status === 'in-progress'
    ).length

    console.log(
      'Updating stats - Total:',
      total,
      'Completed:',
      completed,
      'In Progress:',
      inProgress
    ) // Debug log

    document.getElementById('totalTasks').textContent = total
    document.getElementById('completedTasks').textContent = completed
    document.getElementById('inProgressTasks').textContent = inProgress
  }

  function filterTasks(filter) {
    console.log('Filtering tasks to:', filter) // Debug log
    currentFilter = filter

    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.filter === filter)
    })

    displayTasks()
  }

  function openTaskModal(task = null) {
    console.log('Opening task modal for task:', task) // Debug log

    editingTaskId = task ? task.id : null
    const modal = document.getElementById('taskModal')
    const form = document.getElementById('taskForm')

    if (!modal || !form) {
      console.error('Modal or form not found')
      return
    }

    // Update modal title
    document.getElementById('modalTitle').textContent = task
      ? 'Edit Task'
      : 'Add New Task'

    // Populate form if editing
    if (task) {
      document.getElementById('taskTitle').value = task.title
      document.getElementById('taskDescription').value = task.description || ''
      document.getElementById('taskPriority').value = task.priority
      document.getElementById('taskStatus').value = task.status
      document.getElementById('taskAssignee').value = task.assignee || ''
    } else {
      form.reset()
    }

    modal.style.display = 'flex'

    // Focus the title input
    setTimeout(() => {
      document.getElementById('taskTitle').focus()
    }, 100)
  }

  function openDeleteModal(taskId) {
    console.log('Opening delete modal for task:', taskId) // Debug log
    editingTaskId = taskId
    const modal = document.getElementById('deleteModal')

    if (!modal) {
      console.error('Delete modal not found')
      return
    }

    modal.style.display = 'flex'
  }

  function closeModals() {
    console.log('Closing modals') // Debug log

    const taskModal = document.getElementById('taskModal')
    const deleteModal = document.getElementById('deleteModal')

    if (taskModal) taskModal.style.display = 'none'
    if (deleteModal) deleteModal.style.display = 'none'

    editingTaskId = null
  }

  async function handleTaskSubmission(e) {
    e.preventDefault()
    console.log('Form submitted') // Debug log

    const formData = {
      title: document.getElementById('taskTitle').value.trim(),
      description: document.getElementById('taskDescription').value.trim(),
      priority: document.getElementById('taskPriority').value,
      status: document.getElementById('taskStatus').value,
      assignee: document.getElementById('taskAssignee').value,
      updatedAt: new Date().toISOString(),
    }

    console.log('Form data:', formData) // Debug log
    console.log('Editing task ID:', editingTaskId) // Debug log

    if (!formData.title) {
      showNotification('Task title is required', 'error')
      return
    }

    try {
      if (editingTaskId) {
        // Update existing task
        console.log('Updating task') // Debug log
        const taskIndex = currentTasks.findIndex((t) => t.id === editingTaskId)
        console.log('Task index:', taskIndex) // Debug log

        if (taskIndex !== -1) {
          currentTasks[taskIndex] = { ...currentTasks[taskIndex], ...formData }
          console.log('Updated task:', currentTasks[taskIndex]) // Debug log
          showNotification('Task updated successfully', 'success')
        }
      } else {
        // Create new task
        console.log('Creating new task') // Debug log
        const newTask = {
          id: `task_${Date.now()}`,
          ...formData,
          createdAt: new Date().toISOString(),
        }
        currentTasks.push(newTask)
        console.log('New task created:', newTask) // Debug log
        showNotification('Task created successfully', 'success')
      }

      saveTasks()
      displayTasks()
      updateTaskStats()
      closeModals()
    } catch (error) {
      console.error('Error saving task:', error)
      showNotification('Error saving task', 'error')
    }
  }

  function toggleTaskStatus(taskId) {
    console.log('Toggling task status for:', taskId) // Debug log

    const task = currentTasks.find((t) => t.id === taskId)
    if (!task) {
      console.error('Task not found:', taskId)
      return
    }

    // Cycle through statuses: pending -> in-progress -> completed -> pending
    const statusCycle = {
      pending: 'in-progress',
      'in-progress': 'completed',
      completed: 'pending',
    }

    const oldStatus = task.status
    task.status = statusCycle[task.status]
    task.updatedAt = new Date().toISOString()

    console.log('Status changed from', oldStatus, 'to', task.status) // Debug log

    saveTasks()
    displayTasks()
    updateTaskStats()

    showNotification(
      `Task marked as ${task.status.replace('-', ' ')}`,
      'success'
    )
  }

  function confirmDeleteTask() {
    console.log('Confirming delete for task:', editingTaskId) // Debug log

    if (!editingTaskId) {
      console.error('No task ID set for deletion')
      return
    }

    const taskIndex = currentTasks.findIndex((t) => t.id === editingTaskId)
    console.log('Task index for deletion:', taskIndex) // Debug log

    if (taskIndex !== -1) {
      const deletedTask = currentTasks.splice(taskIndex, 1)[0]
      console.log('Deleted task:', deletedTask) // Debug log

      saveTasks()
      displayTasks()
      updateTaskStats()
      closeModals()
      showNotification('Task deleted successfully', 'success')
    } else {
      console.error('Task not found for deletion')
      showNotification('Error: Task not found', 'error')
    }
  }

  function saveTasks() {
    try {
      console.log('Saving tasks:', currentTasks) // Debug log

      const allTasks = JSON.parse(localStorage.getItem('projectTasks') || '{}')
      allTasks[currentProject.id] = currentTasks
      localStorage.setItem('projectTasks', JSON.stringify(allTasks))

      console.log('Tasks saved successfully') // Debug log
    } catch (error) {
      console.error('Error saving tasks:', error)
    }
  }

  function editProject() {
    showNotification('Project editing coming soon! 🚧', 'info')
    // TODO: Navigate to edit project page or open modal
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = 'index.html'
  }

  // Utility functions
  function formatCategory(category) {
    return category
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  function formatPriority(priority) {
    return priority.charAt(0).toUpperCase() + priority.slice(1)
  }

  function formatDuration(duration) {
    return duration
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  function formatDate(dateString) {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function showNotification(message, type = 'info') {
    const notification = document.createElement('div')
    notification.className = `notification notification-${type}`
    notification.textContent = message

    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '500',
      zIndex: '1001',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease',
    })

    switch (type) {
      case 'success':
        notification.style.background = '#48bb78'
        break
      case 'error':
        notification.style.background = '#f56565'
        break
      case 'info':
        notification.style.background = '#4299e1'
        break
      default:
        notification.style.background = '#4a5568'
    }

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.style.transform = 'translateX(0)'
    }, 100)

    setTimeout(() => {
      notification.style.transform = 'translateX(100%)'
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification)
        }
      }, 300)
    }, 3000)
  }
})
