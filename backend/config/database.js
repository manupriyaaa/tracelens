const mongoose = require('mongoose')
const logger = require('../utils/logger')

class Database {
  constructor() {
    this.connection = null
    this.isConnected = false
  }

  async connect() {
    try {
      if (this.isConnected) {
        logger.info('Database already connected')
        return this.connection
      }

      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tracelens'

      // Connection options
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10, // Maximum number of connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        bufferMaxEntries: 0, // Disable mongoose buffering
        bufferCommands: false, // Disable mongoose buffering
      }

      // Connect to MongoDB
      this.connection = await mongoose.connect(mongoUri, options)
      this.isConnected = true

      logger.info(`MongoDB connected: ${this.connection.connection.host}:${this.connection.connection.port}`)
      logger.info(`Database: ${this.connection.connection.name}`)

      // Connection event listeners
      mongoose.connection.on('connected', () => {
        logger.info('Mongoose connected to MongoDB')
      })

      mongoose.connection.on('error', (err) => {
        logger.error('Mongoose connection error:', err)
        this.isConnected = false
      })

      mongoose.connection.on('disconnected', () => {
        logger.warn('Mongoose disconnected from MongoDB')
        this.isConnected = false
      })

      // Handle application termination
      process.on('SIGINT', async () => {
        await this.disconnect()
        process.exit(0)
      })

      process.on('SIGTERM', async () => {
        await this.disconnect()
        process.exit(0)
      })

      return this.connection

    } catch (error) {
      logger.error('MongoDB connection failed:', error)
      this.isConnected = false
      throw error
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.connection.close()
        this.isConnected = false
        logger.info('MongoDB disconnected')
      }
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error)
    }
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        throw new Error('Database not connected')
      }

      // Simple ping to check connection
      await mongoose.connection.db.admin().ping()

      return {
        status: 'healthy',
        connected: this.isConnected,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        database: mongoose.connection.name,
        readyState: mongoose.connection.readyState,
        readyStateText: this.getReadyStateText(mongoose.connection.readyState)
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message
      }
    }
  }

  getReadyStateText(state) {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }
    return states[state] || 'unknown'
  }

  async dropDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot drop database in production')
    }

    try {
      await mongoose.connection.db.dropDatabase()
      logger.info('Database dropped successfully')
    } catch (error) {
      logger.error('Error dropping database:', error)
      throw error
    }
  }

  async createIndexes() {
    try {
      // Create indexes for better performance
      const User = require('../models/User')
      const Image = require('../models/Image')

      await User.createIndexes()
      await Image.createIndexes()

      logger.info('Database indexes created successfully')
    } catch (error) {
      logger.error('Error creating indexes:', error)
      throw error
    }
  }

  getStats() {
    if (!this.isConnected) {
      return null
    }

    return {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      database: mongoose.connection.name,
      readyState: mongoose.connection.readyState,
      readyStateText: this.getReadyStateText(mongoose.connection.readyState),
      collections: Object.keys(mongoose.connection.collections),
      models: mongoose.modelNames()
    }
  }
}

// Export singleton instance
module.exports = new Database()

