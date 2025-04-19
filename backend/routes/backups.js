const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { authenticateToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

// All backup routes require authentication and admin role
router.use(authenticateToken, isAdmin);

// Create a new backup
router.post('/', backupController.createBackup);

// List all backups
router.get('/', backupController.listBackups);

// Download a backup
router.get('/:backupName/download', backupController.downloadBackup);

// Delete a backup
router.delete('/:backupName', backupController.deleteBackup);

// Restore from a backup
router.post('/:backupName/restore', backupController.restoreBackup);

module.exports = router; 