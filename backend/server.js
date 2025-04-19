const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const promClient = require('prom-client');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, json } = format;
const session = require('express-session');
const passport = require('./config/googleAuth');
const { scheduleBackups } = require('./services/backupService');
require('dotenv').config();

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: 'http://localhost:5173', // Vite's default port
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Session middleware
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Prometheus metrics
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'app_' });

// Winston logger setup
const logger = createLogger({
    format: combine(
        timestamp(),
        json()
    ),
    transports: [
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        new transports.File({ filename: 'logs/combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: combine(
            timestamp(),
            json()
        )
    }));
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/monitoring', require('./routes/monitoring'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/error-logs', require('./routes/errorLogs'));
app.use('/api/backups', require('./routes/backups'));
app.use('/api/trainer', require('./routes/trainers'));

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000, // Timeout after 30 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    connectTimeoutMS: 30000, // Give up initial connection after 30 seconds
    maxPoolSize: 50, // Maintain up to 50 socket connections
    minPoolSize: 10, // Maintain at least 10 socket connections
    retryWrites: true,
    retryReads: true
})
.then(() => {
    logger.info('Connected to MongoDB');
    
    // Initialize backup service with daily backups
    scheduleBackups(24);
})
.catch(err => logger.error('MongoDB connection error:', err));
