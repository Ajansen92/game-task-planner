import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Camera,
  User,
  Mail,
  FileText,
  Lock,
  Settings,
} from 'lucide-react'
import ChangePassword from './ChangePassword'
import './UserProfile.css'

export default function UserProfile({ user, onBack, onProfileUpdate }) {
  const [activeTab, setActiveTab] = useState('profile')
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
    email: '',
  })
  const [avatar, setAvatar] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/profile', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) throw new Error('Failed to load profile')

      const data = await response.json()
      setFormData({
        username: data.username,
        displayName: data.displayName || '',
        bio: data.bio || '',
        email: data.email,
      })
      setAvatar(data.avatar)
    } catch (err) {
      setError('Failed to load profile')
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file size (max 150KB)
    if (file.size > 150000) {
      setError('Image too large. Please use an image under 150KB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      handleAvatarUpload(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleAvatarUpload = async (base64Image) => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('http://localhost:5000/api/users/avatar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ avatar: base64Image }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to upload avatar')
      }

      const data = await response.json()
      setAvatar(data.avatar)
      setSuccess('Avatar updated successfully')

      // Update user in parent component
      if (onProfileUpdate) {
        onProfileUpdate({ ...user, avatar: data.avatar })
      }

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!window.confirm('Remove your profile picture?')) return

    try {
      setLoading(true)
      setError('')

      const response = await fetch('http://localhost:5000/api/users/avatar', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) throw new Error('Failed to remove avatar')

      setAvatar(null)
      setSuccess('Avatar removed')

      if (onProfileUpdate) {
        onProfileUpdate({ ...user, avatar: null })
      }

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      setLoading(true)

      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          username: formData.username,
          displayName: formData.displayName,
          bio: formData.bio,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to update profile')
      }

      const data = await response.json()
      setSuccess('Profile updated successfully')

      // Update localStorage and parent component
      localStorage.setItem('user', JSON.stringify(data.user))
      if (onProfileUpdate) {
        onProfileUpdate(data.user)
      }

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="profile-container">
      <header className="profile-header">
        <button onClick={onBack} className="back-button">
          <ArrowLeft className="back-icon" />
          Back to Dashboard
        </button>
        <h1 className="profile-title">Settings</h1>
      </header>

      <div className="profile-layout">
        {/* Sidebar Navigation */}
        <aside className="profile-sidebar">
          <button
            className={`sidebar-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <Settings className="tab-icon" />
            Profile
          </button>
          <button
            className={`sidebar-tab ${
              activeTab === 'security' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('security')}
          >
            <Lock className="tab-icon" />
            Security
          </button>
        </aside>

        {/* Main Content */}
        <div className="profile-content">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <>
              {/* Avatar Section */}
              <div className="avatar-section">
                <div className="avatar-display">
                  {avatar ? (
                    <img src={avatar} alt="Profile" className="avatar-image" />
                  ) : (
                    <div className="avatar-placeholder">
                      <User className="avatar-icon" />
                    </div>
                  )}
                </div>

                <div className="avatar-actions">
                  <label className="btn-upload">
                    <Camera className="btn-icon" />
                    {avatar ? 'Change Photo' : 'Upload Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                      disabled={loading}
                    />
                  </label>

                  {avatar && (
                    <button
                      onClick={handleRemoveAvatar}
                      className="btn-remove"
                      disabled={loading}
                    >
                      Remove Photo
                    </button>
                  )}

                  <p className="avatar-hint">Max 150KB • JPG, PNG, GIF</p>
                </div>
              </div>

              {/* Profile Form */}
              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-group">
                  <label className="form-label">
                    <User className="label-icon" />
                    Username
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    required
                    minLength={2}
                    maxLength={50}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <FileText className="label-icon" />
                    Display Name (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData({ ...formData, displayName: e.target.value })
                    }
                    maxLength={100}
                    placeholder="How should we call you?"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Mail className="label-icon" />
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    disabled
                  />
                  <p className="field-hint">Email cannot be changed</p>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <FileText className="label-icon" />
                    Bio (Optional)
                  </label>
                  <textarea
                    className="form-textarea"
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    maxLength={500}
                    rows={4}
                    placeholder="Tell us about yourself..."
                  />
                  <p className="field-hint">
                    {formData.bio.length}/500 characters
                  </p>
                </div>

                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && <ChangePassword />}
        </div>
      </div>
    </div>
  )
}
