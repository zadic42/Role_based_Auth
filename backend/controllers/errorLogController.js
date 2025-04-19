const { ErrorLog } = require('../models/ErrorLog');
const { logger } = require('../utils/logger');

const createErrorLog = async (error, req = null) => {
  try {
    // Ensure error has required fields
    if (!error.message) {
      error.message = 'Unknown error occurred';
    }

    const errorLog = new ErrorLog({
      level: error.level || 'error',
      message: error.message,
      stack: error.stack,
      userId: req?.user?.userId || 'unknown',
      userEmail: req?.user?.email || 'unknown',
      route: req?.originalUrl || 'unknown',
      method: req?.method || 'unknown',
      ipAddress: req?.ip || 'unknown',
      userAgent: req?.get('user-agent') || 'unknown',
      additionalData: {
        ...error.additionalData,
        errorCode: error.code,
        errorName: error.name,
        timestamp: new Date().toISOString()
      }
    });

    await errorLog.save();
    logger.error('Error log created:', {
      errorId: errorLog._id,
      level: errorLog.level,
      message: errorLog.message,
      userId: errorLog.userId,
      route: errorLog.route
    });
  } catch (err) {
    logger.error('Failed to create error log:', {
      originalError: error,
      saveError: err
    });
  }
};

const getErrorLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      level,
      startDate,
      endDate,
      userEmail,
      route,
      method
    } = req.query;

    const query = {};

    if (level) {
      query.level = level;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    if (userEmail) {
      query.userEmail = userEmail;
    }

    if (route) {
      query.route = { $regex: route, $options: 'i' };
    }

    if (method) {
      query.method = method.toUpperCase();
    }

    // Use skip and limit for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Add timeout handling for the query
    const errorLogs = await Promise.race([
      ErrorLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean()
        .exec(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 8000)
      )
    ]);
    
    const total = await ErrorLog.countDocuments(query);

    res.json({
      success: true,
      data: errorLogs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching error logs:', {
      error: error.message,
      stack: error.stack,
      query: req.query
    });

    // Send appropriate error response based on the error type
    if (error.message === 'Query timeout') {
      return res.status(504).json({
        success: false,
        message: 'Request timeout while fetching error logs. Please try again.',
        error: 'Gateway Timeout'
      });
    }

    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      return res.status(503).json({
        success: false,
        message: 'Database connection timeout. Please try again.',
        error: 'Service Unavailable'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching error logs',
      error: error.message
    });
  }
};

const getErrorLogById = async (req, res) => {
  try {
    const errorLog = await ErrorLog.findById(req.params.id);
    
    if (!errorLog) {
      return res.status(404).json({
        success: false,
        message: 'Error log not found'
      });
    }

    res.json({
      success: true,
      data: errorLog
    });
  } catch (error) {
    logger.error('Error fetching error log:', {
      error,
      logId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching error log',
      error: error.message
    });
  }
};

module.exports = {
  createErrorLog,
  getErrorLogs,
  getErrorLogById
}; 