const express = require('express');
const router = express.Router();
const { getRides } = require('../controllers/rideController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getRides);

module.exports = router;