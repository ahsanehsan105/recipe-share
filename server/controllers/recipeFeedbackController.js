const RecipeFeedback = require('../models/RecipeFeedback')

function validRecipeId(recipeId) {
  return typeof recipeId === 'string' && recipeId.trim().length > 0 && recipeId.length <= 100
}

async function getRecipeFeedback(request, response, next) {
  const recipeId = request.params.recipeId.trim()
  if (!validRecipeId(recipeId)) return response.status(400).json({ message: 'Invalid recipe ID.' })

  try {
    const posts = await RecipeFeedback.find({ recipeId }).sort({ createdAt: -1 }).lean()
    const ratings = posts.filter((post) => post.kind === 'rating')
    const questions = posts.filter((post) => post.kind === 'question')
    const total = ratings.length
    const sum = ratings.reduce((value, post) => value + post.rating, 0)

    return response.json({
      summary: {
        total,
        average: total ? Number((sum / total).toFixed(1)) : null,
        distribution: [5, 4, 3, 2, 1].map((rating) => ({ rating, count: ratings.filter((post) => post.rating === rating).length })),
      },
      ratings,
      questions,
    })
  } catch (error) {
    return next(error)
  }
}

async function createRecipeRating(request, response, next) {
  const recipeId = request.params.recipeId.trim()
  const name = String(request.body.name || '').trim()
  const rating = Number(request.body.rating)
  const message = String(request.body.message || '').trim()

  if (!validRecipeId(recipeId)) return response.status(400).json({ message: 'Invalid recipe ID.' })
  if (!name || name.length > 60) return response.status(400).json({ message: 'Enter a name up to 60 characters.' })
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return response.status(400).json({ message: 'Choose a rating from 1 to 5 stars.' })
  if (message.length > 500) return response.status(400).json({ message: 'A rating note must be 500 characters or fewer.' })

  try {
    const post = await RecipeFeedback.create({ recipeId, kind: 'rating', name, rating, message: message || undefined })
    return response.status(201).json({ rating: post })
  } catch (error) {
    if (error.name === 'ValidationError') return response.status(400).json({ message: error.message })
    return next(error)
  }
}

async function createRecipeQuestion(request, response, next) {
  const recipeId = request.params.recipeId.trim()
  const name = String(request.body.name || '').trim()
  const message = String(request.body.message || '').trim()

  if (!validRecipeId(recipeId)) return response.status(400).json({ message: 'Invalid recipe ID.' })
  if (!name || name.length > 60) return response.status(400).json({ message: 'Enter a name up to 60 characters.' })
  if (message.length < 10 || message.length > 500) return response.status(400).json({ message: 'Your question must be between 10 and 500 characters.' })

  try {
    const question = await RecipeFeedback.create({ recipeId, kind: 'question', name, message })
    return response.status(201).json({ question })
  } catch (error) {
    if (error.name === 'ValidationError') return response.status(400).json({ message: error.message })
    return next(error)
  }
}

module.exports = { createRecipeQuestion, createRecipeRating, getRecipeFeedback }