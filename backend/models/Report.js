const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: [
            'userActivity',
            'securityAudit',
            'systemPerformance',
            'compliance'
        ]
    },
    parameters: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    generatedAt: {
        type: Date,
        default: Date.now
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'generated', 'archived', 'scheduled'],
        default: 'generated'
    },
    schedule: {
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
        },
        lastGenerated: Date,
        nextGeneration: Date
    },
    format: {
        type: String,
        enum: ['json', 'pdf', 'csv', 'excel'],
        default: 'json'
    },
    metadata: {
        fileSize: Number,
        pageCount: Number,
        generationTime: Number,
        filters: [String],
        customFields: mongoose.Schema.Types.Mixed
    }
});

// Indexes for efficient querying
reportSchema.index({ type: 1, generatedAt: -1 });
reportSchema.index({ generatedBy: 1, generatedAt: -1 });
reportSchema.index({ status: 1, generatedAt: -1 });
reportSchema.index({ 'schedule.nextGeneration': 1 });

// Static method to get reports by type and date range
reportSchema.statics.getReportsByTypeAndDateRange = async function(type, startDate, endDate) {
    return await this.find({
        type,
        generatedAt: {
            $gte: startDate,
            $lte: endDate
        }
    }).sort({ generatedAt: -1 });
};

// Static method to get scheduled reports
reportSchema.statics.getScheduledReports = async function() {
    return await this.find({
        status: 'scheduled',
        'schedule.nextGeneration': { $lte: new Date() }
    });
};

// Static method to archive old reports
reportSchema.statics.archiveOldReports = async function(daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return await this.updateMany(
        {
            generatedAt: { $lt: cutoffDate },
            status: { $ne: 'archived' }
        },
        { $set: { status: 'archived' } }
    );
};

// Instance method to update report status
reportSchema.methods.updateStatus = async function(newStatus) {
    this.status = newStatus;
    if (newStatus === 'generated') {
        this.schedule.lastGenerated = new Date();
        this.schedule.nextGeneration = this.calculateNextGenerationDate();
    }
    return await this.save();
};

// Instance method to calculate next generation date
reportSchema.methods.calculateNextGenerationDate = function() {
    if (!this.schedule.frequency) return null;

    const nextDate = new Date();
    switch (this.schedule.frequency) {
        case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
        case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        case 'quarterly':
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
        case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
    }

    return nextDate;
};

// Instance method to export report
reportSchema.methods.export = async function(format) {
    // Implementation for exporting report in different formats
    return {
        format,
        data: this.data,
        metadata: {
            type: this.type,
            generatedAt: this.generatedAt,
            ...this.metadata
        }
    };
};

const Report = mongoose.model('Report', reportSchema);

module.exports = { Report }; 