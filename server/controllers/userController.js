const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Ride = require('../models/Ride');
const Booking = require('../models/Booking');

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d'
  });
};

const getResolvedContactNumber = (user) => {
  if (!user) return '';
  return user.contactNumber || user.phone || '';
};

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, studentId, contactNumber, password, role, vehicle } = req.body;

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
      contactNumber: contactNumber || '',
      phone: contactNumber || '',
      password: hashedPassword,
      role,
      isVerified: false // Default to false until verified
    };

    if (role === 'driver') {
      userData.vehicle = vehicle;
      userData.vehicleVerificationStatus = 'pending';
      userData.vehicleVerificationRequestedAt = new Date();
    }

    const user = await User.create(userData);

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        contactNumber: getResolvedContactNumber(user),
        role: user.role,
        isVerified: user.isVerified,
        vehicleVerificationStatus: user.vehicleVerificationStatus,
        vehicleVerificationRequestedAt: user.vehicleVerificationRequestedAt,
        vehicle: user.vehicle,
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
        studentId: user.studentId,
        contactNumber: getResolvedContactNumber(user),
        role: user.role,
        isVerified: user.isVerified,
        vehicleVerificationStatus: user.vehicleVerificationStatus,
        vehicleVerificationRequestedAt: user.vehicleVerificationRequestedAt,
        vehicle: user.vehicle,
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

// @desc    Authenticate an admin user
// @route   POST /api/users/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const normalizedUsername = String(username || '').trim().toLowerCase();

    if (!normalizedUsername || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const adminUser = await User.findOne({ username: normalizedUsername, role: 'admin' });

    if (adminUser && (await bcrypt.compare(password, adminUser.password))) {
      return res.json({
        _id: adminUser.id,
        name: adminUser.name,
        username: adminUser.username,
        email: adminUser.email,
        studentId: adminUser.studentId,
        contactNumber: getResolvedContactNumber(adminUser),
        role: adminUser.role,
        isVerified: adminUser.isVerified,
        vehicleVerificationStatus: adminUser.vehicleVerificationStatus,
        vehicleVerificationRequestedAt: adminUser.vehicleVerificationRequestedAt,
        vehicle: adminUser.vehicle,
        token: generateToken(adminUser._id)
      });
    }

    return res.status(401).json({ message: 'Invalid username or password' });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const user = await User.findById(req.user.id).select('-password');

    if (user && !user.contactNumber && user.phone) {
      user.contactNumber = user.phone;
      await user.save();
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
const updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, email, studentId, contactNumber, vehicle } = req.body;

    if (name !== undefined) {
      user.name = String(name).trim();
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const emailOwner = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id }
      });

      if (emailOwner) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      user.email = normalizedEmail;
    }

    if (studentId !== undefined) {
      const normalizedStudentId = String(studentId).trim();
      const studentOwner = await User.findOne({
        studentId: normalizedStudentId,
        _id: { $ne: user._id }
      });

      if (studentOwner) {
        return res.status(400).json({ message: 'User with this Student ID already exists' });
      }

      user.studentId = normalizedStudentId;
    }

    if (contactNumber !== undefined) {
      const normalized = String(contactNumber).trim();
      user.contactNumber = normalized;
      user.phone = normalized;
    }

    if (vehicle && user.role === 'driver') {
      const mergedVehicle = {
        ...(user.vehicle ? user.vehicle.toObject ? user.vehicle.toObject() : user.vehicle : {}),
        ...vehicle
      };

      if (mergedVehicle.licensePlate) {
        const plateOwner = await User.findOne({
          'vehicle.licensePlate': mergedVehicle.licensePlate,
          _id: { $ne: user._id }
        });

        if (plateOwner) {
          return res.status(400).json({ message: 'A vehicle with this license plate is already registered' });
        }
      }

      user.vehicle = {
        make: mergedVehicle.make,
        model: mergedVehicle.model,
        color: mergedVehicle.color,
        licensePlate: mergedVehicle.licensePlate,
        year: mergedVehicle.year
      };
    }

    await user.save();

    res.status(200).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      contactNumber: getResolvedContactNumber(user),
      role: user.role,
      isVerified: user.isVerified,
      vehicleVerificationStatus: user.vehicleVerificationStatus,
      vehicleVerificationRequestedAt: user.vehicleVerificationRequestedAt,
      vehicle: user.vehicle,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Update profile error:', error);
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
    user.isVerified = false;
    user.vehicleVerificationStatus = 'pending';
    user.vehicleVerificationRequestedAt = new Date();
    user.vehicleVerificationReviewedAt = undefined;
    user.vehicleVerificationReviewedBy = undefined;

    await user.save();

    res.status(200).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      contactNumber: getResolvedContactNumber(user),
      role: user.role,
      isVerified: user.isVerified,
      vehicleVerificationStatus: user.vehicleVerificationStatus,
      vehicleVerificationRequestedAt: user.vehicleVerificationRequestedAt,
      vehicle: user.vehicle,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Vehicle verification error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Register new admin
// @route   POST /api/users/register-admin
// @access  Public
const registerAdmin = async (req, res) => {
  const { name, username, email, password } = req.body;

  try {
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    const normalizedUsername = String(username).trim().toLowerCase();
    const normalizedEmail = String(email).trim().toLowerCase();

    const userExists = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }]
    });

    if (userExists) {
      if (userExists.email === normalizedEmail) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      if (userExists.username === normalizedUsername) {
        return res.status(400).json({ message: 'Username is already in use' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const adminUser = await User.create({
      name: String(name).trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'admin',
      isVerified: true
    });

    return res.status(201).json({
      _id: adminUser.id,
      name: adminUser.name,
      username: adminUser.username,
      email: adminUser.email,
      studentId: adminUser.studentId,
      contactNumber: getResolvedContactNumber(adminUser),
      role: adminUser.role,
      isVerified: adminUser.isVerified,
      vehicleVerificationStatus: adminUser.vehicleVerificationStatus,
      vehicleVerificationRequestedAt: adminUser.vehicleVerificationRequestedAt,
      vehicle: adminUser.vehicle,
      token: generateToken(adminUser._id)
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    return res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Get admin operations overview
// @route   GET /api/users/admin/operations-overview
// @access  Private/Admin
const getAdminOperationsOverview = async (_req, res) => {
  try {
    const [
      totalUsers,
      totalHoppers,
      totalSharers,
      pendingVehicleVerifications,
      totalRidePosts,
      totalMatchmakingRequests,
      hoppers,
      sharers,
      pendingVehicleUsers,
      rides,
      matchmakingRequests
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: { $in: ['rider', 'hopper'] } }),
      User.countDocuments({ role: 'driver' }),
      User.countDocuments({ vehicleVerificationStatus: 'pending' }),
      Ride.countDocuments({}),
      Booking.countDocuments({}),
      User.find({ role: { $in: ['rider', 'hopper'] } })
        .select('name email studentId role isVerified totalRides createdAt')
        .sort({ createdAt: -1 })
        .limit(100),
      User.find({ role: 'driver' })
        .select('name email studentId role isVerified totalRides vehicle vehicleVerificationStatus createdAt')
        .sort({ createdAt: -1 })
        .limit(100),
      User.find({ vehicleVerificationStatus: 'pending' })
        .select('name email studentId role vehicle vehicleVerificationStatus vehicleVerificationRequestedAt createdAt')
        .sort({ vehicleVerificationRequestedAt: 1, createdAt: 1 })
        .limit(100),
      Ride.find({})
        .populate('driver', 'name email')
        .sort({ createdAt: -1 })
        .limit(100),
      Booking.find({})
        .populate('rider', 'name email')
        .populate('driver', 'name email')
        .populate('ride', 'origin destination')
        .sort({ createdAt: -1 })
        .limit(100)
    ]);

    const rideIds = rides.map((ride) => ride._id);
    const acceptedRideBookings = await Booking.find({
      ride: { $in: rideIds },
      status: 'accepted'
    })
      .populate('rider', 'name email studentId')
      .select('ride rider seatsBooked status')
      .lean();

    const acceptedHoppersByRide = acceptedRideBookings.reduce((acc, booking) => {
      const rideId = String(booking.ride);
      if (!acc[rideId]) {
        acc[rideId] = [];
      }

      acc[rideId].push({
        _id: booking.rider?._id,
        name: booking.rider?.name || 'Unknown',
        email: booking.rider?.email || 'N/A',
        studentId: booking.rider?.studentId || 'N/A',
        seatsBooked: booking.seatsBooked || 0
      });

      return acc;
    }, {});

    const ridesWithAcceptedHoppers = rides.map((ride) => {
      const rideObj = ride.toObject();
      rideObj.acceptedHoppers = acceptedHoppersByRide[String(ride._id)] || [];
      return rideObj;
    });

    return res.status(200).json({
      summary: {
        totalUsers,
        totalHoppers,
        totalSharers,
        pendingVehicleVerifications,
        totalRidePosts,
        totalMatchmakingRequests
      },
      hoppers,
      sharers,
      pendingVehicleVerifications: pendingVehicleUsers,
      rides: ridesWithAcceptedHoppers,
      matchmakingRequests
    });
  } catch (error) {
    console.error('Admin operations overview error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Review vehicle verification request
// @route   PATCH /api/users/admin/vehicle-verifications/:userId
// @access  Private/Admin
const reviewVehicleVerification = async (req, res) => {
  const { action } = req.body;
  const { userId } = req.params;

  try {
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be either approve or reject' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser.role !== 'driver') {
      return res.status(400).json({ message: 'Only driver verification requests can be reviewed' });
    }

    if (targetUser.vehicleVerificationStatus !== 'pending') {
      return res.status(400).json({ message: 'This verification request is not pending' });
    }

    targetUser.vehicleVerificationStatus = action === 'approve' ? 'approved' : 'rejected';
    targetUser.vehicleVerificationReviewedAt = new Date();
    targetUser.vehicleVerificationReviewedBy = req.user.id;
    targetUser.isVerified = action === 'approve';

    await targetUser.save();

    return res.status(200).json({
      message: `Vehicle verification ${action}d successfully`,
      user: {
        _id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        vehicleVerificationStatus: targetUser.vehicleVerificationStatus,
        isVerified: targetUser.isVerified
      }
    });
  } catch (error) {
    console.error('Review vehicle verification error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Admin update any user
// @route   PUT /api/users/admin/users/:userId
// @access  Private/Admin
const adminUpdateUser = async (req, res) => {
  const { userId } = req.params;
  const { name, email, studentId, contactNumber, role, isVerified } = req.body;

  try {
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateSet = {};
    const updateUnset = {};

    if (name !== undefined) {
      updateSet.name = String(name).trim();
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const emailOwner = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: existingUser._id }
      });

      if (emailOwner) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      updateSet.email = normalizedEmail;
    }

    if (studentId !== undefined) {
      const normalizedStudentId = String(studentId).trim();

      if (normalizedStudentId) {
        const studentOwner = await User.findOne({
          studentId: normalizedStudentId,
          _id: { $ne: existingUser._id }
        });

        if (studentOwner) {
          return res.status(400).json({ message: 'User with this Student ID already exists' });
        }

        updateSet.studentId = normalizedStudentId;
      } else {
        updateUnset.studentId = 1;
      }
    }

    if (contactNumber !== undefined) {
      const normalizedContact = String(contactNumber).trim();
      updateSet.contactNumber = normalizedContact;
      updateSet.phone = normalizedContact;
    }

    if (role !== undefined) {
      let normalizedRole = String(role).trim().toLowerCase();
      if (normalizedRole === 'sharer') normalizedRole = 'driver';
      if (normalizedRole === 'hopper') normalizedRole = 'rider';
      const allowedRoles = ['rider', 'driver', 'admin'];

      if (!allowedRoles.includes(normalizedRole)) {
        return res.status(400).json({ message: 'Invalid role value' });
      }

      updateSet.role = normalizedRole;
    }

    if (isVerified !== undefined) {
      updateSet.isVerified = Boolean(isVerified);
    }

    const updateQuery = {};
    if (Object.keys(updateSet).length > 0) {
      updateQuery.$set = updateSet;
    }
    if (Object.keys(updateUnset).length > 0) {
      updateQuery.$unset = updateUnset;
    }

    if (Object.keys(updateQuery).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided to update' });
    }

    await User.updateOne({ _id: existingUser._id }, updateQuery);

    const updatedUser = await User.findById(existingUser._id).select('-password');
    return res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Admin delete any user
// @route   DELETE /api/users/admin/users/:userId
// @access  Private/Admin
const adminDeleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.deleteOne({ _id: targetUser._id });

    return res.status(200).json({
      message: 'User deleted successfully',
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email
      }
    });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  loginAdmin,
  getMe,
  updateMe,
  verifyVehicle,
  registerAdmin,
  getAdminOperationsOverview,
  reviewVehicleVerification,
  adminUpdateUser,
  adminDeleteUser
};
