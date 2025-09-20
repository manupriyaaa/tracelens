import React, { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { imageAPI } from '../../services/api'
import './FaceDetection.css'

const FaceDetection = ({ images, onImageDelete, onRefresh, isLoading }) => {
  const { t } = useLanguage()
  const [processingImages, setProcessingImages] = useState(new Set())
  const [processedResults, setProcessedResults] = useState({})
  const [selectedImage, setSelectedImage] = useState(null)
  const [error, setError] = useState('')
  const canvasRefs = useRef({})

  useEffect(() => {
    // Auto-process uploaded images that haven't been processed yet
    const unprocessedImages = images.filter(img => !img.processed && !processingImages.has(img._id))
    if (unprocessedImages.length > 0) {
      handleFaceDetection(unprocessedImages.map(img => img._id))
    }
  }, [images])

  const handleFaceDetection = async (imageIds) => {
    if (!imageIds || imageIds.length === 0) return

    // Mark images as processing
    setProcessingImages(prev => new Set([...prev, ...imageIds]))
    setError('')

    try {
      const result = await imageAPI.detectFaces(imageIds)

      if (result && result.results) {
        const newResults = {}
        result.results.forEach(item => {
          if (item.results && !item.error) {
            newResults[item.imageId] = item.results
          }
        })

        setProcessedResults(prev => ({ ...prev, ...newResults }))

        // Refresh images list to get updated processed status
        if (onRefresh) {
          onRefresh()
        }
      }

    } catch (error) {
      console.error('Face detection error:', error)
      setError('Face detection failed. Please try again.')
    } finally {
      // Remove images from processing set
      setProcessingImages(prev => {
        const newSet = new Set(prev)
        imageIds.forEach(id => newSet.delete(id))
        return newSet
      })
    }
  }

  const drawBoundingBoxes = (image, faces) => {
    const canvas = canvasRefs.current[image._id]
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width
      canvas.height = img.height

      // Draw image
      ctx.drawImage(img, 0, 0)

      // Draw bounding boxes
      faces.forEach((face, index) => {
        const { boundingBox, confidence } = face

        // Set up drawing style
        ctx.strokeStyle = '#eb8d13'
        ctx.lineWidth = 3
        ctx.fillStyle = 'rgba(235, 141, 19, 0.1)'
        ctx.font = '14px Arial'

        // Draw bounding box
        ctx.fillRect(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height)
        ctx.strokeRect(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height)

        // Draw confidence label
        const label = `${(confidence * 100).toFixed(1)}%`
        const textWidth = ctx.measureText(label).width
        const labelX = boundingBox.x
        const labelY = boundingBox.y - 5

        // Label background
        ctx.fillStyle = 'rgba(235, 141, 19, 0.9)'
        ctx.fillRect(labelX, labelY - 18, textWidth + 8, 20)

        // Label text
        ctx.fillStyle = 'white'
        ctx.fillText(label, labelX + 4, labelY - 4)
      })
    }

    img.src = `${import.meta.env.VITE_API_URL}/uploads/${image.filename}`
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  if (isLoading) {
    return (
      <div className="face-detection-loading">
        <div className="loading-spinner"></div>
        <p>{t('loading')}</p>
      </div>
    )
  }

  return (
    <div className="face-detection">
      <div className="detection-header">
        <h2>{t('faceDetection')}</h2>
        {images.length > 0 && (
          <p>{images.length} image{images.length !== 1 ? 's' : ''} • {images.filter(img => img.processed).length} processed</p>
        )}
      </div>

      {error && (
        <div className="detection-error">
          {error}
          <button onClick={() => setError('')} className="error-close">×</button>
        </div>
      )}

      {images.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-icon" viewBox="0 0 24 24">
            <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
          </svg>
          <h3>No images uploaded</h3>
          <p>Upload some images to start face detection</p>
        </div>
      ) : (
        <div className="images-grid">
          {images.map(image => {
            const isProcessing = processingImages.has(image._id)
            const results = processedResults[image._id] || image.faceDetectionResults
            const faces = results?.faces || []

            return (
              <div key={image._id} className="image-card">
                <div className="image-container">
                  <img
                    src={`${import.meta.env.VITE_API_URL}/uploads/${image.filename}`}
                    alt={image.originalName}
                    className="detection-image"
                    onLoad={() => {
                      if (faces.length > 0) {
                        drawBoundingBoxes(image, faces)
                      }
                    }}
                  />

                  {/* Canvas for bounding boxes */}
                  <canvas
                    ref={el => canvasRefs.current[image._id] = el}
                    className="detection-canvas"
                    style={{ 
                      display: faces.length > 0 ? 'block' : 'none',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
                    }}
                  />

                  {/* Processing overlay */}
                  {isProcessing && (
                    <div className="processing-overlay">
                      <div className="processing-spinner"></div>
                      <p>Processing...</p>
                    </div>
                  )}

                  {/* Delete button */}
                  <button
                    className="delete-btn"
                    onClick={() => onImageDelete(image._id)}
                    title="Delete image"
                  >
                    ×
                  </button>
                </div>

                <div className="image-info">
                  <h4 className="image-name">{image.originalName}</h4>
                  <div className="image-meta">
                    <span>{formatFileSize(image.size)}</span>
                    <span>{formatDate(image.uploadedAt)}</span>
                  </div>

                  <div className="detection-results">
                    {isProcessing ? (
                      <div className="processing-status">
                        <span className="status-dot processing"></span>
                        Processing...
                      </div>
                    ) : faces.length > 0 ? (
                      <div className="faces-detected">
                        <span className="status-dot success"></span>
                        {faces.length} face{faces.length !== 1 ? 's' : ''} detected
                        <div className="confidence-scores">
                          {faces.map((face, index) => (
                            <span key={index} className="confidence-badge">
                              {(face.confidence * 100).toFixed(1)}%
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="no-faces">
                        <span className="status-dot empty"></span>
                        {t('noFacesDetected')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default FaceDetection

