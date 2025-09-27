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
      // For now, we'll use mock data since we haven't built the projects backend yet
      // TODO: Replace with real API calls when we build the projects system

      updateStats({
        activeProjects: 0,
        pendingTasks: 0,
        completedTasks: 0,
      })

      // Load projects (empty for now)
      loadProjects([])
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

  function loadProjects(projects) {
    const projectsList = document.getElementById('projectsList')

    if (projects.length === 0) {
      // Show empty state (already in HTML)
      return
    }

    // Clear empty state and add projects
    projectsList.innerHTML = ''

    projects.forEach((project) => {
      const projectCard = createProjectCard(project)
      projectsList.appendChild(projectCard)
    })
  }

  function createProjectCard(project) {
    const card = document.createElement('div')
    card.className = 'project-card'
    card.innerHTML = `
            <div class="project-header">
                <h3 class="project-title">${project.title}</h3>
                <span class="project-game">${project.game}</span>
            </div>
            <p class="project-description">${project.description}</p>
            <div class="project-stats">
                <span>Tasks: ${project.taskCount || 0}</span>
                <span>Members: ${project.memberCount || 1}</span>
                <span>Updated: ${formatDate(project.updatedAt)}</span>
            </div>
        `

    card.addEventListener('click', () => {
      // TODO: Navigate to project details page
      console.log('Open project:', project.id)
      showNotification('Project details page coming soon!', 'info')
    })

    return card
  }

  function createProject() {
    // TODO: Open create project modal or navigate to create project page
    console.log('Create new project clicked')
    showNotification('Project creation coming soon! 🚧', 'info')

    // For now, let's simulate creating a project
    setTimeout(() => {
      const mockProject = {
        id: Date.now(),
        title: 'Sample Minecraft Castle',
        game: 'Minecraft',
        description: 'Building a massive medieval castle with the team',
        taskCount: 5,
        memberCount: 3,
        updatedAt: new Date(),
      }

      // Add to projects list (this will be replaced with real data later)
      const currentStats = {
        activeProjects: 1,
        pendingTasks: 5,
        completedTasks: 0,
      }

      updateStats(currentStats)
      loadProjects([mockProject])

      showNotification('Sample project created! (Demo only)', 'success')
    }, 1000)
  }

  function logout() {
    // Clear stored data
    localStorage.removeItem('token')
    localStorage.removeItem('user')

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
