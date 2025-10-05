const jwt = require('jsonwebtoken')
const User = require('../models/User')

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Access token required' })
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || 'fallback-secret-key',
    async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired token' })
      }

      try {
        // Fetch full user from database
        const user = await User.findById(decoded.userId).select('-password')
        if (!user) {
          return res.status(404).json({ message: 'User not found' })
        }

        req.user = {
          id: user._id,
          email: user.email,
          username: user.username,
        }
        req.userId = user._id
        next()
      } catch (error) {
        return res.status(500).json({ message: 'Server error' })
      }
    }
  )
}

module.exports = authenticateToken
