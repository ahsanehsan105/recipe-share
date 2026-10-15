const Recipe = require('../models/Recipe')
const RecipeFeedback = require('../models/RecipeFeedback')

function splitLines(value) {
  return String(value || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
}

function isHttpUrl(value) {
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') && value.length <= 2048
  } catch {
    return false
  }
}

async function getRecipeRatingsById(recipeIds) {
  if (!recipeIds.length) return {}

  const ratings = await RecipeFeedback.aggregate([
    { $match: { recipeId: { $in: recipeIds }, kind: 'rating' } },
    { $group: { _id: '$recipeId', average: { $avg: '$rating' }, total: { $sum: 1 } } },
  ])

  return Object.fromEntries(ratings.map((entry) => [entry._id, Number((entry.average || 0).toFixed(1))]))
}

async function createRecipe(request, response, next) {
  try {
    const imageUrl = String(request.body.imageUrl || '').trim()
    if (!isHttpUrl(imageUrl)) return response.status(400).json({ message: 'Enter a valid http or https recipe image URL.' })

    const recipe = new Recipe({
      name: request.body.name,
      sharedBy: request.body.sharedBy,
      email: request.body.email,
      category: request.body.category,
      diet: request.body.diet,
      description: request.body.description,
      ingredients: splitLines(request.body.ingredients),
      instructions: splitLines(request.body.instructions),
      prepTime: Number(request.body.prepTime),
      cookTime: Number(request.body.cookTime),
      servings: Number(request.body.servings),
      imagePath: imageUrl,
      videoUrl: request.body.videoUrl?.trim() || undefined,
    })
    await recipe.save()

    const { email, ...publicRecipe } = recipe.toObject()
    delete publicRecipe.imageData
    delete publicRecipe.imageMimeType
    return response.status(201).json({ recipe: { ...publicRecipe, rating: 0 } })
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return response.status(400).json({ message: error.message })
    }
    return next(error)
  }
}

async function getRecipeImage(request, response, next) {
  try {
    const recipe = await Recipe.findById(request.params.id).select('+imageData +imageMimeType')
    if (!recipe?.imageData || !recipe.imageMimeType) {
      return response.status(404).json({ message: 'Recipe image not found.' })
    }

    const imageData = Buffer.isBuffer(recipe.imageData)
      ? recipe.imageData
      : recipe.imageData.value?.(true)
    if (!Buffer.isBuffer(imageData) || imageData.length === 0) {
      return response.status(404).json({ message: 'Recipe image data is unavailable.' })
    }

    response.set('Content-Type', recipe.imageMimeType)
    response.set('Cache-Control', 'public, max-age=3600, immutable')
    response.set('X-Content-Type-Options', 'nosniff')
    return response.send(imageData)
  } catch (error) {
    if (error.name === 'CastError') return response.status(400).json({ message: 'Invalid recipe ID.' })
    return next(error)
  }
}

async function updateRecipeImage(request, response, next) {
  try {
    const imageUrl = String(request.body.imageUrl || '').trim()
    if (!isHttpUrl(imageUrl)) return response.status(400).json({ message: 'Enter a valid http or https image URL.' })

    const recipe = await Recipe.findByIdAndUpdate(
      request.params.id,
      { $set: { imagePath: imageUrl }, $unset: { imageData: 1, imageMimeType: 1 } },
      { new: true, runValidators: true },
    ).select('_id imagePath')

    if (!recipe) return response.status(404).json({ message: 'Recipe not found.' })
    return response.json({ recipe: { _id: recipe._id, imagePath: recipe.imagePath } })
  } catch (error) {
    if (error.name === 'CastError') return response.status(400).json({ message: 'Invalid recipe ID.' })
    return next(error)
  }
}

async function getRecipes(_request, response, next) {
  try {
    const page = Math.max(1, Number.parseInt(_request.query.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, Number.parseInt(_request.query.limit, 10) || 15))
    const conditions = []
    const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const search = String(_request.query.search || '').trim()
    const category = String(_request.query.category || '').trim()
    const area = String(_request.query.area || '').trim()
    const ingredient = String(_request.query.ingredient || '').trim()
    const letter = String(_request.query.letter || '').trim()

    if (search) {
      const searchPattern = new RegExp(escapeRegex(search), 'i')
      conditions.push({ $or: [{ name: searchPattern }, { sharedBy: searchPattern }, { category: searchPattern }] })
    }
    if (category) conditions.push({ category })
    if (area) {
      const areaPattern = new RegExp(escapeRegex(area), 'i')
      conditions.push({ $or: [{ name: areaPattern }, { category: areaPattern }, { description: areaPattern }] })
    }
    if (ingredient) conditions.push({ ingredients: new RegExp(escapeRegex(ingredient), 'i') })
    if (/^[a-z]$/i.test(letter)) conditions.push({ name: new RegExp(`^${letter}`, 'i') })

    const filter = conditions.length ? { $and: conditions } : {}
    const total = await Recipe.countDocuments(filter)
    const recipes = await Recipe.find(filter)
      .select('-email')
      .sort({ createdAt: -1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
    const recipeIds = recipes.map((recipe) => recipe._id.toString())
    const ratingsByRecipeId = await getRecipeRatingsById(recipeIds)

    const recipesWithRatings = recipes.map((recipe) => ({
      ...recipe,
      rating: ratingsByRecipeId[recipe._id.toString()] ?? 0,
    }))

    return response.json({
      recipes: recipesWithRatings,
      pagination: { page, limit, total, hasMore: page * limit < total },
    })
  } catch (error) {
    return next(error)
  }
}

async function getRecipeById(request, response, next) {
  try {
    const recipe = await Recipe.findById(request.params.id).select('-email').lean()
    if (!recipe) return response.status(404).json({ message: 'Recipe not found.' })

    const ratingsByRecipeId = await getRecipeRatingsById([recipe._id.toString()])
    const rating = ratingsByRecipeId[recipe._id.toString()] ?? 0

    return response.json({ recipe: { ...recipe, rating } })
  } catch (error) {
    if (error.name === 'CastError') return response.status(400).json({ message: 'Invalid recipe ID.' })
    return next(error)
  }
}

module.exports = { createRecipe, getRecipeById, getRecipeImage, getRecipes, updateRecipeImage }