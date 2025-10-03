// Task routes
const express = require('express')
const router = express.Router()
const Task = require('../models/task')
const Project = require('../models/project')

// Middleware to authenticate token
const authenticateToken = require('../middleware/auth')

// Get all tasks for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    // Verify user has access to this project
    const project = await Project.findById(req.params.projectId)

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    if (!project.hasAccess(req.userId)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const tasks = await Task.find({ project: req.params.projectId }).sort({
      createdAt: -1,
    })

    res.json(tasks)
  } catch (error) {
    console.error('❌ Get tasks error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get single task
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project', 'title')

    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    // Verify user has access to this task's project
    const project = await Project.findById(task.project._id)

    if (!project || !project.hasAccess(req.userId)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    res.json(task)
  } catch (error) {
    console.error('❌ Get task error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Create new task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, project, priority, status, assignedTo } =
      req.body

    // Validation
    if (!title || !project) {
      return res.status(400).json({ message: 'Title and project are required' })
    }

    // Verify user has access to this project
    const projectDoc = await Project.findById(project)

    if (!projectDoc) {
      return res.status(404).json({ message: 'Project not found' })
    }

    if (!projectDoc.hasAccess(req.userId)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Create task
    const newTask = new Task({
      title,
      description: description || '',
      project,
      priority: priority || 'medium',
      status: status || 'todo',
      assignedTo: assignedTo || 'Unassigned',
      createdBy: req.userId,
    })

    await newTask.save()

    // Update project's updatedAt timestamp
    projectDoc.updatedAt = new Date()
    await projectDoc.save()

    console.log('✅ Task created:', { title, project })

    res.status(201).json({
      message: 'Task created successfully',
      task: newTask,
    })
  } catch (error) {
    console.error('❌ Create task error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update task
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, priority, status, assignedTo } = req.body

    const task = await Task.findById(req.params.id)

    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    // Verify user has access to this task's project
    const project = await Project.findById(task.project)

    if (!project || !project.hasAccess(req.userId)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Update fields
    if (title) task.title = title
    if (description !== undefined) task.description = description
    if (priority) task.priority = priority
    if (status) task.status = status
    if (assignedTo !== undefined) task.assignedTo = assignedTo

    await task.save()

    // Update project's updatedAt timestamp
    project.updatedAt = new Date()
    await project.save()

    console.log('✅ Task updated:', { id: req.params.id })

    res.json({
      message: 'Task updated successfully',
      task,
    })
  } catch (error) {
    console.error('❌ Update task error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)

    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    // Verify user has access to this task's project
    const project = await Project.findById(task.project)

    if (!project || !project.hasAccess(req.userId)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    await Task.deleteOne({ _id: req.params.id })

    // Update project's updatedAt timestamp
    project.updatedAt = new Date()
    await project.save()

    console.log('✅ Task deleted:', { id: req.params.id })

    res.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('❌ Delete task error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
