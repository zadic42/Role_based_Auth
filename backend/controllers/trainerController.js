const Trainer = require('../models/Trainer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

// Create a new trainer (admin only)
exports.createTrainer = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if trainer already exists
    const existingTrainer = await Trainer.findOne({ email });
    if (existingTrainer) {
      return res.status(400).json({ message: 'Trainer with this email already exists' });
    }

    // Create new trainer
    const trainer = new Trainer({
      name,
      email,
      password
    });

    await trainer.save();

    res.status(201).json({
      message: 'Trainer created successfully',
      trainer: {
        id: trainer._id,
        name: trainer.name,
        email: trainer.email,
        role: trainer.role,
        isActive: trainer.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating trainer', error: error.message });
  }
};

// Get all trainers (admin only)
exports.getAllTrainers = async (req, res) => {
  try {
    const trainers = await Trainer.find().select('-password');
    res.json(trainers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trainers', error: error.message });
  }
};

// Get trainer by ID (admin only)
exports.getTrainerById = async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.params.id).select('-password');
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }
    res.json(trainer);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trainer', error: error.message });
  }
};

// Update trainer (admin only)
exports.updateTrainer = async (req, res) => {
  try {
    const { name, email, isActive } = req.body;
    const trainer = await Trainer.findById(req.params.id);

    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }

    // Update fields
    if (name) trainer.name = name;
    if (email) trainer.email = email;
    if (typeof isActive === 'boolean') trainer.isActive = isActive;

    await trainer.save();

    res.json({
      message: 'Trainer updated successfully',
      trainer: {
        id: trainer._id,
        name: trainer.name,
        email: trainer.email,
        role: trainer.role,
        isActive: trainer.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating trainer', error: error.message });
  }
};

// Delete trainer (admin only)
exports.deleteTrainer = async (req, res) => {
  try {
    const trainer = await Trainer.findByIdAndDelete(req.params.id);
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }
    res.json({ message: 'Trainer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting trainer', error: error.message });
  }
};

// Trainer login
exports.loginTrainer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find trainer by email
    const trainer = await Trainer.findOne({ email });
    if (!trainer) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if trainer is active
    if (!trainer.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Verify password
    const isMatch = await trainer.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: trainer._id,
        role: trainer.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      trainer: {
        id: trainer._id,
        name: trainer.name,
        email: trainer.email,
        role: trainer.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error during login', error: error.message });
  }
};

// Get trainer profile
exports.getTrainerProfile = async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.user.id).select('-password');
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }
    res.json(trainer);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

// Update trainer password
exports.updateTrainerPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const trainer = await Trainer.findById(req.user.id);

    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }

    // Verify current password
    const isMatch = await trainer.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    trainer.password = newPassword;
    await trainer.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating password', error: error.message });
  }
}; 