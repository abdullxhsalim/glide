const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { chatForUserSide, chatForAdminSide } = require('../controllers/aiController');

router.post('/chat/user', protect, chatForUserSide);
router.post('/chat/admin', protect, admin, chatForAdminSide);

module.exports = router;
