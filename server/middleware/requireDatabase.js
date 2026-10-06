const mongoose = require('mongoose')
const connectDatabase = require('../config/database')

async function requireDatabase(_request, response, next) {
  if (mongoose.connection.readyState === 1) {
    next()
    return
  }

  try {
    await connectDatabase()
    next()
  } catch (error) {
    console.error('Database connection required for request failed:', error.message)
    response.status(503).json({
      message: 'Community and recipe data are temporarily unavailable. Please try again shortly.',
    })
  }
}

module.exports = requireDatabase