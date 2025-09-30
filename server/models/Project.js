// Project model
const mongoose = require('mongoose')

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    game: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'building',
        'farming',
        'exploration',
        'pvp',
        'creative',
        'technical',
        'community',
        'other',
      ],
      default: 'other',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    estimatedDuration: {
      type: String,
      enum: [
        '1-day',
        'few-days',
        '1-week',
        'few-weeks',
        '1-month',
        'few-months',
        'ongoing',
      ],
      default: '1-week',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused', 'cancelled'],
      default: 'active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['owner', 'admin', 'member'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    invitations: [
      {
        email: {
          type: String,
          required: true,
          lowercase: true,
          trim: true,
        },
        invitedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        invitedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'declined'],
          default: 'pending',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
)

// Virtual for task count
projectSchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
  count: true,
})

// Method to check if user has access to project
projectSchema.methods.hasAccess = function (userId) {
  return this.members.some((member) => {
    // Handle both populated (object) and non-populated (ObjectId) cases
    const memberUserId = member.user._id || member.user
    return memberUserId.toString() === userId.toString()
  })
}

// Method to check if user is owner or admin
projectSchema.methods.isOwnerOrAdmin = function (userId) {
  const member = this.members.find((m) => {
    const memberUserId = m.user._id || m.user
    return memberUserId.toString() === userId.toString()
  })
  return member && (member.role === 'owner' || member.role === 'admin')
}

// Method to get user's role
projectSchema.methods.getUserRole = function (userId) {
  const member = this.members.find((m) => {
    const memberUserId = m.user._id || m.user
    return memberUserId.toString() === userId.toString()
  })
  return member ? member.role : null
}

module.exports =
  mongoose.models.Project || mongoose.model('Project', projectSchema)
