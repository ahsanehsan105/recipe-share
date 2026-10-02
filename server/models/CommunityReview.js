const mongoose = require('mongoose')

const communityReviewSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  rating: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
  message: { type: String, required: true, trim: true, minlength: 10, maxlength: 500 },
}, { timestamps: true })

module.exports = mongoose.model('CommunityReview', communityReviewSchema)