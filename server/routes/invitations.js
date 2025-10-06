// Invitation routes
const express = require('express')
const router = express.Router()
const Invitation = require('../models/invitation')
const Project = require('../models/Project')
const User = require('../models/User')

// Middleware to authenticate token
const authenticateToken = require('../middleware/auth')

// Get all invitations for logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const invitations = await Invitation.find({
      invitedUser: req.userId,
      status: 'pending',
    })
      .populate('project', 'title game')
      .populate('invitedBy', 'username')
      .sort({ createdAt: -1 })

    // Transform to match frontend structure
    const transformedInvitations = invitations.map((inv) => ({
      id: inv._id,
      projectId: inv.project._id,
      projectName: inv.project.title,
      game: inv.project.game,
      invitedBy: inv.invitedBy.username,
      invitedAt: getTimeAgo(inv.createdAt),
      memberCount: 1, // We'll update this with actual count
    }))

    res.json(transformedInvitations)
  } catch (error) {
    console.error('❌ Get invitations error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Search users by username
router.get('/search/:username', authenticateToken, async (req, res) => {
  try {
    const searchTerm = req.params.username

    if (searchTerm.length < 2) {
      return res
        .status(400)
        .json({ message: 'Search term must be at least 2 characters' })
    }

    // Find users matching the search term (case-insensitive)
    const users = await User.find({
      username: { $regex: searchTerm, $options: 'i' },
      _id: { $ne: req.userId }, // Exclude current user
    })
      .select('username email')
      .limit(10)

    res.json(users)
  } catch (error) {
    console.error('❌ Search users error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Send invitation
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { projectId, username } = req.body

    // Validation
    if (!projectId || !username) {
      return res
        .status(400)
        .json({ message: 'Project ID and username are required' })
    }

    // Verify project exists and user has access
    const project = await Project.findById(projectId)

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    if (!project.isOwnerOrAdmin(req.userId)) {
      return res
        .status(403)
        .json({ message: 'Only owners and admins can invite members' })
    }

    // Find user to invite
    const userToInvite = await User.findOne({ username })

    if (!userToInvite) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Check if user is already a member
    const isAlreadyMember = project.members.some(
      (member) => member.user.toString() === userToInvite._id.toString()
    )

    if (isAlreadyMember) {
      return res
        .status(400)
        .json({ message: 'User is already a member of this project' })
    }

    // Check if invitation already exists
    const existingInvitation = await Invitation.findOne({
      project: projectId,
      invitedUser: userToInvite._id,
      status: 'pending',
    })

    if (existingInvitation) {
      return res
        .status(400)
        .json({ message: 'Invitation already sent to this user' })
    }

    // Create invitation
    const newInvitation = new Invitation({
      project: projectId,
      invitedUser: userToInvite._id,
      invitedBy: req.userId,
      status: 'pending',
    })

    await newInvitation.save()

    console.log('✅ Invitation sent:', { projectId, username })

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: newInvitation,
    })
  } catch (error) {
    console.error('❌ Send invitation error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Accept invitation
router.post('/:id/accept', authenticateToken, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id)

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' })
    }

    // Verify this invitation is for the logged-in user
    if (invitation.invitedUser.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' })
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation already processed' })
    }

    // Update invitation status
    invitation.status = 'accepted'
    await invitation.save()

    // Add user to project members
    const project = await Project.findById(invitation.project)

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    project.members.push({
      user: req.userId,
      role: 'member',
      joinedAt: new Date(),
    })

    await project.save()

    console.log('✅ Invitation accepted:', { invitationId: req.params.id })

    res.json({
      message: 'Invitation accepted successfully',
      project,
    })
  } catch (error) {
    console.error('❌ Accept invitation error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Decline invitation
router.post('/:id/decline', authenticateToken, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id)

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' })
    }

    // Verify this invitation is for the logged-in user
    if (invitation.invitedUser.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' })
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation already processed' })
    }

    // Update invitation status
    invitation.status = 'declined'
    await invitation.save()

    console.log('✅ Invitation declined:', { invitationId: req.params.id })

    res.json({
      message: 'Invitation declined successfully',
    })
  } catch (error) {
    console.error('❌ Decline invitation error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Helper function to get time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
  return `${Math.floor(seconds / 604800)} weeks ago`
}

module.exports = router
