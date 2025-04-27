const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { Trainer } = require('../models/Trainer');
const { logger } = require('../utils/logger');


const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Special case for admin user
        if (decoded.userId === 'admin' && decoded.role === 'admin') {
            req.user = decoded;
            return next();
        }

        // For regular users and trainers, verify against appropriate database
        let user;
        if (decoded.role === 'trainer') {
            user = await Trainer.findById(decoded.userId);
        } else {
            user = await User.findById(decoded.userId);
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            return res.status(403).json({ 
                message: 'Account is locked. Please try again later.',
                lockedUntil: user.lockedUntil
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        return res.status(403).json({ message: 'Invalid token' });
    }
};

const isAdmin = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (req.user.role !== 'admin') {
            logger.warn(`Unauthorized admin access attempt by user ${req.user.userId} with role ${req.user.role}`);
            return res.status(403).json({ message: 'Admin access required' });
        }

        next();
    } catch (error) {
        logger.error('Admin check error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const checkRole = (roles) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.role) {
                return res.status(403).json({ message: 'Role information missing' });
            }

            if (!roles.includes(req.user.role)) {
                logger.warn(`Unauthorized access attempt by user ${req.user.userId} with role ${req.user.role}`);
                return res.status(403).json({ message: 'Insufficient permissions' });
            }

            next();
        } catch (error) {
            logger.error('Role check error:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    };
};

const checkPermission = (permissions) => {
    return async (req, res, next) => {
        try {
            const user = await User.findById(req.user.userId);
            
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const hasAllPermissions = permissions.every(permission => 
                user.hasPermission(permission)
            );

            if (!hasAllPermissions) {
                logger.warn(`Unauthorized access attempt by user ${user._id} for permissions ${permissions}`);
                return res.status(403).json({ message: 'Insufficient permissions' });
            }

            next();
        } catch (error) {
            logger.error('Permission check error:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    };
};

module.exports = {
    authenticateToken,
    isAdmin,
    checkRole,
    checkPermission
}; 