const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true
  },
  dateTime: {
    type: Date,
    required: true
  },
  seatsBooked: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  tripPrice: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid'
  },
  pickupLocation: {
    type: { type: String, default: 'Point' }, // GeoJSON
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  dropoffLocation: {
    type: { type: String, default: 'Point' }, // GeoJSON
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  notes: {
    type: String, // Optional user notes like "Luggage" or "Wheelchair"
    trim: true,
    maxlength: 200
  }
}, { timestamps: true });

// Prevent rider from booking the same ride twice
bookingSchema.index({ rider: 1, ride: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);
