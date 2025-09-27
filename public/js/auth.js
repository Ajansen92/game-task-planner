// Authentication JavaScript
console.log('🔐 Auth system loaded')

document.addEventListener('DOMContentLoaded', function () {
  // Get form elements
  const loginForm = document.getElementById('loginForm')
  const signupForm = document.getElementById('signupForm')
  const showSignupLink = document.getElementById('showSignup')
  const showLoginLink = document.getElementById('showLogin')

  // Form switching functionality
  showSignupLink.addEventListener('click', function (e) {
    e.preventDefault()
    switchToSignup()
  })

  showLoginLink.addEventListener('click', function (e) {
    e.preventDefault()
    switchToLogin()
  })

  function switchToSignup() {
    loginForm.style.display = 'none'
    signupForm.style.display = 'block'
    signupForm.style.animation = 'slideUp 0.4s ease-out'
  }

  function switchToLogin() {
    signupForm.style.display = 'none'
    loginForm.style.display = 'block'
    loginForm.style.animation = 'slideUp 0.4s ease-out'
  }

  // Handle login form submission
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault()

    const email = document.getElementById('loginEmail').value
    const password = document.getElementById('loginPassword').value

    // Basic validation
    if (!email || !password) {
      showMessage('Please fill in all fields', 'error')
      return
    }

    // For now, just show a success message (we'll connect to backend later)
    console.log('Login attempt:', { email, password: '***' })
    showMessage('Login functionality coming soon! 🚧', 'success')

    // TODO: Send to backend for authentication
    // loginUser(email, password);
  })

  // Handle signup form submission
  signupForm.addEventListener('submit', function (e) {
    e.preventDefault()

    const username = document.getElementById('signupUsername').value
    const email = document.getElementById('signupEmail').value
    const password = document.getElementById('signupPassword').value
    const confirmPassword = document.getElementById('confirmPassword').value

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      showMessage('Please fill in all fields', 'error')
      return
    }

    if (password !== confirmPassword) {
      showMessage('Passwords do not match', 'error')
      return
    }

    if (password.length < 6) {
      showMessage('Password must be at least 6 characters', 'error')
      return
    }

    // For now, just show a success message (we'll connect to backend later)
    console.log('Signup attempt:', { username, email, password: '***' })
    showMessage('Account creation functionality coming soon! 🚧', 'success')

    // TODO: Send to backend for registration
    // registerUser(username, email, password);
  })

  // Utility function to show messages
  function showMessage(text, type) {
    // Remove any existing messages
    const existingMessage = document.querySelector('.message')
    if (existingMessage) {
      existingMessage.remove()
    }

    // Create new message
    const message = document.createElement('div')
    message.className = `message ${type}-message`
    message.textContent = text

    // Insert at the top of the active form
    const activeForm =
      loginForm.style.display !== 'none' ? loginForm : signupForm
    const firstChild = activeForm.querySelector('h2')
    firstChild.parentNode.insertBefore(message, firstChild.nextSibling)

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (message.parentNode) {
        message.remove()
      }
    }, 5000)
  }

  // Email validation helper
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Enhanced validation for email field
  document.getElementById('loginEmail').addEventListener('blur', function () {
    if (this.value && !isValidEmail(this.value)) {
      showMessage('Please enter a valid email address', 'error')
    }
  })

  document.getElementById('signupEmail').addEventListener('blur', function () {
    if (this.value && !isValidEmail(this.value)) {
      showMessage('Please enter a valid email address', 'error')
    }
  })

  // Password strength indicator for signup
  document
    .getElementById('signupPassword')
    .addEventListener('input', function () {
      const password = this.value
      const confirmField = document.getElementById('confirmPassword')

      // Simple strength check
      if (password.length >= 6) {
        this.style.borderColor = '#48bb78'
      } else if (password.length > 0) {
        this.style.borderColor = '#f56565'
      } else {
        this.style.borderColor = '#e2e8f0'
      }

      // Check password match in real-time
      if (confirmField.value && confirmField.value !== password) {
        confirmField.style.borderColor = '#f56565'
      } else if (confirmField.value) {
        confirmField.style.borderColor = '#48bb78'
      }
    })

  // Confirm password matching
  document
    .getElementById('confirmPassword')
    .addEventListener('input', function () {
      const password = document.getElementById('signupPassword').value
      const confirmPassword = this.value

      if (confirmPassword && confirmPassword !== password) {
        this.style.borderColor = '#f56565'
      } else if (confirmPassword) {
        this.style.borderColor = '#48bb78'
      } else {
        this.style.borderColor = '#e2e8f0'
      }
    })
})
