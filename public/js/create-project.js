// Create Project JavaScript
console.log('📝 Create Project page loaded')

document.addEventListener('DOMContentLoaded', function () {
  // Check authentication
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  if (!token) {
    window.location.href = 'auth.html'
    return
  }

  // Initialize page
  initializePage()

  function initializePage() {
    // Display welcome message
    const welcomeElement = document.getElementById('welcomeUser')
    if (user.username) {
      welcomeElement.textContent = `Welcome, ${user.username}!`
    }

    // Set up event listeners
    setupEventListeners()
  }

  function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout)

    // Game selection change
    document
      .getElementById('projectGame')
      .addEventListener('change', handleGameSelection)

    // Add task functionality
    document
      .getElementById('addTaskBtn')
      .addEventListener('click', addTaskInput)

    // Form submission
    document
      .getElementById('createProjectForm')
      .addEventListener('submit', handleFormSubmission)

    // Set up initial task removal (for dynamically added tasks)
    setupTaskRemoval()
  }

  function handleGameSelection() {
    const gameSelect = document.getElementById('projectGame')
    const customGameGroup = document.getElementById('customGameGroup')

    if (gameSelect.value === 'other') {
      customGameGroup.style.display = 'block'
      document.getElementById('customGame').required = true
    } else {
      customGameGroup.style.display = 'none'
      document.getElementById('customGame').required = false
    }
  }

  function addTaskInput() {
    const tasksContainer = document.getElementById('tasksContainer')

    // Create new task input group
    const taskGroup = document.createElement('div')
    taskGroup.className = 'task-input-group'
    taskGroup.innerHTML = `
            <input type="text" placeholder="e.g., Build foundation" class="task-input">
            <button type="button" class="remove-task-btn">×</button>
        `

    // Add to container
    tasksContainer.appendChild(taskGroup)

    // Set up removal for this specific task
    const removeBtn = taskGroup.querySelector('.remove-task-btn')
    removeBtn.addEventListener('click', function () {
      taskGroup.remove()
      updateTaskRemovalButtons()
    })

    // Update all removal buttons visibility
    updateTaskRemovalButtons()

    // Focus the new input
    taskGroup.querySelector('.task-input').focus()
  }

  function setupTaskRemoval() {
    // Set up removal for existing tasks
    document.addEventListener('click', function (e) {
      if (e.target.classList.contains('remove-task-btn')) {
        e.target.closest('.task-input-group').remove()
        updateTaskRemovalButtons()
      }
    })
  }

  function updateTaskRemovalButtons() {
    const taskGroups = document.querySelectorAll('.task-input-group')
    taskGroups.forEach((group, index) => {
      const removeBtn = group.querySelector('.remove-task-btn')
      // Show remove button if there's more than one task or if it's not the first one
      if (taskGroups.length > 1) {
        removeBtn.style.display = 'flex'
      } else {
        removeBtn.style.display = 'none'
      }
    })
  }

  async function handleFormSubmission(e) {
    e.preventDefault()

    // Get form data
    const formData = collectFormData()

    // Validate required fields
    if (!validateForm(formData)) {
      return
    }

    // Show loading state
    setLoadingState(true)

    try {
      // Call real API to create project
      await createProjectAPI(formData)

      // Show success message
      showFormMessage(
        'Project created successfully! Redirecting to dashboard...',
        'success'
      )

      // Redirect to dashboard after delay
      setTimeout(() => {
        window.location.href = 'dashboard.html'
      }, 2000)
    } catch (error) {
      console.error('Error creating project:', error)
      showFormMessage(
        error.message || 'Error creating project. Please try again.',
        'error'
      )
    } finally {
      setLoadingState(false)
    }
  }

  function collectFormData() {
    const game = document.getElementById('projectGame').value
    const customGame = document.getElementById('customGame').value

    // Collect tasks
    const taskInputs = document.querySelectorAll('.task-input')
    const tasks = Array.from(taskInputs)
      .map((input) => input.value.trim())
      .filter((task) => task.length > 0)

    return {
      title: document.getElementById('projectTitle').value.trim(),
      game: game === 'other' ? customGame : game,
      description: document.getElementById('projectDescription').value.trim(),
      category: document.getElementById('projectCategory').value,
      priority: document.getElementById('projectPriority').value,
      estimatedDuration: document.getElementById('estimatedDuration').value,
      tasks: tasks,
    }
  }

  function validateForm(formData) {
    const errors = []

    if (!formData.title) {
      errors.push('Project title is required')
    }

    if (!formData.game) {
      errors.push('Please select a game')
    }

    if (!formData.description) {
      errors.push('Project description is required')
    }

    if (formData.title.length > 100) {
      errors.push('Project title must be less than 100 characters')
    }

    if (formData.description.length > 1000) {
      errors.push('Description must be less than 1000 characters')
    }

    if (errors.length > 0) {
      showFormMessage(errors.join('. '), 'error')
      return false
    }

    return true
  }

  async function createProjectAPI(formData) {
    const token = localStorage.getItem('token')

    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create project')
    }

    const data = await response.json()
    console.log('✅ Project created:', data.project)

    return data
  }

  function setLoadingState(isLoading) {
    const form = document.getElementById('createProjectForm')
    const submitBtn = document.querySelector('.submit-btn')

    if (isLoading) {
      form.classList.add('form-loading')
      submitBtn.classList.add('loading')
      submitBtn.disabled = true
      submitBtn.textContent = 'Creating Project...'
    } else {
      form.classList.remove('form-loading')
      submitBtn.classList.remove('loading')
      submitBtn.disabled = false
      submitBtn.textContent = 'Create Project'
    }
  }

  function showFormMessage(message, type) {
    // Remove existing message
    const existingMessage = document.querySelector('.form-message')
    if (existingMessage) {
      existingMessage.remove()
    }

    // Create new message
    const messageDiv = document.createElement('div')
    messageDiv.className = `form-message ${type}`
    messageDiv.textContent = message

    // Insert at top of form
    const form = document.getElementById('createProjectForm')
    form.insertBefore(messageDiv, form.firstChild)

    // Auto-remove success messages
    if (type === 'success') {
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.remove()
        }
      }, 3000)
    }

    // Scroll to message
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = 'index.html'
  }

  // Initialize task removal buttons on page load
  updateTaskRemovalButtons()
})
