const express = require('express')
const { createRecipe, getRecipeById, getRecipeImage, getRecipes, updateRecipeImage } = require('../controllers/recipeController')
const requireRecipeImageAdmin = require('../middleware/requireRecipeImageAdmin')

const router = express.Router()

router.post('/admin/image-access', requireRecipeImageAdmin, (_request, response) => {
  response.json({ authorized: true })
})
router.get('/', getRecipes)
router.get('/:id/image', getRecipeImage)
router.patch('/:id/image', requireRecipeImageAdmin, updateRecipeImage)
router.get('/:id', getRecipeById)
router.post('/', createRecipe)

module.exports = router