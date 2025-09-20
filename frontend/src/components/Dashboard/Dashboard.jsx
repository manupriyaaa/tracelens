import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import ImageUpload from '../ImageUpload/ImageUpload'
import FaceDetection from '../FaceDetection/FaceDetection'
import { imageAPI } from '../../services/api'
import './Dashboard.css'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const { t, currentLanguage, changeLanguage } = useLanguage()

  const [activeTab, setActiveTab] = useState('upload')
  const [images, setImages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Load user's images on component mount
  useEffect(() => {
    loadImages()
  }, [])

  const loadImages = async () => {
    try {
      setIsLoading(true)
      const result = await imageAPI.getImages()
      setImages(result.images || [])
    } catch (error) {
      console.error('Failed to load images:', error)
      setError('Failed to load images')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = (newImages) => {
    setImages(prev => [...newImages, ...prev])
    setActiveTab('detection')
  }

  const handleImageDelete = async (imageId) => {
    try {
      await imageAPI.deleteImage(imageId)
      setImages(prev => prev.filter(img => img._id !== imageId))
    } catch (error) {
      console.error('Failed to delete image:', error)
      setError('Failed to delete image')
    }
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <div className="logo-symbol">T</div>
            <span>{t('appName')}</span>
          </div>
        </div>

        <div className="header-center">
          <h1>{t('dashboard')}</h1>
        </div>

        <div className="header-right">
          {/* Language Toggle */}
          <div className="language-toggle">
            <button 
              className={`lang-btn ${currentLanguage === 'english' ? 'active' : ''}`}
              onClick={() => changeLanguage('english')}
            >
              EN
            </button>
            <button 
              className={`lang-btn ${currentLanguage === 'hindi' ? 'active' : ''}`}
              onClick={() => changeLanguage('hindi')}
            >
              हि
            </button>
          </div>

          {/* User Info */}
          <div className="user-info">
            <span>Welcome, {user?.email}</span>
            <button className="logout-btn" onClick={logout}>
              {t('logout')}
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="dashboard-nav">
        <button
          className={`nav-tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <svg viewBox="0 0 24 24" className="tab-icon">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
          {t('uploadImages')}
        </button>

        <button
          className={`nav-tab ${activeTab === 'detection' ? 'active' : ''}`}
          onClick={() => setActiveTab('detection')}
        >
          <svg viewBox="0 0 24 24" className="tab-icon">
            <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
          </svg>
          {t('faceDetection')}
        </button>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError('')} className="error-close">×</button>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="tab-content">
            <ImageUpload onImagesUploaded={handleImageUpload} />
          </div>
        )}

        {activeTab === 'detection' && (
          <div className="tab-content">
            <FaceDetection 
              images={images} 
              onImageDelete={handleImageDelete}
              onRefresh={loadImages}
              isLoading={isLoading}
            />
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard

