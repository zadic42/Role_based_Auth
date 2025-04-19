const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const { promisify } = require('util');
const execAsync = promisify(exec);
const { AuditLog } = require('../models/AuditLog');

// MongoDB tools paths
const MONGODUMP_PATH = 'C:\\Program Files\\MongoDB\\Tools\\100\\bin\\mongodump.exe';
const MONGORESTORE_PATH = 'C:\\Program Files\\MongoDB\\Tools\\100\\bin\\mongorestore.exe';

/**
 * Create a new backup
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createBackup = async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../../backups');
    const backupPath = path.join(backupDir, `backup-${timestamp}.gz`);

    // Create backup directory if it doesn't exist
    await fs.mkdir(backupDir, { recursive: true });

    // Get MongoDB connection string from environment or use default
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/authlog';

    // Create backup using mongodump with gzip compression and full path
    await execAsync(`"${MONGODUMP_PATH}" --uri="${mongoUri}" --gzip --archive="${backupPath}"`);

    // Create audit log
    try {
      await AuditLog.create({
        userId: req.user?.id || 'system',
        userEmail: req.user?.email || 'system@example.com',
        action: 'CREATE_BACKUP',
        details: {
          backupPath,
          timestamp,
          isGzipFile: true
        },
        status: 'success'
      });
    } catch (logError) {
      console.error('Error creating audit log:', logError);
      // Continue with the backup operation even if audit logging fails
    }

    res.json({ success: true, message: 'Backup created successfully' });
  } catch (error) {
    console.error('Error creating backup:', error);

    // Log failed backup attempt
    try {
      await AuditLog.create({
        userId: req.user?.id || 'system',
        userEmail: req.user?.email || 'system@example.com',
        action: 'CREATE_BACKUP',
        details: {
          error: error.message
        },
        status: 'failed'
      });
    } catch (logError) {
      console.error('Error creating audit log:', logError);
    }

    res.status(500).json({ success: false, message: 'Failed to create backup' });
  }
};

/**
 * List all available backups
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const listBackups = async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '../../backups');
    const backups = await fs.readdir(backupDir);
    
    const backupDetails = await Promise.all(
      backups.map(async (backup) => {
        const stats = await fs.stat(path.join(backupDir, backup));
        return {
          name: backup,
          createdAt: stats.mtime,
          size: stats.size
        };
      })
    );

    // Sort backups by creation date in descending order (latest first)
    backupDetails.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Removed audit log for viewing backups to reduce unnecessary logging

    res.json({ success: true, data: backupDetails });
  } catch (error) {
    console.error('Error listing backups:', error);

    // Log failed backup list attempt
    try {
      await AuditLog.create({
        userId: req.user?.id || 'system',
        userEmail: req.user?.email || 'system@example.com',
        action: 'VIEW_BACKUPS',
        details: {
          error: error.message
        },
        status: 'failed'
      });
    } catch (logError) {
      console.error('Error creating audit log:', logError);
    }

    res.status(500).json({ success: false, message: 'Failed to list backups' });
  }
};

/**
 * Download a backup file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const downloadBackup = async (req, res) => {
  try {
    const { backupName } = req.params;
    const backupPath = path.join(__dirname, '../../backups', backupName);

    // Check if backup exists
    await fs.access(backupPath);

    // Log backup download with minimal details
    try {
      await AuditLog.create({
        userId: req.user?.id || 'system',
        userEmail: req.user?.email || 'system@example.com',
        action: 'DOWNLOAD_BACKUP',
        details: {
          backupName
        },
        status: 'success'
      });
    } catch (logError) {
      console.error('Error creating audit log:', logError);
      // Continue with the backup operation even if audit logging fails
    }

    res.download(backupPath);
  } catch (error) {
    console.error('Error downloading backup:', error);

    // Log failed backup download attempt with minimal details
    try {
      await AuditLog.create({
        userId: req.user?.id || 'system',
        userEmail: req.user?.email || 'system@example.com',
        action: 'DOWNLOAD_BACKUP',
        details: {
          backupName: req.params.backupName,
          error: error.message
        },
        status: 'failed'
      });
    } catch (logError) {
      console.error('Error creating audit log:', logError);
    }

    res.status(404).json({ success: false, message: 'Backup not found' });
  }
};

/**
 * Delete a backup
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteBackup = async (req, res) => {
  try {
    const { backupName } = req.params;
    const backupPath = path.join(__dirname, '../../backups', backupName);

    // Check if backup exists
    await fs.access(backupPath);

    // Delete backup
    await fs.rm(backupPath, { recursive: true, force: true });

    // Log backup deletion
    try {
      await AuditLog.create({
        userId: req.user?.id || 'system',
        userEmail: req.user?.email || 'system@example.com',
        action: 'DELETE_BACKUP',
        details: {
          backupName,
          backupPath
        },
        status: 'success'
      });
    } catch (logError) {
      console.error('Error creating audit log:', logError);
      // Continue with the backup operation even if audit logging fails
    }

    res.json({ success: true, message: 'Backup deleted successfully' });
  } catch (error) {
    console.error('Error deleting backup:', error);

    // Log failed backup deletion attempt
    try {
      await AuditLog.create({
        userId: req.user?.id || 'system',
        userEmail: req.user?.email || 'system@example.com',
        action: 'DELETE_BACKUP',
        details: {
          backupName: req.params.backupName,
          error: error.message
        },
        status: 'failed'
      });
    } catch (logError) {
      console.error('Error creating audit log:', logError);
    }

    res.status(500).json({ success: false, message: 'Failed to delete backup' });
  }
};

/**
 * Restore from a backup
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const restoreBackup = async (req, res) => {
  try {
    const { backupName } = req.params;
    const backupPath = path.join(__dirname, '../../backups', backupName);

    // Check if backup exists
    await fs.access(backupPath);

    // Check if the backup is a .gz file
    const isGzipFile = backupName.endsWith('.gz');
    
    // Get MongoDB connection string from environment or use default
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/authlog';
    
    // Restore backup using mongorestore with full path
    if (isGzipFile) {
      // For .gz files, use the --gzip flag
      await execAsync(`"${MONGORESTORE_PATH}" --uri="${mongoUri}" --gzip --archive="${backupPath}" --drop`);
    } else {
      // For directory backups
      await execAsync(`"${MONGORESTORE_PATH}" --uri="${mongoUri}" --drop "${backupPath}"`);
    }

    // Log backup restoration with minimal details
    try {
      await AuditLog.create({
        userId: req.user?.id || 'system',
        userEmail: req.user?.email || 'system@example.com',
        action: 'RESTORE_BACKUP',
        details: {
          backupName
        },
        status: 'success'
      });
    } catch (logError) {
      console.error('Error creating audit log:', logError);
      // Continue with the backup operation even if audit logging fails
    }

    res.json({ success: true, message: 'Backup restored successfully' });
  } catch (error) {
    console.error('Error restoring backup:', error);

    // Log failed backup restoration attempt with minimal details
    try {
      await AuditLog.create({
        userId: req.user?.id || 'system',
        userEmail: req.user?.email || 'system@example.com',
        action: 'RESTORE_BACKUP',
        details: {
          backupName: req.params.backupName,
          error: error.message
        },
        status: 'failed'
      });
    } catch (logError) {
      console.error('Error creating audit log:', logError);
    }

    res.status(500).json({ success: false, message: 'Failed to restore backup' });
  }
};

module.exports = {
  createBackup,
  listBackups,
  downloadBackup,
  deleteBackup,
  restoreBackup
}; 