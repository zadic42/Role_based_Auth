import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const SystemPerformance = () => {
  const [metrics, setMetrics] = useState(null)
  const [historicalData, setHistoricalData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeRange, setTimeRange] = useState('24h') // 24h, 7d, 30d

  // Fetch current metrics
  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:3001/api/monitoring/performance', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setMetrics(response.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching system performance metrics:', err)
      setError('Failed to load system performance metrics')
      toast.error('Failed to load system performance metrics')
    } finally {
      setLoading(false)
    }
  }

  // Fetch historical data
  const fetchHistoricalData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:3001/api/monitoring/health', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setHistoricalData([response.data]) // Convert to array for compatibility
    } catch (err) {
      console.error('Error fetching historical data:', err)
      toast.error('Failed to load historical performance data')
    }
  }

  // Set up polling for real-time updates
  useEffect(() => {
    fetchMetrics()
    fetchHistoricalData()
    
    // Poll for updates every 30 seconds
    const intervalId = setInterval(fetchMetrics, 30000)
    
    return () => clearInterval(intervalId)
  }, [])

  // Format bytes to human-readable format
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format uptime to human-readable format
  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    return `${days}d ${hours}h ${minutes}m`
  }

  // Prepare data for CPU load chart
  const prepareCpuLoadData = () => {
    if (!historicalData.length) return null;
    
    const labels = historicalData.map(item => {
      const date = new Date(item.timestamp);
      return date.toLocaleTimeString();
    });
    
    const cpuUser = historicalData.map(item => (item.cpu?.user || 0) / 1000000);
    const cpuSystem = historicalData.map(item => (item.cpu?.system || 0) / 1000000);
    
    return {
      labels,
      datasets: [
        {
          label: 'CPU User (%)',
          data: cpuUser,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        {
          label: 'CPU System (%)',
          data: cpuSystem,
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.1
        }
      ]
    };
  };

  // Prepare data for memory usage chart
  const prepareMemoryData = () => {
    if (!metrics?.memory) return null;
    
    const usedMemory = metrics.memory.heapUsed;
    const totalMemory = metrics.memory.heapTotal;
    const memoryPercentage = (usedMemory / totalMemory) * 100;
    
    return {
      labels: ['Used', 'Free'],
      datasets: [
        {
          data: [memoryPercentage, 100 - memoryPercentage],
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(75, 192, 192, 0.8)'
          ],
          borderColor: [
            'rgb(255, 99, 132)',
            'rgb(75, 192, 192)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'System Performance Metrics'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }

  // Doughnut chart options
  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Memory Usage'
      }
    }
  }

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">System Performance</h1>
        <button
          onClick={fetchMetrics}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">CPU Usage</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {metrics?.cpu ? `${((metrics.cpu.user + metrics.cpu.system) / 1000000).toFixed(2)}%` : 'N/A'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Memory Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Memory Usage</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {metrics?.memory ? formatBytes(metrics.memory.heapUsed) : 'N/A'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Uptime Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Uptime</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {metrics?.uptime ? formatUptime(metrics.uptime) : 'N/A'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Process Memory Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Process Memory</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {metrics?.memory ? formatBytes(metrics.memory.rss) : 'N/A'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Load Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">CPU Load Over Time</h2>
          {prepareCpuLoadData() ? (
            <Line data={prepareCpuLoadData()} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">No data available</p>
            </div>
          )}
        </div>

        {/* Memory Usage Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Memory Usage</h2>
          {prepareMemoryData() ? (
            <Doughnut data={prepareMemoryData()} options={doughnutOptions} />
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">No data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SystemPerformance 