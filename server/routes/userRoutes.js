const express = require('express');
const router = express.Router();
const {
	registerUser,
	loginUser,
	getMe,
	updateMe,
	verifyVehicle,
	registerAdmin,
	getAdminOperationsOverview,
	reviewVehicleVerification
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/register-admin', registerAdmin);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/verify-vehicle', protect, verifyVehicle);
router.get('/admin/operations-overview', protect, admin, getAdminOperationsOverview);
router.patch('/admin/vehicle-verifications/:userId', protect, admin, reviewVehicleVerification);

module.exports = router;