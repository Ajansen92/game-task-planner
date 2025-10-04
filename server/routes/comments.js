// Comments routes
const express = require('express')
const router = express.Router()
const Comment = require('../models/comment')
const Task = require('../models/task')
const Project = require('../models/project')

// Middleware to authenticate token
const authenticateToken = require('../middleware/auth')

// Get all comments for a task
router.get('/task/:taskId', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId)

    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    // Verify user has access to this task's project
    const project = await Project.findById(task.project)
    if (!project || !project.hasAccess(req.userId)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const comments = await Comment.find({ task: req.params.taskId })
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })

    res.json(comments)
  } catch (error) {
    console.error('❌ Get comments error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Create a comment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { text, taskId } = req.body

    // Validation
    if (!text || !taskId) {
      return res.status(400).json({ message: 'Text and task ID are required' })
    }

    if (text.length > 1000) {
      return res
        .status(400)
        .json({ message: 'Comment must be 1000 characters or less' })
    }

    // Verify task exists
    const task = await Task.findById(taskId)
    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    // Verify user has access to this task's project
    const project = await Project.findById(task.project)
    if (!project || !project.hasAccess(req.userId)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Create comment
    const newComment = new Comment({
      text,
      task: taskId,
      createdBy: req.userId,
    })

    await newComment.save()

    // Populate the createdBy field before returning
    await newComment.populate('createdBy', 'username')

    console.log('✅ Comment created:', { taskId, text: text.substring(0, 50) })

    res.status(201).json({
      message: 'Comment created successfully',
      comment: newComment,
    })
  } catch (error) {
    console.error('❌ Create comment error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update a comment
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body

    if (!text) {
      return res.status(400).json({ message: 'Text is required' })
    }

    if (text.length > 1000) {
      return res
        .status(400)
        .json({ message: 'Comment must be 1000 characters or less' })
    }

    const comment = await Comment.findById(req.params.id)

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' })
    }

    // Only the comment creator can edit it
    if (comment.createdBy.toString() !== req.userId.toString()) {
      return res
        .status(403)
        .json({ message: 'You can only edit your own comments' })
    }

    comment.text = text
    await comment.save()

    await comment.populate('createdBy', 'username')

    console.log('✅ Comment updated:', { id: req.params.id })

    res.json({
      message: 'Comment updated successfully',
      comment,
    })
  } catch (error) {
    console.error('❌ Update comment error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Delete a comment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' })
    }

    // Only the comment creator can delete it
    if (comment.createdBy.toString() !== req.userId.toString()) {
      return res
        .status(403)
        .json({ message: 'You can only delete your own comments' })
    }

    await Comment.deleteOne({ _id: req.params.id })

    console.log('✅ Comment deleted:', { id: req.params.id })

    res.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('❌ Delete comment error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
