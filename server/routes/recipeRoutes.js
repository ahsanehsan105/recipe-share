const express = require('express')
const { createRecipe, getRecipeById, getRecipeImage, getRecipes } = require('../controllers/recipeController')
const uploadRecipeImage = require('../middleware/uploadRecipeImage')

const router = express.Router()

router.get('/', getRecipes)
router.get('/:id/image', getRecipeImage)
router.get('/:id', getRecipeById)
router.post('/', uploadRecipeImage.single('image'), createRecipe)

module.exports = router