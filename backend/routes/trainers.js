const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const {
  createTrainer,
  getAllTrainers,
  getTrainerById,
  updateTrainer,
  deleteTrainer,
  loginTrainer
} = require('../controllers/trainerController');

// Public routes
router.post('/login', loginTrainer);

// Protected routes (require authentication)
router.get('/profile', authenticateToken, getTrainerById);

// Admin routes (require admin authentication)
router.post('/', authenticateToken, isAdmin, createTrainer);
router.get('/', authenticateToken, isAdmin, getAllTrainers);
router.get('/:id', authenticateToken, isAdmin, getTrainerById);
router.put('/:id', authenticateToken, isAdmin, updateTrainer);
router.delete('/:id', authenticateToken, isAdmin, deleteTrainer);

module.exports = router; 