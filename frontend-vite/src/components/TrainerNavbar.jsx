import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

const TrainerNavbar = () => {
  const navigate = useNavigate()
  const trainerName = localStorage.getItem('userName') || 'Trainer'

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userName')
    toast.success('Logged out successfully')
    navigate('/trainers/login')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-200">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/trainer/dashboard" className="text-xl font-bold text-gray-800">
              Trainer Dashboard
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {trainerName}</span>
            <Link
              to="/trainer/profile"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default TrainerNavbar 