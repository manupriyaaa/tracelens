import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProtectedRoute from './components/Common/ProtectedRoute'
import LoadingScreen from './components/Common/LoadingScreen'
import './App.css'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [appReady, setAppReady] = useState(false)

  useEffect(() => {
    // Initialize application
    const initializeApp = async () => {
      try {
        // Check if API is available
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

        // Optional: Ping health endpoint
        if (import.meta.env.PROD) {
          await fetch(`${apiUrl}/health`).catch(console.warn)
        }

        // Set app as ready
        setAppReady(true)
      } catch (error) {
        console.warn('App initialization warning:', error)
        setAppReady(true) // Continue even if health check fails
      } finally {
        // Minimum loading time for better UX
        setTimeout(() => {
          setIsLoading(false)
        }, 1000)
      }
    }

    initializeApp()
  }, [])

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!appReady) {
    return (
      <div className="app-error">
        <div className="error-content">
          <h1>Unable to connect</h1>
          <p>Please check your connection and try again.</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="app">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* 404 Route */}
              <Route path="*" element={
                <div className="not-found">
                  <div className="not-found-content">
                    <h1>404 - Page Not Found</h1>
                    <p>The page you're looking for doesn't exist.</p>
                    <button onClick={() => window.history.back()}>
                      Go Back
                    </button>
                  </div>
                </div>
              } />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App

