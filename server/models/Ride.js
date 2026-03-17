const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  origin: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
    address: { type: String, required: true } // Human readable address
  },
  
  destination: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
    address: { type: String, required: true } // Human readable address
  },
  
  departureTime: { type: Date, required: true },
  estimatedArrival: { type: Date },
  
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  
  seatsTotal: { type: Number, required: true, min: 1 },
  seatsBooked: { type: Number, default: 0 },
  
  pricePerSeat: { type: Number, required: true }, // In Taka

  preferences: {
    smoking: { type: Boolean, default: false },
    music: { type: Boolean, default: true },
    ac: { type: Boolean, default: true },
    quietPayload: { type: Boolean, default: false }, // "Quiet mode"
    pets: { type: Boolean, default: false },
    expressway: { type: Boolean, default: false } // "Toggle tolls on"
  },
  
  vehicle: {
    make: String,
    model: String,
    color: String,
    licensePlate: String
  },

  isRecurring: { type: Boolean, default: false },
  recurringDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }]

}, { timestamps: true });

// Index for Geospatial queries
rideSchema.index({ 'origin.coordinates': '2dsphere' });
rideSchema.index({ 'destination.coordinates': '2dsphere' });

module.exports = mongoose.model('Ride', rideSchema);
