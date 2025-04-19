const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['success', 'failure', 'failed'],
        default: 'success'
    }
}, {
    timestamps: true
});

// Index for faster queries
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = { AuditLog }; 