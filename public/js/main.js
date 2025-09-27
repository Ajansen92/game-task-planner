// Game Task Planner - Main JavaScript File
console.log('🎮 Game Task Planner loaded successfully!')

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
  // Get the CTA button
  const ctaButton = document.querySelector('.cta-button')

  // Add click event to the CTA button
  if (ctaButton) {
    ctaButton.addEventListener('click', function () {
      alert(
        'Welcome to Game Task Planner! 🎮\n\nSign up and login features coming soon!'
      )
    })
  }

  // Add some interactive effects to feature cards
  const featureCards = document.querySelectorAll('.feature')

  featureCards.forEach((card) => {
    card.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-8px) scale(1.02)'
    })

    card.addEventListener('mouseleave', function () {
      this.style.transform = 'translateY(0) scale(1)'
    })
  })

  // Simple function to show we're ready for future features
  window.gameTaskPlanner = {
    version: '1.0.0',
    status: 'Development',
    features: {
      userAuth: 'Coming Soon',
      projectManagement: 'Coming Soon',
      taskTracking: 'Coming Soon',
    },
  }

  console.log('Game Task Planner Object:', window.gameTaskPlanner)
})
