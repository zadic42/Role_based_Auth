const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const { promisify } = require('util');
const execAsync = promisify(exec);
const { AuditLog } = require('../models/AuditLog');
const cron = require('node-cron');

// MongoDB tools paths
const MONGODUMP_PATH = 'C:\\Program Files\\MongoDB\\Tools\\100\\bin\\mongodump.exe';
const MONGORESTORE_PATH = 'C:\\Program Files\\MongoDB\\Tools\\100\\bin\\mongorestore.exe';

// Schedule automatic backup every 24 hours
cron.schedule('0 0 * * *', async () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../backups');
    const backupName = `b-${timestamp.slice(0, 10)}.gz`;
    const backupPath = path.join(backupDir, backupName);

    // Create backup directory if it doesn't exist
    await fs.mkdir(backupDir, { recursive: true });

    // Get MongoDB connection string from environment or use default
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/authlog';

    // Create backup using mongodump with gzip compression
    await execAsync(`"${MONGODUMP_PATH}" --uri="${mongoUri}" --gzip --archive="${backupPath}"`);

    // Log automatic backup creation
    await AuditLog.create({
      userId: 'system',
      userEmail: 'system@example.com',
      action: 'AUTO_CREATE_BACKUP',
      details: {
        name: backupName,
        date: timestamp.slice(0, 10)
      },
      status: 'success'
    });

    // Clean up old backups
    await cleanupOldBackups();
  } catch (error) {
    console.error('Error in automatic backup:', error);
    await AuditLog.create({
      userId: 'system',
      userEmail: 'system@example.com',
      action: 'AUTO_CREATE_BACKUP',
      details: {
        error: error.message
      },
      status: 'failed'
    });
  }
});

// Function to clean up backups older than 30 days
const cleanupOldBackups = async () => {
  try {
    const backupDir = path.join(__dirname, '../backups');
    const backups = await fs.readdir(backupDir);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const backup of backups) {
      if (backup.endsWith('.gz')) {
        const stats = await fs.stat(path.join(backupDir, backup));
        if (stats.mtime < thirtyDaysAgo) {
          await fs.unlink(path.join(backupDir, backup));
          await AuditLog.create({
            userId: 'system',
            userEmail: 'system@example.com',
            action: 'AUTO_DELETE_BACKUP',
            details: {
              name: backup,
              reason: 'Backup older than 30 days'
            },
            status: 'success'
          });
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up old backups:', error);
    await AuditLog.create({
      userId: 'system',
      userEmail: 'system@example.com',
      action: 'AUTO_DELETE_BACKUP',
      details: {
        error: error.message
      },
      status: 'failed'
    });
  }
};

/**
 * Create a new backup
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createBackup = async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../backups');
    const backupName = `b-${timestamp.slice(0, 10)}.gz`;
    const backupPath = path.join(backupDir, backupName);

    // Create backup directory if it doesn't exist
    await fs.mkdir(backupDir, { recursive: true });

    // Get MongoDB connection string from environment or use default
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/authlog';

    // Create backup using mongodump with gzip compression and full path
    await execAsync(`"${MONGODUMP_PATH}" --uri="${mongoUri}" --gzip --archive="${backupPath}"`);

    // Create audit log for new backup
    try {
      await AuditLog.create({
        userId: req.user?.id || 'system',
        userEmail: req.user?.email || 'system@example.com',
        action: 'CREATE_BACKUP',
        details: {
          name: backupName,
          date: timestamp.slice(0, 10)
        },
        status: 'success'
      });
    } catch (logError) {
      console.error('Error creating audit log:', logError);
    }

    // Clean up old backups after creating new one
    await cleanupOldBackups();

    res.json({ 
      success: true, 
      name: backupName,
      date: timestamp.slice(0, 10)
    });
  } catch (error) {
    console.error('Error creating backup:', error);

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
    const backupDir = path.join(__dirname, '../backups');
    
    // Check if backup directory exists
    try {
      await fs.access(backupDir);
    } catch (error) {
      // If directory doesn't exist, create it
      await fs.mkdir(backupDir, { recursive: true });
      return res.json({ success: true, data: [], total: 0 });
    }

    const backups = await fs.readdir(backupDir);
    
    const backupDetails = await Promise.all(
      backups
        .filter(backup => backup.endsWith('.gz'))
        .map(async (backup) => {
          try {
            const stats = await fs.stat(path.join(backupDir, backup));
            return {
              name: backup,
              date: backup.replace('b-', '').replace('.gz', ''),
              size: stats.size,
              createdAt: stats.mtime
            };
          } catch (error) {
            console.error(`Error processing backup ${backup}:`, error);
            return null;
          }
        })
    );

    // Filter out any null entries and sort by creation date (newest first)
    const validBackups = backupDetails.filter(backup => backup !== null);
    validBackups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ 
      success: true, 
      data: validBackups,
      total: validBackups.length
    });
  } catch (error) {
    console.error('Error listing backups:', error);

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
    const backupDir = path.join(__dirname, '../backups');
    const backupPath = path.join(backupDir, backupName);

    // Check if backup exists
    try {
      await fs.access(backupPath);
    } catch (error) {
      return res.status(404).json({ 
        success: false, 
        message: 'Backup not found',
        error: 'The requested backup file does not exist'
      });
    }

    // Log backup download
    try {
      await AuditLog.create({
        userId: req.user?.id || 'system',
        userEmail: req.user?.email || 'system@example.com',
        action: 'DOWNLOAD_BACKUP',
        details: {
          name: backupName
        },
        status: 'success'
      });
    } catch (logError) {
      console.error('Error creating audit log:', logError);
    }

    // Send the file
    res.download(backupPath, backupName, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).json({ 
            success: false, 
            message: 'Error sending backup file',
            error: err.message
          });
        }
      }
    });
  } catch (error) {
    console.error('Error downloading backup:', error);

    try {
      await AuditLog.create({
        userId: req.user?.id || 'system',
        userEmail: req.user?.email || 'system@example.com',
        action: 'DOWNLOAD_BACKUP',
        details: {
          name: req.params.backupName,
          error: error.message
        },
        status: 'failed'
      });
    } catch (logError) {
      console.error('Error creating audit log:', logError);
    }

    res.status(500).json({ 
      success: false, 
      message: 'Failed to download backup',
      error: error.message
    });
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
    const backupDir = path.join(__dirname, '../backups');
    const backupPath = path.join(backupDir, backupName);

    // Check if backup exists
    try {
      await fs.access(backupPath);
    } catch (error) {
      return res.status(404).json({ 
        success: false, 
        message: 'Backup not found',
        error: 'The requested backup file does not exist'
      });
    }

    // Get MongoDB connection string from environment or use default
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/authlog';

    // Restore backup using mongorestore
    try {
      await execAsync(`"${MONGORESTORE_PATH}" --uri="${mongoUri}" --gzip --archive="${backupPath}" --drop`);
    } catch (error) {
      console.error('Error restoring backup:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to restore backup',
        error: error.message
      });
    }

    // Log backup restoration
    try {
      await AuditLog.create({
        userId: req.user?.id || 'system',
        userEmail: req.user?.email || 'system@example.com',
        action: 'RESTORE_BACKUP',
        details: {
          name: backupName
        },
        status: 'success'
      });
    } catch (logError) {
      console.error('Error creating audit log:', logError);
    }

    res.json({ 
      success: true, 
      message: 'Backup restored successfully'
    });
  } catch (error) {
    console.error('Error in restore backup:', error);

    try {
      await AuditLog.create({
        userId: req.user?.id || 'system',
        userEmail: req.user?.email || 'system@example.com',
        action: 'RESTORE_BACKUP',
        details: {
          name: req.params.backupName,
          error: error.message
        },
        status: 'failed'
      });
    } catch (logError) {
      console.error('Error creating audit log:', logError);
    }

    res.status(500).json({ 
      success: false, 
      message: 'Failed to restore backup',
      error: error.message
    });
  }
};

module.exports = {
  createBackup,
  listBackups,
  downloadBackup,
  deleteBackup,
  restoreBackup
}; 