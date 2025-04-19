const winston = require('winston');
const { format } = winston;
const { combine, timestamp, printf, colorize, errors } = format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level}] : ${message}`;
    if (stack) {
        msg += `\nStack: ${stack}`;
    }
    if (Object.keys(metadata).length > 0) {
        msg += `\nMetadata: ${JSON.stringify(metadata, null, 2)}`;
    }
    return msg;
});

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        timestamp(),
        errors({ stack: true }), // Include stack traces
        format.json()
    ),
    defaultMeta: { service: 'secure-backend' },
    transports: [
        // Write to all logs with level 'info' and below to combined.log
        new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: combine(
                timestamp(),
                errors({ stack: true }),
                format.json()
            )
        }),
        // Write all logs error (and above) to error.log
        new winston.transports.File({ 
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: combine(
                timestamp(),
                errors({ stack: true }),
                format.json()
            )
        })
    ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: combine(
            colorize(),
            timestamp(),
            errors({ stack: true }),
            consoleFormat
        )
    }));
}

// Create a stream object for Morgan
logger.stream = {
    write: function(message) {
        logger.info(message.trim());
    }
};

module.exports = { logger }; 