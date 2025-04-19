import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

const backupService = {
  createBackup: async () => {
    try {
      const response = await axios.post(`${API_URL}/backups`, {}, getAuthHeader());
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  listBackups: async () => {
    try {
      const response = await axios.get(`${API_URL}/backups`, getAuthHeader());
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  downloadBackup: async (backupName) => {
    try {
      const response = await axios.get(`${API_URL}/backups/${backupName}/download`, {
        ...getAuthHeader(),
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteBackup: async (backupName) => {
    try {
      const response = await axios.delete(`${API_URL}/backups/${backupName}`, getAuthHeader());
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  restoreBackup: async (backupName) => {
    try {
      const response = await axios.post(`${API_URL}/backups/${backupName}/restore`, {}, getAuthHeader());
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default backupService; 