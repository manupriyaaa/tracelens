const express = require('express')
const router = express.Router()
const database = require('../config/database')
const redisConnection = require('../config/redis')
const logger = require('../utils/logger')

// Basic health check
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now()

    // Basic system info
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      responseTime: null
    }

    // Check database connection
    try {
      const dbHealth = await database.healthCheck()
      healthStatus.database = dbHealth
    } catch (error) {
      healthStatus.database = {
        status: 'unhealthy',
        error: error.message
      }
      healthStatus.status = 'degraded'
    }

    // Calculate response time
    healthStatus.responseTime = `${Date.now() - startTime}ms`

    // Set appropriate status code
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503

    res.status(statusCode).json(healthStatus)

  } catch (error) {
    logger.error('Health check error:', error)
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
})

module.exports = router

