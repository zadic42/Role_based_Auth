import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const AdminErrorLogs = () => {
  const [errorLogs, setErrorLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedLog, setSelectedLog] = useState(null)
  const [filters, setFilters] = useState({
    level: '',
    startDate: '',
    endDate: '',
    userEmail: '',
    route: '',
    method: '',
    page: 1,
    limit: 10
  })
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  })

  const fetchErrorLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('token')
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const queryParams = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        ...(filters.level && { level: filters.level }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.userEmail && { userEmail: filters.userEmail }),
        ...(filters.route && { route: filters.route }),
        ...(filters.method && { method: filters.method })
      })

      const response = await axios.get(
        `http://localhost:3001/api/error-logs?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        setErrorLogs(response.data.data)
        setPagination(response.data.pagination)
      } else {
        throw new Error(response.data.message || 'Failed to fetch error logs')
      }
    } catch (error) {
      console.error('Error fetching error logs:', error)
      setError(error.response?.data?.message || error.message || 'Error fetching error logs')
      toast.error(error.response?.data?.message || error.message || 'Error fetching error logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchErrorLogs()
  }, [filters.page, filters.limit, filters.level, filters.startDate, filters.endDate, filters.userEmail, filters.route, filters.method])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Reset to first page when filters change
    }))
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }))
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getLevelColor = (level) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'info':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleViewDetails = async (logId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `http://localhost:3001/api/error-logs/${logId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        setSelectedLog(response.data.data)
      } else {
        throw new Error(response.data.message || 'Failed to fetch error log details')
      }
    } catch (error) {
      console.error('Error fetching error log details:', error)
      toast.error(error.response?.data?.message || error.message || 'Error fetching error log details')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Error Logs</h1>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Level</label>
            <select
              name="level"
              value={filters.level}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Levels</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">User Email</label>
            <input
              type="text"
              name="userEmail"
              value={filters.userEmail}
              onChange={handleFilterChange}
              placeholder="Filter by user email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Route</label>
            <input
              type="text"
              name="route"
              value={filters.route}
              onChange={handleFilterChange}
              placeholder="Filter by route"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Method</label>
            <select
              name="method"
              value={filters.method}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
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

      {/* Error Logs Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {errorLogs.length > 0 ? (
              errorLogs.map((log) => (
                <tr key={log._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getLevelColor(log.level)}`}>
                      {log.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs truncate">{log.message}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.userEmail || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.method} {log.route}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleViewDetails(log._id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                  No error logs found matching your criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  page === pagination.page
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Error Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Error Log Details</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-6 py-4">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Timestamp</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedLog.timestamp)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Level</dt>
                  <dd className="mt-1">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getLevelColor(selectedLog.level)}`}>
                      {selectedLog.level}
                    </span>
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Message</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedLog.message}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">User</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedLog.userEmail || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Route</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedLog.method} {selectedLog.route}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">IP Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedLog.ipAddress}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">User Agent</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedLog.userAgent}</dd>
                </div>
                {selectedLog.stack && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Stack Trace</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded">
                      {selectedLog.stack}
                    </dd>
                  </div>
                )}
                {selectedLog.additionalData && Object.keys(selectedLog.additionalData).length > 0 && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Additional Data</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded">
                      {JSON.stringify(selectedLog.additionalData, null, 2)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminErrorLogs 