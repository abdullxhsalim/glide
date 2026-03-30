const express = require('express');
const router = express.Router();
const { getRides, createRide, getMyRides, updateMyRide, deleteMyRide } = require('../controllers/rideController');
const { protect } = require('../middleware/authMiddleware');

router.get('/mine', protect, getMyRides);
router.get('/', protect, getRides);
router.post('/', protect, createRide);
router.put('/:id', protect, updateMyRide);
router.delete('/:id', protect, deleteMyRide);

module.exports = router;