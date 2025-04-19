const os = require('os');
const SystemPerformance = require('../models/SystemPerformance');
const { createAuditLog } = require('../utils/auditLogger');

// Function to collect current system metrics
const collectMetrics = () => {
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
  return {
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
    timestamp: new Date()
  };
};

// Function to save metrics to the database
const saveMetrics = async (metrics, activeUsers = 0, requestCount = 0, errorCount = 0) => {
  try {
    const performanceData = new SystemPerformance({
      ...metrics,
      activeUsers,
      requestCount,
      errorCount
    });

    await performanceData.save();
    return performanceData;
  } catch (error) {
    console.error('Error saving system performance metrics:', error);
    throw error;
  }
};

// Function to start the metrics collection service
const startMetricsCollection = (intervalMinutes = 5) => {
  console.log(`Starting system performance metrics collection every ${intervalMinutes} minutes`);
  
  // Collect metrics immediately
  collectAndSaveMetrics();
  
  // Set up interval for periodic collection
  const intervalId = setInterval(collectAndSaveMetrics, intervalMinutes * 60 * 1000);
  
  return intervalId;
};

// Function to collect and save metrics
const collectAndSaveMetrics = async () => {
  try {
    const metrics = collectMetrics();
    
    // Get active users count (this would be implemented based on your user tracking system)
    const activeUsers = 0; // Placeholder
    
    // Get request and error counts (this would be implemented based on your request tracking system)
    const requestCount = 0; // Placeholder
    const errorCount = 0; // Placeholder
    
    await saveMetrics(metrics, activeUsers, requestCount, errorCount);
    
    // Log the action
    await createAuditLog({
      userId: 'system',
      userEmail: 'system@example.com',
      action: 'COLLECT_SYSTEM_METRICS',
      details: 'System performance metrics collected',
      ipAddress: '127.0.0.1',
      userAgent: 'System Service',
      status: 'success'
    });
    
    console.log('System performance metrics collected and saved');
  } catch (error) {
    console.error('Error collecting system performance metrics:', error);
    
    // Log the error
    await createAuditLog({
      userId: 'system',
      userEmail: 'system@example.com',
      action: 'COLLECT_SYSTEM_METRICS',
      details: `Error: ${error.message}`,
      ipAddress: '127.0.0.1',
      userAgent: 'System Service',
      status: 'error'
    });
  }
};

// Function to get historical metrics
const getHistoricalMetrics = async (hours = 24) => {
  try {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);
    
    const metrics = await SystemPerformance.find({
      timestamp: { $gte: cutoffTime }
    }).sort({ timestamp: 1 });
    
    return metrics;
  } catch (error) {
    console.error('Error getting historical metrics:', error);
    throw error;
  }
};

// Function to clean up old metrics
const cleanupOldMetrics = async (daysToKeep = 30) => {
  try {
    const result = await SystemPerformance.cleanupOldRecords(daysToKeep);
    
    // Log the action
    await createAuditLog({
      userId: 'system',
      userEmail: 'system@example.com',
      action: 'CLEANUP_SYSTEM_METRICS',
      details: `Cleaned up system performance metrics older than ${daysToKeep} days`,
      ipAddress: '127.0.0.1',
      userAgent: 'System Service',
      status: 'success'
    });
    
    return result;
  } catch (error) {
    console.error('Error cleaning up old metrics:', error);
    
    // Log the error
    await createAuditLog({
      userId: 'system',
      userEmail: 'system@example.com',
      action: 'CLEANUP_SYSTEM_METRICS',
      details: `Error: ${error.message}`,
      ipAddress: '127.0.0.1',
      userAgent: 'System Service',
      status: 'error'
    });
    
    throw error;
  }
};

module.exports = {
  collectMetrics,
  saveMetrics,
  startMetricsCollection,
  getHistoricalMetrics,
  cleanupOldMetrics
}; 