const multer = require('multer')

const imageExtensions = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, fields: 50, fieldSize: 32 * 1024 },
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