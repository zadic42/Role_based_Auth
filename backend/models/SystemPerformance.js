const mongoose = require('mongoose');

const systemPerformanceSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  cpu: {
    model: String,
    cores: Number,
    loadAverage: [Number],
    usage: {
      user: Number,
      system: Number
    }
  },
  memory: {
    total: Number,
    free: Number,
    used: Number,
    usagePercentage: Number,
    processMemory: {
      heapUsed: Number,
      heapTotal: Number,
      external: Number,
      rss: Number
    }
  },
  uptime: Number,
  network: {
    type: Map,
    of: [{
      address: String,
      netmask: String,
      family: String,
      mac: String,
      internal: Boolean
    }]
  },
  activeUsers: {
    type: Number,
    default: 0
  },
  requestCount: {
    type: Number,
    default: 0
  },
  errorCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create index for efficient querying by timestamp
systemPerformanceSchema.index({ timestamp: -1 });

// Create a method to clean up old records
systemPerformanceSchema.statics.cleanupOldRecords = async function(daysToKeep) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  return this.deleteMany({
    timestamp: { $lt: cutoffDate }
  });
};

const SystemPerformance = mongoose.model('SystemPerformance', systemPerformanceSchema);

module.exports = SystemPerformance; 