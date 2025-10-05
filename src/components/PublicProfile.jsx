import { useState, useEffect } from 'react'
import { ArrowLeft, User, Calendar, FileText } from 'lucide-react'
import './PublicProfile.css'

export default function PublicProfile({ userId, onBack }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPublicProfile()
  }, [userId])

  const loadPublicProfile = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(
        `http://localhost:5000/api/users/public/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to load profile')
      }

      const data = await response.json()
      setProfile(data)
    } catch (err) {
      setError('Failed to load user profile')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="public-profile-container">
        <div className="loading-state">Loading profile...</div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="public-profile-container">
        <button onClick={onBack} className="back-button">
          <ArrowLeft className="back-icon" />
          Back
        </button>
        <div className="error-state">{error || 'User not found'}</div>
      </div>
    )
  }

  return (
    <div className="public-profile-container">
      <header className="public-profile-header">
        <button onClick={onBack} className="back-button">
          <ArrowLeft className="back-icon" />
          Back
        </button>
      </header>

      <div className="public-profile-content">
        {/* Avatar and Name Section */}
        <div className="profile-hero">
          <div className="hero-avatar">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.username}
                className="hero-avatar-image"
              />
            ) : (
              <div className="hero-avatar-placeholder">
                <User className="hero-avatar-icon" />
              </div>
            )}
          </div>

          <div className="hero-info">
            <h1 className="hero-username">
              {profile.displayName || profile.username}
            </h1>
            {profile.displayName && (
              <p className="hero-handle">@{profile.username}</p>
            )}
            <p className="hero-joined">
              <Calendar className="hero-icon" />
              Joined {formatDate(profile.createdAt)}
            </p>
          </div>
        </div>

        {/* Bio Section */}
        {profile.bio && (
          <div className="profile-section">
            <h2 className="section-title">
              <FileText className="section-icon" />
              About
            </h2>
            <p className="profile-bio">{profile.bio}</p>
          </div>
        )}

        {!profile.bio && !profile.displayName && (
          <div className="empty-profile">
            <p>This user hasn't set up their profile yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
