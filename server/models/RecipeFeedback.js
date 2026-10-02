const mongoose = require('mongoose')

const recipeFeedbackSchema = new mongoose.Schema({
  recipeId: { type: String, required: true, trim: true, maxlength: 100, index: true },
  kind: { type: String, required: true, enum: ['rating', 'question'] },
  name: { type: String, required: true, trim: true, maxlength: 60 },
  rating: {
    type: Number,
    required: function requiredRating() { return this.kind === 'rating' },
    min: 1,
    max: 5,
    validate: { validator: (value) => value === undefined || Number.isInteger(value), message: 'Rating must be a whole number of stars.' },
  },
  message: {
    type: String,
    trim: true,
    maxlength: 500,
    required: function requiredQuestion() { return this.kind === 'question' },
    validate: { validator: function validQuestion(value) { return this.kind !== 'question' || String(value || '').trim().length >= 10 }, message: 'A question must be at least 10 characters.' },
  },
}, { timestamps: true })

recipeFeedbackSchema.index({ recipeId: 1, createdAt: -1 })

module.exports = mongoose.model('RecipeFeedback', recipeFeedbackSchema)