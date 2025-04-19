const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { User } = require('../models/User');
const { logger } = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const jwt = require('jsonwebtoken');
const { createAuditLog } = require('../controllers/auditLogController');

// Fixed admin credentials
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    try {
        // Special case for fixed admin user
        if (req.user.userId === 'admin' && req.user.role === 'admin') {
            return next();
        }

        // For other users, check database
        const user = await User.findById(req.user.userId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        next();
    } catch (error) {
        logger.error('Admin check error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const ipAddress = req.ip;
        const userAgent = req.get('user-agent');

        // Check if credentials match fixed admin credentials
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            // Generate JWT token
            const token = jwt.sign(
                { 
                    userId: 'admin',
                    role: 'admin',
                    email: ADMIN_EMAIL 
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            await createAuditLog(
                'admin',
                ADMIN_EMAIL,
                'admin_login',
                'Admin login successful',
                ipAddress,
                userAgent,
                'success'
            );

            logger.info('Admin login successful');
            res.json({
                success: true,
                token,
                user: {
                    id: 'admin',
                    email: ADMIN_EMAIL,
                    role: 'admin'
                }
            });
        } else {
            await createAuditLog(
                'unknown',
                email,
                'admin_login',
                'Invalid admin credentials',
                ipAddress,
                userAgent,
                'failure'
            );

            logger.warn('Invalid admin login attempt');
            res.status(401).json({
                success: false,
                message: 'Invalid admin credentials'
            });
        }
    } catch (error) {
        logger.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Protected admin route example
router.get('/dashboard', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.'
        });
    }

    res.json({
        success: true,
        message: 'Admin dashboard data',
        user: req.user
    });
});

// Get audit logs
router.get('/logs/audit', authenticateToken, isAdmin, async (req, res) => {
    try {
        const logPath = path.join(__dirname, '../logs/audit.log');
        const logs = await fs.readFile(logPath, 'utf8');
        const logLines = logs.split('\n').filter(line => line.trim());
        
        await createAuditLog(
            req.user.userId,
            req.user.email,
            'view_audit_logs',
            'Retrieved audit logs',
            req.ip,
            req.get('user-agent'),
            'success'
        );

        res.json({ logs: logLines });
    } catch (error) {
        logger.error('Error reading audit logs:', error);
        res.status(500).json({ message: 'Error reading logs' });
    }
});

// Get error logs
router.get('/logs/error', authenticateToken, isAdmin, async (req, res) => {
    try {
        const logPath = path.join(__dirname, '../logs/error.log');
        const logs = await fs.readFile(logPath, 'utf8');
        const logLines = logs.split('\n').filter(line => line.trim());
        res.json({ logs: logLines });
    } catch (error) {
        logger.error('Error reading error logs:', error);
        res.status(500).json({ message: 'Error reading logs' });
    }
});

// Get all users
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await User.find({}, '-password -mfaCode -mfaCodeExpires');
        await createAuditLog(
            req.user.userId,
            req.user.email,
            'view_users',
            'Retrieved all users',
            req.ip,
            req.get('user-agent'),
            'success'
        );
        res.json({ users });
    } catch (error) {
        logger.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Get user details
router.get('/users/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id, '-password -mfaCode -mfaCodeExpires');
        if (!user) {
            await createAuditLog(
                req.user.userId,
                req.user.email,
                'view_user',
                `Failed to find user with ID: ${req.params.id}`,
                req.ip,
                req.get('user-agent'),
                'failure'
            );
            return res.status(404).json({ message: 'User not found' });
        }

        await createAuditLog(
            req.user.userId,
            req.user.email,
            'view_user',
            `Retrieved details for user: ${user.email}`,
            req.ip,
            req.get('user-agent'),
            'success'
        );

        res.json({ user });
    } catch (error) {
        logger.error('Error fetching user details:', error);
        res.status(500).json({ message: 'Error fetching user details' });
    }
});

// Update user role
router.patch('/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = role;
        await user.save();

        logger.info(`Updated user role: ${user._id} to ${role}`);
        res.json({ message: 'User role updated successfully' });
    } catch (error) {
        logger.error('Error updating user role:', error);
        res.status(500).json({ message: 'Error updating user role' });
    }
});

// Update user permissions
router.patch('/users/:id/permissions', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { permissions } = req.body;
        if (!Array.isArray(permissions)) {
            return res.status(400).json({ message: 'Invalid permissions format' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.permissions = permissions;
        await user.save();

        logger.info(`Updated user permissions: ${user._id}`);
        res.json({ message: 'User permissions updated successfully' });
    } catch (error) {
        logger.error('Error updating user permissions:', error);
        res.status(500).json({ message: 'Error updating user permissions' });
    }
});

module.exports = router; 