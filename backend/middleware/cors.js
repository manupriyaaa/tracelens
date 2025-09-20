const cors = require('cors')
const rateLimit = require('express-rate-limit')

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}

// Rate limiting
const rateLimits = {
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      message: 'Too many requests, please try again later.'
    }
  }),

  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 auth requests per windowMs
    message: {
      success: false,
      message: 'Too many authentication attempts, please try again later.'
    }
  }),

  otp: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // limit each IP to 5 OTP requests per 5 minutes
    message: {
      success: false,
      message: 'Too many OTP requests, please try again in 5 minutes.'
    }
  })
}

module.exports = {
  cors: cors(corsOptions),
  rateLimits
}

