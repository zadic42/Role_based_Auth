const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole, checkPermission } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { generateReport } = require('../services/reportService');

// Generate user activity report
router.get('/user-activity', authenticateToken, checkPermission(['view_reports']), async (req, res) => {
    try {
        const { startDate, endDate, userId } = req.query;
        const report = await generateReport('userActivity', {
            startDate,
            endDate,
            userId
        });
        res.json(report);
    } catch (error) {
        logger.error('Error generating user activity report:', error);
        res.status(500).json({ message: 'Error generating report' });
    }
});

// Generate security audit report
router.get('/security-audit', authenticateToken, checkRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate, eventType } = req.query;
        const report = await generateReport('securityAudit', {
            startDate,
            endDate,
            eventType
        });
        res.json(report);
    } catch (error) {
        logger.error('Error generating security audit report:', error);
        res.status(500).json({ message: 'Error generating report' });
    }
});

// Generate system performance report
router.get('/system-performance', authenticateToken, checkRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate, metrics } = req.query;
        const report = await generateReport('systemPerformance', {
            startDate,
            endDate,
            metrics: metrics ? metrics.split(',') : undefined
        });
        res.json(report);
    } catch (error) {
        logger.error('Error generating system performance report:', error);
        res.status(500).json({ message: 'Error generating report' });
    }
});

// Generate compliance report
router.get('/compliance', authenticateToken, checkRole(['admin']), async (req, res) => {
    try {
        const { reportType, period } = req.query;
        const report = await generateReport('compliance', {
            reportType,
            period
        });
        res.json(report);
    } catch (error) {
        logger.error('Error generating compliance report:', error);
        res.status(500).json({ message: 'Error generating report' });
    }
});

// Export report to PDF
router.post('/export/:reportId', authenticateToken, checkPermission(['view_reports']), async (req, res) => {
    try {
        const { reportId } = req.params;
        const { format } = req.body;
        
        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        const exportedReport = await exportReport(report, format);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=report-${reportId}.pdf`);
        res.send(exportedReport);
    } catch (error) {
        logger.error('Error exporting report:', error);
        res.status(500).json({ message: 'Error exporting report' });
    }
});

// Schedule report generation
router.post('/schedule', authenticateToken, checkPermission(['view_reports']), async (req, res) => {
    try {
        const { reportType, schedule, parameters } = req.body;
        const scheduledReport = await scheduleReport({
            reportType,
            schedule,
            parameters,
            userId: req.user.userId
        });
        res.json(scheduledReport);
    } catch (error) {
        logger.error('Error scheduling report:', error);
        res.status(500).json({ message: 'Error scheduling report' });
    }
});

module.exports = router; 