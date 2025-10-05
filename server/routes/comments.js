// server/routes/comments.js - FIXED MEMBER POPULATION
const express = require('express')
const router = express.Router()
const Comment = require('../models/Comment')
const Task = require('../models/task')
const Project = require('../models/project')
const Notification = require('../models/Notification')
const auth = require('../middleware/auth')

// Get all comments for a task
router.get('/:taskId', auth, async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })

    res.json(comments)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create a comment
router.post('/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId)
    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    const comment = new Comment({
      text: req.body.text,
      createdBy: req.user.id,
      task: req.params.taskId,
    })

    await comment.save()
    await comment.populate('createdBy', 'username email')

    // Emit real-time update
    const io = req.app.get('io')
    io.to(`project:${task.project}`).emit('comment:created', {
      taskId: task._id,
      comment,
    })

    // Return success immediately
    res.status(201).json(comment)

    // Try to create notifications asynchronously (don't block comment creation)
    setImmediate(async () => {
      console.log('🔔 Starting notification creation...')
      try {
        // Get all project members - populate members.user since members is an array of objects
        const project = await Project.findById(task.project).populate(
          'members.user',
          '_id username'
        )
        console.log('📋 Project found:', !!project)
        console.log('📋 Project members:', project?.members?.length)

        if (project && project.members) {
          // Notify each member except the commenter
          for (const member of project.members) {
            const memberId = member.user._id.toString()
            console.log(
              `👤 Checking member: ${memberId}, commenter: ${req.user.id}`
            )

            if (memberId !== req.user.id.toString()) {
              console.log(`✅ Creating notification for member: ${memberId}`)

              const notification = new Notification({
                recipient: member.user._id,
                sender: req.user.id,
                type: 'task_comment',
                title: 'New Comment',
                message: `${req.user.username} commented on "${task.title}"`,
                link: `/projects/${task.project}`,
                project: task.project,
                task: task._id,
              })

              await notification.save()
              console.log(`📢 Emitting notification to user:${memberId}`)
              await notification.populate('sender', 'username email')
              io.to(`user:${memberId}`).emit('notification:new', notification)
              console.log(`✅ Notification emitted successfully`)
            } else {
              console.log(`⏭️ Skipping commenter (same user)`)
            }
          }
        } else {
          console.log('❌ No project or members found')
        }

        // Check for @mentions in comment text
        const mentionRegex = /@(\w+)/g
        const mentions = req.body.text.match(mentionRegex)
        if (mentions && project) {
          console.log(`🏷️ Found mentions:`, mentions)
          for (const mention of mentions) {
            const username = mention.substring(1) // Remove @
            const mentionedMember = project.members.find(
              (m) => m.user.username === username
            )

            if (
              mentionedMember &&
              mentionedMember.user._id.toString() !== req.user.id.toString()
            ) {
              console.log(`📢 Creating mention notification for ${username}`)
              const notification = new Notification({
                recipient: mentionedMember.user._id,
                sender: req.user.id,
                type: 'task_mention',
                title: 'You were mentioned',
                message: `${req.user.username} mentioned you in "${task.title}"`,
                link: `/projects/${task.project}`,
                project: task.project,
                task: task._id,
              })

              await notification.save()
              await notification.populate('sender', 'username email')
              io.to(`user:${mentionedMember.user._id}`).emit(
                'notification:new',
                notification
              )
            }
          }
        }
      } catch (notifError) {
        console.error(
          '❌ Notification creation failed (comment was saved):',
          notifError.message
        )
        console.error('Full error:', notifError)
      }
    })
  } catch (error) {
    console.error('Error creating comment:', error)
    res.status(400).json({ message: error.message })
  }
})

// Update a comment
router.patch('/:commentId', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId)

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' })
    }

    if (comment.createdBy.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ message: 'Not authorized to edit this comment' })
    }

    comment.text = req.body.text
    await comment.save()
    await comment.populate('createdBy', 'username email')

    const io = req.app.get('io')
    const task = await Task.findById(comment.task)
    io.to(`project:${task.project}`).emit('comment:updated', {
      taskId: comment.task,
      comment,
    })

    res.json(comment)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Delete a comment
router.delete('/:commentId', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId)

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' })
    }

    if (comment.createdBy.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ message: 'Not authorized to delete this comment' })
    }

    const taskId = comment.task
    const task = await Task.findById(taskId)

    await comment.deleteOne()

    const io = req.app.get('io')
    io.to(`project:${task.project}`).emit('comment:deleted', {
      taskId,
      commentId: req.params.commentId,
    })

    res.json({ message: 'Comment deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
