const fs = require('fs/promises')
const Recipe = require('../models/Recipe')

function splitLines(value) {
  return String(value || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
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

    const recipe = await Recipe.create({
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
      imagePath: request.file ? `/uploads/${request.file.filename}` : mealDbImage,
      videoUrl: request.body.videoUrl?.trim() || undefined,
    })

    const { email, ...publicRecipe } = recipe.toObject()
    return response.status(201).json({ recipe: publicRecipe })
  } catch (error) {
    if (request.file) await fs.unlink(request.file.path).catch(() => {})
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return response.status(400).json({ message: error.message })
    }
    return next(error)
  }
}

async function getRecipes(_request, response, next) {
  try {
    const recipes = await Recipe.find().select('-email').sort({ createdAt: -1 }).lean()
    return response.json({ recipes })
  } catch (error) {
    return next(error)
  }
}

async function getRecipeById(request, response, next) {
  try {
    const recipe = await Recipe.findById(request.params.id).select('-email').lean()
    if (!recipe) return response.status(404).json({ message: 'Recipe not found.' })
    return response.json({ recipe })
  } catch (error) {
    if (error.name === 'CastError') return response.status(400).json({ message: 'Invalid recipe ID.' })
    return next(error)
  }
}

module.exports = { createRecipe, getRecipes, getRecipeById }