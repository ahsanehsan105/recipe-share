const fs = require('fs')
const path = require('path')
const cors = require('cors')
const dotenv = require('dotenv')
const express = require('express')
const multer = require('multer')
const mongoose = require('mongoose')
const connectDatabase = require('./config/database')
const communityRoutes = require('./routes/communityRoutes')
const mealRoutes = require('./routes/mealRoutes')
const recipeRoutes = require('./routes/recipeRoutes')
const recipeFeedbackRoutes = require('./routes/recipeFeedbackRoutes')
const requireDatabase = require('./middleware/requireDatabase')

dotenv.config({ path: path.join(__dirname, '.env') })

function ensureUploadDirectory(directory) {
  const candidates = [
    directory,
    path.resolve(process.cwd(), 'uploads'),
    path.resolve('/tmp', 'recipe-uploads'),
  ]

  for (const candidate of candidates) {
    try {
      fs.mkdirSync(candidate, { recursive: true })
      return candidate
    } catch (_error) {
      // Try the next safe fallback location.
    }
  }

  return directory
}

const app = express()
const port = process.env.PORT || 5000
const uploadDirectory = ensureUploadDirectory(path.resolve(__dirname, 'uploads'))

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' }))
app.use(express.json({ limit: '1mb' }))
app.use('/uploads', express.static(uploadDirectory))
app.use('/api/meals', mealRoutes)
app.use('/api/recipes', requireDatabase, recipeFeedbackRoutes)

app.get('/api/health', (_request, response) => {
  const connected = mongoose.connection.readyState === 1
  response.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'degraded',
    database: connected ? 'connected' : 'disconnected',
  })
})

app.use('/api/recipes', requireDatabase, recipeRoutes)
app.use('/api/community', requireDatabase, communityRoutes)

app.use((error, _request, response, _next) => {
  const status = error instanceof multer.MulterError
    ? error.code === 'LIMIT_FILE_SIZE' ? 413 : 400
    : error.status || 500
  response.status(status).json({ message: error.message || 'An unexpected server error occurred.' })
})

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function connectWithRetry() {
  let retryDelay = 2000

  while (mongoose.connection.readyState !== 1) {
    try {
      await connectDatabase()
      return
    } catch (error) {
      console.error(`MongoDB connection failed: ${error.message}`)
      console.error(`Recipe API remains available; retrying MongoDB in ${retryDelay / 1000}s.`)
      await wait(retryDelay)
      retryDelay = Math.min(retryDelay * 2, 30000)
    }
  }
}

const server = app.listen(port, () => {
  console.log(`Recipe API listening on port ${port}`)
  void connectWithRetry()
})

function shutdown() {
  server.close(() => {
    mongoose.disconnect().finally(() => process.exit(0))
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)