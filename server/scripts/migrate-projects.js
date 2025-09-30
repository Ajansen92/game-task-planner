// Migration script to add owners to members array
const mongoose = require('mongoose')
require('dotenv').config()
const Project = require('../models/Project')

async function migrateProjects() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to database')

    // Find all projects
    const projects = await Project.find({})

    console.log(`Found ${projects.length} projects to migrate`)

    for (const project of projects) {
      // Check if createdBy user is already in members
      const hasCreator = project.members.some(
        (m) => m.user.toString() === project.createdBy.toString()
      )

      if (!hasCreator) {
        console.log(`Adding creator to project: ${project.title}`)
        project.members.push({
          user: project.createdBy,
          role: 'owner',
          joinedAt: project.createdAt || new Date(),
        })
        await project.save()
      } else {
        console.log(`Project already has creator: ${project.title}`)
      }
    }

    console.log('✅ Migration complete!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration error:', error)
    process.exit(1)
  }
}

migrateProjects()
