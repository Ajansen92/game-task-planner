// Game Task Planner - Main JavaScript File
console.log('🎮 Game Task Planner loaded successfully!')

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
  // Add some interactive effects to feature cards only
  const featureCards = document.querySelectorAll('.feature')

  featureCards.forEach((card) => {
    card.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-8px) scale(1.02)'
    })

    card.addEventListener('mouseleave', function () {
      this.style.transform = 'translateY(0) scale(1)'
    })
  })

  // Project status object
  window.gameTaskPlanner = {
    version: '1.0.0',
    status: 'Development',
    features: {
      userAuth: 'Active',
      projectManagement: 'Coming Soon',
      taskTracking: 'Coming Soon',
    },
  }

  console.log('Game Task Planner Object:', window.gameTaskPlanner)
})
