// Project Details JavaScript
console.log('📋 Project Details page loaded')

let currentProject = null
let currentTasks = []
let currentFilter = 'all'
let editingTaskId = null
let teamMembers = []

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

  console.log('Project ID:', projectId)

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
    console.log('Setting up event listeners')

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout)

    // Add task buttons
    const addTaskBtn = document.getElementById('addTaskBtn')
    if (addTaskBtn) {
      addTaskBtn.addEventListener('click', () => {
        console.log('Add task button clicked')
        openTaskModal()
      })
    }

    // Edit project button
    const editProjectBtn = document.getElementById('editProjectBtn')
    if (editProjectBtn) {
      editProjectBtn.addEventListener('click', editProject)
    }

    // Invite member button
    const inviteMemberBtn = document.getElementById('inviteMemberBtn')
    if (inviteMemberBtn) {
      inviteMemberBtn.addEventListener('click', openInviteMemberModal)
    }

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        console.log('Filter clicked:', e.target.dataset.filter)
        filterTasks(e.target.dataset.filter)
      })
    })

    // Modal event listeners
    setupModalListeners()
  }

  function setupModalListeners() {
    console.log('Setting up modal listeners')

    const taskModal = document.getElementById('taskModal')
    const deleteModal = document.getElementById('deleteModal')
    const inviteMemberModal = document.getElementById('inviteMemberModal')

    if (!taskModal || !deleteModal || !inviteMemberModal) {
      console.error('Modals not found in DOM')
      return
    }

    // Close modal buttons
    document.querySelectorAll('.modal-close, .cancel-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        console.log('Close modal clicked')
        e.preventDefault()
        closeModals()
      })
    })

    // Click outside modal to close
    ;[taskModal, deleteModal, inviteMemberModal].forEach((modal) => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          console.log('Clicked outside modal')
          closeModals()
        }
      })
    })

    // Task form submission
    const taskForm = document.getElementById('taskForm')
    if (taskForm) {
      taskForm.addEventListener('submit', (e) => {
        console.log('Task form submitted')
        handleTaskSubmission(e)
      })
    }

    // Delete confirmation
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn')
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', (e) => {
        console.log('Confirm delete clicked')
        e.preventDefault()
        confirmDeleteTask()
      })
    }

    // Invite member form submission
    const inviteMemberForm = document.getElementById('inviteMemberForm')
    if (inviteMemberForm) {
      inviteMemberForm.addEventListener('submit', (e) => {
        console.log('Invite form submitted')
        handleInviteMemberSubmission(e)
      })
    }
  }

  async function loadProject(projectId) {
    try {
      console.log('Loading project from API:', projectId)
      const token = localStorage.getItem('token')

      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        console.error('Failed to load project, status:', response.status)
        throw new Error('Failed to load project')
      }

      const project = await response.json()
      console.log('Project loaded from API:', project)

      currentProject = project

      await loadTasks(projectId)
      await loadTeamMembers(projectId)
      displayProjectInfo(project)
    } catch (error) {
      console.error('Error loading project:', error)
      showNotification('Error loading project: ' + error.message, 'error')
      setTimeout(() => (window.location.href = 'dashboard.html'), 2000)
    }
  }

  async function loadTasks(projectId) {
    try {
      console.log('Loading tasks from API for project:', projectId)
      const token = localStorage.getItem('token')

      const response = await fetch(`/api/tasks/project/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        console.error('Failed to load tasks, status:', response.status)
        throw new Error('Failed to load tasks')
      }

      currentTasks = await response.json()
      console.log('Tasks loaded from API:', currentTasks)

      displayTasks()
      updateTaskStats()
    } catch (error) {
      console.error('Error loading tasks:', error)
      showNotification('Error loading tasks: ' + error.message, 'error')
      currentTasks = []
      displayTasks()
      updateTaskStats()
    }
  }

  async function loadTeamMembers(projectId) {
    try {
      console.log('Loading team members from API')
      const token = localStorage.getItem('token')

      const response = await fetch(`/api/team/project/${projectId}/members`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load team members')
      }

      const data = await response.json()
      console.log('Team data loaded:', data)

      teamMembers = data.members
      displayTeamMembers(data.members, data.invitations)
      updateTeamCount(data.members.length)

      // Show invite button if user is owner or admin
      if (
        currentProject.userRole === 'owner' ||
        currentProject.userRole === 'admin'
      ) {
        document.getElementById('inviteMemberBtn').style.display = 'block'
      }

      // Update task assignee dropdown with team members
      updateAssigneeDropdown()
    } catch (error) {
      console.error('Error loading team members:', error)
      showNotification('Error loading team members', 'error')
    }
  }

  function displayProjectInfo(project) {
    console.log('Displaying project info:', project)

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

    document.title = `${project.title} - Game Task Planner`
  }

  function displayTeamMembers(members, invitations) {
    const container = document.getElementById('teamMembersGrid')
    const currentUserId = JSON.parse(localStorage.getItem('user')).id

    if (!members || members.length === 0) {
      container.innerHTML =
        '<div class="loading-state">No team members found</div>'
      return
    }

    container.innerHTML = members
      .map((member) => {
        const isCurrentUser = member.user._id === currentUserId
        const canManage =
          currentProject.userRole === 'owner' ||
          (currentProject.userRole === 'admin' && member.role !== 'owner')

        const initials = member.user.username.substring(0, 2).toUpperCase()

        return `
                <div class="team-member-card">
                    <div class="member-header">
                        <div class="member-avatar">${initials}</div>
                        <div class="member-info">
                            <h4 class="member-name">${member.user.username} ${
          isCurrentUser ? '(You)' : ''
        }</h4>
                            <p class="member-email">${member.user.email}</p>
                        </div>
                    </div>
                    <div class="member-footer">
                        <span class="member-role-badge role-${
                          member.role
                        }">${member.role.toUpperCase()}</span>
                        <div class="member-actions">
                            ${
                              canManage && !isCurrentUser
                                ? `
                                <button class="member-action-btn danger" onclick="window.removeMember('${member._id}')">
                                    Remove
                                </button>
                            `
                                : ''
                            }
                        </div>
                    </div>
                    <p class="member-joined">Joined ${formatDate(
                      member.joinedAt
                    )}</p>
                </div>
            `
      })
      .join('')

    // Display pending invitations if user is owner/admin
    if (
      (currentProject.userRole === 'owner' ||
        currentProject.userRole === 'admin') &&
      invitations &&
      invitations.length > 0
    ) {
      const pendingInvites = invitations.filter(
        (inv) => inv.status === 'pending'
      )

      if (pendingInvites.length > 0) {
        document.getElementById('pendingInvitationsSection').style.display =
          'block'
        document.getElementById('pendingInvitationsList').innerHTML =
          pendingInvites
            .map(
              (inv) => `
                    <div class="invitation-card">
                        <div class="invitation-info">
                            <div class="invitation-email">${inv.email}</div>
                            <div class="invitation-date">Invited ${formatDate(
                              inv.invitedAt
                            )}</div>
                        </div>
                        <div class="invitation-actions">
                            <button class="invitation-cancel-btn" onclick="window.cancelInvitation('${
                              inv._id
                            }')">
                                Cancel
                            </button>
                        </div>
                    </div>
                `
            )
            .join('')
      }
    }
  }

  function updateTeamCount(count) {
    document.getElementById('teamMembers').textContent = count
  }

  function updateAssigneeDropdown() {
    const assigneeSelect = document.getElementById('taskAssignee')
    if (!assigneeSelect) return

    // Clear existing options except "Unassigned"
    assigneeSelect.innerHTML = '<option value="">Unassigned</option>'

    // Add team members as options
    teamMembers.forEach((member) => {
      const option = document.createElement('option')
      option.value = member.user._id
      option.textContent = member.user.username
      assigneeSelect.appendChild(option)
    })
  }

  function displayTasks() {
    console.log('Displaying tasks, filter:', currentFilter)
    const container = document.getElementById('tasksContainer')

    if (!container) {
      console.error('Tasks container not found')
      return
    }

    const filteredTasks = currentTasks.filter((task) => {
      if (currentFilter === 'all') return true
      return task.status === currentFilter
    })

    console.log('Filtered tasks:', filteredTasks)

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

      if (currentFilter === 'all') {
        const emptyAddBtn = container.querySelector('.empty-add-task')
        if (emptyAddBtn) {
          emptyAddBtn.addEventListener('click', () => {
            console.log('Empty state add task clicked')
            openTaskModal()
          })
        }
      }

      return
    }

    container.innerHTML = filteredTasks
      .map((task) => createTaskCard(task))
      .join('')

    filteredTasks.forEach((task) => {
      const taskCard = container.querySelector(`[data-task-id="${task._id}"]`)

      if (!taskCard) {
        console.error('Task card not found for task:', task._id)
        return
      }

      taskCard.addEventListener('click', (e) => {
        if (!e.target.closest('.task-action-btn')) {
          console.log('Task card clicked for editing:', task._id)
          openTaskModal(task)
        }
      })

      const editBtn = taskCard.querySelector('.edit-task-btn')
      const deleteBtn = taskCard.querySelector('.delete-task-btn')
      const toggleBtn = taskCard.querySelector('.toggle-status-btn')

      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          console.log('Edit button clicked for task:', task._id)
          openTaskModal(task)
        })
      }

      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          console.log('Delete button clicked for task:', task._id)
          openDeleteModal(task._id)
        })
      }

      if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          console.log('Toggle status clicked for task:', task._id)
          toggleTaskStatus(task._id)
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

    const assigneeName = task.assignee
      ? task.assignee.username || 'Assigned'
      : 'Unassigned'

    return `
            <div class="${cardClass}" data-task-id="${task._id}">
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
                        ${assigneeName}
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
    )

    document.getElementById('totalTasks').textContent = total
    document.getElementById('completedTasks').textContent = completed
    document.getElementById('inProgressTasks').textContent = inProgress
  }

  function filterTasks(filter) {
    console.log('Filtering tasks to:', filter)
    currentFilter = filter

    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.filter === filter)
    })

    displayTasks()
  }

  function openTaskModal(task = null) {
    console.log('Opening task modal for task:', task)

    editingTaskId = task ? task._id : null
    const modal = document.getElementById('taskModal')
    const form = document.getElementById('taskForm')

    if (!modal || !form) {
      console.error('Modal or form not found')
      return
    }

    document.getElementById('modalTitle').textContent = task
      ? 'Edit Task'
      : 'Add New Task'

    if (task) {
      document.getElementById('taskTitle').value = task.title
      document.getElementById('taskDescription').value = task.description || ''
      document.getElementById('taskPriority').value = task.priority
      document.getElementById('taskStatus').value = task.status
      document.getElementById('taskAssignee').value = task.assignee
        ? task.assignee._id
        : ''
    } else {
      form.reset()
    }

    modal.style.display = 'flex'

    setTimeout(() => {
      document.getElementById('taskTitle').focus()
    }, 100)
  }

  function openDeleteModal(taskId) {
    console.log('Opening delete modal for task:', taskId)
    editingTaskId = taskId
    const modal = document.getElementById('deleteModal')

    if (!modal) {
      console.error('Delete modal not found')
      return
    }

    modal.style.display = 'flex'
  }

  function openInviteMemberModal() {
    console.log('Opening invite member modal')
    const modal = document.getElementById('inviteMemberModal')
    const form = document.getElementById('inviteMemberForm')

    if (!modal || !form) {
      console.error('Invite modal or form not found')
      return
    }

    form.reset()
    modal.style.display = 'flex'

    setTimeout(() => {
      document.getElementById('inviteEmail').focus()
    }, 100)
  }

  function closeModals() {
    console.log('Closing modals')

    const taskModal = document.getElementById('taskModal')
    const deleteModal = document.getElementById('deleteModal')
    const inviteMemberModal = document.getElementById('inviteMemberModal')

    if (taskModal) taskModal.style.display = 'none'
    if (deleteModal) deleteModal.style.display = 'none'
    if (inviteMemberModal) inviteMemberModal.style.display = 'none'

    editingTaskId = null
  }

  async function handleTaskSubmission(e) {
    e.preventDefault()
    console.log('Form submitted')

    const formData = {
      title: document.getElementById('taskTitle').value.trim(),
      description: document.getElementById('taskDescription').value.trim(),
      priority: document.getElementById('taskPriority').value,
      status: document.getElementById('taskStatus').value,
      assignee: document.getElementById('taskAssignee').value || null,
      project: currentProject._id,
    }

    console.log('Form data:', formData)
    console.log('Editing task ID:', editingTaskId)

    if (!formData.title) {
      showNotification('Task title is required', 'error')
      return
    }

    try {
      const token = localStorage.getItem('token')

      if (editingTaskId) {
        console.log('Updating task via API')

        const response = await fetch(`/api/tasks/${editingTaskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          throw new Error('Failed to update task')
        }

        showNotification('Task updated successfully', 'success')
      } else {
        console.log('Creating new task via API')

        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          throw new Error('Failed to create task')
        }

        showNotification('Task created successfully', 'success')
      }

      await loadTasks(currentProject._id)
      closeModals()
    } catch (error) {
      console.error('Error saving task:', error)
      showNotification('Error saving task: ' + error.message, 'error')
    }
  }

  async function handleInviteMemberSubmission(e) {
    e.preventDefault()
    console.log('Invite form submitted')

    const email = document.getElementById('inviteEmail').value.trim()

    if (!email) {
      showNotification('Email is required', 'error')
      return
    }

    try {
      const token = localStorage.getItem('token')

      const response = await fetch(
        `/api/team/project/${currentProject._id}/invite`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send invitation')
      }

      showNotification('Invitation sent successfully!', 'success')
      closeModals()

      // Reload team members to show the pending invitation
      await loadTeamMembers(currentProject._id)
    } catch (error) {
      console.error('Error sending invitation:', error)
      showNotification(error.message, 'error')
    }
  }

  async function toggleTaskStatus(taskId) {
    console.log('Toggling task status for:', taskId)

    const task = currentTasks.find((t) => t._id === taskId)
    if (!task) {
      console.error('Task not found:', taskId)
      return
    }

    const statusCycle = {
      pending: 'in-progress',
      'in-progress': 'completed',
      completed: 'pending',
    }

    const newStatus = statusCycle[task.status]

    try {
      const token = localStorage.getItem('token')

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update task status')
      }

      await loadTasks(currentProject._id)
      showNotification(
        `Task marked as ${newStatus.replace('-', ' ')}`,
        'success'
      )
    } catch (error) {
      console.error('Error toggling task status:', error)
      showNotification('Error updating task status', 'error')
    }
  }

  async function confirmDeleteTask() {
    console.log('Confirming delete for task:', editingTaskId)

    if (!editingTaskId) {
      console.error('No task ID set for deletion')
      return
    }

    try {
      const token = localStorage.getItem('token')

      const response = await fetch(`/api/tasks/${editingTaskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete task')
      }

      await loadTasks(currentProject._id)
      closeModals()
      showNotification('Task deleted successfully', 'success')
    } catch (error) {
      console.error('Error deleting task:', error)
      showNotification('Error deleting task: ' + error.message, 'error')
    }
  }

  // Global functions for onclick handlers
  window.removeMember = async function (memberId) {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')

      const response = await fetch(
        `/api/team/project/${currentProject._id}/members/${memberId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to remove member')
      }

      showNotification('Team member removed successfully', 'success')
      await loadTeamMembers(currentProject._id)
    } catch (error) {
      console.error('Error removing member:', error)
      showNotification(error.message, 'error')
    }
  }

  window.cancelInvitation = async function (invitationId) {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return
    }

    console.log('Canceling invitation:', invitationId)
    showNotification('Cancel invitation feature coming soon', 'info')
    // TODO: Implement cancel invitation API endpoint
  }

  function editProject() {
    showNotification('Project editing coming soon! 🚧', 'info')
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = 'index.html'
  }

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
