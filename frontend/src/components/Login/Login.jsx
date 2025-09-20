import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

const Login = () => {
  const navigate = useNavigate()
  const { login, sendOTP, isAuthenticated } = useAuth()
  const { t, currentLanguage, changeLanguage } = useLanguage()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    mobile: '',
    otp: ''
  })

  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpExpiry, setOtpExpiry] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [generatedOTP, setGeneratedOTP] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  // Validate form fields
  const validateForm = () => {
    const newErrors = {}

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email) {
      newErrors.email = t('emailRequired')
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = t('emailRequired')
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = t('passwordRequired')
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    // Mobile validation
    const mobileRegex = /^\d{10}$/
    if (!formData.mobile) {
      newErrors.mobile = t('mobileRequired')
    } else if (!mobileRegex.test(formData.mobile)) {
      newErrors.mobile = t('mobileRequired')
    }

    // OTP validation
    const otpRegex = /^\d{6}$/
    if (!formData.otp) {
      newErrors.otp = t('otpRequired')
    } else if (!otpRegex.test(formData.otp)) {
      newErrors.otp = 'OTP must be 6 digits'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle OTP generation
  const handleGenerateOTP = async () => {
    // Validate mobile number first
    const mobileRegex = /^\d{10}$/
    if (!mobileRegex.test(formData.mobile)) {
      setErrors(prev => ({
        ...prev,
        mobile: t('mobileRequired')
      }))
      return
    }

    setErrors(prev => ({
      ...prev,
      mobile: ''
    }))

    setIsLoading(true)

    try {
      const result = await sendOTP(formData.mobile)

      if (result.success) {
        setOtpSent(true)
        setOtpExpiry(Date.now() + 5 * 60 * 1000) // 5 minutes
        setSuccess(t('otpSentSuccess'))

        // In development, show the OTP
        if (result.otp) {
          setGeneratedOTP(result.otp)
          console.log('Development OTP:', result.otp)
        }

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess('')
        }, 3000)

      } else {
        setErrors(prev => ({
          ...prev,
          mobile: result.error || 'Failed to send OTP'
        }))
      }
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        mobile: 'Network error. Please try again.'
      }))
    } finally {
      setIsLoading(false)
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Check OTP expiry
    if (otpExpiry && Date.now() > otpExpiry) {
      setErrors(prev => ({
        ...prev,
        otp: 'OTP has expired. Please request a new one.'
      }))
      setOtpSent(false)
      return
    }

    setIsLoading(true)

    try {
      const result = await login(formData)

      if (result.success) {
        setSuccess(t('loginSuccess'))
        // Navigation will be handled by useEffect when isAuthenticated changes
      } else {
        setErrors(prev => ({
          ...prev,
          general: result.error || t('loginFailed')
        }))
      }
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        general: t('networkError')
      }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      {/* Language Toggle */}
      <div className="language-toggle">
        <button 
          className={`lang-btn ${currentLanguage === 'english' ? 'active' : ''}`}
          onClick={() => changeLanguage('english')}
        >
          English
        </button>
        <button 
          className={`lang-btn ${currentLanguage === 'hindi' ? 'active' : ''}`}
          onClick={() => changeLanguage('hindi')}
        >
          हिंदी
        </button>
      </div>

      {/* Logo */}
      <div className="logo">
        <div className="logo-symbol">T</div>
        <span>{t('appName')}</span>
      </div>

      {/* Main Container */}
      <div className="container">
        {/* Left Section */}
        <div className="left-section">
          <div className="main-icon">
            <svg viewBox="0 0 24 24">
              <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
            </svg>
          </div>
          <h1 className="main-title">
            <span className="hindi-text">{t('title')}</span><br/>
            {t('titleLine2')}
          </h1>
          <p className="tagline">{t('tagline')}</p>
          <p className="description">{t('description')}</p>
        </div>

        {/* Right Section */}
        <div className="right-section">
          <h2 className="login-header">{t('login')}</h2>

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="input-group">
              <label className="input-label">{t('email')}</label>
              <input
                type="email"
                name="email"
                className="input-field"
                placeholder={t('emailPlaceholder')}
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              {errors.email && (
                <div className="error-message show">{errors.email}</div>
              )}
            </div>

            {/* Password Field */}
            <div className="input-group">
              <label className="input-label">{t('password')}</label>
              <input
                type="password"
                name="password"
                className="input-field"
                placeholder={t('passwordPlaceholder')}
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              {errors.password && (
                <div className="error-message show">{errors.password}</div>
              )}
            </div>

            {/* Mobile and OTP Row */}
            <div className="input-group">
              <div className="mobile-otp-row">
                <div className="mobile-group">
                  <label className="input-label">{t('mobile')}</label>
                  <input
                    type="tel"
                    name="mobile"
                    className="input-field"
                    placeholder={t('mobilePlaceholder')}
                    value={formData.mobile}
                    onChange={handleInputChange}
                    maxLength="10"
                    required
                  />
                  {errors.mobile && (
                    <div className="error-message show">{errors.mobile}</div>
                  )}
                </div>
                <button
                  type="button"
                  className={`otp-button ${otpSent ? 'disabled' : ''}`}
                  onClick={handleGenerateOTP}
                  disabled={otpSent || isLoading}
                >
                  {otpSent ? t('otpSent') : t('sendOtp')}
                </button>
              </div>
            </div>

            {/* OTP Field */}
            <div className="input-group">
              <label className="input-label">{t('otp')}</label>
              <input
                type="text"
                name="otp"
                className="input-field"
                placeholder={t('otpPlaceholder')}
                value={formData.otp}
                onChange={handleInputChange}
                maxLength="6"
                required
              />
              {errors.otp && (
                <div className="error-message show">{errors.otp}</div>
              )}
              {success && (
                <div className="success-message show">{success}</div>
              )}
              {generatedOTP && (
                <div className="dev-otp show">Dev OTP: {generatedOTP}</div>
              )}
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="error-message show general-error">{errors.general}</div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={`login-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? t('loading') : t('loginButton')}
            </button>
          </form>
        </div>
      </div>

      {/* Version Info */}
      <div className="version-info">v2.1.4 | Build #847291</div>
    </div>
  )
}

export default Login

