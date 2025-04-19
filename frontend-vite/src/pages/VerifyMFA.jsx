import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

const VerifyMFA = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes in seconds
  const [resendTimer, setResendTimer] = useState(30) // 30 seconds cooldown for resend
  const [canResend, setCanResend] = useState(false)
  const [isOAuth, setIsOAuth] = useState(false)

  useEffect(() => {
    // Get parameters from URL
    const params = new URLSearchParams(location.search)
    const tempToken = params.get('tempToken')
    const isOAuthParam = params.get('isOAuth')

    // Set OAuth flag
    setIsOAuth(isOAuthParam === 'true')

    // Check if we have a tempToken in either the URL or sessionStorage
    const storedTempToken = sessionStorage.getItem('tempToken')
    const tokenToUse = tempToken || storedTempToken

    if (!tokenToUse) {
      toast.error('Session expired. Please login again.')
      navigate('/login')
      return
    }

    // Store tempToken in sessionStorage if it came from URL
    if (tempToken && !storedTempToken) {
      sessionStorage.setItem('tempToken', tempToken)
    }

    // Timer for code expiration
    const codeTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(codeTimer)
          sessionStorage.removeItem('tempToken')
          sessionStorage.removeItem('mfaEmail')
          localStorage.removeItem('mfaEnabled')
          toast.error('Verification code expired. Please login again.')
          navigate('/login')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Timer for resend button
    const resendCooldown = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(resendCooldown)
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(codeTimer)
      clearInterval(resendCooldown)
    }
  }, [location, navigate])

  const handleResendCode = async () => {
    if (!canResend) return
    
    setResendLoading(true)
    const tempToken = sessionStorage.getItem('tempToken')

    try {
      const response = await axios.post('http://localhost:3001/api/auth/resend-mfa', {
        tempToken,
        isOAuth
      })
      
      // Update tempToken in sessionStorage
      sessionStorage.setItem('tempToken', response.data.tempToken)
      
      // Reset timers
      setTimeLeft(300)
      setResendTimer(30)
      setCanResend(false)
      toast.success('New verification code sent to your email')
    } catch (err) {
      if (err.response?.data?.code === 'INVALID_TEMP_TOKEN') {
        sessionStorage.removeItem('tempToken')
        sessionStorage.removeItem('mfaEmail')
        localStorage.removeItem('mfaEnabled')
        toast.error('Session expired. Please login again.')
        navigate('/login')
      } else {
        toast.error(err.response?.data?.message || 'Failed to resend verification code')
      }
    } finally {
      setResendLoading(false)
    }
  }

  const handleChange = (index, value) => {
    if (value.length > 1) return // Prevent multiple digits
    if (!/^\d*$/.test(value)) return // Only allow digits

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.querySelector(`input[name=code-${index + 1}]`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.querySelector(`input[name=code-${index - 1}]`)
      if (prevInput) prevInput.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const verificationCode = code.join('')
    
    if (verificationCode.length !== 6) {
      toast.error('Please enter the complete verification code')
      return
    }

    setLoading(true)
    const tempToken = sessionStorage.getItem('tempToken')

    if (!tempToken) {
      toast.error('Session expired. Please login again.')
      navigate('/login')
      return
    }

    try {
      const response = await axios.post('http://localhost:3001/api/auth/verify-mfa', {
        code: verificationCode,
        tempToken,
        isOAuth
      })

      // Store the final token and user data
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('userRole', response.data.user.role)
      localStorage.setItem('userId', response.data.user.id)
      localStorage.setItem('userEmail', response.data.user.email)
      localStorage.setItem('userName', response.data.user.name)
      localStorage.setItem('mfaEnabled', 'true')

      // Clear session storage
      sessionStorage.removeItem('tempToken')
      sessionStorage.removeItem('mfaEmail')

      toast.success('Verification successful!')
      navigate('/dashboard')
    } catch (err) {
      if (err.response?.data?.code === 'CODE_EXPIRED') {
        sessionStorage.removeItem('tempToken')
        sessionStorage.removeItem('mfaEmail')
        localStorage.removeItem('mfaEnabled')
        toast.error('Verification code expired. Please login again.')
        navigate('/login')
      } else if (err.response?.data?.code === 'INVALID_TEMP_TOKEN') {
        sessionStorage.removeItem('tempToken')
        sessionStorage.removeItem('mfaEmail')
        localStorage.removeItem('mfaEnabled')
        toast.error('Session expired. Please login again.')
        navigate('/login')
      } else {
        toast.error(err.response?.data?.message || 'Invalid verification code')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the verification code sent to your email
          </p>
          <p className="mt-2 text-center text-sm text-red-600">
            Code expires in: {formatTime(timeLeft)}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="flex justify-center space-x-2">
            {code.map((digit, index) => (
              <input
                key={index}
                type="text"
                name={`code-${index}`}
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-2xl border rounded-md focus:ring-blue-500 focus:border-blue-500"
                autoFocus={index === 0}
              />
            ))}
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={loading || timeLeft === 0}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading || timeLeft === 0
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg'
              }`}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendLoading || !canResend}
              className={`w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md ${
                resendLoading || !canResend
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {resendLoading 
                ? 'Sending...' 
                : !canResend 
                  ? `Resend available in ${resendTimer}s` 
                  : 'Resend Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VerifyMFA 