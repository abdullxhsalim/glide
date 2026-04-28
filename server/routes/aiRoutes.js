const express = require('express');
const router = express.Router();
const { adminChat, userChat } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/admin-chat', protect, adminChat);
router.post('/user-chat', protect, userChat);

module.exports = router;
