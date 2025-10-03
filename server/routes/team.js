// Team collaboration routes
const express = require('express')
const router = express.Router()
const Project = require('../models/project')
const User = require('../models/user')
const authenticateToken = require('../middleware/auth')

// Get team members for a project
router.get(
  '/project/:projectId/members',
  authenticateToken,
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId)
        .populate('members.user', 'username email')
        .populate('invitations.invitedBy', 'username email')

      if (!project) {
        return res.status(404).json({ message: 'Project not found' })
      }

      // Check if user has access to this project
      if (!project.hasAccess(req.userId)) {
        return res.status(403).json({ message: 'Access denied' })
      }

      res.json({
        members: project.members,
        invitations: project.invitations,
      })
    } catch (error) {
      console.error('❌ Get team members error:', error)
      res.status(500).json({ message: 'Server error' })
    }
  }
)

// Invite user to project by email or username
router.post(
  '/project/:projectId/invite',
  authenticateToken,
  async (req, res) => {
    try {
      const { email, username } = req.body

      if (!email && !username) {
        return res
          .status(400)
          .json({ message: 'Email or username is required' })
      }

      const project = await Project.findById(req.params.projectId)

      if (!project) {
        return res.status(404).json({ message: 'Project not found' })
      }

      // Check if user is owner or admin
      if (!project.isOwnerOrAdmin(req.userId)) {
        return res
          .status(403)
          .json({ message: 'Only owners and admins can invite members' })
      }

      let inviteEmail = email
      let existingUser = null

      // If username is provided, find the user
      if (username) {
        existingUser = await User.findOne({ username })

        if (!existingUser) {
          return res
            .status(404)
            .json({ message: 'User not found with that username' })
        }

        inviteEmail = existingUser.email

        // Check if user is already a member
        const isAlreadyMember = project.members.some(
          (m) =>
            (m.user._id || m.user).toString() === existingUser._id.toString()
        )

        if (isAlreadyMember) {
          return res
            .status(400)
            .json({ message: 'User is already a member of this project' })
        }
      } else {
        // Check if email user is already a member (if they exist)
        existingUser = await User.findOne({ email: inviteEmail.toLowerCase() })

        if (existingUser) {
          const isAlreadyMember = project.members.some(
            (m) =>
              (m.user._id || m.user).toString() === existingUser._id.toString()
          )

          if (isAlreadyMember) {
            return res
              .status(400)
              .json({ message: 'User is already a member of this project' })
          }
        }
      }

      // Check if invitation already exists
      const existingInvitation = project.invitations.find(
        (inv) =>
          inv.email === inviteEmail.toLowerCase() && inv.status === 'pending'
      )

      if (existingInvitation) {
        return res
          .status(400)
          .json({ message: 'Invitation already sent to this user' })
      }

      // Add invitation
      project.invitations.push({
        email: inviteEmail.toLowerCase(),
        invitedBy: req.userId,
        status: 'pending',
      })

      await project.save()

      console.log('✅ Invitation sent:', {
        email: inviteEmail,
        username: username || 'N/A',
        project: project.title,
      })

      // TODO: Send email notification (we'll implement this later)

      res.status(201).json({
        message: `Invitation sent successfully to ${username || inviteEmail}`,
        invitation: project.invitations[project.invitations.length - 1],
      })
    } catch (error) {
      console.error('❌ Invite user error:', error)
      res.status(500).json({ message: 'Server error' })
    }
  }
)

// Get pending invitations for logged-in user
router.get('/invitations', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Find all projects with pending invitations for this user's email
    const projects = await Project.find({
      'invitations.email': user.email.toLowerCase(),
      'invitations.status': 'pending',
    })
      .populate('createdBy', 'username email')
      .populate('invitations.invitedBy', 'username email')

    // Extract only relevant invitations
    const invitations = projects.map((project) => {
      const invitation = project.invitations.find(
        (inv) =>
          inv.email === user.email.toLowerCase() && inv.status === 'pending'
      )

      return {
        _id: invitation._id,
        project: {
          _id: project._id,
          title: project.title,
          description: project.description,
          game: project.game,
        },
        invitedBy: invitation.invitedBy,
        invitedAt: invitation.invitedAt,
      }
    })

    res.json(invitations)
  } catch (error) {
    console.error('❌ Get invitations error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Accept invitation
router.post(
  '/invitations/:projectId/accept',
  authenticateToken,
  async (req, res) => {
    try {
      const user = await User.findById(req.userId)
      const project = await Project.findById(req.params.projectId)

      if (!project) {
        return res.status(404).json({ message: 'Project not found' })
      }

      // Find the invitation
      const invitation = project.invitations.find(
        (inv) =>
          inv.email === user.email.toLowerCase() && inv.status === 'pending'
      )

      if (!invitation) {
        return res.status(404).json({ message: 'Invitation not found' })
      }

      // Add user as member
      project.members.push({
        user: req.userId,
        role: 'member',
        joinedAt: new Date(),
      })

      // Update invitation status
      invitation.status = 'accepted'

      await project.save()

      console.log('✅ Invitation accepted:', {
        user: user.email,
        project: project.title,
      })

      res.json({
        message: 'Invitation accepted successfully',
        project: {
          _id: project._id,
          title: project.title,
          description: project.description,
          game: project.game,
        },
      })
    } catch (error) {
      console.error('❌ Accept invitation error:', error)
      res.status(500).json({ message: 'Server error' })
    }
  }
)

// Decline invitation
router.post(
  '/invitations/:projectId/decline',
  authenticateToken,
  async (req, res) => {
    try {
      const user = await User.findById(req.userId)
      const project = await Project.findById(req.params.projectId)

      if (!project) {
        return res.status(404).json({ message: 'Project not found' })
      }

      // Find the invitation
      const invitation = project.invitations.find(
        (inv) =>
          inv.email === user.email.toLowerCase() && inv.status === 'pending'
      )

      if (!invitation) {
        return res.status(404).json({ message: 'Invitation not found' })
      }

      // Update invitation status
      invitation.status = 'declined'

      await project.save()

      console.log('✅ Invitation declined:', {
        user: user.email,
        project: project.title,
      })

      res.json({ message: 'Invitation declined' })
    } catch (error) {
      console.error('❌ Decline invitation error:', error)
      res.status(500).json({ message: 'Server error' })
    }
  }
)

// Update member role (owner/admin only)
router.put(
  '/project/:projectId/members/:memberId',
  authenticateToken,
  async (req, res) => {
    try {
      const { role } = req.body

      if (!['member', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' })
      }

      const project = await Project.findById(req.params.projectId)

      if (!project) {
        return res.status(404).json({ message: 'Project not found' })
      }

      // Check if user is owner or admin
      if (!project.isOwnerOrAdmin(req.userId)) {
        return res
          .status(403)
          .json({ message: 'Only owners and admins can change roles' })
      }

      // Find the member
      const member = project.members.id(req.params.memberId)

      if (!member) {
        return res.status(404).json({ message: 'Member not found' })
      }

      // Can't change owner role
      if (member.role === 'owner') {
        return res.status(400).json({ message: 'Cannot change owner role' })
      }

      member.role = role
      await project.save()

      console.log('✅ Member role updated:', {
        memberId: req.params.memberId,
        newRole: role,
      })

      res.json({
        message: 'Member role updated successfully',
        member,
      })
    } catch (error) {
      console.error('❌ Update member role error:', error)
      res.status(500).json({ message: 'Server error' })
    }
  }
)

// Remove member from project (owner/admin only)
router.delete(
  '/project/:projectId/members/:memberId',
  authenticateToken,
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId)

      if (!project) {
        return res.status(404).json({ message: 'Project not found' })
      }

      // Check if user is owner or admin
      if (!project.isOwnerOrAdmin(req.userId)) {
        return res
          .status(403)
          .json({ message: 'Only owners and admins can remove members' })
      }

      // Find the member
      const member = project.members.id(req.params.memberId)

      if (!member) {
        return res.status(404).json({ message: 'Member not found' })
      }

      // Can't remove owner
      if (member.role === 'owner') {
        return res.status(400).json({ message: 'Cannot remove project owner' })
      }

      // Remove member
      project.members.pull(req.params.memberId)
      await project.save()

      console.log('✅ Member removed:', {
        memberId: req.params.memberId,
        project: project.title,
      })

      res.json({ message: 'Member removed successfully' })
    } catch (error) {
      console.error('❌ Remove member error:', error)
      res.status(500).json({ message: 'Server error' })
    }
  }
)

// Leave project (member can leave on their own)
router.post(
  '/project/:projectId/leave',
  authenticateToken,
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId)

      if (!project) {
        return res.status(404).json({ message: 'Project not found' })
      }

      // Find the member
      const memberIndex = project.members.findIndex(
        (m) => (m.user._id || m.user).toString() === req.userId.toString()
      )

      if (memberIndex === -1) {
        return res
          .status(404)
          .json({ message: 'You are not a member of this project' })
      }

      const member = project.members[memberIndex]

      // Owner cannot leave (must transfer ownership first)
      if (member.role === 'owner') {
        return res.status(400).json({
          message: 'Owner cannot leave. Please transfer ownership first.',
        })
      }

      // Remove member
      project.members.splice(memberIndex, 1)
      await project.save()

      console.log('✅ User left project:', {
        userId: req.userId,
        project: project.title,
      })

      res.json({ message: 'You have left the project' })
    } catch (error) {
      console.error('❌ Leave project error:', error)
      res.status(500).json({ message: 'Server error' })
    }
  }
)

module.exports = router
