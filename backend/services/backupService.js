const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { logger } = require('../utils/logger');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Configuration
const BACKUP_DIR = path.join(__dirname, '../../backups');
const MAX_BACKUPS = 10; // Keep the last 10 backups
const BACKUP_RETENTION_DAYS = 30; // Keep backups for 30 days
const MONGODUMP_PATH = 'C:\\Program Files\\MongoDB\\Tools\\100\\bin\\mongodump.exe';
const MONGORESTORE_PATH = 'C:\\Program Files\\MongoDB\\Tools\\100\\bin\\mongorestore.exe';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Create a MongoDB backup
 * @returns {Promise<Object>} Backup result
 */
const createBackup = async () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.gz`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);
    
    // Get MongoDB connection details from environment variables
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    // Create backup using mongodump with full path
    const command = `"${MONGODUMP_PATH}" --uri="${uri}" --archive="${backupPath}" --gzip`;
    
    logger.info(`Starting database backup: ${backupFileName}`);
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('writing metadata')) {
      logger.warn(`Backup warning: ${stderr}`);
    }
    
    // Clean up old backups
    await cleanupOldBackups();
    
    logger.info(`Database backup completed successfully: ${backupFileName}`);
    return {
      success: true,
      fileName: backupFileName,
      path: backupPath,
      timestamp: new Date(),
      size: fs.statSync(backupPath).size
    };
  } catch (error) {
    logger.error('Database backup failed:', {
      error: error.message,
      stack: error.stack
    });
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
};

/**
 * Restore database from a backup
 * @param {string} backupFileName - Name of the backup file to restore
 * @returns {Promise<Object>} Restore result
 */
const restoreBackup = async (backupFileName) => {
  try {
    const backupPath = path.join(BACKUP_DIR, backupFileName);
    
    // Check if backup file exists
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupFileName}`);
    }
    
    // Get MongoDB connection details from environment variables
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    // Restore backup using mongorestore with full path
    const command = `"${MONGORESTORE_PATH}" --uri="${uri}" --archive="${backupPath}" --gzip --drop`;
    
    logger.info(`Starting database restore from: ${backupFileName}`);
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('restoring metadata')) {
      logger.warn(`Restore warning: ${stderr}`);
    }
    
    logger.info(`Database restore completed successfully from: ${backupFileName}`);
    return {
      success: true,
      fileName: backupFileName,
      timestamp: new Date()
    };
  } catch (error) {
    logger.error('Database restore failed:', {
      error: error.message,
      stack: error.stack,
      backupFile: backupFileName
    });
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
};

/**
 * List all available backups
 * @returns {Promise<Array>} List of backups
 */
const listBackups = async () => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter(file => file.startsWith('backup-') && file.endsWith('.gz'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          fileName: file,
          path: filePath,
          size: stats.size,
          createdAt: stats.mtime
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt); // Sort by date, newest first
    
    return {
      success: true,
      backups
    };
  } catch (error) {
    logger.error('Failed to list backups:', {
      error: error.message,
      stack: error.stack
    });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Clean up old backups based on retention policy
 * @returns {Promise<void>}
 */
const cleanupOldBackups = async () => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter(file => file.startsWith('backup-') && file.endsWith('.gz'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          fileName: file,
          path: filePath,
          createdAt: stats.mtime
        };
      })
      .sort((a, b) => a.createdAt - b.createdAt); // Sort by date, oldest first
    
    // Remove backups older than retention period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - BACKUP_RETENTION_DAYS);
    
    const oldBackups = backups.filter(backup => backup.createdAt < cutoffDate);
    
    for (const backup of oldBackups) {
      fs.unlinkSync(backup.path);
      logger.info(`Deleted old backup: ${backup.fileName}`);
    }
    
    // If we still have more than MAX_BACKUPS, remove the oldest ones
    if (backups.length - oldBackups.length > MAX_BACKUPS) {
      const backupsToRemove = backups.length - oldBackups.length - MAX_BACKUPS;
      for (let i = 0; i < backupsToRemove; i++) {
        fs.unlinkSync(backups[i].path);
        logger.info(`Deleted excess backup: ${backups[i].fileName}`);
      }
    }
  } catch (error) {
    logger.error('Failed to clean up old backups:', {
      error: error.message,
      stack: error.stack
    });
  }
};

/**
 * Schedule regular backups
 * @param {number} intervalHours - Hours between backups
 */
const scheduleBackups = (intervalHours = 24) => {
  const intervalMs = intervalHours * 60 * 60 * 1000;
  
  // Create initial backup
  createBackup();
  
  // Schedule regular backups
  setInterval(async () => {
    await createBackup();
  }, intervalMs);
  
  logger.info(`Scheduled backups every ${intervalHours} hours`);
};

module.exports = {
  createBackup,
  restoreBackup,
  listBackups,
  scheduleBackups
}; 