const os = require('os');
const { createAuditLog } = require('../utils/auditLogger');

// Get system performance metrics
const getSystemPerformance = async (req, res) => {
  try {
    // Get CPU information
    const cpuInfo = {
      model: os.cpus()[0].model,
      cores: os.cpus().length,
      loadAvg: os.loadavg(),
      usage: process.cpuUsage()
    };

    // Get memory information
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = process.memoryUsage();

    // Get uptime
    const uptime = os.uptime();

    // Get network interfaces
    const networkInterfaces = os.networkInterfaces();

    // Create metrics object
    const metrics = {
      cpu: {
        model: cpuInfo.model,
        cores: cpuInfo.cores,
        loadAverage: cpuInfo.loadAvg,
        usage: {
          user: cpuInfo.usage.user,
          system: cpuInfo.usage.system
        }
      },
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: usedMemory,
        usagePercentage: ((usedMemory / totalMemory) * 100).toFixed(2),
        processMemory: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external,
          rss: memoryUsage.rss
        }
      },
      uptime: uptime,
      network: networkInterfaces,
      timestamp: new Date().toISOString()
    };

    // Log the action
    await createAuditLog({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'VIEW_SYSTEM_PERFORMANCE',
      details: 'User viewed system performance metrics',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.status(200).json(metrics);
  } catch (error) {
    console.error('Error getting system performance:', error);
    
    // Log the error
    await createAuditLog({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'VIEW_SYSTEM_PERFORMANCE',
      details: `Error: ${error.message}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'error'
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve system performance metrics',
      error: error.message 
    });
  }
};

// Get historical system performance data
const getHistoricalPerformance = async (req, res) => {
  try {
    // This would typically fetch from a database
    // For now, we'll return a sample of historical data
    const historicalData = [
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        cpuLoad: [0.5, 0.6, 0.4],
        memoryUsage: 65.2,
        activeUsers: 12
      },
      {
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        cpuLoad: [0.3, 0.4, 0.5],
        memoryUsage: 58.7,
        activeUsers: 8
      },
      {
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        cpuLoad: [0.2, 0.3, 0.4],
        memoryUsage: 52.1,
        activeUsers: 5
      }
    ];

    // Log the action
    await createAuditLog({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'VIEW_HISTORICAL_PERFORMANCE',
      details: 'User viewed historical system performance data',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.status(200).json(historicalData);
  } catch (error) {
    console.error('Error getting historical performance:', error);
    
    // Log the error
    await createAuditLog({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'VIEW_HISTORICAL_PERFORMANCE',
      details: `Error: ${error.message}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'error'
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve historical performance data',
      error: error.message 
    });
  }
};

module.exports = {
  getSystemPerformance,
  getHistoricalPerformance
}; 