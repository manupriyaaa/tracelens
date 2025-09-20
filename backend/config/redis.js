const redis = require('redis')
const logger = require('../utils/logger')

class RedisConnection {
  constructor() {
    this.client = null
    this.isConnected = false
    this.connectionConfig = {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD || undefined,
      database: parseInt(process.env.REDIS_DB) || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000
    }
  }

  async connect() {
    try {
      if (this.isConnected && this.client) {
        return this.client
      }

      // Create Redis client
      this.client = redis.createClient(this.connectionConfig)

      // Event listeners
      this.client.on('connect', () => {
        logger.info('Redis connecting...')
      })

      this.client.on('ready', () => {
        this.isConnected = true
        logger.info('Redis connected and ready')
      })

      this.client.on('error', (error) => {
        logger.error('Redis connection error:', error)
        this.isConnected = false
      })

      this.client.on('end', () => {
        logger.warn('Redis connection ended')
        this.isConnected = false
      })

      this.client.on('reconnecting', () => {
        logger.info('Redis reconnecting...')
      })

      // Connect to Redis
      await this.client.connect()

      // Test connection
      await this.client.ping()
      logger.info('Redis ping successful')

      return this.client

    } catch (error) {
      logger.error('Redis connection failed:', error)
      this.isConnected = false

      // Fall back to in-memory storage if Redis is not available
      if (process.env.NODE_ENV === 'development') {
        logger.warn('Falling back to in-memory storage for development')
        this.client = this.createMemoryClient()
        this.isConnected = true
        return this.client
      }

      throw error
    }
  }

  createMemoryClient() {
    const memoryStorage = new Map()
    const memoryExpiry = new Map()

    return {
      // Basic Redis-like operations for development fallback
      get: async (key) => {
        if (memoryExpiry.has(key) && memoryExpiry.get(key) < Date.now()) {
          memoryStorage.delete(key)
          memoryExpiry.delete(key)
          return null
        }
        return memoryStorage.get(key) || null
      },

      set: async (key, value, options = {}) => {
        memoryStorage.set(key, value)

        if (options.EX) {
          memoryExpiry.set(key, Date.now() + (options.EX * 1000))
        }

        return 'OK'
      },

      setEx: async (key, seconds, value) => {
        memoryStorage.set(key, value)
        memoryExpiry.set(key, Date.now() + (seconds * 1000))
        return 'OK'
      },

      del: async (key) => {
        memoryStorage.delete(key)
        memoryExpiry.delete(key)
        return 1
      },

      exists: async (key) => {
        if (memoryExpiry.has(key) && memoryExpiry.get(key) < Date.now()) {
          memoryStorage.delete(key)
          memoryExpiry.delete(key)
          return 0
        }
        return memoryStorage.has(key) ? 1 : 0
      },

      ping: async () => 'PONG',

      flushDb: async () => {
        memoryStorage.clear()
        memoryExpiry.clear()
        return 'OK'
      },

      quit: async () => 'OK',

      disconnect: () => Promise.resolve(),

      // Memory-specific cleanup
      cleanup: () => {
        const now = Date.now()
        for (const [key, expiry] of memoryExpiry.entries()) {
          if (expiry < now) {
            memoryStorage.delete(key)
            memoryExpiry.delete(key)
          }
        }
      }
    }
  }

  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit()
        this.isConnected = false
        logger.info('Redis disconnected')
      }
    } catch (error) {
      logger.error('Error disconnecting Redis:', error)
    }
  }

  async healthCheck() {
    try {
      if (!this.client || !this.isConnected) {
        return {
          status: 'unhealthy',
          connected: false,
          error: 'Not connected to Redis'
        }
      }

      const startTime = Date.now()
      const pong = await this.client.ping()
      const responseTime = Date.now() - startTime

      return {
        status: pong === 'PONG' ? 'healthy' : 'unhealthy',
        connected: this.isConnected,
        responseTime: `${responseTime}ms`,
        memory: await this.getMemoryStats()
      }

    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message
      }
    }
  }

  async getMemoryStats() {
    try {
      if (this.client.info) {
        const info = await this.client.info('memory')
        const lines = info.split('\r\n')
        const memoryStats = {}

        lines.forEach(line => {
          if (line.includes(':')) {
            const [key, value] = line.split(':')
            if (key.includes('memory')) {
              memoryStats[key] = value
            }
          }
        })

        return memoryStats
      }
    } catch (error) {
      logger.warn('Could not get Redis memory stats:', error)
    }

    return {}
  }

  getClient() {
    return this.client
  }

  isRedisConnected() {
    return this.isConnected
  }
}

// Export singleton instance
module.exports = new RedisConnection()

