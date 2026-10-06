const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const multer = require('multer')

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

const uploadDirectory = ensureUploadDirectory(path.resolve(__dirname, '..', 'uploads'))
const imageExtensions = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => callback(null, uploadDirectory),
  filename: (_request, file, callback) => {
    callback(null, `${crypto.randomUUID()}${imageExtensions[file.mimetype]}`)
  },
})

module.exports = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, fields: 50, fieldSize: 32 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (!imageExtensions[file.mimetype]) {
      const error = new Error('Upload a JPG, PNG, or WebP image.')
      error.status = 400
      callback(error)
      return
    }
    callback(null, true)
  },
})