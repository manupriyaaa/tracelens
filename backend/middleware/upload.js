const multer = require('multer')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const logger = require('../utils/logger')

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    './uploads',
    './uploads/images',
    './uploads/temp',
    './uploads/processed'
  ]

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      logger.info(`Created upload directory: ${dir}`)
    }
  })
}

// Initialize upload directories
createUploadDirs()

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads/images'
    cb(null, uploadDir)
  },

  filename: (req, file, cb) => {
    // Generate unique filename
    const timestamp = Date.now()
    const randomBytes = crypto.randomBytes(6).toString('hex')
    const ext = path.extname(file.originalname).toLowerCase()
    const baseName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 20)

    const filename = `${timestamp}-${randomBytes}-${baseName}${ext}`
    cb(null, filename)
  }
})

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/jpg,image/png,image/webp').split(',')
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp']

  const ext = path.extname(file.originalname).toLowerCase()
  const mimeType = file.mimetype.toLowerCase()

  // Check MIME type
  if (!allowedTypes.includes(mimeType)) {
    return cb(new Error(`Invalid file type: ${mimeType}. Allowed types: ${allowedTypes.join(', ')}`), false)
  }

  // Check file extension
  if (!allowedExts.includes(ext)) {
    return cb(new Error(`Invalid file extension: ${ext}. Allowed extensions: ${allowedExts.join(', ')}`), false)
  }

  cb(null, true)
}

// Multer configuration
const uploadConfig = {
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB default
    files: parseInt(process.env.MAX_FILES_PER_UPLOAD) || 10    // 10 files default
  }
}

// Create multer instance
const upload = multer(uploadConfig)

// Middleware functions
const uploadMiddleware = {
  // Single image upload
  single: (fieldName = 'image') => {
    return (req, res, next) => {
      const singleUpload = upload.single(fieldName)

      singleUpload(req, res, (error) => {
        if (error instanceof multer.MulterError) {
          logger.error('Multer error:', error)

          if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: `File too large. Maximum size: ${uploadConfig.limits.fileSize} bytes`
            })
          }

          if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
              success: false,
              message: 'Unexpected field name for file upload'
            })
          }

          return res.status(400).json({
            success: false,
            message: error.message
          })
        }

        if (error) {
          logger.error('Upload error:', error)
          return res.status(400).json({
            success: false,
            message: error.message
          })
        }

        next()
      })
    }
  },

  // Multiple images upload
  array: (fieldName = 'images', maxCount) => {
    const maxFiles = maxCount || uploadConfig.limits.files

    return (req, res, next) => {
      const arrayUpload = upload.array(fieldName, maxFiles)

      arrayUpload(req, res, (error) => {
        if (error instanceof multer.MulterError) {
          logger.error('Multer error:', error)

          if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: `File too large. Maximum size: ${(uploadConfig.limits.fileSize / (1024 * 1024)).toFixed(1)}MB`
            })
          }

          if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              success: false,
              message: `Too many files. Maximum: ${maxFiles} files`
            })
          }

          if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
              success: false,
              message: 'Unexpected field name for file upload'
            })
          }

          return res.status(400).json({
            success: false,
            message: error.message
          })
        }

        if (error) {
          logger.error('Upload error:', error)
          return res.status(400).json({
            success: false,
            message: error.message
          })
        }

        // Log successful upload
        if (req.files && req.files.length > 0) {
          logger.info(`${req.files.length} file(s) uploaded successfully`, {
            userId: req.userId,
            files: req.files.map(f => ({ 
              originalName: f.originalname, 
              filename: f.filename, 
              size: f.size 
            }))
          })
        }

        next()
      })
    }
  },

  // Multiple fields upload
  fields: (fields) => {
    return (req, res, next) => {
      const fieldsUpload = upload.fields(fields)

      fieldsUpload(req, res, (error) => {
        if (error instanceof multer.MulterError) {
          logger.error('Multer error:', error)
          return res.status(400).json({
            success: false,
            message: error.message
          })
        }

        if (error) {
          logger.error('Upload error:', error)
          return res.status(400).json({
            success: false,
            message: error.message
          })
        }

        next()
      })
    }
  }
}

// Utility functions
const uploadUtils = {
  // Clean up uploaded files on error
  cleanup: (files) => {
    if (!files) return

    const filesToClean = Array.isArray(files) ? files : [files]

    filesToClean.forEach(file => {
      if (file && file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path)
          logger.info(`Cleaned up file: ${file.path}`)
        } catch (error) {
          logger.error(`Failed to clean up file ${file.path}:`, error)
        }
      }
    })
  },

  // Get file info
  getFileInfo: (file) => {
    return {
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date()
    }
  },

  // Validate file after upload
  validateFile: (file) => {
    const errors = []

    // Check if file exists
    if (!fs.existsSync(file.path)) {
      errors.push('File not found after upload')
    }

    // Check file size matches
    const stats = fs.statSync(file.path)
    if (stats.size !== file.size) {
      errors.push('File size mismatch')
    }

    return errors
  },

  // Move file to different directory
  moveFile: async (fromPath, toPath) => {
    return new Promise((resolve, reject) => {
      // Ensure destination directory exists
      const toDir = path.dirname(toPath)
      if (!fs.existsSync(toDir)) {
        fs.mkdirSync(toDir, { recursive: true })
      }

      // Move file
      fs.rename(fromPath, toPath, (error) => {
        if (error) {
          reject(error)
        } else {
          resolve(toPath)
        }
      })
    })
  }
}

// Error handling middleware for upload errors
const handleUploadError = (error, req, res, next) => {
  // Clean up any uploaded files if there was an error
  if (req.files) {
    uploadUtils.cleanup(req.files)
  } else if (req.file) {
    uploadUtils.cleanup([req.file])
  }

  logger.error('Upload error handler:', error)

  res.status(400).json({
    success: false,
    message: 'File upload failed',
    error: error.message
  })
}

module.exports = {
  uploadMiddleware,
  uploadUtils,
  handleUploadError,
  upload: upload // Direct access to multer instance if needed
}

