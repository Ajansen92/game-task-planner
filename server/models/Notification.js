const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: [
        'task_assigned',
        'task_comment',
        'task_mention',
        'task_status_changed',
        'task_deadline_approaching',
        'project_invite',
        'team_member_joined',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'project',
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

// Index for efficient querying
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 })

// Auto-populate sender info
// notificationSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'sender',
//     select: 'username email',
//   })
//   next()
// })

module.exports = mongoose.model('Notification', notificationSchema)
