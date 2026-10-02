const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const multer = require('multer')

const uploadDirectory = path.join(__dirname, '..', 'uploads')
const imageExtensions = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

fs.mkdirSync(uploadDirectory, { recursive: true })

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => callback(null, uploadDirectory),
  filename: (_request, file, callback) => {
    callback(null, `${crypto.randomUUID()}${imageExtensions[file.mimetype]}`)
  },
})

module.exports = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, fields: 12, fieldSize: 32 * 1024 },
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