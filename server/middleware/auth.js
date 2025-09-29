// Authentication middleware
const jwt = require('jsonwebtoken')

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

module.exports = authenticateToken
