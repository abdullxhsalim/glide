const express = require('express');
const router = express.Router();
const { getRides, findPartners, createPartnerRequest, getMyPartnerRequests, updateMyPartnerRequest, deleteMyPartnerRequest, createRide, getMyRides, updateMyRide, deleteMyRide } = require('../controllers/rideController');
const { protect } = require('../middleware/authMiddleware');

router.get('/mine', protect, getMyRides);
router.get('/find-partners', protect, findPartners);
router.post('/partner-requests', protect, createPartnerRequest);
router.get('/partner-requests/mine', protect, getMyPartnerRequests);
router.put('/partner-requests/:id', protect, updateMyPartnerRequest);
router.delete('/partner-requests/:id', protect, deleteMyPartnerRequest);
router.get('/', protect, getRides);
router.post('/', protect, createRide);
router.put('/:id', protect, updateMyRide);
router.delete('/:id', protect, deleteMyRide);

module.exports = router;