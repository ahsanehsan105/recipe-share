const { timingSafeEqual } = require('crypto')

function requireRecipeImageAdmin(request, response, next) {
  const expectedKey = process.env.RECIPE_IMAGE_ADMIN_KEY
  if (!expectedKey) {
    response.status(503).json({ message: 'Recipe image updates are not configured.' })
    return
  }

  const providedKey = request.get('x-recipe-image-admin-key') || ''
  const providedBuffer = Buffer.from(providedKey)
  const expectedBuffer = Buffer.from(expectedKey)
  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    response.status(401).json({ message: 'Admin authorization is required.' })
    return
  }

  next()
}

module.exports = requireRecipeImageAdmin