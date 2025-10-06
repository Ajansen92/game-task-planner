import axios from 'axios'

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: `${API_URL}/api`,
  // ... rest of config
})

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Projects API
export const projectsAPI = {
  // Get all projects
  getAll: async () => {
    const response = await api.get('/projects')
    return response.data
  },

  // Get single project
  getById: async (id) => {
    const response = await api.get(`/projects/${id}`)
    return response.data
  },

  // Create project
  create: async (projectData) => {
    console.log('Creating project with data:', projectData)
    const response = await api.post('/projects', {
      title: projectData.name,
      description: projectData.description || 'No description provided',
      game: projectData.game,
      category: 'other',
      priority: 'medium',
    })
    return response.data
  },

  // Update project
  update: async (id, projectData) => {
    const response = await api.put(`/projects/${id}`, projectData)
    return response.data
  },

  // Delete project
  delete: async (id) => {
    const response = await api.delete(`/projects/${id}`)
    return response.data
  },
}

// Tasks API
export const tasksAPI = {
  // Get all tasks for a project
  getByProject: async (projectId) => {
    const response = await api.get(`/tasks/project/${projectId}`)
    return response.data
  },

  // Get single task
  getById: async (id) => {
    const response = await api.get(`/tasks/${id}`)
    return response.data
  },

  // Create task
  create: async (projectId, taskData) => {
    const response = await api.post('/tasks', {
      title: taskData.title,
      description: taskData.description || '',
      project: projectId,
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      assignedTo: taskData.assignedTo || 'Unassigned',
    })
    return response.data
  },

  // Update task
  update: async (id, taskData) => {
    const response = await api.put(`/tasks/${id}`, taskData)
    return response.data
  },

  // Delete task
  delete: async (id) => {
    const response = await api.delete(`/tasks/${id}`)
    return response.data
  },
}

// Auth API
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
    }
    return response.data
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
    }
    return response.data
  },

  logout: () => {
    localStorage.removeItem('token')
  },
}

// Invitations API
export const invitationsAPI = {
  // Get all invitations for current user
  getAll: async () => {
    const response = await api.get('/invitations')
    return response.data
  },

  // Search users by username
  searchUsers: async (username) => {
    const response = await api.get(`/invitations/search/${username}`)
    return response.data
  },

  // Send invitation
  send: async (projectId, username) => {
    const response = await api.post('/invitations', {
      projectId,
      username,
    })
    return response.data
  },

  // Accept invitation
  accept: async (invitationId) => {
    const response = await api.post(`/invitations/${invitationId}/accept`)
    return response.data
  },

  // Decline invitation
  decline: async (invitationId) => {
    const response = await api.post(`/invitations/${invitationId}/decline`)
    return response.data
  },
}

// Comments API
export const commentsAPI = {
  // Get all comments for a task
  getByTask: async (taskId) => {
    const response = await api.get(`/comments/${taskId}`)
    return response.data
  },

  // Create comment
  create: async (taskId, text) => {
    const response = await api.post(`/comments/${taskId}`, {
      text,
    })
    return response.data
  },

  // Update comment
  update: async (commentId, text) => {
    const response = await api.patch(`/comments/${commentId}`, {
      text,
    })
    return response.data
  },

  // Delete comment
  delete: async (commentId) => {
    const response = await api.delete(`/comments/${commentId}`)
    return response.data
  },
}

export default api
