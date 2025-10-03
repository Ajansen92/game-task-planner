import React, { useState } from 'react'
import { X, Plus, User, Flag, Clock } from 'lucide-react'
import './TaskModal.css'

export default function AddTaskModal({ members, onClose, onAdd }) {
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'todo',
    assignedTo: 'Unassigned',
    priority: 'medium',
  })

  const handleChange = (field, value) => {
    setNewTask({ ...newTask, [field]: value })
  }

  const handleAdd = () => {
    if (newTask.title.trim() === '') {
      alert('Please enter a task title')
      return
    }

    const taskToAdd = {
      id: Date.now(), // Simple ID generation
      ...newTask,
    }

    onAdd(taskToAdd)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">Add New Task</h2>
          <button className="modal-close" onClick={onClose}>
            <X className="close-icon" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Task Title */}
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input
              type="text"
              className="form-input"
              value={newTask.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter task title"
              autoFocus
            />
          </div>

          {/* Task Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={newTask.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Enter task description (optional)"
              rows="4"
            />
          </div>

          {/* Task Status */}
          <div className="form-group">
            <label className="form-label">
              <Clock className="label-icon" />
              Status
            </label>
            <select
              className="form-select"
              value={newTask.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Assigned To */}
          <div className="form-group">
            <label className="form-label">
              <User className="label-icon" />
              Assigned To
            </label>
            <select
              className="form-select"
              value={newTask.assignedTo}
              onChange={(e) => handleChange('assignedTo', e.target.value)}
            >
              <option value="Unassigned">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.name}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="form-group">
            <label className="form-label">
              <Flag className="label-icon" />
              Priority
            </label>
            <select
              className="form-select"
              value={newTask.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div className="footer-spacer"></div>
          <div className="footer-actions">
            <button className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-save" onClick={handleAdd}>
              <Plus className="btn-icon" />
              Add Task
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
