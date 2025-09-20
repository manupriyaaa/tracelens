import React, { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

const translations = {
  english: {
    // App Navigation
    appName: "TRACE LENS",

    // Login Page
    title: "See Truth,",
    titleLine2: "Identify Source", 
    tagline: "Professional Investigation Platform",
    description: "Comprehensive source verification and authenticity analysis platform designed for professionals who demand accuracy and reliability in their investigations.",
    login: "Login to Account",
    email: "Email Address",
    emailPlaceholder: "Enter your email address",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    mobile: "Mobile Number",
    mobilePlaceholder: "Enter 10-digit mobile number",
    otp: "Enter OTP",
    otpPlaceholder: "Enter 6-digit OTP",
    sendOtp: "Send OTP",
    otpSent: "OTP Sent",
    loginButton: "Login",

    // Dashboard
    dashboard: "Dashboard",
    welcome: "Welcome to Trace Lens",
    uploadImages: "Upload Images",
    faceDetection: "Face Detection Results",
    confidence: "Confidence",
    noFacesDetected: "No faces detected in this image",
    facesDetected: "faces detected",

    // Common
    loading: "Loading...",
    logout: "Logout",
    close: "Close",
    cancel: "Cancel",
    confirm: "Confirm",
    error: "Error",
    success: "Success",

    // Error Messages
    emailRequired: "Please enter a valid email address",
    passwordRequired: "Password is required",
    mobileRequired: "Please enter a valid 10-digit mobile number",
    otpRequired: "Please enter the OTP sent to your mobile",
    loginFailed: "Login failed. Please check your credentials.",
    networkError: "Network error. Please check your connection.",

    // Success Messages
    otpSentSuccess: "OTP sent successfully!",
    loginSuccess: "Login successful!",
    uploadSuccess: "Images uploaded successfully!",
    detectionComplete: "Face detection completed!"
  },

  hindi: {
    // App Navigation
    appName: "ट्रेस लेंस",

    // Login Page
    title: "सत्य देखें,",
    titleLine2: "स्रोत पहचानें",
    tagline: "व्यावसायिक जांच मंच",
    description: "व्यापक स्रोत सत्यापन और प्रामाणिकता विश्लेषण मंच जो उन पेशेवरों के लिए डिज़ाइन किया गया है जो अपनी जांच में सटीकता और विश्वसनीयता की मांग करते हैं।",
    login: "खाते में लॉगिन करें",
    email: "ईमेल पता",
    emailPlaceholder: "अपना ईमेल पता दर्ज करें",
    password: "पासवर्ड",
    passwordPlaceholder: "अपना पासवर्ड दर्ज करें",
    mobile: "मोबाइल नंबर",
    mobilePlaceholder: "10 अंकों का मोबाइल नंबर दर्ज करें",
    otp: "OTP दर्ज करें",
    otpPlaceholder: "6 अंकों का OTP दर्ज करें",
    sendOtp: "OTP भेजें",
    otpSent: "OTP भेजा गया",
    loginButton: "लॉगिन",

    // Dashboard
    dashboard: "डैशबोर्ड",
    welcome: "ट्रेस लेंस में आपका स्वागत है",
    uploadImages: "चित्र अपलोड करें",
    faceDetection: "चेहरा पहचान परिणाम",
    confidence: "विश्वास",
    noFacesDetected: "इस चित्र में कोई चेहरा नहीं मिला",
    facesDetected: "चेहरे मिले",

    // Common
    loading: "लोड हो रहा है...",
    logout: "लॉगआउट",
    close: "बंद करें",
    cancel: "रद्द करें",
    confirm: "पुष्टि करें",
    error: "त्रुटि",
    success: "सफलता",

    // Error Messages
    emailRequired: "कृपया एक वैध ईमेल पता दर्ज करें",
    passwordRequired: "पासवर्ड आवश्यक है",
    mobileRequired: "कृपया एक वैध 10 अंकों का मोबाइल नंबर दर्ज करें",
    otpRequired: "कृपया अपने मोबाइल पर भेजा गया OTP दर्ज करें",
    loginFailed: "लॉगिन असफल। कृपया अपनी जानकारी जांचें।",
    networkError: "नेटवर्क त्रुटि। कृपया अपना कनेक्शन जांचें।",

    // Success Messages
    otpSentSuccess: "OTP सफलतापूर्वक भेजा गया!",
    loginSuccess: "लॉगिन सफल!",
    uploadSuccess: "चित्र सफलतापूर्वक अपलोड किए गए!",
    detectionComplete: "चेहरा पहचान पूर्ण!"
  }
}

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('english')
  const [isRTL, setIsRTL] = useState(false)

  // Load saved language preference on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language')
    if (savedLanguage && translations[savedLanguage]) {
      setCurrentLanguage(savedLanguage)
      setIsRTL(savedLanguage === 'hindi') // Set RTL for Hindi if needed
    }
  }, [])

  const changeLanguage = (language) => {
    if (translations[language]) {
      setCurrentLanguage(language)
      setIsRTL(language === 'hindi')
      localStorage.setItem('preferred-language', language)

      // Update document direction
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
      document.documentElement.lang = language === 'hindi' ? 'hi' : 'en'
    }
  }

  const t = (key) => {
    return translations[currentLanguage][key] || key
  }

  const value = {
    currentLanguage,
    isRTL,
    changeLanguage,
    t,
    translations: translations[currentLanguage],
    availableLanguages: Object.keys(translations)
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

