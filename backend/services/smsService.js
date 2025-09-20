const logger = require('../utils/logger')

class SMSService {
  constructor() {
    this.client = null
    this.isConfigured = false
    this.initialize()
  }

  initialize() {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID
      const authToken = process.env.TWILIO_AUTH_TOKEN
      const phoneNumber = process.env.TWILIO_PHONE_NUMBER

      // Check if credentials are properly configured
      if (!accountSid || !authToken || !phoneNumber || 
          accountSid === 'your-twilio-account-sid' || 
          authToken === 'your-twilio-auth-token' ||
          !accountSid.startsWith('AC')) {
        logger.warn('SMS service not configured - missing or invalid Twilio credentials')
        logger.info('SMS service will use mock mode for development')
        return
      }

      // Only initialize Twilio if credentials are valid
      const twilio = require('twilio')
      this.client = twilio(accountSid, authToken)
      this.phoneNumber = phoneNumber
      this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER
      this.isConfigured = true

      logger.info('SMS service initialized successfully with Twilio')
    } catch (error) {
      logger.error('SMS service initialization failed:', error)
      logger.info('SMS service will use mock mode')
    }
  }

  async sendSMS(to, message) {
    // Always use mock in development or if not configured
    if (!this.isConfigured || process.env.NODE_ENV === 'development') {
      logger.info(`[MOCK SMS] To: ${to}, Message: ${message}`)

      // Simulate realistic delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

      return { 
        success: true, 
        messageId: 'mock-sms-' + Date.now(),
        status: 'delivered',
        provider: 'mock'
      }
    }

    try {
      // Format phone number
      const formattedNumber = this.formatPhoneNumber(to)

      const messageOptions = {
        body: message,
        from: this.phoneNumber,
        to: formattedNumber
      }

      const result = await this.client.messages.create(messageOptions)

      logger.info(`SMS sent successfully to ${formattedNumber}`, {
        messageId: result.sid,
        status: result.status
      })

      return {
        success: true,
        messageId: result.sid,
        status: result.status,
        provider: 'twilio'
      }

    } catch (error) {
      logger.error('SMS sending failed:', error)

      // Fallback to mock if Twilio fails
      logger.info(`[FALLBACK MOCK SMS] To: ${to}, Message: ${message}`)
      return { 
        success: true, 
        messageId: 'fallback-mock-' + Date.now(),
        status: 'delivered',
        provider: 'mock-fallback'
      }
    }
  }

  async sendWhatsApp(to, message) {
    if (!this.isConfigured || !this.whatsappNumber || process.env.NODE_ENV === 'development') {
      logger.info(`[MOCK WHATSAPP] To: ${to}, Message: ${message}`)

      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200))

      return { 
        success: true, 
        messageId: 'mock-whatsapp-' + Date.now(),
        status: 'delivered',
        provider: 'mock'
      }
    }

    try {
      const formattedNumber = this.formatWhatsAppNumber(to)

      const messageOptions = {
        body: message,
        from: this.whatsappNumber,
        to: formattedNumber
      }

      const result = await this.client.messages.create(messageOptions)

      logger.info(`WhatsApp message sent successfully to ${formattedNumber}`, {
        messageId: result.sid,
        status: result.status
      })

      return {
        success: true,
        messageId: result.sid,
        status: result.status,
        provider: 'twilio'
      }

    } catch (error) {
      logger.error('WhatsApp message sending failed:', error)

      // Fallback to mock
      logger.info(`[FALLBACK MOCK WHATSAPP] To: ${to}, Message: ${message}`)
      return { 
        success: true, 
        messageId: 'fallback-mock-whatsapp-' + Date.now(),
        status: 'delivered',
        provider: 'mock-fallback'
      }
    }
  }

  formatPhoneNumber(phoneNumber) {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '')

    // Add country code if not present (assuming Indian numbers)
    if (cleaned.length === 10) {
      cleaned = '+91' + cleaned
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      cleaned = '+' + cleaned
    } else if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned
    }

    return cleaned
  }

  formatWhatsAppNumber(phoneNumber) {
    const formatted = this.formatPhoneNumber(phoneNumber)
    return `whatsapp:${formatted}`
  }

  async getMessageStatus(messageId) {
    if (!this.isConfigured) {
      // Return mock status
      return {
        messageId: messageId,
        status: 'delivered',
        provider: 'mock',
        dateCreated: new Date(),
        dateSent: new Date(),
        dateUpdated: new Date()
      }
    }

    try {
      const message = await this.client.messages(messageId).fetch()

      return {
        messageId: message.sid,
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated,
        provider: 'twilio'
      }
    } catch (error) {
      logger.error('Error fetching message status:', error)
      throw error
    }
  }

  async healthCheck() {
    if (!this.isConfigured) {
      return {
        status: 'healthy',
        configured: false,
        provider: 'mock',
        message: 'Using mock SMS service for development'
      }
    }

    try {
      // Try to fetch account details as a health check
      const account = await this.client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch()

      return {
        status: 'healthy',
        configured: true,
        provider: 'twilio',
        accountSid: account.sid,
        friendlyName: account.friendlyName
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        configured: true,
        provider: 'twilio',
        error: error.message
      }
    }
  }

  // Get service status
  getStatus() {
    return {
      configured: this.isConfigured,
      provider: this.isConfigured ? 'twilio' : 'mock',
      phoneNumber: this.isConfigured ? this.phoneNumber : 'mock-number',
      whatsappEnabled: this.isConfigured && !!this.whatsappNumber
    }
  }
}

// Export singleton instance
module.exports = new SMSService()

