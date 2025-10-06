// User profile routes
const express = require('express')
const router = express.Router()
const User = require('../models/User')
const auth = require('../middleware/auth')

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get public profile by user ID
router.get('/public/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      '-password -email'
    )

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatar: user.avatar,
      createdAt: user.createdAt,
    })
  } catch (error) {
    console.error('Get public profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, displayName, bio } = req.body

    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Check if username is being changed and if it's already taken
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username })
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' })
      }
      user.username = username
    }

    // Update other fields
    if (displayName !== undefined) user.displayName = displayName
    if (bio !== undefined) user.bio = bio

    await user.save()

    // Return user without password
    const updatedUser = await User.findById(user._id).select('-password')

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update avatar
router.put('/avatar', auth, async (req, res) => {
  try {
    const { avatar } = req.body

    if (!avatar) {
      return res.status(400).json({ message: 'Avatar data required' })
    }

    // Validate base64 format and size (limit to ~200KB base64 string)
    if (avatar.length > 200000) {
      return res
        .status(400)
        .json({ message: 'Avatar too large. Please use an image under 150KB' })
    }

    // Basic validation that it's a base64 image
    if (!avatar.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Invalid image format' })
    }

    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    user.avatar = avatar
    await user.save()

    res.json({
      message: 'Avatar updated successfully',
      avatar: user.avatar,
    })
  } catch (error) {
    console.error('Update avatar error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Remove avatar
router.delete('/avatar', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    user.avatar = null
    await user.save()

    res.json({ message: 'Avatar removed successfully' })
  } catch (error) {
    console.error('Remove avatar error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Change password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Please provide both current and new password',
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'New password must be at least 6 characters',
      })
    }

    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' })
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword
    await user.save()

    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
