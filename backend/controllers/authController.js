const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')
const User = require('../models/User')
const { generateOTP, verifyOTP, deleteOTP } = require('../services/otpService')
const { sendSMS } = require('../services/smsService')
const logger = require('../utils/logger')

class AuthController {
  // Send OTP to mobile number
  async sendOTP(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        })
      }

      const { mobile } = req.body

      // Generate OTP
      const otp = generateOTP(mobile)

      // Send SMS in production
      if (process.env.NODE_ENV === 'production') {
        try {
          await sendSMS(mobile, `Your Trace Lens OTP is: ${otp}. Valid for 5 minutes. Do not share with anyone.`)
          logger.info(`OTP sent to mobile: ${mobile}`)
        } catch (smsError) {
          logger.error('SMS sending failed:', smsError)
          return res.status(500).json({
            success: false,
            message: 'Failed to send SMS. Please try again.'
          })
        }
      } else {
        // In development, log the OTP
        logger.info(`Development OTP for ${mobile}: ${otp}`)
      }

      res.json({
        success: true,
        message: 'OTP sent successfully',
        // Include OTP in development mode only
        ...(process.env.NODE_ENV !== 'production' && { otp })
      })

    } catch (error) {
      logger.error('Send OTP error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  // Login with credentials and OTP
  async login(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        })
      }

      const { email, password, mobile, otp } = req.body

      // Verify OTP first
      const isOTPValid = await verifyOTP(mobile, otp)
      if (!isOTPValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        })
      }

      // Find or create user
      let user = await User.findOne({ email }).select('+password')

      if (!user) {
        // Create new user
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12)
        user = new User({
          email,
          password: hashedPassword,
          mobile,
          isVerified: true,
          profile: {
            firstName: email.split('@')[0] // Default first name from email
          }
        })
        await user.save()
        logger.info(`New user created: ${email}`)
      } else {
        // Verify password for existing user
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
          return res.status(400).json({
            success: false,
            message: 'Invalid credentials'
          })
        }

        // Update mobile if different
        if (user.mobile !== mobile) {
          user.mobile = mobile
          await user.save()
        }
      }

      // Delete used OTP
      await deleteOTP(mobile)

      // Update last login
      user.lastLogin = new Date()
      await user.save()

      // Generate tokens
      const accessToken = jwt.sign(
        { 
          userId: user._id,
          email: user.email,
          type: 'access'
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '24h' }
      )

      const refreshToken = jwt.sign(
        {
          userId: user._id,
          type: 'refresh'
        },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
      )

      // Remove sensitive data
      const userResponse = user.toObject()
      delete userResponse.password

      logger.info(`User logged in: ${email}`)

      res.json({
        success: true,
        message: 'Login successful',
        token: accessToken,
        refreshToken,
        user: userResponse
      })

    } catch (error) {
      logger.error('Login error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  // Get current user
  async getMe(req, res) {
    try {
      const user = await User.findById(req.userId).select('-password')

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      res.json({
        success: true,
        user
      })

    } catch (error) {
      logger.error('Get user error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  // Refresh access token
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        })
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET)

      if (decoded.type !== 'refresh') {
        return res.status(400).json({
          success: false,
          message: 'Invalid token type'
        })
      }

      const user = await User.findById(decoded.userId)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      // Generate new access token
      const accessToken = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          type: 'access'
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '24h' }
      )

      res.json({
        success: true,
        token: accessToken
      })

    } catch (error) {
      logger.error('Refresh token error:', error)
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      })
    }
  }

  // Logout user
  async logout(req, res) {
    try {
      // In a production environment, you might want to:
      // 1. Add token to blacklist
      // 2. Clear refresh tokens from database
      // 3. Log the logout event

      logger.info(`User logged out: ${req.userId}`)

      res.json({
        success: true,
        message: 'Logged out successfully'
      })

    } catch (error) {
      logger.error('Logout error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  // Verify OTP endpoint (separate from login)
  async verifyOTP(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        })
      }

      const { mobile, otp } = req.body

      const isValid = await verifyOTP(mobile, otp)

      if (isValid) {
        res.json({
          success: true,
          message: 'OTP verified successfully'
        })
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        })
      }

    } catch (error) {
      logger.error('Verify OTP error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }
}

module.exports = new AuthController()

