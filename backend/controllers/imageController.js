const path = require('path')
const fs = require('fs')
const { validationResult } = require('express-validator')
const Image = require('../models/Image')
const { detectFaces } = require('../services/visionService')
const logger = require('../utils/logger')

class ImageController {
  // Upload images
  async uploadImages(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No images uploaded'
        })
      }

      const uploadedImages = []
      const userId = req.userId

      // Process each uploaded file
      for (const file of req.files) {
        try {
          // Create image record in database
          const image = new Image({
            userId,
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype,
            uploadedAt: new Date()
          })

          await image.save()
          uploadedImages.push(image)

          logger.info(`Image uploaded: ${file.originalname} by user ${userId}`)

        } catch (error) {
          logger.error(`Failed to save image ${file.originalname}:`, error)
          // Clean up file if database save fails
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path)
          }
        }
      }

      if (uploadedImages.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Failed to process uploaded images'
        })
      }

      res.status(201).json({
        success: true,
        message: `${uploadedImages.length} image(s) uploaded successfully`,
        images: uploadedImages
      })

    } catch (error) {
      logger.error('Upload images error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  // Detect faces in uploaded images
  async detectFaces(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        })
      }

      const { imageIds } = req.body
      const userId = req.userId

      if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No image IDs provided'
        })
      }

      const results = []

      // Process each image
      for (const imageId of imageIds) {
        try {
          // Find image belonging to user
          const image = await Image.findOne({ 
            _id: imageId, 
            userId: userId 
          })

          if (!image) {
            results.push({
              imageId,
              error: 'Image not found or access denied'
            })
            continue
          }

          // Check if file exists
          if (!fs.existsSync(image.path)) {
            results.push({
              imageId,
              error: 'Image file not found on disk'
            })
            continue
          }

          // Run face detection
          const startTime = Date.now()
          const faceDetectionResults = await detectFaces(image.path)
          const processingTime = Date.now() - startTime

          // Update image with results
          image.faceDetectionResults = {
            ...faceDetectionResults,
            processingTime
          }
          image.processed = true
          image.processedAt = new Date()
          await image.save()

          results.push({
            imageId: image._id,
            filename: image.filename,
            originalName: image.originalName,
            results: image.faceDetectionResults
          })

          logger.info(`Face detection completed for image ${imageId}: ${faceDetectionResults.faceCount} faces found`)

        } catch (detectionError) {
          logger.error(`Face detection failed for image ${imageId}:`, detectionError)

          results.push({
            imageId,
            error: 'Face detection processing failed'
          })
        }
      }

      res.json({
        success: true,
        message: 'Face detection completed',
        results,
        processed: results.filter(r => !r.error).length,
        failed: results.filter(r => r.error).length
      })

    } catch (error) {
      logger.error('Detect faces error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  // Get user's images
  async getUserImages(req, res) {
    try {
      const userId = req.userId
      const { page = 1, limit = 20, processed, sortBy = 'uploadedAt', sortOrder = 'desc' } = req.query

      // Build query
      const query = { userId }
      if (processed !== undefined) {
        query.processed = processed === 'true'
      }

      // Build sort object
      const sort = {}
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit)

      // Execute query
      const [images, total] = await Promise.all([
        Image.find(query)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .select('-path'), // Don't expose file paths
        Image.countDocuments(query)
      ])

      res.json({
        success: true,
        images,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      })

    } catch (error) {
      logger.error('Get user images error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  // Get single image details
  async getImageDetails(req, res) {
    try {
      const { imageId } = req.params
      const userId = req.userId

      const image = await Image.findOne({ 
        _id: imageId, 
        userId: userId 
      }).select('-path')

      if (!image) {
        return res.status(404).json({
          success: false,
          message: 'Image not found'
        })
      }

      res.json({
        success: true,
        image
      })

    } catch (error) {
      logger.error('Get image details error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  // Delete image
  async deleteImage(req, res) {
    try {
      const { imageId } = req.params
      const userId = req.userId

      const image = await Image.findOneAndDelete({ 
        _id: imageId, 
        userId: userId 
      })

      if (!image) {
        return res.status(404).json({
          success: false,
          message: 'Image not found'
        })
      }

      // Delete file from disk
      if (fs.existsSync(image.path)) {
        try {
          fs.unlinkSync(image.path)
          logger.info(`Image file deleted: ${image.path}`)
        } catch (fileError) {
          logger.warn(`Failed to delete image file ${image.path}:`, fileError)
        }
      }

      logger.info(`Image deleted: ${imageId} by user ${userId}`)

      res.json({
        success: true,
        message: 'Image deleted successfully'
      })

    } catch (error) {
      logger.error('Delete image error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  // Bulk delete images
  async bulkDeleteImages(req, res) {
    try {
      const { imageIds } = req.body
      const userId = req.userId

      if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No image IDs provided'
        })
      }

      // Find images belonging to user
      const images = await Image.find({ 
        _id: { $in: imageIds }, 
        userId: userId 
      })

      if (images.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No images found'
        })
      }

      // Delete files from disk
      let filesDeleted = 0
      for (const image of images) {
        if (fs.existsSync(image.path)) {
          try {
            fs.unlinkSync(image.path)
            filesDeleted++
          } catch (fileError) {
            logger.warn(`Failed to delete image file ${image.path}:`, fileError)
          }
        }
      }

      // Delete from database
      const result = await Image.deleteMany({ 
        _id: { $in: images.map(img => img._id) }
      })

      logger.info(`Bulk delete: ${result.deletedCount} images deleted by user ${userId}`)

      res.json({
        success: true,
        message: `${result.deletedCount} images deleted successfully`,
        deleted: result.deletedCount,
        filesDeleted
      })

    } catch (error) {
      logger.error('Bulk delete images error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  // Get image statistics
  async getImageStats(req, res) {
    try {
      const userId = req.userId

      const [stats] = await Image.aggregate([
        { $match: { userId: userId } },
        {
          $group: {
            _id: null,
            totalImages: { $sum: 1 },
            processedImages: { 
              $sum: { $cond: [{ $eq: ['$processed', true] }, 1, 0] } 
            },
            totalSize: { $sum: '$size' },
            totalFaces: {
              $sum: { $ifNull: ['$faceDetectionResults.faceCount', 0] }
            },
            avgConfidence: {
              $avg: '$faceDetectionResults.faces.confidence'
            }
          }
        }
      ])

      const imageStats = stats || {
        totalImages: 0,
        processedImages: 0,
        totalSize: 0,
        totalFaces: 0,
        avgConfidence: 0
      }

      res.json({
        success: true,
        stats: imageStats
      })

    } catch (error) {
      logger.error('Get image stats error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }
}

module.exports = new ImageController()

