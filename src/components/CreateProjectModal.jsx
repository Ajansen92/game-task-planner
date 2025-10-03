import React, { useState } from 'react'
import { X, Plus, Gamepad2 } from 'lucide-react'
import './TaskModal.css'

export default function CreateProjectModal({ onClose, onCreate }) {
  const [newProject, setNewProject] = useState({
    name: '',
    game: 'Minecraft',
    description: '',
  })

  const gameOptions = [
    'Minecraft',
    'Terraria',
    'Stardew Valley',
    'Valheim',
    'ARK: Survival Evolved',
    'Rust',
    "Don't Starve Together",
    'Factorio',
    'Satisfactory',
    'Other',
  ]

  const handleChange = (field, value) => {
    setNewProject({ ...newProject, [field]: value })
  }

  const handleCreate = () => {
    if (newProject.name.trim() === '') {
      alert('Please enter a project name')
      return
    }

    const projectToCreate = {
      id: Date.now(),
      name: newProject.name,
      game: newProject.game,
      members: 1, // Just you to start
      tasks: 0,
      completedTasks: 0,
      role: 'owner',
      createdDate: 'Just now',
    }

    onCreate(projectToCreate)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">Create New Project</h2>
          <button className="modal-close" onClick={onClose}>
            <X className="close-icon" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Project Name */}
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input
              type="text"
              className="form-input"
              value={newProject.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter project name (e.g., 'Mega Base Build')"
              autoFocus
            />
          </div>

          {/* Game Selection */}
          <div className="form-group">
            <label className="form-label">
              <Gamepad2 className="label-icon" />
              Game
            </label>
            <select
              className="form-select"
              value={newProject.game}
              onChange={(e) => handleChange('game', e.target.value)}
            >
              {gameOptions.map((game) => (
                <option key={game} value={game}>
                  {game}
                </option>
              ))}
            </select>
          </div>

          {/* Project Description */}
          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea
              className="form-textarea"
              value={newProject.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="What's this project about? What are your goals?"
              rows="4"
            />
          </div>

          {/* Info Box */}
          <div className="info-box">
            <p className="info-text">
              💡 <strong>Tip:</strong> After creating your project, you can
              invite team members and start adding tasks!
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div className="footer-spacer"></div>
          <div className="footer-actions">
            <button className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-save" onClick={handleCreate}>
              <Plus className="btn-icon" />
              Create Project
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
