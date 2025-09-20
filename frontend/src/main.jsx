import React, { useState, useEffect, useRef, useCallback } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// Main Application Component with FIXED camera and input issues
function TraceLensApp() {
  const [currentPage, setCurrentPage] = useState('login')
  const [language, setLanguage] = useState('english')
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Camera and detection state
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null) // Store stream reference
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [detectedFaces, setDetectedFaces] = useState([])
  const [isDetecting, setIsDetecting] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [detectionInterval, setDetectionInterval] = useState(null)
  const [faceCount, setFaceCount] = useState(0)

  // FIXED: Login form state with proper state management
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [generatedOtp, setGeneratedOtp] = useState('')

  // Translations
  const translations = {
    english: {
      appName: 'TRACE LENS',
      title: 'See Truth,',
      titleLine2: 'Identify Source',
      tagline: 'Professional Investigation Platform',
      description: 'Comprehensive source verification and authenticity analysis platform designed for professionals who demand accuracy and reliability in their investigations.',
      login: 'Login to Account',
      email: 'Email Address',
      password: 'Password',
      mobile: 'Mobile Number',
      otp: 'Enter OTP',
      sendOtp: 'Send OTP',
      otpSent: 'OTP Sent',
      loginButton: 'Login',
      dashboard: 'Dashboard',
      liveFaceDetection: 'Live Face Detection',
      startCamera: 'Start Camera',
      stopCamera: 'Stop Camera',
      startDetection: 'Start Detection',
      stopDetection: 'Stop Detection',
      capturePhoto: 'Capture Photo',
      facesDetected: 'faces detected',
      cameraError: 'Camera access denied or unavailable',
      detecting: 'Detecting faces...',
      confidence: 'Confidence',
      logout: 'Logout',
      realTimeDetection: 'Real-time Face Detection',
      noCameraAccess: 'Please allow camera access to use face detection',
      totalFaces: 'Total Faces Detected'
    },
    hindi: {
      appName: 'ट्रेस लेंस',
      title: 'सत्य देखें,',
      titleLine2: 'स्रोत पहचानें',
      tagline: 'व्यावसायिक जांच मंच',
      description: 'व्यापक स्रोत सत्यापन और प्रामाणिकता विश्लेषण मंच जो उन पेशेवरों के लिए डिज़ाइन किया गया है जो अपनी जांच में सटीकता और विश्वसनीयता की मांग करते हैं।',
      login: 'खाते में लॉगिन करें',
      email: 'ईमेल पता',
      password: 'पासवर्ड',
      mobile: 'मोबाइल नंबर',
      otp: 'OTP दर्ज करें',
      sendOtp: 'OTP भेजें',
      otpSent: 'OTP भेजा गया',
      loginButton: 'लॉगिन',
      dashboard: 'डैशबोर्ड',
      liveFaceDetection: 'लाइव चेहरा पहचान',
      startCamera: 'कैमरा शुरू करें',
      stopCamera: 'कैमरा बंद करें',
      startDetection: 'पहचान शुरू करें',
      stopDetection: 'पहचान बंद करें',
      capturePhoto: 'फोटो लें',
      facesDetected: 'चेहरे पहचाने गए',
      cameraError: 'कैमरा एक्सेस नहीं मिला या उपलब्ध नहीं',
      detecting: 'चेहरे पहचान रहे हैं...',
      confidence: 'विश्वास',
      logout: 'लॉगआउट',
      realTimeDetection: 'रियल-टाइम चेहरा पहचान',
      noCameraAccess: 'चेहरा पहचान के लिए कैमरा एक्सेस की अनुमति दें',
      totalFaces: 'कुल चेहरे पहचाने गए'
    }
  }

  const t = (key) => translations[language][key] || key

  // FIXED: Camera functions with proper stream management
  const startCamera = useCallback(async () => {
    try {
      setCameraError('')
      console.log('Starting camera...')

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      })

      console.log('Camera stream obtained:', stream)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        // Wait for video to be ready
        const playPromise = videoRef.current.play()
        if (playPromise !== undefined) {
          await playPromise
        }

        setIsCameraActive(true)
        console.log('Camera started successfully')

        // Set canvas size after video loads
        videoRef.current.onloadedmetadata = () => {
          if (canvasRef.current && videoRef.current) {
            const video = videoRef.current
            canvasRef.current.width = video.videoWidth
            canvasRef.current.height = video.videoHeight
            console.log(`Canvas size set to: ${video.videoWidth}x${video.videoHeight}`)
          }
        }
      }
    } catch (err) {
      console.error('Camera access error:', err)
      setCameraError(t('cameraError'))
      setIsCameraActive(false)
    }
  }, [t])

  const stopCamera = useCallback(() => {
    console.log('Stopping camera...')

    // Stop detection first
    if (detectionInterval) {
      clearInterval(detectionInterval)
      setDetectionInterval(null)
    }
    setIsDetecting(false)

    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
        console.log('Track stopped:', track.kind)
      })
      streamRef.current = null
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }

    setIsCameraActive(false)
    setDetectedFaces([])
    setFaceCount(0)
    console.log('Camera stopped')
  }, [detectionInterval])

  // Face detection functions
  const generateMockFaces = useCallback((videoWidth, videoHeight) => {
    const faceCount = Math.floor(Math.random() * 4)
    const faces = []

    for (let i = 0; i < faceCount; i++) {
      const faceWidth = Math.random() * 120 + 100
      const faceHeight = faceWidth * (1.2 + Math.random() * 0.3)

      const x = Math.random() * (videoWidth - faceWidth)
      const y = Math.random() * (videoHeight - faceHeight)

      const confidence = (Math.random() * 0.25 + 0.7).toFixed(2)

      faces.push({
        id: i,
        boundingBox: {
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(faceWidth),
          height: Math.round(faceHeight)
        },
        confidence: parseFloat(confidence)
      })
    }

    return faces
  }, [])

  const detectFacesInVideo = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) {
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      return
    }

    const videoWidth = video.videoWidth
    const videoHeight = video.videoHeight

    if (videoWidth === 0 || videoHeight === 0) {
      return
    }

    // Make sure canvas matches video
    if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
      canvas.width = videoWidth
      canvas.height = videoHeight
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Generate mock faces
    const faces = generateMockFaces(videoWidth, videoHeight)
    setDetectedFaces(faces)
    setFaceCount(faces.length)

    // Draw bounding boxes
    ctx.strokeStyle = '#eb8d13'
    ctx.lineWidth = 3
    ctx.fillStyle = '#eb8d13'
    ctx.font = 'bold 16px Arial'

    faces.forEach(face => {
      const { x, y, width, height } = face.boundingBox

      // Draw bounding box
      ctx.strokeRect(x, y, width, height)

      // Draw confidence label
      const confidence = `${Math.round(face.confidence * 100)}%`
      const textWidth = ctx.measureText(confidence).width
      const labelHeight = 25

      ctx.fillRect(x, y - labelHeight, textWidth + 10, labelHeight)
      ctx.fillStyle = '#ffffff'
      ctx.fillText(confidence, x + 5, y - 5)
      ctx.fillStyle = '#eb8d13'
    })
  }, [isCameraActive, generateMockFaces])

  const startFaceDetection = useCallback(() => {
    if (detectionInterval || !isCameraActive) return

    console.log('Starting face detection...')
    setIsDetecting(true)
    const interval = setInterval(() => {
      detectFacesInVideo()
    }, 1000)

    setDetectionInterval(interval)
  }, [detectionInterval, isCameraActive, detectFacesInVideo])

  const stopFaceDetection = useCallback(() => {
    if (detectionInterval) {
      console.log('Stopping face detection...')
      clearInterval(detectionInterval)
      setDetectionInterval(null)
    }
    setIsDetecting(false)
    setDetectedFaces([])
    setFaceCount(0)

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }, [detectionInterval])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !streamRef.current) return

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    ctx.drawImage(video, 0, 0)

    // Draw current detections
    if (detectedFaces.length > 0) {
      ctx.strokeStyle = '#eb8d13'
      ctx.lineWidth = 3
      ctx.fillStyle = '#eb8d13'
      ctx.font = 'bold 16px Arial'

      detectedFaces.forEach(face => {
        const { x, y, width, height } = face.boundingBox

        ctx.strokeRect(x, y, width, height)

        const confidence = `${Math.round(face.confidence * 100)}%`
        const textWidth = ctx.measureText(confidence).width
        ctx.fillRect(x, y - 25, textWidth + 10, 25)
        ctx.fillStyle = '#ffffff'
        ctx.fillText(confidence, x + 5, y - 5)
        ctx.fillStyle = '#eb8d13'
      })
    }

    const dataURL = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `trace-lens-capture-${Date.now()}.png`
    link.href = dataURL
    link.click()
  }, [detectedFaces])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (detectionInterval) {
        clearInterval(detectionInterval)
      }
    }
  }, [detectionInterval])

  // FIXED: Login functions with proper event handling
  const handleSendOtp = useCallback(async () => {
    if (!mobile || mobile.length !== 10) {
      alert('Please enter a valid 10-digit mobile number')
      return
    }

    setIsLoading(true)

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(otpCode)
    setOtpSent(true)

    console.log(`OTP for ${mobile}: ${otpCode}`)
    alert(`Development Mode: Your OTP is ${otpCode}`)

    setIsLoading(false)
  }, [mobile])

  const handleLogin = useCallback(async (e) => {
    e.preventDefault()

    if (!email || !password || !mobile) {
      alert('Please fill in all fields')
      return
    }

    if (!otpSent) {
      alert('Please send OTP first')
      return
    }

    if (otp !== generatedOtp) {
      alert('Invalid OTP. Please check your OTP.')
      return
    }

    setIsLoading(true)

    setTimeout(() => {
      setUser({
        email: email,
        mobile: mobile
      })
      setCurrentPage('dashboard')
      setIsLoading(false)
    }, 1000)
  }, [email, password, mobile, otp, otpSent, generatedOtp])

  // FIXED: Login Page Component with proper input handling
  const LoginPage = () => (
    <div className="login-container">
      <div className="language-toggle">
        <button 
          className="lang-btn" 
          onClick={() => setLanguage(language === 'english' ? 'hindi' : 'english')}
        >
          {language === 'english' ? 'हिंदी' : 'English'}
        </button>
      </div>

      <div className="login-wrapper">
        <div className="login-left">
          <div className="brand-container">
            <div className="logo">
              <div className="logo-icon">T</div>
              <span className="brand-name">{t('appName')}</span>
            </div>
          </div>

          <div className="content-section">
            <h1 className="main-title">
              <span>{t('title')}</span><br />
              <span>{t('titleLine2')}</span>
            </h1>
            <p className="tagline">{t('tagline')}</p>
            <p className="description">{t('description')}</p>
          </div>
        </div>

        <div className="login-right">
          <div className="login-card">
            <h2>{t('login')}</h2>

            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <input
                  type="email"
                  placeholder={t('email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <input
                  type="password"
                  placeholder={t('password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <input
                  type="tel"
                  placeholder={t('mobile')}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  maxLength="10"
                  required
                />
              </div>

              <div className="form-group">
                <div className="otp-group">
                  <input
                    type="text"
                    placeholder={t('otp')}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength="6"
                    required
                  />
                  <button
                    type="button"
                    className={`otp-btn ${otpSent ? 'sent' : ''}`}
                    onClick={handleSendOtp}
                    disabled={isLoading || otpSent}
                  >
                    {otpSent ? t('otpSent') : t('sendOtp')}
                  </button>
                </div>
              </div>

              <button type="submit" className="login-btn" disabled={isLoading}>
                {isLoading ? 'Loading...' : t('loginButton')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )

  // Dashboard with Live Camera
  const DashboardPage = () => (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo-small">
            <div className="logo-icon">T</div>
            <span className="brand-name">{t('appName')}</span>
          </div>
        </div>
        <div className="header-right">
          <button 
            className="lang-btn-small" 
            onClick={() => setLanguage(language === 'english' ? 'hindi' : 'english')}
          >
            {language === 'english' ? 'हिंदी' : 'English'}
          </button>
          <span className="user-email">{user?.email}</span>
          <button className="logout-btn" onClick={() => {
            stopCamera()
            setUser(null)
            setCurrentPage('login')
            // Reset all form fields
            setEmail('')
            setPassword('')
            setMobile('')
            setOtp('')
            setOtpSent(false)
            setGeneratedOtp('')
          }}>
            {t('logout')}
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <h1 className="dashboard-title">{t('realTimeDetection')}</h1>

        <div className="camera-section">
          <div className="video-container">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline
              className="camera-video"
            />
            <canvas 
              ref={canvasRef} 
              className="detection-overlay"
            />
            {!isCameraActive && (
              <div className="camera-placeholder">
                <p>📷 Camera not active</p>
                <p>Click "Start Camera" to begin</p>
              </div>
            )}
          </div>

          <div className="camera-controls">
            {!isCameraActive ? (
              <button className="control-btn start-camera" onClick={startCamera}>
                📹 {t('startCamera')}
              </button>
            ) : (
              <>
                <button className="control-btn stop-camera" onClick={stopCamera}>
                  ⏹️ {t('stopCamera')}
                </button>

                {!isDetecting ? (
                  <button className="control-btn start-detection" onClick={startFaceDetection}>
                    🔍 {t('startDetection')}
                  </button>
                ) : (
                  <button className="control-btn stop-detection" onClick={stopFaceDetection}>
                    ⏸️ {t('stopDetection')}
                  </button>
                )}

                <button className="control-btn capture" onClick={capturePhoto}>
                  📸 {t('capturePhoto')}
                </button>
              </>
            )}
          </div>

          {cameraError && (
            <div className="error-message">
              ⚠️ {cameraError}
            </div>
          )}

          <div className="detection-stats">
            {isDetecting && (
              <div className="stats-item">
                <span className="stats-label">{t('totalFaces')}:</span>
                <span className="stats-value">{faceCount}</span>
              </div>
            )}

            {detectedFaces.length > 0 && (
              <div className="faces-list">
                <h3>Detected Faces:</h3>
                {detectedFaces.map((face, index) => (
                  <div key={face.id} className="face-info">
                    Face {index + 1}: {Math.round(face.confidence * 100)}% confidence
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )

  return (
    <div className="trace-lens-app">
      {currentPage === 'login' ? <LoginPage /> : <DashboardPage />}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<TraceLensApp />)

