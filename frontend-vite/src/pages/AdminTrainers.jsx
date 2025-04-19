import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getAllTrainers, deleteTrainer } from '../services/trainerService'

const AdminTrainers = () => {
  const navigate = useNavigate()
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrainers()
  }, [])

  const fetchTrainers = async () => {
    try {
      const response = await getAllTrainers()
      setTrainers(response || [])
    } catch (error) {
      console.error('Error fetching trainers:', error)
      toast.error('Failed to fetch trainers')
      setTrainers([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (trainerId) => {
    if (!window.confirm('Are you sure you want to delete this trainer?')) return

    try {
      await deleteTrainer(trainerId)
      toast.success('Trainer deleted successfully')
      fetchTrainers()
    } catch (error) {
      console.error('Error deleting trainer:', error)
      toast.error('Failed to delete trainer')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Trainers</h1>
        <button
          onClick={() => navigate('/admin/trainers/add')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Trainer
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trainers.map((trainer) => (
              <tr key={trainer._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{trainer.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{trainer.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    trainer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {trainer.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDelete(trainer._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminTrainers 