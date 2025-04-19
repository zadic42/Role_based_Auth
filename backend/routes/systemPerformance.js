const express = require('express');
const router = express.Router();
const { getSystemPerformance, getHistoricalPerformance } = require('../controllers/systemPerformanceController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Get current system performance metrics
router.get('/', authenticateToken, isAdmin, getSystemPerformance);

// Get historical system performance data
router.get('/historical', authenticateToken, isAdmin, getHistoricalPerformance);

module.exports = router; 