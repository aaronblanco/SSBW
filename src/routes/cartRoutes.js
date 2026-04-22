const express = require('express');
const cartController = require('../controllers/cartController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, cartController.listCart);
router.post('/', requireAuth, cartController.addToCart);
router.delete('/:productId', requireAuth, cartController.removeFromCart);
router.delete('/', requireAuth, cartController.clearCart);

module.exports = router;
