const { body, param, query, validationResult } = require('express-validator')

// Common validation rules
const validationRules = {
  // Authentication
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  password: body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  mobile: body('mobile')
    .matches(/^\d{10}$/)
    .withMessage('Mobile number must be exactly 10 digits'),

  otp: body('otp')
    .matches(/^\d{6}$/)
    .withMessage('OTP must be exactly 6 digits'),

  // Image validation
  imageIds: body('imageIds')
    .isArray({ min: 1, max: 10 })
    .withMessage('imageIds must be an array with 1-10 items')
    .custom((value) => {
      if (!value.every(id => typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/))) {
        throw new Error('All imageIds must be valid MongoDB ObjectIds')
      }
      return true
    }),

  imageId: param('imageId')
    .isMongoId()
    .withMessage('Invalid image ID format'),

  // Pagination
  page: query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be a number between 1 and 1000'),

  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be a number between 1 and 100'),

  // Sorting
  sortBy: query('sortBy')
    .optional()
    .isIn(['uploadedAt', 'processedAt', 'size', 'originalName'])
    .withMessage('Invalid sortBy field'),

  sortOrder: query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  // Boolean fields
  processed: query('processed')
    .optional()
    .isBoolean()
    .withMessage('Processed must be true or false')
}

// Validation rule sets for different endpoints
const validationSets = {
  // Auth validations
  sendOTP: [
    validationRules.mobile
  ],

  login: [
    validationRules.email,
    validationRules.password,
    validationRules.mobile,
    validationRules.otp
  ],

  verifyOTP: [
    validationRules.mobile,
    validationRules.otp
  ],

  refreshToken: [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required')
  ],

  // Image validations
  detectFaces: [
    validationRules.imageIds
  ],

  imageDetails: [
    validationRules.imageId
  ],

  deleteImage: [
    validationRules.imageId
  ],

  bulkDeleteImages: [
    body('imageIds')
      .isArray({ min: 1, max: 50 })
      .withMessage('imageIds must be an array with 1-50 items')
      .custom((value) => {
        if (!value.every(id => typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/))) {
          throw new Error('All imageIds must be valid MongoDB ObjectIds')
        }
        return true
      })
  ],

  getUserImages: [
    validationRules.page,
    validationRules.limit,
    validationRules.processed,
    validationRules.sortBy,
    validationRules.sortOrder
  ]
}

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }))

    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: formattedErrors
    })
  }

  next()
}

// Helper function to create validation middleware
const createValidation = (ruleName) => {
  if (!validationSets[ruleName]) {
    throw new Error(`Validation set '${ruleName}' not found`)
  }

  return [
    ...validationSets[ruleName],
    handleValidationErrors
  ]
}

// Custom validation functions
const customValidations = {
  // File upload validation
  validateFileUpload: (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      })
    }

    const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB
    const maxFiles = parseInt(process.env.MAX_FILES_PER_UPLOAD) || 10
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/jpg,image/png,image/webp').split(',')

    // Check file count
    if (req.files.length > maxFiles) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxFiles} files allowed`
      })
    }

    // Validate each file
    for (const file of req.files) {
      // Check file size
      if (file.size > maxFileSize) {
        return res.status(400).json({
          success: false,
          message: `File ${file.originalname} exceeds maximum size of ${maxFileSize} bytes`
        })
      }

      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `File ${file.originalname} has invalid type. Allowed types: ${allowedTypes.join(', ')}`
        })
      }
    }

    next()
  },

  // Sanitize input data
  sanitizeInput: (req, res, next) => {
    // Remove any potential XSS attempts from string fields
    const sanitizeString = (str) => {
      if (typeof str !== 'string') return str
      return str.replace(/<script[^>]*>.*?<\/script>/gi, '')
                .replace(/<[^>]+>/g, '')
                .trim()
    }

    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = sanitizeString(obj[key])
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key])
        }
      }
    }

    if (req.body) {
      sanitizeObject(req.body)
    }

    if (req.query) {
      sanitizeObject(req.query)
    }

    next()
  }
}

module.exports = {
  validationRules,
  validationSets,
  handleValidationErrors,
  createValidation,
  customValidations
}

