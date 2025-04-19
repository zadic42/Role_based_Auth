require('dotenv').config();

module.exports = {
    // JWT Configuration
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
    JWT_EXPIRES_IN: '24h',

    // MongoDB Configuration
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/trainer-management',

    // Server Configuration
    PORT: process.env.PORT || 3001,
    NODE_ENV: process.env.NODE_ENV || 'development',

    // CORS Configuration
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 100,

    // Session Configuration
    SESSION_SECRET: process.env.SESSION_SECRET || 'your-session-secret',
    SESSION_COOKIE_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours

    // Logging Configuration
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_FILE_PATH: 'logs/app.log',

    // Backup Configuration
    BACKUP_INTERVAL_HOURS: 24,
    BACKUP_DIR: 'backups'
}; 