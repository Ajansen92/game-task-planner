// Project routes
const express = require('express')
const router = express.Router()
const Project = require('../models/project')
const Task = require('../models/Task')

// Middleware to authenticate token
const authenticateToken = require('../middleware/auth')

// Get all projects for logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const projects = await Project.find({ createdBy: req.userId }).sort({
      updatedAt: -1,
    })

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
    const project = await Project.findOne({
      _id: req.params.id,
      createdBy: req.userId,
    })

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    res.json(project)
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

    const project = await Project.findOne({
      _id: req.params.id,
      createdBy: req.userId,
    })

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
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
    const project = await Project.findOne({
      _id: req.params.id,
      createdBy: req.userId,
    })

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
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
