const mongoose = require('mongoose')

function isHttpUrl(value) {
  if (!value) return true
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const recipeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  sharedBy: { type: String, required: true, trim: true, maxlength: 60 },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 254,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address.'],
  },
  category: {
    type: String,
    required: true,
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Drinks', 'Baking'],
  },
  diet: {
    type: String,
    enum: ['Everything', 'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free'],
    default: 'Everything',
  },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 600 },
  ingredients: {
    type: [{ type: String, trim: true }],
    default: undefined,
    validate: { validator: (items) => Array.isArray(items) && items.length > 0, message: 'Add at least one ingredient.' },
  },
  instructions: {
    type: [{ type: String, trim: true }],
    default: undefined,
    validate: { validator: (steps) => Array.isArray(steps) && steps.length > 0, message: 'Add at least one method step.' },
  },
  prepTime: { type: Number, required: true, min: 0, max: 1440 },
  cookTime: { type: Number, required: true, min: 0, max: 1440 },
  servings: { type: Number, required: true, min: 1, max: 100 },
  imagePath: { type: String, required: true },
  videoUrl: {
    type: String,
    trim: true,
    maxlength: 2048,
    validate: { validator: isHttpUrl, message: 'Enter a valid http or https video URL.' },
  },
}, { timestamps: true })

module.exports = mongoose.model('Recipe', recipeSchema)