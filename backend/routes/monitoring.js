const express = require('express');
const router = express.Router();
const promClient = require('prom-client');
const { authenticateToken, checkRole } = require('../middleware/auth');
const { logger } = require('../utils/logger');

// Metrics endpoint for Prometheus
router.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', promClient.register.contentType);
        const metrics = await promClient.register.metrics();
        res.send(metrics);
    } catch (error) {
        logger.error('Error generating metrics:', error);
        res.status(500).json({ message: 'Error generating metrics' });
    }
});

// System health check with historical data
router.get('/health', authenticateToken, checkRole(['admin']), async (req, res) => {
    try {
        const health = {
            timestamp: new Date(),
            cpu: {
                user: process.cpuUsage().user,
                system: process.cpuUsage().system
            },
            memory: {
                heapUsed: process.memoryUsage().heapUsed,
                heapTotal: process.memoryUsage().heapTotal,
                rss: process.memoryUsage().rss
            },
            uptime: process.uptime()
        };
        res.json(health);
    } catch (error) {
        logger.error('Health check error:', error);
        res.status(500).json({ message: 'Health check failed' });
    }
});

// Security audit logs
router.get('/audit-logs', authenticateToken, checkRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate, eventType } = req.query;
        const query = {};
        
        if (startDate && endDate) {
            query.timestamp = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        if (eventType) {
            query.eventType = eventType;
        }

        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .limit(100);
            
        res.json(logs);
    } catch (error) {
        logger.error('Error fetching audit logs:', error);
        res.status(500).json({ message: 'Error fetching audit logs' });
    }
});

// Performance metrics
router.get('/performance', authenticateToken, checkRole(['admin']), async (req, res) => {
    try {
        const metrics = {
            cpu: {
                user: process.cpuUsage().user,
                system: process.cpuUsage().system
            },
            memory: {
                heapUsed: process.memoryUsage().heapUsed,
                heapTotal: process.memoryUsage().heapTotal,
                rss: process.memoryUsage().rss
            },
            uptime: process.uptime()
        };
        res.json(metrics);
    } catch (error) {
        logger.error('Error fetching performance metrics:', error);
        res.status(500).json({ message: 'Error fetching performance metrics' });
    }
});

// Helper functions for performance metrics
async function getAverageResponseTime() {
    // Implementation for calculating average response time
    return 0;
}

async function getErrorRate() {
    // Implementation for calculating error rate
    return 0;
}

async function getRequestRate() {
    // Implementation for calculating request rate
    return 0;
}

async function getSystemLoad() {
    // Implementation for calculating system load
    return 0;
}

module.exports = router; 