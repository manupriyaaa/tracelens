// Simplified logger that falls back to console if winston is not available
let logger;

try {
  const winston = require('winston');
  const path = require('path');

  // Create logs directory if it doesn't exist
  const fs = require('fs');
  const logsDir = './logs';
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Custom format for console output
  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return `${timestamp} [${level}]: ${stack || message}`;
    })
  );

  // Custom format for file output
  const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  );

  // Create logger instance
  logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: {
      service: 'trace-lens-backend',
      version: process.env.npm_package_version || '1.0.0'
    },
    transports: []
  });

  // Console transport for development
  if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: consoleFormat
    }));
  }

  // File transports for production and development
  if (process.env.ENABLE_LOGGING !== 'false') {
    // Combined log file
    logger.add(new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      format: fileFormat,
      maxsize: process.env.LOG_MAX_SIZE || '10m',
      maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
      tailable: true
    }));

    // Error log file
    logger.add(new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: process.env.LOG_MAX_SIZE || '10m',
      maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
      tailable: true
    }));
  }

} catch (error) {
  console.warn('Winston logger not available, falling back to console logging');

  // Fallback logger using console
  logger = {
    info: (message, meta) => {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || '');
    },
    warn: (message, meta) => {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || '');
    },
    error: (message, meta) => {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta || '');
    },
    debug: (message, meta) => {
      if (process.env.LOG_LEVEL === 'debug') {
        console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta || '');
      }
    }
  };
}

// Add request logging middleware
logger.requestMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.userId || null
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;

    logger.info('HTTP Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.userId || null
    });

    originalEnd.apply(res, args);
  };

  next();
};

// Add error logging
logger.errorMiddleware = (err, req, res, next) => {
  logger.error('Unhandled Error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    userId: req.userId || null,
    body: req.body,
    params: req.params,
    query: req.query
  });

  next(err);
};

module.exports = logger;

