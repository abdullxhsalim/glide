const express = require('express');
const router = express.Router();
const {
	registerUser,
	loginUser,
	loginAdmin,
	getMe,
	updateMe,
	verifyVehicle,
	getAdminOperationsOverview,
	reviewVehicleVerification,
	adminUpdateUser,
	adminDeleteUser
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/admin/login', loginAdmin);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/verify-vehicle', protect, verifyVehicle);
router.get('/admin/operations-overview', protect, admin, getAdminOperationsOverview);
router.patch('/admin/vehicle-verifications/:userId', protect, admin, reviewVehicleVerification);
router.put('/admin/users/:userId', protect, admin, adminUpdateUser);
router.delete('/admin/users/:userId', protect, admin, adminDeleteUser);

module.exports = router;