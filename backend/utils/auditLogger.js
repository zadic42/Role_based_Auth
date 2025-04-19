const { AuditLog } = require('../models/AuditLog');
const { logger } = require('./logger');

/**
 * Creates an audit log entry
 * @param {Object} params - Parameters for the audit log
 * @param {string} params.userId - User ID
 * @param {string} params.userEmail - User email
 * @param {string} params.action - Action performed
 * @param {string} params.details - Details of the action
 * @param {string} params.ipAddress - IP address
 * @param {string} params.userAgent - User agent
 * @param {string} params.status - Status of the action (success/error)
 * @returns {Promise<Object>} - The created audit log entry
 */
const createAuditLog = async (params) => {
  try {
    const { userId, userEmail, action, details, ipAddress, userAgent, status } = params;
    
    const auditLog = new AuditLog({
      userId,
      userEmail,
      action,
      details,
      ipAddress,
      userAgent,
      status,
      timestamp: new Date()
    });
    
    await auditLog.save();
    return auditLog;
  } catch (error) {
    logger.error('Error creating audit log:', error);
    // Don't throw the error to prevent disrupting the main flow
    return null;
  }
};

module.exports = {
  createAuditLog
}; 