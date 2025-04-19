import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import backupService from '../services/backupService';
import { format } from 'date-fns';

const AdminBackups = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(null);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await backupService.listBackups();
      
      if (response.success) {
        setBackups(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch backups');
      }
    } catch (error) {
      console.error('Error fetching backups:', error);
      setError(error.response?.data?.message || error.message || 'Error fetching backups');
      toast.error(error.response?.data?.message || error.message || 'Error fetching backups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true);
      const response = await backupService.createBackup();
      
      if (response.success) {
        toast.success('Backup created successfully');
        fetchBackups(); // Refresh the list
      } else {
        throw new Error(response.message || 'Failed to create backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error(error.response?.data?.message || error.message || 'Error creating backup');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDownloadBackup = async (fileName) => {
    try {
      const blob = await backupService.downloadBackup(fileName);
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Backup downloaded successfully');
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error(error.response?.data?.message || error.message || 'Error downloading backup');
    }
  };

  const handleRestoreBackup = async (fileName) => {
    if (!window.confirm('Are you sure you want to restore this backup? This will overwrite the current database.')) {
      return;
    }
    
    try {
      setRestoringBackup(fileName);
      const response = await backupService.restoreBackup(fileName);
      
      if (response.success) {
        toast.success('Backup restored successfully');
      } else {
        throw new Error(response.message || 'Failed to restore backup');
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error(error.response?.data?.message || error.message || 'Error restoring backup');
    } finally {
      setRestoringBackup(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Database Backups</h1>
        <button
          onClick={handleCreateBackup}
          disabled={creatingBackup}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {creatingBackup ? 'Creating...' : 'Create Backup'}
        </button>
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

      {/* Backups Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading backups...
                </td>
              </tr>
            ) : backups.length > 0 ? (
              backups.map((backup) => (
                <tr key={backup.name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {backup.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(backup.createdAt), 'PPpp')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFileSize(backup.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleDownloadBackup(backup.name)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleRestoreBackup(backup.name)}
                      disabled={restoringBackup === backup.name}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {restoringBackup === backup.name ? 'Restoring...' : 'Restore'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                  No backups found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Backup Information */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Backup Information</h2>
        <p className="text-sm text-gray-500 mb-4">
          Backups are automatically created daily and retained for 30 days. You can also create manual backups at any time.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Automatic Backups</h3>
            <p className="text-sm text-gray-500">Daily backups are created automatically at midnight.</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700">Manual Backups</h3>
            <p className="text-sm text-gray-500">Click the "Create Backup" button to create a manual backup.</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700">Restoring Backups</h3>
            <p className="text-sm text-gray-500">Restoring a backup will overwrite the current database. This action cannot be undone.</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700">Backup Retention</h3>
            <p className="text-sm text-gray-500">Backups are retained for 30 days or until the maximum number of backups (10) is reached.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBackups; 