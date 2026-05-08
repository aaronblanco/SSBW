const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const productRoutes = require('./routes/productRoutes');
const productController = require('./controllers/productController');
const loggerRoutes = require('./routes/loggerRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const authService = require('./services/authService');

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

function resolveCorsOrigins() {
  const raw = String(process.env.CORS_ORIGINS || '').trim();
  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const corsOrigins = resolveCorsOrigins();
const corsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (!corsOrigins.length || corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origen no permitido por CORS'));
  }
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const reactDistDir = path.resolve(__dirname, '..', 'web', 'dist');
const publicDir = path.resolve(__dirname, '..', 'public');
const frontendDir = fs.existsSync(reactDistDir) ? reactDistDir : publicDir;

app.use(express.static(frontendDir));

app.get('/health', (_, res) => {
  res.json({ ok: true, service: 'ssbw-backend' });
});

app.get('/', (_, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

authService.ensureDefaultAdmin().catch((error) => {
  console.error('No se pudo crear usuario admin por defecto:', error.message);
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/logs', loggerRoutes);
app.use('/api/orders', orderRoutes);
app.get('/api/scrape/kiwoko', productController.scrapeAndSaveKiwokoProducts);

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path === '/health') {
    next();
    return;
  }

  res.sendFile(path.join(frontendDir, 'index.html'));
});

module.exports = app;
