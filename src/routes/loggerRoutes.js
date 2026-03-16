const express = require('express');
const loggerController = require('../controllers/loggerController');

const router = express.Router();

router.post('/cart', loggerController.logCartEvent);

module.exports = router;
