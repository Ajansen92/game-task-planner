// Dashboard JavaScript
console.log('📊 Dashboard loaded')

document.addEventListener('DOMContentLoaded', function () {
  // Check if user is logged in
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  if (!token) {
    // Redirect to login if not authenticated
    window.location.href = 'auth.html'
    return
  }

  // Initialize dashboard
  initializeDashboard()

  function initializeDashboard() {
    // Display welcome message
    const welcomeElement = document.getElementById('welcomeUser')
    if (user.username) {
      welcomeElement.textContent = `Welcome, ${user.username}!`
    }

    // Load user data and projects
    loadDashboardData()

    // Set up event listeners
    setupEventListeners()
  }

  function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout)

    // Create project buttons
    const createBtns = document.querySelectorAll('.create-btn')
    createBtns.forEach((btn) => {
      btn.addEventListener('click', createProject)
    })

    // New project button in header
    document
      .getElementById('createProjectBtn')
      .addEventListener('click', createProject)
  }

  async function loadDashboardData() {
    try {
      // Load projects from localStorage (temporary until we build backend)
      const userProjects = JSON.parse(
        localStorage.getItem('userProjects') || '[]'
      )

      // Load all tasks to calculate stats
      const allTasks = JSON.parse(localStorage.getItem('projectTasks') || '{}')

      // Calculate comprehensive stats
      let totalTasks = 0
      let completedTasks = 0
      let inProgressTasks = 0

      userProjects.forEach((project) => {
        const projectTasks = allTasks[project.id] || []
        totalTasks += projectTasks.length
        completedTasks += projectTasks.filter(
          (t) => t.status === 'completed'
        ).length
        inProgressTasks += projectTasks.filter(
          (t) => t.status === 'in-progress'
        ).length
      })

      const stats = {
        activeProjects: userProjects.length,
        pendingTasks: totalTasks - completedTasks,
        completedTasks: completedTasks,
      }

      updateStats(stats)
      loadProjects(userProjects, allTasks)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      showNotification('Error loading dashboard data', 'error')
    }
  }

  function updateStats(stats) {
    document.getElementById('activeProjects').textContent = stats.activeProjects
    document.getElementById('pendingTasks').textContent = stats.pendingTasks
    document.getElementById('completedTasks').textContent = stats.completedTasks
  }

  function loadProjects(projects, allTasks = {}) {
    const projectsList = document.getElementById('projectsList')

    if (projects.length === 0) {
      // Show empty state (already in HTML)
      return
    }

    // Clear empty state and add projects
    projectsList.innerHTML = ''

    projects.forEach((project) => {
      // Calculate actual task count from stored tasks
      const projectTasks = allTasks[project.id] || []
      const updatedProject = {
        ...project,
        taskCount: projectTasks.length,
        completedTasks: projectTasks.filter((t) => t.status === 'completed')
          .length,
      }

      const projectCard = createProjectCard(updatedProject)
      projectsList.appendChild(projectCard)
    })
  }

  function createProjectCard(project) {
    const card = document.createElement('div')
    card.className = 'project-card'

    // Calculate completion percentage
    const completionPercent =
      project.taskCount > 0
        ? Math.round((project.completedTasks / project.taskCount) * 100)
        : 0

    card.innerHTML = `
            <div class="project-header">
                <h3 class="project-title">${project.title}</h3>
                <span class="project-game">${project.game}</span>
            </div>
            <p class="project-description">${project.description}</p>
            <div class="project-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${completionPercent}%"></div>
                </div>
                <span class="progress-text">${completionPercent}% Complete</span>
            </div>
            <div class="project-stats">
                <span>Tasks: ${project.taskCount || 0}</span>
                <span>Completed: ${project.completedTasks || 0}</span>
                <span>Members: ${project.memberCount || 1}</span>
                <span>Updated: ${formatDate(project.updatedAt)}</span>
            </div>
        `

    card.addEventListener('click', () => {
      // Navigate to project details page
      window.location.href = `project-details.html?id=${project.id}`
    })

    return card
  }

  function createProject() {
    // Navigate to create project page
    window.location.href = 'create-project.html'
  }

  function logout() {
    // Clear stored data
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('userProjects') // Clear projects too
    localStorage.removeItem('projectTasks') // Clear tasks too

    // Show confirmation
    showNotification('Logged out successfully', 'success')

    // Redirect to home page
    setTimeout(() => {
      window.location.href = 'index.html'
    }, 1000)
  }

  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div')
    notification.className = `notification notification-${type}`
    notification.textContent = message

    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '500',
      zIndex: '1000',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease',
    })

    // Set background color based on type
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

    // Add to page
    document.body.appendChild(notification)

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)'
    }, 100)

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)'
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification)
        }
      }, 300)
    }, 3000)
  }

  function formatDate(date) {
    if (!date) return 'Unknown'
    const now = new Date()
    const diff = now - new Date(date)
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return new Date(date).toLocaleDateString()
  }

  // Check token validity periodically
  setInterval(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        // Token is invalid, logout
        logout()
      }
    } catch (error) {
      console.error('Token validation error:', error)
    }
  }, 5 * 60 * 1000) // Check every 5 minutes
})
