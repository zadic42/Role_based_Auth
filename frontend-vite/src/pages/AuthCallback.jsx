import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'

const AuthCallback = () => {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleCallback = () => {
      // Get token from URL parameters
      const params = new URLSearchParams(location.search)
      const token = params.get('token')
      const error = params.get('error')

      if (error) {
        toast.error('Authentication failed. Please try again.')
        navigate('/login')
        return
      }

      if (!token) {
        toast.error('No authentication token received')
        navigate('/login')
        return
      }

      // Store the token and redirect to dashboard
      localStorage.setItem('token', token)
      
      // Extract user info from token (this is a simple decode, not verification)
      try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        }).join(''))
        
        const payload = JSON.parse(jsonPayload)
        
        // Store user info
        localStorage.setItem('userId', payload.userId)
        localStorage.setItem('userRole', payload.role)
        localStorage.setItem('userName', payload.name)
        localStorage.setItem('userEmail', payload.email)
        
        // Check if we need to redirect to MFA verification
        if (location.pathname.includes('verify-mfa')) {
          toast.success('Please check your email for the verification code')
          navigate('/verify-mfa')
        } else {
          toast.success('Login successful!')
          navigate('/dashboard')
        }
      } catch (error) {
        console.error('Error parsing token:', error)
        toast.error('Invalid authentication token')
        navigate('/login')
      }
    }

    handleCallback()
  }, [location, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Completing authentication...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  )
}

export default AuthCallback 