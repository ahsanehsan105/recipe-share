const Recipe = require('../models/Recipe')
const RecipeFeedback = require('../models/RecipeFeedback')

function splitLines(value) {
  return String(value || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
}

async function getRecipeRatingsById(recipeIds) {
  if (!recipeIds.length) return {}

  const ratings = await RecipeFeedback.aggregate([
    { $match: { recipeId: { $in: recipeIds }, kind: 'rating' } },
    { $group: { _id: '$recipeId', average: { $avg: '$rating' }, total: { $sum: 1 } } },
  ])

  return Object.fromEntries(ratings.map((entry) => [entry._id, Number((entry.average || 0).toFixed(1))]))
}

function getMealDbImageUrl(value) {
  try {
    const url = new URL(String(value || ''))
    const isMealDbHost = url.hostname === 'themealdb.com' || url.hostname.endsWith('.themealdb.com')
    if (url.protocol !== 'https:' || !isMealDbHost || !url.pathname.startsWith('/images/media/meals/')) return ''
    return url.toString()
  } catch {
    return ''
  }
}

async function createRecipe(request, response, next) {
  try {
    const mealDbImage = getMealDbImageUrl(request.body.imageUrl)
    if (!request.file && !mealDbImage) {
      return response.status(400).json({ message: 'A recipe image is required.' })
    }

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
      imagePath: mealDbImage || 'pending',
      imageData: request.file?.buffer,
      imageMimeType: request.file?.mimetype,
      videoUrl: request.body.videoUrl?.trim() || undefined,
    })
    if (request.file) recipe.imagePath = `/api/recipes/${recipe._id}/image`
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

async function getRecipes(_request, response, next) {
  try {
    const recipes = await Recipe.find().select('-email').sort({ createdAt: -1 }).lean()
    const recipeIds = recipes.map((recipe) => recipe._id.toString())
    const ratingsByRecipeId = await getRecipeRatingsById(recipeIds)

    const recipesWithRatings = recipes.map((recipe) => ({
      ...recipe,
      rating: ratingsByRecipeId[recipe._id.toString()] ?? 0,
    }))

    return response.json({ recipes: recipesWithRatings })
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

module.exports = { createRecipe, getRecipeById, getRecipeImage, getRecipes }