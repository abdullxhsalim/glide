const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  origin: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
    placeName: { type: String },
    address: { type: String, required: true } // Human readable address
  },
  
  destination: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
    placeName: { type: String },
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
  
  totalFuelCost: { type: Number, required: true }, // The total cost to be split
  pricePerSeat: { type: Number }, // Snapshot or initial estimate (optional now)
  
  routeData: {
    distanceKm: { type: Number },
    durationMin: { type: Number },
    geometry: { type: String } // Encoded polyline or similar for mapping
  },
  
  // Decoded path for geospatial queries (Is Near Route?)
  // Only set if we have valid coordinates (don't set type without coordinates)
  path: {
     type: { 
       type: String, 
       enum: ['LineString']
     },
     coordinates: { 
       type: [[Number]]
     }
  },

  preferences: {
    smoking: { type: Boolean, default: false },
    music: { type: Boolean, default: true },
    ac: { type: Boolean, default: true },
    quietPayload: { type: Boolean, default: false }, // "Quiet mode"
    pets: { type: Boolean, default: false },
    expressway: { type: Boolean, default: false }, // "Expressway Tolls"
    multipleStoppages: { type: Boolean, default: false } // "Multiple Stoppages"
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

// Index for Geospatial queries (sparse so documents without path don't cause validation errors)
rideSchema.index({ 'path': '2dsphere' }, { sparse: true });

// Index for Geospatial queries
rideSchema.index({ 'origin.coordinates': '2dsphere' });
rideSchema.index({ 'destination.coordinates': '2dsphere' });

module.exports = mongoose.model('Ride', rideSchema);
