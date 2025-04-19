const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/auth');
const { getErrorLogs, getErrorLogById, createErrorLog } = require('../controllers/errorLogController');

// Test route to create a sample error log
router.post('/test', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const testError = new Error('Test error log');
    testError.level = 'error';
    testError.stack = testError.stack;
    await createErrorLog(testError, req);
    
    res.json({
      success: true,
      message: 'Test error log created'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create test error log'
    });
  }
});

// Get all error logs with pagination and filtering
router.get('/', authenticateToken, checkRole(['admin']), getErrorLogs);

// Get a specific error log by ID
router.get('/:id', authenticateToken, checkRole(['admin']), getErrorLogById);

module.exports = router; 