const express = require('express')
const { createRecipeQuestion, createRecipeRating, getRecipeFeedback } = require('../controllers/recipeFeedbackController')

const router = express.Router()

router.get('/:recipeId/feedback', getRecipeFeedback)
router.post('/:recipeId/ratings', createRecipeRating)
router.post('/:recipeId/questions', createRecipeQuestion)

module.exports = router