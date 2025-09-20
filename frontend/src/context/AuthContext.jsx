import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check for existing authentication on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if token exists (in memory only for security)
        const storedToken = sessionStorage.getItem('authToken')
        const storedUser = sessionStorage.getItem('authUser')

        if (storedToken && storedUser) {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
          setIsAuthenticated(true)

          // Verify token is still valid
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          })

          if (!response.ok) {
            // Token is invalid, clear auth state
            logout()
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        logout()
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (credentials) => {
    try {
      setLoading(true)

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      // Store auth data
      setToken(data.token)
      setUser(data.user)
      setIsAuthenticated(true)

      // Store in sessionStorage for persistence across page refreshes
      sessionStorage.setItem('authToken', data.token)
      sessionStorage.setItem('authUser', JSON.stringify(data.user))

      return { success: true, user: data.user }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUser(null)
    setToken(null)

    // Clear stored data
    sessionStorage.removeItem('authToken')
    sessionStorage.removeItem('authUser')

    // Optional: Call logout endpoint
    if (token) {
      fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).catch(console.error)
    }
  }

  const sendOTP = async (mobile) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP')
      }

      return { success: true, ...data }
    } catch (error) {
      console.error('Send OTP error:', error)
      return { success: false, error: error.message }
    }
  }

  const value = {
    isAuthenticated,
    user,
    token,
    loading,
    login,
    logout,
    sendOTP
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

