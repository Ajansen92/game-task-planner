// Project routes
const express = require('express')
const router = express.Router()
const Project = require('../models/project')
const Task = require('../models/task')

// Middleware to authenticate token
const authenticateToken = require('../middleware/auth')

// Get all projects for logged-in user (includes projects where they're a member)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const projects = await Project.find({
      'members.user': req.userId,
    })
      .populate('members.user', 'username email')
      .sort({ updatedAt: -1 })

    // Get task counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const totalTasks = await Task.countDocuments({ project: project._id })
        const completedTasks = await Task.countDocuments({
          project: project._id,
          status: 'completed',
        })

        return {
          ...project.toObject(),
          taskCount: totalTasks,
          completedTasks: completedTasks,
          userRole: project.getUserRole(req.userId),
        }
      })
    )

    res.json(projectsWithCounts)
  } catch (error) {
    console.error('❌ Get projects error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get single project by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      'members.user',
      'username email'
    )

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    // DEBUG: Log to see what's happening
    console.log('🔍 DEBUG - Request userId:', req.userId)
    console.log('🔍 DEBUG - Request userId type:', typeof req.userId)
    console.log(
      '🔍 DEBUG - Project members:',
      project.members.map((m) => ({
        userId: m.user._id,
        userIdType: typeof m.user._id,
        userIdString: m.user._id.toString(),
        role: m.role,
      }))
    )
    console.log('🔍 DEBUG - Has access?', project.hasAccess(req.userId))

    // Check if user has access
    if (!project.hasAccess(req.userId)) {
      console.log('❌ Access denied for user:', req.userId)
      return res.status(403).json({ message: 'Access denied' })
    }

    // Add user's role to response
    const projectData = {
      ...project.toObject(),
      userRole: project.getUserRole(req.userId),
    }

    res.json(projectData)
  } catch (error) {
    console.error('❌ Get project error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Create new project
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, game, category, priority, estimatedDuration } =
      req.body

    // Validation
    if (!title || !description || !game) {
      return res
        .status(400)
        .json({ message: 'Title, description, and game are required' })
    }

    // DEBUG: Log user ID
    console.log('🔍 Creating project for user:', req.userId)
    console.log('🔍 User ID type:', typeof req.userId)

    // Create project
    const newProject = new Project({
      title,
      description,
      game,
      category: category || 'other',
      priority: priority || 'medium',
      estimatedDuration: estimatedDuration || '1-week',
      createdBy: req.userId,
      members: [
        {
          user: req.userId,
          role: 'owner',
          joinedAt: new Date(),
        },
      ],
    })

    await newProject.save()

    console.log('✅ Project created with members:', newProject.members)

    // If initial tasks are provided, create them
    if (req.body.tasks && Array.isArray(req.body.tasks)) {
      const taskPromises = req.body.tasks.map((taskTitle) => {
        const task = new Task({
          title: taskTitle,
          project: newProject._id,
          createdBy: req.userId,
          status: 'pending',
          priority: 'medium',
        })
        return task.save()
      })

      await Promise.all(taskPromises)
    }

    console.log('✅ Project created:', { title, createdBy: req.userId })

    res.status(201).json({
      message: 'Project created successfully',
      project: newProject,
    })
  } catch (error) {
    console.error('❌ Create project error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update project
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      game,
      category,
      priority,
      estimatedDuration,
      status,
    } = req.body

    const project = await Project.findById(req.params.id)

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    // Check if user is owner or admin
    if (!project.isOwnerOrAdmin(req.userId)) {
      return res
        .status(403)
        .json({ message: 'Only owners and admins can edit the project' })
    }

    // Update fields
    if (title) project.title = title
    if (description) project.description = description
    if (game) project.game = game
    if (category) project.category = category
    if (priority) project.priority = priority
    if (estimatedDuration) project.estimatedDuration = estimatedDuration
    if (status) project.status = status

    await project.save()

    console.log('✅ Project updated:', { id: req.params.id })

    res.json({
      message: 'Project updated successfully',
      project,
    })
  } catch (error) {
    console.error('❌ Update project error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Delete project
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    // Only owner can delete project
    const userRole = project.getUserRole(req.userId)
    if (userRole !== 'owner') {
      return res
        .status(403)
        .json({ message: 'Only the project owner can delete the project' })
    }

    // Delete all tasks associated with this project
    await Task.deleteMany({ project: req.params.id })

    // Delete the project
    await Project.deleteOne({ _id: req.params.id })

    console.log('✅ Project deleted:', { id: req.params.id })

    res.json({ message: 'Project and associated tasks deleted successfully' })
  } catch (error) {
    console.error('❌ Delete project error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
