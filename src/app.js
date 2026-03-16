const express = require('express');
const cors = require('cors');
const path = require('path');
const productRoutes = require('./routes/productRoutes');
const productController = require('./controllers/productController');
const loggerRoutes = require('./routes/loggerRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authService = require('./services/authService');

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

authService.ensureDefaultAdmin().catch((error) => {
  console.error('No se pudo crear usuario admin por defecto:', error.message);
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/logs', loggerRoutes);
app.use('/api/orders', orderRoutes);
app.get('/api/scrape/kiwoko', productController.scrapeAndSaveKiwokoProducts);

module.exports = app;
