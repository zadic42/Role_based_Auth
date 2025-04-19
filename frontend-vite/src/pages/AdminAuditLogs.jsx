import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const AdminAuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    action: '',
    startDate: '',
    endDate: '',
    status: '',
    page: 1,
    limit: 10
  })
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  })

  const fetchAuditLogs = async () => {
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
        ...(filters.action && { action: filters.action }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.status && { status: filters.status })
      })

      const response = await axios.get(
        `http://localhost:3001/api/audit-logs?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        setAuditLogs(response.data.data)
        setPagination(response.data.pagination)
      } else {
        throw new Error(response.data.message || 'Failed to fetch audit logs')
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      setError(error.response?.data?.message || error.message || 'Error fetching audit logs')
      toast.error(error.response?.data?.message || error.message || 'Error fetching audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLogs()
  }, [filters.page, filters.limit, filters.action, filters.startDate, filters.endDate, filters.status])

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

  const getActionColor = (action) => {
    switch (action) {
      case 'login':
      case 'oauth_login':
        return 'bg-blue-100 text-blue-800'
      case 'signup':
        return 'bg-green-100 text-green-800'
      case 'logout':
        return 'bg-gray-100 text-gray-800'
      case 'enable_mfa':
      case 'disable_mfa':
        return 'bg-purple-100 text-purple-800'
      case 'delete_account':
        return 'bg-red-100 text-red-800'
      case 'mfa_verification':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getActionLabel = (action) => {
    switch (action) {
      case 'login':
        return 'Login'
      case 'oauth_login':
        return 'OAuth Login'
      case 'signup':
        return 'Sign Up'
      case 'logout':
        return 'Logout'
      case 'enable_mfa':
        return 'Enable MFA'
      case 'disable_mfa':
        return 'Disable MFA'
      case 'delete_account':
        return 'Delete Account'
      case 'mfa_verification':
        return 'MFA Verification'
      case 'mfa_resend':
        return 'MFA Resend'
      case 'delete_account_mfa_request':
        return 'Delete Account MFA Request'
      default:
        return action
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
        <h1 className="text-2xl font-semibold text-gray-900">Audit Logs</h1>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Action</label>
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              <option value="login">Login</option>
              <option value="oauth_login">OAuth Login</option>
              <option value="signup">Sign Up</option>
              <option value="logout">Logout</option>
              <option value="delete_account">Delete Account</option>
              <option value="enable_mfa">Enable MFA</option>
              <option value="disable_mfa">Disable MFA</option>
              <option value="mfa_verification">MFA Verification</option>
              <option value="mfa_resend">MFA Resend</option>
              <option value="delete_account_mfa_request">Delete Account MFA Request</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
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

      {/* Audit Logs Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <tr key={log._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.userEmail}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}`}>
                      {getActionLabel(log.action)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {typeof log.details === 'object' 
                      ? JSON.stringify(log.details) 
                      : log.details}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                  No audit logs found matching your criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-3 py-1 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm text-gray-700">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-1 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminAuditLogs 