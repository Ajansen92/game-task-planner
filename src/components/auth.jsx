import React, { useState } from 'react'
import { Users, Mail, Lock, User, LogIn, UserPlus } from 'lucide-react'
import { authAPI } from '../services/api'
import './Auth.css'

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
    setError('') // Clear error when user types
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        // Login
        if (!formData.email || !formData.password) {
          setError('Please fill in all fields')
          setLoading(false)
          return
        }

        const response = await authAPI.login({
          email: formData.email,
          password: formData.password,
        })

        console.log('✅ Login successful:', response)
        onLogin(response.user, response.token)
      } else {
        // Register
        if (!formData.username || !formData.email || !formData.password) {
          setError('Please fill in all fields')
          setLoading(false)
          return
        }

        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters')
          setLoading(false)
          return
        }

        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }

        const response = await authAPI.register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        })

        console.log('✅ Registration successful:', response)
        onLogin(response.user, response.token)
      }
    } catch (err) {
      console.error('❌ Auth error:', err)
      setError(
        err.response?.data?.message ||
          'Authentication failed. Please try again.'
      )
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    })
    setError('')
  }

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <Users className="auth-logo" />
            <h1 className="auth-title">Game Project Planner</h1>
            <p className="auth-subtitle">
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}

            {/* Username (Register only) */}
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">
                  <User className="label-icon" />
                  Username
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  placeholder="Enter your username"
                  disabled={loading}
                />
              </div>
            )}

            {/* Email */}
            <div className="form-group">
              <label className="form-label">
                <Mail className="label-icon" />
                Email
              </label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">
                <Lock className="label-icon" />
                Password
              </label>
              <input
                type="password"
                className="form-input"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            {/* Confirm Password (Register only) */}
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">
                  <Lock className="label-icon" />
                  Confirm Password
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleChange('confirmPassword', e.target.value)
                  }
                  placeholder="Confirm your password"
                  disabled={loading}
                />
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                'Please wait...'
              ) : isLogin ? (
                <>
                  <LogIn className="btn-icon" />
                  Sign In
                </>
              ) : (
                <>
                  <UserPlus className="btn-icon" />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="auth-toggle">
            <p>
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={toggleMode}
                className="toggle-button"
                disabled={loading}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
