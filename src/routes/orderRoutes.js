const express = require('express');
const orderController = require('../controllers/orderController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/my', requireAuth, orderController.listMyOrders);

module.exports = router;
