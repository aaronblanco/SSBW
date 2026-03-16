const { scrapeKiwokoCatsProducts } = require('../scraper/kiwokoScraper');
const productRepository = require('../repositories/productRepository');

function parseFirstPrice(rawPrice) {
  if (!rawPrice) {
    return null;
  }
  const match = String(rawPrice).match(/(\d+[.,]\d+|\d+)/);
  if (!match) {
    return null;
  }
  const value = Number(match[1].replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

function normalizeProductPrice(item) {
  if (!item) {
    return item;
  }

  const resolvedPrice = Number.isFinite(item.price) ? item.price : parseFirstPrice(item.rawPrice);
  const normalizedRawPrice = Number.isFinite(resolvedPrice)
    ? `${resolvedPrice.toFixed(2)} EUR`
    : item.rawPrice;

  return {
    ...item,
    price: resolvedPrice,
    rawPrice: normalizedRawPrice
  };
}

async function scrapeAndSaveKiwokoProducts({ maxPages = 4, headless = true } = {}) {
  const items = await scrapeKiwokoCatsProducts({ maxPages, headless });

  const savedCount = await productRepository.upsertMany(items);

  return {
    scrapedCount: items.length,
    savedCount,
    items
  };
}

async function listProducts({ take = 20, skip = 0, search = '' } = {}) {
  const safeTake = Math.max(1, Math.min(take, 100));
  const safeSkip = Math.max(0, skip);

  const [items, total] = await Promise.all([
    productRepository.findMany({
      take: safeTake,
      skip: safeSkip,
      search
    }),
    productRepository.count({ search })
  ]);

  return {
    total,
    take: safeTake,
    skip: safeSkip,
    items: items.map(normalizeProductPrice)
  };
}

async function getProductById(id) {
  const safeId = Number(id);
  if (!Number.isInteger(safeId) || safeId <= 0) {
    return null;
  }

  const item = await productRepository.findById(safeId);
  return normalizeProductPrice(item);
}

async function createProduct(payload) {
  const now = new Date();

  return productRepository.createProduct({
    source: String(payload.source || 'manual').trim() || 'manual',
    title: String(payload.title || '').trim(),
    price: payload.price == null || payload.price === '' ? null : Number(payload.price),
    rawPrice: String(payload.rawPrice || '').trim() || null,
    currency: String(payload.currency || 'EUR').trim() || 'EUR',
    url: String(payload.url || '').trim(),
    image: String(payload.image || '').trim() || null,
    scrapedAt: payload.scrapedAt ? new Date(payload.scrapedAt) : now
  });
}

async function updateProduct(id, payload) {
  const safeId = Number(id);
  if (!Number.isInteger(safeId) || safeId <= 0) {
    return null;
  }

  return productRepository.updateProduct(safeId, {
    source: payload.source == null ? undefined : String(payload.source).trim(),
    title: payload.title == null ? undefined : String(payload.title).trim(),
    price: payload.price == null || payload.price === '' ? undefined : Number(payload.price),
    rawPrice: payload.rawPrice == null ? undefined : String(payload.rawPrice).trim(),
    currency: payload.currency == null ? undefined : String(payload.currency).trim(),
    url: payload.url == null ? undefined : String(payload.url).trim(),
    image: payload.image == null ? undefined : String(payload.image).trim() || null,
    scrapedAt: payload.scrapedAt == null ? undefined : new Date(payload.scrapedAt)
  });
}

async function deleteProduct(id) {
  const safeId = Number(id);
  if (!Number.isInteger(safeId) || safeId <= 0) {
    return null;
  }

  return productRepository.deleteProduct(safeId);
}

module.exports = {
  scrapeAndSaveKiwokoProducts,
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
