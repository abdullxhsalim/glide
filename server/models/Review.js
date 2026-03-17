const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
    // Optional, but good for verification
  },
  rating: {
    type: Number,
    required: true,
    min: 1, 
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, { timestamps: true });

// Prevent multiple reviews for the same ride by the same author for the same recipient
reviewSchema.index({ ride: 1, author: 1, recipient: 1 }, { unique: true });

// Static method to calculate average rating
reviewSchema.statics.calcAverageRatings = async function(userId) {
  const stats = await this.aggregate([
    {
      $match: { recipient: userId }
    },
    {
      $group: {
        _id: '$recipient',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await mongoose.model('User').findByIdAndUpdate(userId, {
      rating: stats[0].avgRating,
      totalRatings: stats[0].nRating
    });
  } else {
    await mongoose.model('User').findByIdAndUpdate(userId, {
      rating: 0,
      totalRatings: 0
    });
  }
};

// Middleware to calculate average rating after save
reviewSchema.post('save', function() {
  this.constructor.calcAverageRatings(this.recipient);
});

// Middleware to calculate average rating before remove/findOneAndRemove
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  if (this.r) {
    await this.r.constructor.calcAverageRatings(this.r.recipient);
  }
});

module.exports = mongoose.model('Review', reviewSchema);
