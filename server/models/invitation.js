// Invitation model
const mongoose = require('mongoose')

const invitationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    invitedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
)

// Index for better query performance
invitationSchema.index({ invitedUser: 1, status: 1 })
invitationSchema.index({ project: 1 })

// Prevent duplicate pending invitations
invitationSchema.index(
  { project: 1, invitedUser: 1, status: 1 },
  { unique: true }
)

module.exports =
  mongoose.models.Invitation || mongoose.model('Invitation', invitationSchema)
