import React, { useState } from 'react'
import { X, Search, UserPlus } from 'lucide-react'
import { invitationsAPI } from '../services/api'
import './InviteMemberModal.css'

export default function InviteMemberModal({
  projectId,
  onClose,
  onInviteSent,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [sending, setSending] = useState(false)

  const handleSearch = async () => {
    if (searchTerm.length < 2) {
      setError('Please enter at least 2 characters')
      return
    }

    try {
      setSearching(true)
      setError('')
      const results = await invitationsAPI.searchUsers(searchTerm)
      setSearchResults(results)

      if (results.length === 0) {
        setError('No users found')
      }
    } catch (err) {
      console.error('Search error:', err)
      setError('Failed to search users')
    } finally {
      setSearching(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleSelectUser = (user) => {
    setSelectedUser(user)
    setError('')
  }

  const handleSendInvite = async () => {
    if (!selectedUser) {
      setError('Please select a user')
      return
    }

    try {
      setSending(true)
      setError('')
      await invitationsAPI.send(projectId, selectedUser.username)

      setSuccess(`Invitation sent to ${selectedUser.username}!`)
      setTimeout(() => {
        if (onInviteSent) onInviteSent()
        onClose()
      }, 1500)
    } catch (err) {
      console.error('Send invitation error:', err)
      setError(err.response?.data?.message || 'Failed to send invitation')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">Invite Team Member</h2>
          <button className="modal-close" onClick={onClose}>
            <X className="close-icon" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Success Message */}
          {success && <div className="success-message">{success}</div>}

          {/* Error Message */}
          {error && <div className="auth-error">{error}</div>}

          {/* Search Input */}
          <div className="form-group">
            <label className="form-label">Search by Username</label>
            <div className="search-input-container">
              <input
                type="text"
                className="form-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter username..."
                disabled={sending}
              />
              <button
                className="search-button"
                onClick={handleSearch}
                disabled={searching || sending}
              >
                <Search className="btn-icon" />
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="search-results">
              <p className="results-label">Select a user to invite:</p>
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  className={`user-result ${
                    selectedUser?._id === user._id ? 'selected' : ''
                  }`}
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="user-avatar">👤</div>
                  <div className="user-info">
                    <p className="user-username">{user.username}</p>
                    <p className="user-email">{user.email}</p>
                  </div>
                  {selectedUser?._id === user._id && (
                    <span className="selected-check">✓</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Selected User */}
          {selectedUser && (
            <div className="selected-user-box">
              <p className="selected-label">Selected User:</p>
              <div className="selected-user">
                <div className="user-avatar">👤</div>
                <span className="user-username">{selectedUser.username}</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div className="footer-spacer"></div>
          <div className="footer-actions">
            <button className="btn-cancel" onClick={onClose} disabled={sending}>
              Cancel
            </button>
            <button
              className="btn-save"
              onClick={handleSendInvite}
              disabled={!selectedUser || sending}
            >
              <UserPlus className="btn-icon" />
              {sending ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
