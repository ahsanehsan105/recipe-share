const express = require('express')
const {
  getMealById,
  getMealCategories,
  getMealLists,
  getMealsByArea,
  getMealsByCategory,
  getMealsByIngredient,
  getMealsByLetter,
  getRandomMeal,
  searchMeals,
} = require('../controllers/mealController')

const router = express.Router()

router.get('/search', searchMeals)
router.get('/letter/:letter', getMealsByLetter)
router.get('/category', getMealsByCategory)
router.get('/area', getMealsByArea)
router.get('/ingredient', getMealsByIngredient)
router.get('/categories', getMealCategories)
router.get('/random', getRandomMeal)
router.get('/lists/:type', getMealLists)
router.get('/:id', getMealById)

module.exports = router