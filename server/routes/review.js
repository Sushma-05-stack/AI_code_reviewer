const express = require('express');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadReview, githubReview, getReport } = require('../controllers/reviewController');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Stricter rate limit for AI review endpoints
const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { error: 'Review limit reached. Please wait before submitting more reviews.' },
});

router.post('/upload', protect, reviewLimiter, upload.array('files', 20), uploadReview);
router.post('/github', protect, reviewLimiter, githubReview);
router.get('/:id', protect, getReport);

module.exports = router;
