const { AuditLog } = require('../models/AuditLog')
const { logger } = require('../utils/logger')

// Get all audit logs with pagination and filtering
const getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    
    // Build query
    const query = {}
    
    // Filter by action
    if (req.query.action) {
      query.action = req.query.action
    }
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status
    }
    
    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.timestamp = {}
      if (req.query.startDate) {
        query.timestamp.$gte = new Date(req.query.startDate)
      }
      if (req.query.endDate) {
        // Set end date to end of day (23:59:59)
        const endDate = new Date(req.query.endDate)
        endDate.setHours(23, 59, 59, 999)
        query.timestamp.$lte = endDate
      }
    }

    // Get total count for pagination
    const total = await AuditLog.countDocuments(query)

    // Get logs with pagination and sorting
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    logger.error('Error fetching audit logs:', error)
    res.status(500).json({ 
      success: false,
      message: 'Error fetching audit logs',
      error: error.message 
    })
  }
}

// Get audit logs for a specific user
const getUserAuditLogs = async (req, res) => {
  try {
    const userId = req.params.userId
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    // Build query
    const query = { userId }
    
    // Apply filters if provided
    if (req.query.action) {
      query.action = req.query.action
    }
    if (req.query.status) {
      query.status = req.query.status
    }
    if (req.query.startDate || req.query.endDate) {
      query.timestamp = {}
      if (req.query.startDate) {
        query.timestamp.$gte = new Date(req.query.startDate)
      }
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate)
        endDate.setHours(23, 59, 59, 999)
        query.timestamp.$lte = endDate
      }
    }

    const total = await AuditLog.countDocuments(query)
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    logger.error('Error fetching user audit logs:', error)
    res.status(500).json({ 
      success: false,
      message: 'Error fetching user audit logs',
      error: error.message 
    })
  }
}

// Create a new audit log entry
const createAuditLog = async (userId, userEmail, action, details, ipAddress, userAgent, status = 'success') => {
  try {
    const auditLog = new AuditLog({
      userId,
      userEmail,
      action,
      details,
      ipAddress,
      userAgent,
      status,
      timestamp: new Date()
    })

    await auditLog.save()
    logger.info(`Audit log created for user ${userId}: ${action}`)
  } catch (error) {
    logger.error('Error creating audit log:', error)
  }
}

module.exports = {
  getAuditLogs,
  getUserAuditLogs,
  createAuditLog
} 