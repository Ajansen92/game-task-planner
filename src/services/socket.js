import io from 'socket.io-client'

class SocketService {
  constructor() {
    this.socket = null
  }

  connect(token) {
    if (this.socket?.connected) return

    this.socket = io('http://localhost:5001', {
      auth: { token },
    })

    this.socket.on('connect', () => {
      console.log('✅ Socket.io connected:', this.socket.id)
    })

    this.socket.on('disconnect', () => {
      console.log('❌ Socket.io disconnected')
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  // Join a project room
  joinProject(projectId) {
    if (this.socket) {
      this.socket.emit('join-project', projectId)
      console.log('📂 Joined project room:', projectId)
    }
  }

  // Leave a project room
  leaveProject(projectId) {
    if (this.socket) {
      this.socket.emit('leave-project', projectId)
      console.log('🚪 Left project room:', projectId)
    }
  }

  // ===== TASK EVENTS =====

  // Emit task created
  emitTaskCreated(projectId, task) {
    if (this.socket) {
      this.socket.emit('task-created', { projectId, task })
    }
  }

  // Emit task updated
  emitTaskUpdated(projectId, task) {
    if (this.socket) {
      this.socket.emit('task-updated', { projectId, task })
    }
  }

  // Emit task deleted
  emitTaskDeleted(projectId, taskId) {
    if (this.socket) {
      this.socket.emit('task-deleted', { projectId, taskId })
    }
  }

  // Listen for task created
  onTaskCreated(callback) {
    if (this.socket) {
      this.socket.on('task-created', callback)
    }
  }

  // Listen for task updated
  onTaskUpdated(callback) {
    if (this.socket) {
      this.socket.on('task-updated', callback)
    }
  }

  // Listen for task deleted
  onTaskDeleted(callback) {
    if (this.socket) {
      this.socket.on('task-deleted', callback)
    }
  }

  // ===== PROJECT EVENTS =====

  // Emit project updated
  emitProjectUpdated(projectId, project) {
    if (this.socket) {
      this.socket.emit('project-updated', { projectId, project })
    }
  }

  // Listen for project updated
  onProjectUpdated(callback) {
    if (this.socket) {
      this.socket.on('project-updated', callback)
    }
  }

  // ===== COMMENT EVENTS =====

  // Emit comment created
  emitCommentCreated(projectId, comment) {
    if (this.socket) {
      this.socket.emit('comment-created', { projectId, comment })
      console.log('💬 Emitted comment-created:', comment)
    }
  }

  // Emit comment updated
  emitCommentUpdated(projectId, comment) {
    if (this.socket) {
      this.socket.emit('comment-updated', { projectId, comment })
      console.log('✏️ Emitted comment-updated:', comment)
    }
  }

  // Emit comment deleted
  emitCommentDeleted(projectId, commentId) {
    if (this.socket) {
      this.socket.emit('comment-deleted', { projectId, commentId })
      console.log('🗑️ Emitted comment-deleted:', commentId)
    }
  }

  // Listen for comment created
  onCommentCreated(callback) {
    if (this.socket) {
      this.socket.on('comment-created', callback)
    }
  }

  // Listen for comment updated
  onCommentUpdated(callback) {
    if (this.socket) {
      this.socket.on('comment-updated', callback)
    }
  }

  // Listen for comment deleted
  onCommentDeleted(callback) {
    if (this.socket) {
      this.socket.on('comment-deleted', callback)
    }
  }

  // ===== UTILITY =====

  // Remove event listener
  off(eventName) {
    if (this.socket) {
      this.socket.off(eventName)
    }
  }
}

const socketService = new SocketService()
export default socketService
