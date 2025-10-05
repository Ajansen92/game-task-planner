import { useState } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'
import './ChangePassword.css'

export default function ChangePassword() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const validatePassword = () => {
    if (!formData.currentPassword) {
      setError('Current password is required')
      return false
    }
    if (!formData.newPassword) {
      setError('New password is required')
      return false
    }
    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return false
    }
    if (formData.newPassword === formData.currentPassword) {
      setError('New password must be different from current password')
      return false
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validatePassword()) return

    try {
      setLoading(true)

      const response = await fetch(
        'http://localhost:5000/api/users/change-password',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
          }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to change password')
      }

      setSuccess('Password changed successfully')
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  return (
    <div className="change-password-section">
      <h2 className="section-title">
        <Lock className="section-icon" />
        Change Password
      </h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="password-form">
        <div className="form-group">
          <label className="form-label">Current Password</label>
          <div className="password-input-wrapper">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              className="form-input"
              value={formData.currentPassword}
              onChange={(e) =>
                setFormData({ ...formData, currentPassword: e.target.value })
              }
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => togglePasswordVisibility('current')}
            >
              {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">New Password</label>
          <div className="password-input-wrapper">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              className="form-input"
              value={formData.newPassword}
              onChange={(e) =>
                setFormData({ ...formData, newPassword: e.target.value })
              }
              required
              minLength={6}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => togglePasswordVisibility('new')}
            >
              {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <p className="field-hint">Minimum 6 characters</p>
        </div>

        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <div className="password-input-wrapper">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              className="form-input"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => togglePasswordVisibility('confirm')}
            >
              {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn-change-password"
          disabled={loading}
        >
          {loading ? 'Changing Password...' : 'Change Password'}
        </button>
      </form>
    </div>
  )
}
