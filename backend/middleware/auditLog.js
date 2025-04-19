const AuditLog = require('../models/AuditLog')

const auditLog = async (req, res, next) => {
  try {
    // Skip logging for audit log requests to prevent infinite loops
    if (req.path.startsWith('/api/audit-logs')) {
      return next()
    }

    // Get user ID from request (if available)
    const userId = req.user?.id

    // Determine the action based on the request method and path
    let action = ''
    if (req.path === '/api/auth/login') {
      action = 'login'
    } else if (req.path === '/api/auth/logout') {
      action = 'logout'
    } else if (req.path === '/api/auth/signup') {
      action = 'signup'
    } else if (req.path === '/api/auth/delete-account') {
      action = 'delete_account'
    } else if (req.path === '/api/auth/enable-mfa') {
      action = 'enable_mfa'
    } else if (req.path === '/api/auth/disable-mfa') {
      action = 'disable_mfa'
    } else if (req.path === '/api/auth/update-profile') {
      action = 'update_profile'
    }

    // Only log if we have a valid action
    if (action) {
      const details = {
        method: req.method,
        path: req.path,
        body: req.body,
        query: req.query,
        params: req.params
      }

      // Create audit log entry
      await AuditLog.create({
        userId,
        action,
        details: JSON.stringify(details),
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      })
    }

    next()
  } catch (error) {
    console.error('Error in audit log middleware:', error)
    next()
  }
}

module.exports = auditLog 