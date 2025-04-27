import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { getTrainerProfile } from '../services/trainerService'

const TrainerDashboard = () => {
  const [stats, setStats] = useState({
    totalSessions: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    averageRating: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getTrainerProfile()
        setStats({
          totalSessions: response.totalSessions || 0,
          upcomingSessions: response.upcomingSessions || 0,
          completedSessions: response.completedSessions || 0,
          averageRating: response.averageRating || 0
        })
      } catch (error) {
        toast.error('Failed to fetch trainer statistics')
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Trainer Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Total Sessions</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalSessions}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Upcoming Sessions</h3>
          <p className="text-3xl font-bold text-green-600">{stats.upcomingSessions}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Completed Sessions</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.completedSessions}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Average Rating</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="p-4 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
            Schedule New Session
          </button>
          <button className="p-4 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
            View My Schedule
          </button>
          <button className="p-4 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors">
            Manage Clients
          </button>
        </div>
      </div>
    </div>
  )
}

export default TrainerDashboard 