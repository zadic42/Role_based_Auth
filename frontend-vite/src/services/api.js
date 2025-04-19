import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const auth = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },
  
  signup: async (name, email, password) => {
    const response = await api.post('/auth/signup', { name, email, password })
    return response.data
  },
  
  verifyMFA: async (token, mfaCode) => {
    const response = await api.post('/auth/verify-mfa', { token, mfaCode })
    return response.data
  },
  
  logout: () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  },
}

export default api 