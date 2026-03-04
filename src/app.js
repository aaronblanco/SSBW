const express = require('express');
const cors = require('cors');
const path = require('path');
const productRoutes = require('./routes/productRoutes');
const productController = require('./controllers/productController');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '..', 'public')));

app.get('/health', (_, res) => {
  res.json({ ok: true, service: 'ssbw-backend' });
});

app.get('/', (_, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'public', 'index.html'));
});

app.use('/api/products', productRoutes);
app.get('/api/scrape/kiwoko', productController.scrapeAndSaveKiwokoProducts);

module.exports = app;
