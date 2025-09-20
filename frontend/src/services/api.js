// API Configuration and Service Layer
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Default headers
const getHeaders = (includeAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
  }

  if (includeAuth) {
    const token = sessionStorage.getItem('authToken')
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  return headers
}

// Generic API request handler
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`

  const config = {
    ...options,
    headers: {
      ...getHeaders(options.auth !== false),
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)

    // Handle different content types
    const contentType = response.headers.get('content-type')
    let data

    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`)
    }

    return data
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error)
    throw error
  }
}

// Auth API
export const authAPI = {
  sendOTP: (mobile) => 
    apiRequest('/api/auth/send-otp', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ mobile }),
    }),

  login: (credentials) => 
    apiRequest('/api/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify(credentials),
    }),

  getMe: () => 
    apiRequest('/api/auth/me', {
      method: 'GET',
      auth: true,
    }),

  logout: () => 
    apiRequest('/api/auth/logout', {
      method: 'POST',
      auth: true,
    }),
}

// Image API
export const imageAPI = {
  upload: (formData) => 
    apiRequest('/api/images/upload', {
      method: 'POST',
      auth: true,
      headers: {}, // Don't set Content-Type for FormData
      body: formData,
    }),

  detectFaces: (imageIds) => 
    apiRequest('/api/images/detect-faces', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ imageIds }),
    }),

  getImages: () => 
    apiRequest('/api/images', {
      method: 'GET',
      auth: true,
    }),

  deleteImage: (imageId) => 
    apiRequest(`/api/images/${imageId}`, {
      method: 'DELETE',
      auth: true,
    }),
}

// Health check
export const healthAPI = {
  check: () => 
    apiRequest('/health', {
      method: 'GET',
      auth: false,
    }),
}

// Utility function to handle API errors
export const handleApiError = (error) => {
  if (error.message.includes('Failed to fetch')) {
    return 'Network error. Please check your connection.'
  }

  if (error.message.includes('401')) {
    return 'Authentication failed. Please log in again.'
  }

  if (error.message.includes('403')) {
    return 'Access denied. You do not have permission.'
  }

  if (error.message.includes('404')) {
    return 'Resource not found.'
  }

  if (error.message.includes('500')) {
    return 'Server error. Please try again later.'
  }

  return error.message || 'An unexpected error occurred.'
}

export default {
  authAPI,
  imageAPI,
  healthAPI,
  handleApiError,
}

