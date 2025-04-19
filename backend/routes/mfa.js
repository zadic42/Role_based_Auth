const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const { logger } = require('../utils/logger');
const { createAuditLog } = require('../controllers/auditLogController');

// Verify MFA code
router.post('/verify', async (req, res) => {
    try {
        const { code } = req.body;
        const ipAddress = req.ip;
        const userAgent = req.get('user-agent');

        // Find user with MFA code
        const user = await User.findOne({
            mfaCode: code,
            mfaCodeExpires: { $gt: Date.now() }
        }).select('+mfaCode +mfaCodeExpires');

        if (!user) {
            await createAuditLog(
                'unknown',
                'unknown',
                'verify_mfa',
                'Invalid or expired MFA code',
                ipAddress,
                userAgent,
                'failure'
            );
            return res.status(401).json({ message: 'Invalid or expired verification code' });
        }

        // Clear MFA code and generate new token
        user.mfaCode = undefined;
        user.mfaCodeExpires = undefined;
        await user.save();

        await createAuditLog(
            user._id.toString(),
            user.email,
            'verify_mfa',
            'MFA verification successful',
            ipAddress,
            userAgent,
            'success'
        );

        const token = jwt.sign(
            { 
                userId: user._id,
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                mfaEnabled: true
            }
        });
    } catch (error) {
        logger.error('MFA verification error:', error);
        res.status(500).json({ message: 'Server error during verification' });
    }
});

// Enable MFA
router.post('/enable', async (req, res) => {
    try {
        const userId = req.user.userId;
        const ipAddress = req.ip;
        const userAgent = req.get('user-agent');

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.mfaEnabled = true;
        await user.save();

        await createAuditLog(
            user._id.toString(),
            user.email,
            'enable_mfa',
            'MFA enabled successfully',
            ipAddress,
            userAgent,
            'success'
        );

        res.json({ message: 'MFA enabled successfully' });
    } catch (error) {
        logger.error('Enable MFA error:', error);
        res.status(500).json({ message: 'Server error while enabling MFA' });
    }
});

// Disable MFA
router.post('/disable', async (req, res) => {
    try {
        const userId = req.user.userId;
        const ipAddress = req.ip;
        const userAgent = req.get('user-agent');

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.mfaEnabled = false;
        user.mfaCode = undefined;
        user.mfaCodeExpires = undefined;
        await user.save();

        await createAuditLog(
            user._id.toString(),
            user.email,
            'disable_mfa',
            'MFA disabled successfully',
            ipAddress,
            userAgent,
            'success'
        );

        res.json({ message: 'MFA disabled successfully' });
    } catch (error) {
        logger.error('Disable MFA error:', error);
        res.status(500).json({ message: 'Server error while disabling MFA' });
    }
});

module.exports = router; 