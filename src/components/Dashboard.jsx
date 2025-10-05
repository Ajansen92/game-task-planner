import React, { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  Mail,
  Check,
  X,
  Calendar,
  ListTodo,
  LogOut,
  User,
} from 'lucide-react'
import ProjectDetail from './ProjectDetail'
import CreateProjectModal from './CreateProjectModal'
import NotificationBell from './NotificationBell'
import UserProfile from './UserProfile'
import { projectsAPI, invitationsAPI } from '../services/api'
import './Dashboard.css'

export default function Dashboard({ user, onLogout }) {
  const [activeView, setActiveView] = useState('dashboard')
  const [selectedProject, setSelectedProject] = useState(null)
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [currentUser, setCurrentUser] = useState(user)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [invitations, setInvitations] = useState([])

  // Fetch projects and invitations on component mount
  useEffect(() => {
    fetchProjects()
    fetchInvitations()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await projectsAPI.getAll()

      // Transform backend data to match frontend structure
      const transformedProjects = data.map((project) => ({
        id: project._id,
        name: project.title,
        game: project.game,
        members: project.members.length,
        tasks: project.taskCount || 0,
        completedTasks: project.completedTasks || 0,
        role: project.userRole || 'member',
        projectTasks: [],
      }))

      setProjects(transformedProjects)
    } catch (err) {
      console.error('Failed to fetch projects:', err)
      setError('Failed to load projects. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchInvitations = async () => {
    try {
      const data = await invitationsAPI.getAll()
      setInvitations(data)
    } catch (err) {
      console.error('Failed to fetch invitations:', err)
    }
  }

  const handleAcceptInvite = async (inviteId) => {
    try {
      await invitationsAPI.accept(inviteId)
      // Refresh both projects and invitations
      await fetchProjects()
      await fetchInvitations()
    } catch (err) {
      console.error('Failed to accept invitation:', err)
      setError('Failed to accept invitation. Please try again.')
    }
  }

  const handleDeclineInvite = async (inviteId) => {
    try {
      await invitationsAPI.decline(inviteId)
      // Refresh invitations
      await fetchInvitations()
    } catch (err) {
      console.error('Failed to decline invitation:', err)
      setError('Failed to decline invitation. Please try again.')
    }
  }

  const handleProjectClick = (project) => {
    setSelectedProject(project)
  }

  const handleBackToDashboard = () => {
    setSelectedProject(null)
    fetchProjects() // Refresh projects when returning to dashboard
  }

  const handleCreateProject = async (newProject) => {
    try {
      const response = await projectsAPI.create(newProject)
      console.log('✅ Project created:', response)

      // Refresh projects list
      await fetchProjects()
    } catch (err) {
      console.error('Failed to create project:', err)
      setError('Failed to create project. Please try again.')
    }
  }

  const handleUpdateProjectTasks = (projectId, updatedTasks) => {
    setProjects(
      projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              projectTasks: updatedTasks,
              tasks: updatedTasks.length,
              completedTasks: updatedTasks.filter(
                (t) => t.status === 'completed'
              ).length,
            }
          : p
      )
    )
  }

  const handleProfileUpdate = (updatedUser) => {
    setCurrentUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  // If profile is shown, display profile view
  if (showProfile) {
    return (
      <UserProfile
        user={currentUser}
        onBack={() => setShowProfile(false)}
        onProfileUpdate={handleProfileUpdate}
      />
    )
  }

  // If a project is selected, show the detail view
  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        onBack={handleBackToDashboard}
        onUpdateTasks={(updatedTasks) =>
          handleUpdateProjectTasks(selectedProject.id, updatedTasks)
        }
        currentUser={currentUser}
      />
    )
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="header-title">
              <Users className="header-icon" />
              QuestBoard
            </h1>
          </div>
          <div className="header-actions">
            <span className="user-name">
              👋 {currentUser?.displayName || currentUser?.username || 'User'}
            </span>
            <NotificationBell />
            <button
              className="btn-profile"
              onClick={() => setShowProfile(true)}
              title="Edit Profile"
            >
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt="Profile"
                  className="header-avatar"
                />
              ) : (
                <User className="btn-icon" />
              )}
            </button>
            <button
              className="btn-primary"
              onClick={() => setShowCreateProjectModal(true)}
            >
              <Plus className="btn-icon" />
              New Project
            </button>
            <button className="btn-logout" onClick={onLogout}>
              <LogOut className="btn-icon" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-main">
        {/* Navigation Tabs */}
        <div className="nav-tabs">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`nav-tab ${activeView === 'dashboard' ? 'active' : ''}`}
          >
            My Projects
          </button>
          <button
            onClick={() => setActiveView('invitations')}
            className={`nav-tab ${
              activeView === 'invitations' ? 'active' : ''
            }`}
          >
            <Mail className="tab-icon" />
            Invitations
            {invitations.length > 0 && (
              <span className="notification-badge">{invitations.length}</span>
            )}
          </button>
        </div>

        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <>
            {error && (
              <div className="error-message">
                {error}
                <button onClick={fetchProjects} className="retry-button">
                  Retry
                </button>
              </div>
            )}

            {loading ? (
              <div className="loading-container">
                <p>Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="empty-state">
                <Users className="empty-icon" />
                <h3 className="empty-title">No Projects Yet</h3>
                <p className="empty-text">
                  Create your first project to get started!
                </p>
                <button
                  className="btn-primary"
                  onClick={() => setShowCreateProjectModal(true)}
                >
                  <Plus className="btn-icon" />
                  Create Project
                </button>
              </div>
            ) : (
              <div className="projects-grid">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="project-card"
                    onClick={() => handleProjectClick(project)}
                  >
                    <div className="project-header">
                      <div>
                        <h3 className="project-name">{project.name}</h3>
                        <p className="project-game">{project.game}</p>
                      </div>
                      <span className={`role-badge ${project.role}`}>
                        {project.role}
                      </span>
                    </div>

                    <div className="project-stats">
                      <div className="stat-row">
                        <span className="stat-label">
                          <Users className="stat-icon" />
                          Members
                        </span>
                        <span className="stat-value">{project.members}</span>
                      </div>

                      <div className="stat-row">
                        <span className="stat-label">
                          <ListTodo className="stat-icon" />
                          Tasks
                        </span>
                        <span className="stat-value">
                          {project.completedTasks}/{project.tasks}
                        </span>
                      </div>

                      {project.tasks > 0 && (
                        <div className="progress-section">
                          <div className="progress-header">
                            <span>Progress</span>
                            <span>
                              {Math.round(
                                (project.completedTasks / project.tasks) * 100
                              )}
                              %
                            </span>
                          </div>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${
                                  (project.completedTasks / project.tasks) * 100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Invitations View */}
        {activeView === 'invitations' && (
          <div className="invitations-container">
            {invitations.length === 0 ? (
              <div className="empty-state">
                <Mail className="empty-icon" />
                <h3 className="empty-title">No Pending Invitations</h3>
                <p className="empty-text">
                  You're all caught up! New project invitations will appear
                  here.
                </p>
              </div>
            ) : (
              invitations.map((invite) => (
                <div key={invite.id} className="invitation-card">
                  <div className="invitation-content">
                    <div className="invitation-header">
                      <h3 className="invitation-name">{invite.projectName}</h3>
                      <span className="game-badge">{invite.game}</span>
                    </div>

                    <div className="invitation-details">
                      <p className="detail-row">
                        <Users className="detail-icon" />
                        Invited by{' '}
                        <span className="invited-by">{invite.invitedBy}</span>
                      </p>
                      <p className="detail-row">
                        <Calendar className="detail-icon" />
                        {invite.invitedAt}
                      </p>
                      <p className="detail-text">
                        {invite.memberCount} member
                        {invite.memberCount !== 1 ? 's' : ''} currently in
                        project
                      </p>
                    </div>

                    <div className="invitation-actions">
                      <button
                        onClick={() => handleAcceptInvite(invite.id)}
                        className="btn-accept"
                      >
                        <Check className="btn-icon" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineInvite(invite.id)}
                        className="btn-decline"
                      >
                        <X className="btn-icon" />
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateProjectModal && (
        <CreateProjectModal
          onClose={() => setShowCreateProjectModal(false)}
          onCreate={handleCreateProject}
        />
      )}
    </div>
  )
}
