import React, { useState, useEffect } from 'react'
import { Send, Edit2, Trash2, MessageCircle, User } from 'lucide-react'
import { commentsAPI } from '../services/api'
import socketService from '../services/socket'
import './TaskComments.css'

export default function TaskComments({
  taskId,
  projectId,
  currentUser,
  onViewProfile,
}) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchComments()

    // Set up real-time listeners
    socketService.onCommentCreated(handleCommentCreatedFromSocket)
    socketService.onCommentUpdated(handleCommentUpdatedFromSocket)
    socketService.onCommentDeleted(handleCommentDeletedFromSocket)

    return () => {
      socketService.off('comment-created')
      socketService.off('comment-updated')
      socketService.off('comment-deleted')
    }
  }, [taskId])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const data = await commentsAPI.getByTask(taskId)
      setComments(data)
    } catch (err) {
      console.error('Failed to fetch comments:', err)
    } finally {
      setLoading(false)
    }
  }

  // Socket.io real-time handlers
  const handleCommentCreatedFromSocket = (comment) => {
    console.log('🔔 Real-time: Comment created', comment)
    setComments((prev) => [comment, ...prev])
  }

  const handleCommentUpdatedFromSocket = (comment) => {
    console.log('🔔 Real-time: Comment updated', comment)
    setComments((prev) =>
      prev.map((c) => (c._id === comment._id ? comment : c))
    )
  }

  const handleCommentDeletedFromSocket = (commentId) => {
    console.log('🔔 Real-time: Comment deleted', commentId)
    setComments((prev) => prev.filter((c) => c._id !== commentId))
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || sending) return

    try {
      setSending(true)
      const response = await commentsAPI.create(taskId, newComment.trim())

      setComments((prev) => [response, ...prev])
      setNewComment('')

      // Emit real-time update
      socketService.emitCommentCreated(projectId, response.comment)
    } catch (err) {
      console.error('Failed to create comment:', err)
      alert('Failed to add comment. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleStartEdit = (comment) => {
    setEditingCommentId(comment._id)
    setEditingText(comment.text)
  }

  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditingText('')
  }

  const handleSaveEdit = async (commentId) => {
    if (!editingText.trim()) return

    try {
      const response = await commentsAPI.update(commentId, editingText.trim())

      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? response.comment : c))
      )
      setEditingCommentId(null)
      setEditingText('')

      // Emit real-time update
      socketService.emitCommentUpdated(projectId, response.comment)
    } catch (err) {
      console.error('Failed to update comment:', err)
      alert('Failed to update comment. Please try again.')
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return

    try {
      await commentsAPI.delete(commentId)

      setComments((prev) => prev.filter((c) => c._id !== commentId))

      // Emit real-time update
      socketService.emitCommentDeleted(projectId, commentId)
    } catch (err) {
      console.error('Failed to delete comment:', err)
      alert('Failed to delete comment. Please try again.')
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const handleUsernameClick = (userId) => {
    if (onViewProfile && userId) {
      onViewProfile(userId)
    }
  }

  return (
    <div className="task-comments">
      <div className="comments-header">
        <MessageCircle className="comments-icon" />
        <h3 className="comments-title">Comments ({comments.length})</h3>
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmitComment} className="comment-form">
        <textarea
          className="comment-input"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows="3"
          maxLength="1000"
          disabled={sending}
        />
        <div className="comment-form-footer">
          <span className="char-count">{newComment.length}/1000</span>
          <button
            type="submit"
            className="btn-send-comment"
            disabled={!newComment.trim() || sending}
          >
            <Send className="btn-icon" />
            {sending ? 'Sending...' : 'Comment'}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="comments-list">
        {loading ? (
          <p className="comments-loading">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="comments-empty">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="comment-card">
              <div className="comment-header">
                <div className="comment-author">
                  <div
                    className="author-avatar-container"
                    onClick={() => handleUsernameClick(comment.createdBy?._id)}
                    style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
                  >
                    {comment.createdBy?.avatar ? (
                      <img
                        src={comment.createdBy.avatar}
                        alt={comment.createdBy.username}
                        className="author-avatar-img"
                      />
                    ) : (
                      <div className="author-avatar-placeholder">
                        <User size={16} />
                      </div>
                    )}
                  </div>
                  <span
                    className={`author-name ${
                      onViewProfile ? 'clickable-username' : ''
                    }`}
                    onClick={() => handleUsernameClick(comment.createdBy?._id)}
                    style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
                  >
                    {comment.createdBy?.displayName ||
                      comment.createdBy?.username ||
                      'Unknown User'}
                  </span>
                  <span className="comment-time">
                    {formatTime(comment.createdAt)}
                  </span>
                </div>
                {comment.createdBy?._id === currentUser?.id && (
                  <div className="comment-actions">
                    {editingCommentId !== comment._id && (
                      <>
                        <button
                          className="btn-comment-action"
                          onClick={() => handleStartEdit(comment)}
                          title="Edit"
                        >
                          <Edit2 className="action-icon" />
                        </button>
                        <button
                          className="btn-comment-action delete"
                          onClick={() => handleDeleteComment(comment._id)}
                          title="Delete"
                        >
                          <Trash2 className="action-icon" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {editingCommentId === comment._id ? (
                <div className="comment-edit-form">
                  <textarea
                    className="comment-edit-input"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    rows="3"
                    maxLength="1000"
                    autoFocus
                  />
                  <div className="comment-edit-actions">
                    <button
                      type="button"
                      className="btn-cancel-edit"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-save-edit"
                      onClick={() => handleSaveEdit(comment._id)}
                      disabled={!editingText.trim()}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="comment-text">{comment.text}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
