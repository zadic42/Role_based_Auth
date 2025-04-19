import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { UserPlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { createTrainer } from '../services/trainerService'

const AddTrainer = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await createTrainer(formData)
      toast.success('Trainer added successfully!', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#4CAF50',
          color: '#fff',
        },
      })
      // Redirect to admin trainers page after a short delay
      setTimeout(() => {
        navigate('/admin/trainers')
      }, 1000)
    } catch (error) {
      // Check for email already exists error
      if (error.message?.toLowerCase().includes('email already exists') || 
          error.response?.data?.message?.toLowerCase().includes('email already exists')) {
        toast.error('A trainer with this email already exists')
      } else {
        toast.error(error.response?.data?.message || 'Failed to add trainer')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-2">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center">
            <UserPlusIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Add New Trainer</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Create a new trainer account with their basic information.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-4 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="block w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ease-in-out text-gray-700 placeholder-gray-400"
                      placeholder="Enter trainer's full name"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="block w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ease-in-out text-gray-700 placeholder-gray-400"
                      placeholder="Enter trainer's email address"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="block w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ease-in-out text-gray-700 placeholder-gray-400"
                      placeholder="Enter trainer's password"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Password must be at least 6 characters long
                  </p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/admin/trainers')}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium text-white rounded-md ${
                    loading
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  } transition-colors duration-200`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Adding...
                    </>
                  ) : (
                    'Add Trainer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddTrainer 