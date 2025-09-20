import React, { useState, useRef } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { imageAPI } from '../../services/api'
import './ImageUpload.css'

const ImageUpload = ({ onImagesUploaded }) => {
  const { t } = useLanguage()
  const fileInputRef = useRef(null)

  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [error, setError] = useState('')

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }

  // Handle file selection
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    handleFiles(selectedFiles)
  }

  // Process selected files
  const handleFiles = (newFiles) => {
    const validFiles = newFiles.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      const maxSize = 5 * 1024 * 1024 // 5MB

      if (!validTypes.includes(file.type)) {
        setError('Only JPEG, PNG, and WebP images are allowed')
        return false
      }

      if (file.size > maxSize) {
        setError('File size must be less than 5MB')
        return false
      }

      return true
    })

    if (validFiles.length === 0) return

    // Limit total files
    const totalFiles = files.length + validFiles.length
    if (totalFiles > 10) {
      setError('Maximum 10 images allowed')
      return
    }

    setError('')
    setFiles(prev => [...prev, ...validFiles])

    // Generate previews
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviews(prev => [...prev, {
          id: Date.now() + Math.random(),
          file: file,
          url: e.target.result,
          name: file.name,
          size: file.size
        }])
      }
      reader.readAsDataURL(file)
    })
  }

  // Remove file from selection
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  // Clear all files
  const clearAll = () => {
    setFiles([])
    setPreviews([])
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Upload files to server
  const uploadImages = async () => {
    if (files.length === 0) {
      setError('Please select images to upload')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('images', file)
      })

      const result = await imageAPI.upload(formData)

      if (result && result.images) {
        onImagesUploaded(result.images)
        clearAll()
        setError('')
      } else {
        setError('Upload failed. Please try again.')
      }

    } catch (error) {
      console.error('Upload error:', error)
      setError('Upload failed. Please check your connection.')
    } finally {
      setIsUploading(false)
    }
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="image-upload">
      <div className="upload-header">
        <h2>{t('uploadImages')}</h2>
        <p>Drag and drop images or click to select (Max 10 images, 5MB each)</p>
      </div>

      {/* Upload Area */}
      <div 
        className={`upload-dropzone ${dragActive ? 'active' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={isUploading}
        />

        <div className="dropzone-content">
          {isUploading ? (
            <>
              <div className="upload-spinner"></div>
              <p>Uploading images...</p>
            </>
          ) : (
            <>
              <svg className="upload-icon" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
              <p>
                <strong>Drop images here</strong> or <span className="browse-text">browse</span>
              </p>
              <p className="upload-info">Supports JPEG, PNG, WebP • Max 5MB each</p>
            </>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="upload-error">
          {error}
        </div>
      )}

      {/* File Previews */}
      {previews.length > 0 && (
        <div className="image-previews">
          <div className="previews-header">
            <h3>Selected Images ({previews.length})</h3>
            <button 
              className="clear-all-btn" 
              onClick={clearAll}
              disabled={isUploading}
            >
              Clear All
            </button>
          </div>

          <div className="previews-grid">
            {previews.map((preview, index) => (
              <div key={preview.id} className="preview-item">
                <div className="preview-image-container">
                  <img src={preview.url} alt={preview.name} className="preview-image" />
                  <button
                    className="remove-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(index)
                    }}
                    disabled={isUploading}
                  >
                    ×
                  </button>
                </div>
                <div className="preview-info">
                  <p className="preview-name">{preview.name}</p>
                  <p className="preview-size">{formatFileSize(preview.size)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="upload-actions">
            <button
              className="upload-btn"
              onClick={uploadImages}
              disabled={isUploading || files.length === 0}
            >
              {isUploading ? 'Uploading...' : `Upload ${files.length} Image${files.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageUpload

