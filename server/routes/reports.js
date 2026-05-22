const express = require('express');
const { protect } = require('../middleware/auth');
const { getHistory, getStats, downloadPDF, downloadJSON, deleteReport } = require('../controllers/reportController');

const router = express.Router();

router.get('/history', protect, getHistory);
router.get('/stats', protect, getStats);
router.get('/:id/pdf', protect, downloadPDF);
router.get('/:id/json', protect, downloadJSON);
router.delete('/:id', protect, deleteReport);

module.exports = router;
