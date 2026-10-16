const express = require('express')
const { createRecipe, deleteRecipe, getRecipeById, getRecipeImage, getRecipes, updateRecipeImage } = require('../controllers/recipeController')
const requireRecipeImageAdmin = require('../middleware/requireRecipeImageAdmin')

const router = express.Router()

router.get('/', getRecipes)
router.get('/:id/image', getRecipeImage)
router.patch('/:id/image', requireRecipeImageAdmin, updateRecipeImage)
router.delete('/:id', requireRecipeImageAdmin, deleteRecipe)
router.get('/:id', getRecipeById)
router.post('/', createRecipe)

module.exports = router