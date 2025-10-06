const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
require('dotenv').config()

const fs = require('fs')
const path = require('path')

// Debug: Log what files exist
console.log('Current directory:', __dirname)
console.log(
  'Models directory exists?',
  fs.existsSync(path.join(__dirname, 'models'))
)
console.log('Models files:', fs.readdirSync(path.join(__dirname, 'models')))

const app = express()
const server = http.createServer(app)

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5001', 'https://questboard-six.vercel.app'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

//Make io accessible to routes
app.set('io', io)

// Middleware
app.use(
  cors({
    origin: ['http://localhost:5001', 'https://questboard-six.vercel.app'],
    credentials: true,
  })
)
app.use(express.json())

// Routes
const authRoutes = require('./routes/auth')
const projectRoutes = require('./routes/projects')
const taskRoutes = require('./routes/tasks')
const invitationRoutes = require('./routes/invitations')
const commentRoutes = require('./routes/comments')
const notificationRoutes = require('./routes/notifications')
const userRoutes = require('./routes/users')

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/invitations', invitationRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/users', userRoutes)

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Atlas Connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err))

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'QuestBoard API is running! 🎮' })
})

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token

  console.log('🔐 Socket auth attempt')
  console.log(
    'Token received:',
    token ? token.substring(0, 20) + '...' : 'NONE'
  )

  if (!token) {
    console.log('❌ Rejecting: No token')
    return next(new Error('No token provided'))
  }

  try {
    const jwt = require('jsonwebtoken')
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET)

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log('✅ Token verified successfully')
    console.log('User ID:', decoded.userId)

    socket.userId = decoded.userId
    socket.username = decoded.username || decoded.email
    next()
  } catch (err) {
    console.log('❌ Token verification failed')
    console.log('Error name:', err.name)
    console.log('Error message:', err.message)
    return next(new Error('Invalid token'))
  }
})

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id)

  // Join personal user room for notifications
  const userRoom = `user:${socket.userId}`
  socket.join(userRoom)
  console.log(`👤 User ${socket.userId} joined personal room: ${userRoom}`)

  // Join a project room
  socket.on('join-project', (projectId) => {
    console.log(`📂 User ${socket.id} joined project ${projectId}`)
  })

  // Leave a project room
  socket.on('leave-project', (projectId) => {
    socket.leave(`project-${projectId}`)
    console.log(`🚪 User ${socket.id} left project ${projectId}`)
  })

  // ===== TASK EVENTS =====

  // Task created
  socket.on('task-created', (data) => {
    console.log('📝 Task created, broadcasting to project:', data.projectId)
    socket.to(`project-${data.projectId}`).emit('task-created', data.task)
  })

  // Task updated
  socket.on('task-updated', (data) => {
    console.log('✏️ Task updated, broadcasting to project:', data.projectId)
    socket.to(`project-${data.projectId}`).emit('task-updated', data.task)
  })

  // Task deleted
  socket.on('task-deleted', (data) => {
    console.log('🗑️ Task deleted, broadcasting to project:', data.projectId)
    socket.to(`project-${data.projectId}`).emit('task-deleted', data.taskId)
  })

  // ===== PROJECT EVENTS =====

  // Project updated
  socket.on('project-updated', (data) => {
    console.log('📂 Project updated, broadcasting to project:', data.projectId)
    socket.to(`project-${data.projectId}`).emit('project-updated', data.project)
  })

  // ===== COMMENT EVENTS =====

  // Comment created
  socket.on('comment-created', (data) => {
    console.log('💬 Comment created, broadcasting to project:', data.projectId)
    socket.to(`project-${data.projectId}`).emit('comment-created', data.comment)
  })

  // Comment updated
  socket.on('comment-updated', (data) => {
    console.log('✏️ Comment updated, broadcasting to project:', data.projectId)
    socket.to(`project-${data.projectId}`).emit('comment-updated', data.comment)
  })

  // Comment deleted
  socket.on('comment-deleted', (data) => {
    console.log('🗑️ Comment deleted, broadcasting to project:', data.projectId)
    socket
      .to(`project-${data.projectId}`)
      .emit('comment-deleted', data.commentId)
  })

  // Disconnect
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id)
  })
})

// Start server
const PORT = process.env.PORT || 5000
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`🎮 QuestBoard Backend Active`)
  console.log(`🔌 Socket.io enabled for real-time collaboration`)
})
