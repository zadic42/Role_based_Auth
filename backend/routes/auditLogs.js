const express = require('express');
const router = express.Router();
const { getAuditLogs, getUserAuditLogs } = require('../controllers/auditLogController');
const { authenticateToken, checkRole } = require('../middleware/auth');

// Get all audit logs (admin only)
router.get('/', authenticateToken, checkRole(['admin']), getAuditLogs);

// Get user-specific audit logs (admin only)
router.get('/user/:userId', authenticateToken, checkRole(['admin']), getUserAuditLogs);

module.exports = router; 