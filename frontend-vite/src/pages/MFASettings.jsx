import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const MFASettings = () => {
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
  const [showVerification, setShowVerification] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resendTimer, setResendTimer] = useState(30)
  const [canResend, setCanResend] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const inputRefs = useRef([])

  // Fetch initial MFA status
  useEffect(() => {
    const fetchMFAStatus = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('http://localhost:3001/api/auth/mfa/status', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setMfaEnabled(response.data.mfaEnabled)
      } catch (err) {
        setError('Failed to fetch MFA status')
        console.error('Error fetching MFA status:', err)
      }
    }

    fetchMFAStatus()
  }, [])

  // Timer for resend button
  useEffect(() => {
    if (!canResend && resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [canResend, resendTimer])

  const handleResendCode = async () => {
    if (!canResend) return
    
    setResendLoading(true)
    const token = localStorage.getItem('token')
    
    try {
      const endpoint = mfaEnabled ? 'request-disable-mfa' : 'setup-mfa'
      await axios.post(`http://localhost:3001/api/auth/${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Reset timer
      setResendTimer(30)
      setCanResend(false)
      toast.success('New verification code sent to your email')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend verification code')
    } finally {
      setResendLoading(false)
    }
  }

  const handleEnableMFA = async () => {
    try {
      setIsLoading(true)
      setError('')
      setSuccess('')
      
      const token = localStorage.getItem('token')
      const response = await axios.post('http://localhost:3001/api/auth/setup-mfa', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setShowVerification(true)
        setSuccess('Verification code sent to your email. Please enter it below.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate MFA setup')
      console.error('Error initiating MFA setup:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisableMFA = async () => {
    try {
      setIsLoading(true)
      setError('')
      setSuccess('')
      
      const token = localStorage.getItem('token')
      const response = await axios.post('http://localhost:3001/api/auth/request-disable-mfa', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setShowVerification(true)
        setSuccess('Verification code sent to your email. Please enter it below.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate MFA disable')
      console.error('Error initiating MFA disable:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    try {
      setIsLoading(true)
      setError('')
      setSuccess('')

      const token = localStorage.getItem('token')
      const code = verificationCode.join('')
      
      // Determine which verification endpoint to use based on current MFA status
      const endpoint = mfaEnabled ? 'verify-and-disable-mfa' : 'verify-and-enable-mfa'
      const response = await axios.post(`http://localhost:3001/api/auth/${endpoint}`, 
        { code },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        setShowVerification(false)
        setMfaEnabled(!mfaEnabled)
        setVerificationCode(['', '', '', '', '', ''])
        setSuccess(mfaEnabled ? 'MFA has been disabled successfully.' : 'MFA has been enabled successfully.')
      }
    } catch (err) {
      if (err.response?.data?.code === 'CODE_EXPIRED') {
        setError('Verification code has expired. Please try again.')
        setShowVerification(false)
      } else {
        setError(err.response?.data?.message || 'Invalid verification code')
      }
      console.error('Error verifying code:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (index, value) => {
    if (value.length > 1) return // Prevent multiple digits
    
    const newCode = [...verificationCode]
    newCode[index] = value
    setVerificationCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus()
      setFocusedIndex(index + 1)
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1].focus()
      setFocusedIndex(index - 1)
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (/^\d+$/.test(pastedData)) {
      const newCode = [...verificationCode]
      pastedData.split('').forEach((digit, index) => {
        if (index < 6) newCode[index] = digit
      })
      setVerificationCode(newCode)
    }
  }

  useEffect(() => {
    // Focus first input when verification section appears
    if (showVerification) {
      inputRefs.current[0].focus()
    }
  }, [showVerification])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Multi-Factor Authentication</h1>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* MFA Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">MFA Status</h3>
            <p className="mt-1 text-sm text-gray-500">
              {mfaEnabled ? 'Multi-factor authentication is enabled' : 'Multi-factor authentication is disabled'}
            </p>
          </div>
          <button
            onClick={mfaEnabled ? handleDisableMFA : handleEnableMFA}
            disabled={isLoading || showVerification}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              isLoading || showVerification
                ? 'bg-gray-400 cursor-not-allowed'
                : mfaEnabled
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Processing...' : showVerification ? 'Verification in Progress' : mfaEnabled ? 'Disable MFA' : 'Enable MFA'}
          </button>
        </div>
      </div>

      {/* Verification Code */}
      {showVerification && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">
            {mfaEnabled ? 'Disable MFA Verification' : 'Enable MFA Verification'}
          </h3>
          <div className="mt-4">
            <div className="flex flex-col items-center space-y-4">
              <label className="text-sm font-medium text-gray-700">
                Enter the 6-digit verification code sent to your email
              </label>
              <div className="flex space-x-2">
                {verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={isLoading}
                    className={`w-12 h-12 text-center text-xl font-semibold rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      focusedIndex === index
                        ? 'border-blue-500 bg-blue-50'
                        : digit
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500">
                Enter the code sent to your email
              </p>
            </div>
            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={() => {
                  setShowVerification(false)
                  setVerificationCode(['', '', '', '', '', ''])
                }}
                disabled={isLoading}
                className="px-6 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyCode}
                disabled={!verificationCode.every(digit => digit !== '') || isLoading}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isLoading || !verificationCode.every(digit => digit !== '')
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendLoading || !canResend}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  resendLoading || !canResend
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                {resendLoading 
                  ? 'Sending...' 
                  : !canResend 
                    ? `Resend (${resendTimer}s)` 
                    : 'Resend Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MFASettings 