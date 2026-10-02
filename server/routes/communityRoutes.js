const express = require('express')
const { createCommunityReview, getCommunityReviews } = require('../controllers/communityController')

const router = express.Router()

router.get('/reviews', getCommunityReviews)
router.post('/reviews', createCommunityReview)

module.exports = router