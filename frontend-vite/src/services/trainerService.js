import axios from 'axios';
import { getAuthHeader } from '../utils/auth';

const API_URL = 'http://localhost:3001/api/trainers';

// Create a new trainer
export const createTrainer = async (trainerData) => {
  try {
    const response = await axios.post(`${API_URL}`, trainerData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all trainers
export const getAllTrainers = async () => {
  try {
    const response = await axios.get(`${API_URL}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get trainer by ID
export const getTrainerById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update trainer
export const updateTrainer = async (id, trainerData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, trainerData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Delete trainer
export const deleteTrainer = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Login trainer
export const loginTrainer = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify({
        ...response.data.trainer,
        role: 'trainer'
      }));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get trainer profile
export const getTrainerProfile = async () => {
  try {
    const response = await axios.get(`${API_URL}/profile`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update trainer password
export const updateTrainerPassword = async (passwordData) => {
  try {
    const response = await axios.put(`${API_URL}/password`, passwordData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}; 