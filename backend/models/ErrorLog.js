const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  level: {
    type: String,
    enum: ['error', 'warning', 'info'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  stack: {
    type: String
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userEmail: {
    type: String
  },
  route: {
    type: String
  },
  method: {
    type: String
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  additionalData: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient querying
errorLogSchema.index({ timestamp: -1 });
errorLogSchema.index({ level: 1 });
errorLogSchema.index({ userEmail: 1 });

const ErrorLog = mongoose.model('ErrorLog', errorLogSchema);

module.exports = { ErrorLog }; 