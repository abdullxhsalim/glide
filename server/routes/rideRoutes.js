const express = require('express');
const router = express.Router();
const { getRides, createRide } = require('../controllers/rideController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getRides);
router.post('/', protect, createRide);

module.exports = router;