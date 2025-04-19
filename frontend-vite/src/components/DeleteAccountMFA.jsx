import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const DeleteAccountMFA = ({ onVerificationComplete, onCancel }) => {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes in seconds
  const [resendTimer, setResendTimer] = useState(30) // 30 seconds cooldown for resend
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    // Request MFA code when component mounts
    requestMfaCode()

    // Timer for code expiration
    const codeTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(codeTimer)
          toast.error('Verification code expired. Please request a new code.')
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
  }, [])

  const requestMfaCode = async () => {
    setResendLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await axios.post(
        'http://localhost:3001/api/auth/request-delete-mfa',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      
      // Reset timers
      setTimeLeft(300)
      setResendTimer(30)
      setCanResend(false)
      toast.success('Verification code sent to your email')
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message === 'MFA is not enabled for this account') {
        // If MFA is not enabled, proceed with account deletion
        onVerificationComplete()
      } else {
        toast.error(error.response?.data?.message || 'Failed to send verification code')
      }
    } finally {
      setResendLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!canResend) return
    await requestMfaCode()
  }

  const handleChange = (index, value) => {
    if (value.length > 1) return // Prevent multiple digits
    if (!/^\d*$/.test(value)) return // Only allow digits

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.querySelector(`input[name=delete-code-${index + 1}]`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.querySelector(`input[name=delete-code-${index - 1}]`)
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
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await axios.delete(
        'http://localhost:3001/api/auth/delete-account',
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          data: {
            mfaCode: verificationCode
          }
        }
      )
      
      if (response.data.message) {
        toast.success(response.data.message)
        onVerificationComplete()
      } else {
        toast.error('Failed to delete account')
      }
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.code === 'MFA_REQUIRED') {
        toast.error('MFA verification required')
      } else if (error.response?.status === 401 && error.response?.data?.code === 'INVALID_CODE') {
        toast.error('Invalid verification code')
      } else if (error.response?.status === 401 && error.response?.data?.code === 'CODE_EXPIRED') {
        toast.error('Verification code expired. Please request a new code.')
        setTimeLeft(0)
      } else if (error.response?.status === 404) {
        toast.error('User not found')
      } else if (error.response?.status === 401) {
        toast.error('Authentication failed')
      } else {
        toast.error(error.response?.data?.message || 'Error deleting account')
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
    <div className="px-4 py-2 space-y-2">
      <p className="text-sm text-gray-700">Please verify your identity to delete your account.</p>
      <p className="text-sm text-red-600">Code expires in: {formatTime(timeLeft)}</p>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex justify-center space-x-2">
          {code.map((digit, index) => (
            <input
              key={index}
              type="text"
              name={`delete-code-${index}`}
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-10 h-10 text-center text-xl border rounded-md focus:ring-blue-500 focus:border-blue-500"
              autoFocus={index === 0}
            />
          ))}
        </div>

        <div className="space-y-2">
          <button
            type="submit"
            disabled={loading || timeLeft === 0}
            className={`w-full px-3 py-1 text-sm text-white ${
              loading || timeLeft === 0
                ? 'bg-red-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
            } rounded`}
          >
            {loading ? 'Verifying...' : 'Verify and Delete Account'}
          </button>

          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendLoading || !canResend}
            className={`w-full px-3 py-1 text-sm ${
              resendLoading || !canResend
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            {resendLoading 
              ? 'Sending...' 
              : !canResend 
                ? `Resend available in ${resendTimer}s` 
                : 'Resend Code'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default DeleteAccountMFA 