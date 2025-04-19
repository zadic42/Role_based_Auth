const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: function() {
            // Password is required only if googleId is not provided
            return !this.googleId;
        }
    },
    googleId: {
        type: String,
        sparse: true,
        unique: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    permissions: [{
        type: String,
        enum: ['read', 'write', 'delete', 'manage_users', 'view_reports']
    }],
    mfaEnabled: {
        type: Boolean,
        default: false
    },
    mfaCode: {
        type: String,
        select: false // Don't include in queries by default
    },
    mfaCodeExpires: {
        type: Date,
        select: false // Don't include in queries by default
    },
    lastLogin: {
        type: Date
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockedUntil: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Check if user has specific permission
userSchema.methods.hasPermission = function(permission) {
    return this.permissions.includes(permission);
};

// Check if user has specific role
userSchema.methods.hasRole = function(role) {
    return this.role === role;
};

// Increment login attempts
userSchema.methods.incrementLoginAttempts = async function() {
    this.loginAttempts += 1;
    if (this.loginAttempts >= 5) {
        this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
    }
    await this.save();
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
    this.loginAttempts = 0;
    this.lockedUntil = null;
    await this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = { User }; 