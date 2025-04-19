const { User } = require('../models/User');
const { AuditLog } = require('../models/AuditLog');
const { Report } = require('../models/Report');
const { logger } = require('../utils/logger');
const PDFDocument = require('pdfkit');

const generateReport = async (reportType, parameters) => {
    try {
        let reportData;

        switch (reportType) {
            case 'userActivity':
                reportData = await generateUserActivityReport(parameters);
                break;
            case 'securityAudit':
                reportData = await generateSecurityAuditReport(parameters);
                break;
            case 'systemPerformance':
                reportData = await generateSystemPerformanceReport(parameters);
                break;
            case 'compliance':
                reportData = await generateComplianceReport(parameters);
                break;
            default:
                throw new Error('Invalid report type');
        }

        // Save report to database
        const report = new Report({
            type: reportType,
            parameters,
            data: reportData,
            generatedAt: new Date()
        });
        await report.save();

        return report;
    } catch (error) {
        logger.error(`Error generating ${reportType} report:`, error);
        throw error;
    }
};

const generateUserActivityReport = async ({ startDate, endDate, userId }) => {
    const query = {
        timestamp: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    };

    if (userId) {
        query.userId = userId;
    }

    const activities = await AuditLog.find(query)
        .sort({ timestamp: -1 })
        .populate('userId', 'email');

    return {
        totalActivities: activities.length,
        activitiesByType: groupBy(activities, 'eventType'),
        activitiesByUser: groupBy(activities, 'userId.email'),
        timeDistribution: calculateTimeDistribution(activities)
    };
};

const generateSecurityAuditReport = async ({ startDate, endDate, eventType }) => {
    const query = {
        timestamp: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        },
        eventType: { $in: ['login', 'logout', 'failed_login', 'password_change'] }
    };

    if (eventType) {
        query.eventType = eventType;
    }

    const securityEvents = await AuditLog.find(query)
        .sort({ timestamp: -1 });

    return {
        totalEvents: securityEvents.length,
        eventsByType: groupBy(securityEvents, 'eventType'),
        failedLoginAttempts: securityEvents.filter(e => e.eventType === 'failed_login').length,
        suspiciousActivities: await detectSuspiciousActivities(securityEvents)
    };
};

const generateSystemPerformanceReport = async ({ startDate, endDate, metrics }) => {
    const performanceData = await collectPerformanceMetrics(startDate, endDate, metrics);
    
    return {
        responseTime: performanceData.responseTime,
        errorRate: performanceData.errorRate,
        requestRate: performanceData.requestRate,
        systemLoad: performanceData.systemLoad,
        resourceUsage: performanceData.resourceUsage
    };
};

const generateComplianceReport = async ({ reportType, period }) => {
    const complianceData = await collectComplianceData(reportType, period);
    
    return {
        reportType,
        period,
        complianceScore: calculateComplianceScore(complianceData),
        violations: complianceData.violations,
        recommendations: generateComplianceRecommendations(complianceData)
    };
};

const exportReport = async (report, format) => {
    if (format === 'pdf') {
        return await generatePDFReport(report);
    }
    throw new Error('Unsupported export format');
};

const generatePDFReport = async (report) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument();
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));

            // Add report content
            doc.fontSize(20).text('Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Type: ${report.type}`);
            doc.text(`Generated: ${report.generatedAt}`);
            doc.moveDown();

            // Add report data
            doc.fontSize(14).text('Data');
            doc.moveDown();
            doc.fontSize(12).text(JSON.stringify(report.data, null, 2));

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

const scheduleReport = async ({ reportType, schedule, parameters, userId }) => {
    const scheduledReport = new Report({
        type: reportType,
        parameters,
        schedule,
        userId,
        status: 'scheduled'
    });
    await scheduledReport.save();

    // Schedule the report generation
    await scheduleReportGeneration(scheduledReport);

    return scheduledReport;
};

// Helper functions
const groupBy = (array, key) => {
    return array.reduce((result, item) => {
        const group = key.split('.').reduce((obj, k) => obj && obj[k], item);
        (result[group] = result[group] || []).push(item);
        return result;
    }, {});
};

const calculateTimeDistribution = (activities) => {
    return activities.reduce((acc, activity) => {
        const hour = new Date(activity.timestamp).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
    }, {});
};

const detectSuspiciousActivities = async (events) => {
    // Implementation for detecting suspicious activities
    return [];
};

const collectPerformanceMetrics = async (startDate, endDate, metrics) => {
    // Implementation for collecting performance metrics
    return {
        responseTime: 0,
        errorRate: 0,
        requestRate: 0,
        systemLoad: 0,
        resourceUsage: {}
    };
};

const collectComplianceData = async (reportType, period) => {
    // Implementation for collecting compliance data
    return {
        violations: [],
        score: 0
    };
};

const calculateComplianceScore = (data) => {
    // Implementation for calculating compliance score
    return 0;
};

const generateComplianceRecommendations = (data) => {
    // Implementation for generating compliance recommendations
    return [];
};

const scheduleReportGeneration = async (report) => {
    // Implementation for scheduling report generation
};

module.exports = {
    generateReport,
    exportReport,
    scheduleReport
}; 