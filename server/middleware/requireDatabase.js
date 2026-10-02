const mongoose = require('mongoose')

function requireDatabase(_request, response, next) {
  if (mongoose.connection.readyState !== 1) {
    response.status(503).json({ message: 'Community and recipe data are temporarily unavailable. Please try again shortly.' })
    return
  }
  next()
}

module.exports = requireDatabase