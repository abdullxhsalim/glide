const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  make: { type: String, required: true },
  model: { type: String, required: true },
  color: { type: String, required: true },
  licensePlate: { type: String, required: true, unique: true, sparse: true },
  year: { type: Number }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address'] // Basic validation
    // TODO: Add strict institutional email validation logic later
  },
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  contactNumber: {
    type: String,
    trim: true,
    default: ''
  },
  // Legacy compatibility: older records may store phone under this key
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['rider', 'driver', 'admin'],
    default: 'rider'
  },
  vehicle: {
    type: vehicleSchema,
    required: function() { return this.role === 'driver'; }
  },
  rating: {
    type: Number,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  totalRides: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
