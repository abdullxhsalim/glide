const express = require('express');
const router = express.Router();
const {
  autoMatchBooking,
  createBookingRequest,
  getMyBookings,
  getDriverBookings,
  respondToBooking
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/auto-match', protect, autoMatchBooking);
router.post('/', protect, createBookingRequest);
router.get('/mine', protect, getMyBookings);
router.get('/driver', protect, getDriverBookings);
router.patch('/:id/respond', protect, respondToBooking);

module.exports = router;
