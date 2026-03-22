const express = require('express');
const router = express.Router();
const { getRoute } = require('../controllers/mapController');

router.post('/route', getRoute);

module.exports = router;