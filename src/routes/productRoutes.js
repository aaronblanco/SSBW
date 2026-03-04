const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

router.get('/', productController.listProducts);
router.post('/scrape/kiwoko', productController.scrapeAndSaveKiwokoProducts);
router.get('/scrape/kiwoko', productController.scrapeAndSaveKiwokoProducts);

module.exports = router;
