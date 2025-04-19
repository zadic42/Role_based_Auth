import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const navigate = useNavigate()
  const dropdownRef = useRef(null)
  const [user, setUser] = useState({
    name: '',
    email: ''
  })

  useEffect(() => {
    // Get user data from localStorage
    const userName = localStorage.getItem('userName')
    const userEmail = localStorage.getItem('userEmail')
    
    if (userName && userEmail) {
      setUser({
        name: userName,
        email: userEmail
      })
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    // Clear all user data from localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userName')
    localStorage.removeItem('mfaEnabled')
    navigate('/login')
  }

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between h-full px-4">
        {/* Logo */}
        <div className="flex items-center">
          <div className="flex items-center space-x-2">
            <svg
              className="h-8 w-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span className="text-xl font-semibold text-gray-900">Dashboard</span>
          </div>
        </div>

        {/* Right side - User profile and dropdown */}
        <div className="flex items-center space-x-4">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">{user.name}</span>
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                <div className="py-1" role="menu">
                  <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                    {user.email}
                  </div>
                  <button
                    onClick={() => {
                      navigate('/mfa-settings')
                      setIsDropdownOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    MFA Settings
                  </button>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsDropdownOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    role="menuitem"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navbar 