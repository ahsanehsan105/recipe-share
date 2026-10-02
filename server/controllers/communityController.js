const CommunityReview = require('../models/CommunityReview')

async function getCommunityReviews(_request, response, next) {
  try {
    const reviews = await CommunityReview.find().sort({ createdAt: -1 }).lean()
    const ratingCounts = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: reviews.filter((review) => review.rating === rating).length,
    }))
    const ratingTotal = reviews.reduce((total, review) => total + review.rating, 0)

    return response.json({
      reviews,
      summary: {
        total: reviews.length,
        average: reviews.length ? Number((ratingTotal / reviews.length).toFixed(1)) : null,
        recommendCount: reviews.filter((review) => review.rating >= 4).length,
        ratingCounts,
      },
    })
  } catch (error) {
    return next(error)
  }
}

async function createCommunityReview(request, response, next) {
  try {
    const review = await CommunityReview.create({
      name: request.body.name,
      rating: Number(request.body.rating),
      message: request.body.message,
    })
    return response.status(201).json({ review })
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return response.status(400).json({ message: error.message })
    }
    return next(error)
  }
}

module.exports = { createCommunityReview, getCommunityReviews }