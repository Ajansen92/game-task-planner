// Authentication routes
const express = require('express')
const jwt = require('jsonwebtoken')
const router = express.Router()
const User = require('../models/User')

// Register route
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 6 characters' })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'User already exists with this email' })
    }

    // Check if username is taken
    const existingUsername = await User.findOne({ username })
    if (existingUsername) {
      return res.status(400).json({ message: 'Username is already taken' })
    }

    // Create user (password will be hashed by the model pre-save hook)
    const newUser = new User({
      username,
      email: email.toLowerCase(),
      password,
    })

    await newUser.save()

    // Create JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    )

    console.log('✅ New user registered:', { username, email })

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: newUser._id.toString(),
        _id: newUser._id.toString(),
        username: newUser.username,
        email: newUser.email,
      },
    })
  } catch (error) {
    console.error('❌ Registration error:', error)
    res.status(500).json({ message: 'Server error during registration' })
  }
})

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required' })
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    // Check password using the model method
    const isValidPassword = await user.comparePassword(password)
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    )

    console.log('✅ User logged in:', { email })

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('❌ Login error:', error)
    res.status(500).json({ message: 'Server error during login' })
  }
})

// Get current user (protected route)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('❌ Get user error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Middleware to authenticate token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Access token required' })
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || 'fallback-secret-key',
    (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired token' })
      }
      req.userId = decoded.userId
      next()
    }
  )
}

module.exports = router
