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
  },
  {
    timestamps: true,
  }
)

// Virtual for task count (we'll populate this when needed)
projectSchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
  count: true,
})

module.exports = mongoose.model('Project', projectSchema)
