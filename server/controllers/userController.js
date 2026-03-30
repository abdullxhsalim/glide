const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d'
  });
};

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, studentId, password, role, vehicle } = req.body;

  try {
    // 1. Basic Validation
    if (!name || !email || !studentId || !password || !role) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    // 2. Role-specific validation
    if (role === 'driver') {
      if (!vehicle || !vehicle.make || !vehicle.model || !vehicle.color || !vehicle.licensePlate) {
        return res.status(400).json({ message: 'Vehicle details are required for drivers' });
      }
    }

    // 3. Check for existing user (Email or Student ID)
    const userExists = await User.findOne({ 
      $or: [{ email }, { studentId }] 
    });

    if (userExists) {
      // Be specific about what already exists for better UX
      if (userExists.email === email) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      if (userExists.studentId === studentId) {
        return res.status(400).json({ message: 'User with this Student ID already exists' });
      }
    }

    // 4. Check for existing license plate if driver
    if (role === 'driver' && vehicle && vehicle.licensePlate) {
      const plateExists = await User.findOne({ 'vehicle.licensePlate': vehicle.licensePlate });
      if (plateExists) {
        return res.status(400).json({ message: 'A vehicle with this license plate is already registered' });
      }
    }

    // 5. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6. Create User
    const userData = {
      name,
      email,
      studentId,
      password: hashedPassword,
      role,
      isVerified: false // Default to false until verified
    };

    if (role === 'driver') {
      userData.vehicle = vehicle;
    }

    const user = await User.create(userData);

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const user = await User.findById(req.user.id).select('-password'); 
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Verify vehicle and upgrade user to driver
// @route   PUT /api/users/verify-vehicle
// @access  Private
const verifyVehicle = async (req, res) => {
  try {
    const { make, model, color, licensePlate, year } = req.body;

    if (!make || !model || !color || !licensePlate) {
      return res.status(400).json({ message: 'Vehicle make, model, color and license plate are required' });
    }

    const existingPlateOwner = await User.findOne({
      'vehicle.licensePlate': licensePlate,
      _id: { $ne: req.user.id }
    });

    if (existingPlateOwner) {
      return res.status(400).json({ message: 'A vehicle with this license plate is already registered' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.vehicle = {
      make,
      model,
      color,
      licensePlate,
      year
    };
    user.role = 'driver';
    user.isVerified = true;

    await user.save();

    res.status(200).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      vehicle: user.vehicle,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Vehicle verification error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  verifyVehicle
};
