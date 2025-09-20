const nodemailer = require('nodemailer')
const logger = require('../utils/logger')

class EmailService {
  constructor() {
    this.transporter = null
    this.isConfigured = false
    this.initialize()
  }

  initialize() {
    try {
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        logger.warn('Email service not configured - missing SMTP credentials')
        return
      }

      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      })

      this.isConfigured = true
      logger.info('Email service initialized')

    } catch (error) {
      logger.error('Email service initialization failed:', error)
    }
  }

  async sendEmail(options) {
    if (!this.isConfigured) {
      throw new Error('Email service not configured')
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      }

      const result = await this.transporter.sendMail(mailOptions)

      logger.info(`Email sent successfully to ${options.to}`)
      return { success: true, messageId: result.messageId }

    } catch (error) {
      logger.error('Email sending failed:', error)
      throw error
    }
  }
}

module.exports = new EmailService()

