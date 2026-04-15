const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema(
  {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
    placeName: { type: String, default: '' },
    address: { type: String, required: true }
  },
  { _id: false }
);

const partnerRequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pickup: { type: pointSchema, required: true },
    destination: { type: pointSchema, required: true },
    requestedAt: { type: Date, required: true },
    requestedTimeLabel: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'matched', 'cancelled'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

partnerRequestSchema.index({ requester: 1, requestedAt: -1 });

module.exports = mongoose.model('PartnerRequest', partnerRequestSchema);
