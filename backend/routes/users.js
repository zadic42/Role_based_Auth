const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const { authenticateToken, checkRole, checkPermission } = require('../middleware/auth');
const { logger } = require('../utils/logger');

// Get all users (admin only)
router.get('/', authenticateToken, checkRole(['admin']), async (req, res) => {
    try {
        const users = await User.find().select('-password -mfaSecret');
        res.json(users);
    } catch (error) {
        logger.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password -mfaSecret');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        logger.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Error fetching user profile' });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (email) {
            user.email = email;
        }

        if (currentPassword && newPassword) {
            const isValid = await user.comparePassword(currentPassword);
            if (!isValid) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }
            user.password = newPassword;
        }

        await user.save();
        logger.info(`User profile updated: ${user._id}`);
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        logger.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

// Create new user (admin only)
router.post('/', authenticateToken, checkRole(['admin']), async (req, res) => {
    try {
        const { email, password, role, permissions } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = new User({
            email,
            password,
            role,
            permissions
        });

        await user.save();
        logger.info(`New user created: ${user._id}`);
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        logger.error('Error creating user:', error);
        res.status(500).json({ message: 'Error creating user' });
    }
});

// Update user (admin only)
router.put('/:userId', authenticateToken, checkRole(['admin']), async (req, res) => {
    try {
        const { role, permissions, lockedUntil } = req.body;
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (role) user.role = role;
        if (permissions) user.permissions = permissions;
        if (lockedUntil) user.lockedUntil = new Date(lockedUntil);

        await user.save();
        logger.info(`User updated: ${user._id}`);
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        logger.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user' });
    }
});

// Delete user (admin only)
router.delete('/:userId', authenticateToken, checkRole(['admin']), async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.deleteOne();
        logger.info(`User deleted: ${req.params.userId}`);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        logger.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user' });
    }
});

module.exports = router; 