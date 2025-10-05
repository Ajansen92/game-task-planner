import React, { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Users,
  Calendar,
  Plus,
  MoreVertical,
  CheckCircle2,
  Circle,
  Clock,
} from 'lucide-react'
import TaskModal from './TaskModal'
import AddTaskModal from './AddTaskModal'
import InviteMemberModal from './InviteMemberModal'
import { tasksAPI } from '../services/api'
import socketService from '../services/socket'
import './ProjectDetail.css'

export default function ProjectDetail({
  project,
  onBack,
  onUpdateTasks,
  currentUser,
}) {
  const [selectedTask, setSelectedTask] = useState(null)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [showInviteMemberModal, setShowInviteMemberModal] = useState(false)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState(0)
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(true)

  // Fetch project members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoadingMembers(true)
        const response = await fetch(
          `http://localhost:5000/api/projects/${project.id}/members`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch members')
        }

        const data = await response.json()

        // Transform to match expected format
        const transformedMembers = data.map((member) => ({
          id: member.user._id,
          name: member.user.username,
          role: member.role,
          avatar: member.user.username.charAt(0).toUpperCase() + '👤',
        }))

        setMembers(transformedMembers)
      } catch (err) {
        console.error('Failed to fetch members:', err)
      } finally {
        setLoadingMembers(false)
      }
    }

    fetchMembers()
  }, [project.id])

  // Join project room and set up Socket.io listeners
  useEffect(() => {
    socketService.joinProject(project.id)
    socketService.onTaskCreated(handleTaskCreatedFromSocket)
    socketService.onTaskUpdated(handleTaskUpdatedFromSocket)
    socketService.onTaskDeleted(handleTaskDeletedFromSocket)

    return () => {
      socketService.leaveProject(project.id)
      socketService.off('task-created')
      socketService.off('task-updated')
      socketService.off('task-deleted')
    }
  }, [project.id])

  // Fetch tasks when component mounts
  useEffect(() => {
    fetchTasks()
  }, [project.id])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await tasksAPI.getByProject(project.id)

      // Transform backend data to match frontend structure
      const transformedTasks = data.map((task) => ({
        id: task._id,
        title: task.title,
        description: task.description || '',
        status: task.status,
        assignedTo: task.assignedTo || 'Unassigned',
        priority: task.priority,
      }))

      setTasks(transformedTasks)
      if (onUpdateTasks) onUpdateTasks(transformedTasks)
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
      setError('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  // Socket.io event handlers
  const handleTaskCreatedFromSocket = (task) => {
    console.log('Real-time: Task created', task)
    const transformedTask = {
      id: task._id,
      title: task.title,
      description: task.description || '',
      status: task.status,
      assignedTo: task.assignedTo || 'Unassigned',
      priority: task.priority,
    }
    setTasks((prev) => [...prev, transformedTask])
  }

  const handleTaskUpdatedFromSocket = (task) => {
    console.log('Real-time: Task updated', task)
    const transformedTask = {
      id: task._id,
      title: task.title,
      description: task.description || '',
      status: task.status,
      assignedTo: task.assignedTo || 'Unassigned',
      priority: task.priority,
    }
    setTasks((prev) =>
      prev.map((t) => (t.id === transformedTask.id ? transformedTask : t))
    )
  }

  const handleTaskDeletedFromSocket = (taskId) => {
    console.log('Real-time: Task deleted', taskId)
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  const getTasksByStatus = (status) => {
    return tasks.filter((task) => task.status === status)
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'priority-high'
      case 'medium':
        return 'priority-medium'
      case 'low':
        return 'priority-low'
      default:
        return ''
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="status-icon completed" />
      case 'in-progress':
        return <Clock className="status-icon in-progress" />
      case 'todo':
        return <Circle className="status-icon todo" />
      default:
        return null
    }
  }

  const handleTaskClick = (task) => {
    setSelectedTask(task)
  }

  const handleSaveTask = async (updatedTask) => {
    try {
      await tasksAPI.update(updatedTask.id, {
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        priority: updatedTask.priority,
        assignedTo: updatedTask.assignedTo,
      })

      const newTasks = tasks.map((t) =>
        t.id === updatedTask.id ? updatedTask : t
      )
      setTasks(newTasks)
      if (onUpdateTasks) onUpdateTasks(newTasks)

      // Emit real-time update
      socketService.emitTaskUpdated(project.id, {
        _id: updatedTask.id,
        ...updatedTask,
      })
    } catch (err) {
      console.error('Failed to update task:', err)
      alert('Failed to update task. Please try again.')
    }
  }

  const handleDeleteTask = async (taskId) => {
    try {
      await tasksAPI.delete(taskId)

      const newTasks = tasks.filter((t) => t.id !== taskId)
      setTasks(newTasks)
      if (onUpdateTasks) onUpdateTasks(newTasks)

      // Emit real-time update
      socketService.emitTaskDeleted(project.id, taskId)
    } catch (err) {
      console.error('Failed to delete task:', err)
      alert('Failed to delete task. Please try again.')
    }
  }

  const handleAddTask = async (newTask) => {
    try {
      const response = await tasksAPI.create(project.id, newTask)

      const createdTask = {
        id: response.task._id,
        title: response.task.title,
        description: response.task.description || '',
        status: response.task.status,
        assignedTo: response.task.assignedTo || 'Unassigned',
        priority: response.task.priority,
      }

      const newTasks = [...tasks, createdTask]
      setTasks(newTasks)
      if (onUpdateTasks) onUpdateTasks(newTasks)

      // Emit real-time update
      socketService.emitTaskCreated(project.id, response.task)
    } catch (err) {
      console.error('Failed to create task:', err)
      alert('Failed to create task. Please try again.')
    }
  }

  // Drag and Drop handlers
  const [draggedTask, setDraggedTask] = useState(null)

  const handleDragStart = (e, task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, newStatus) => {
    e.preventDefault()
    if (draggedTask && draggedTask.status !== newStatus) {
      const updatedTask = { ...draggedTask, status: newStatus }

      try {
        await tasksAPI.update(updatedTask.id, {
          status: newStatus,
        })

        const newTasks = tasks.map((t) =>
          t.id === draggedTask.id ? updatedTask : t
        )
        setTasks(newTasks)
        if (onUpdateTasks) onUpdateTasks(newTasks)

        // Emit real-time update
        socketService.emitTaskUpdated(project.id, {
          _id: updatedTask.id,
          ...updatedTask,
        })
      } catch (err) {
        console.error('Failed to update task status:', err)
        alert('Failed to move task. Please try again.')
      }
    }
    setDraggedTask(null)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
  }

  const handleInviteSent = () => {
    console.log('Invitation sent successfully!')
    // Refresh members list
    const fetchMembers = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/projects/${project.id}/members`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        )
        const data = await response.json()
        const transformedMembers = data.map((member) => ({
          id: member.user._id,
          name: member.user.username,
          role: member.role,
          avatar: member.user.username.charAt(0).toUpperCase() + '👤',
        }))
        setMembers(transformedMembers)
      } catch (err) {
        console.error('Failed to refresh members:', err)
      }
    }
    fetchMembers()
  }

  return (
    <div className="project-detail-container">
      {/* Header */}
      <header className="project-detail-header">
        <div className="header-content">
          <button onClick={onBack} className="back-button">
            <ArrowLeft className="back-icon" />
            Back to Dashboard
          </button>

          <div className="project-info">
            <div className="project-title-section">
              <h1 className="project-title">{project.name}</h1>
              <span className="game-tag">{project.game}</span>
              {onlineUsers > 0 && (
                <span className="online-indicator">
                  {onlineUsers + 1} online
                </span>
              )}
            </div>

            <div className="project-meta">
              <div className="meta-item">
                <Users className="meta-icon" />
                <span>{members.length} Members</span>
              </div>
              <div className="meta-item">
                <Calendar className="meta-icon" />
                <span>Created 2 weeks ago</span>
              </div>
            </div>
          </div>

          <button
            className="btn-add-task"
            onClick={() => setShowAddTaskModal(true)}
          >
            <Plus className="btn-icon" />
            Add Task
          </button>
        </div>
      </header>

      <div className="project-detail-main">
        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <p>Loading tasks...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-message">
            {error}
            <button onClick={fetchTasks} className="retry-button">
              Retry
            </button>
          </div>
        )}

        {/* Team Members Sidebar */}
        {!loading && (
          <aside className="members-sidebar">
            <h3 className="sidebar-title">Team Members</h3>
            <div className="members-list">
              {loadingMembers ? (
                <p className="loading-members">Loading members...</p>
              ) : members && members.length > 0 ? (
                members.map((member) => (
                  <div key={member.id} className="member-card">
                    <div className="member-avatar">{member.avatar}</div>
                    <div className="member-info">
                      <p className="member-name">{member.name}</p>
                      <span className={`member-role ${member.role}`}>
                        {member.role}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-members">No members yet</p>
              )}
            </div>

            <button
              className="btn-invite"
              onClick={() => setShowInviteMemberModal(true)}
            >
              <Plus className="btn-icon" />
              Invite Member
            </button>
          </aside>
        )}

        {/* Kanban Board */}
        {!loading && (
          <div className="kanban-board">
            {/* To Do Column */}
            <div
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'todo')}
            >
              <div className="column-header">
                <h3 className="column-title">
                  <Circle className="column-icon" />
                  To Do
                </h3>
                <span className="task-count">
                  {getTasksByStatus('todo').length}
                </span>
              </div>
              <div className="tasks-container">
                {getTasksByStatus('todo').map((task) => (
                  <div
                    key={task.id}
                    className="task-card"
                    onClick={() => handleTaskClick(task)}
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="task-header">
                      <span
                        className={`priority-dot ${getPriorityColor(
                          task.priority
                        )}`}
                      ></span>
                      <button
                        className="task-menu"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="menu-icon" />
                      </button>
                    </div>
                    <h4 className="task-title">{task.title}</h4>
                    <p className="task-description">{task.description}</p>
                    <div className="task-footer">
                      <span className="task-assignee">{task.assignedTo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* In Progress Column */}
            <div
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'in-progress')}
            >
              <div className="column-header">
                <h3 className="column-title">
                  <Clock className="column-icon" />
                  In Progress
                </h3>
                <span className="task-count">
                  {getTasksByStatus('in-progress').length}
                </span>
              </div>
              <div className="tasks-container">
                {getTasksByStatus('in-progress').map((task) => (
                  <div
                    key={task.id}
                    className="task-card"
                    onClick={() => handleTaskClick(task)}
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="task-header">
                      <span
                        className={`priority-dot ${getPriorityColor(
                          task.priority
                        )}`}
                      ></span>
                      <button
                        className="task-menu"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="menu-icon" />
                      </button>
                    </div>
                    <h4 className="task-title">{task.title}</h4>
                    <p className="task-description">{task.description}</p>
                    <div className="task-footer">
                      <span className="task-assignee">{task.assignedTo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Completed Column */}
            <div
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'completed')}
            >
              <div className="column-header">
                <h3 className="column-title">
                  <CheckCircle2 className="column-icon" />
                  Completed
                </h3>
                <span className="task-count">
                  {getTasksByStatus('completed').length}
                </span>
              </div>
              <div className="tasks-container">
                {getTasksByStatus('completed').map((task) => (
                  <div
                    key={task.id}
                    className="task-card completed"
                    onClick={() => handleTaskClick(task)}
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="task-header">
                      <span
                        className={`priority-dot ${getPriorityColor(
                          task.priority
                        )}`}
                      ></span>
                      <button
                        className="task-menu"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="menu-icon" />
                      </button>
                    </div>
                    <h4 className="task-title">{task.title}</h4>
                    <p className="task-description">{task.description}</p>
                    <div className="task-footer">
                      <span className="task-assignee">{task.assignedTo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          members={members}
          onClose={() => setSelectedTask(null)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          projectId={project.id}
          currentUser={currentUser}
        />
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <AddTaskModal
          members={members}
          onClose={() => setShowAddTaskModal(false)}
          onAdd={handleAddTask}
        />
      )}

      {/* Invite Member Modal */}
      {showInviteMemberModal && (
        <InviteMemberModal
          projectId={project.id}
          onClose={() => setShowInviteMemberModal(false)}
          onInviteSent={handleInviteSent}
        />
      )}
    </div>
  )
}
