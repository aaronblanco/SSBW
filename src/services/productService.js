const { scrapeKiwokoCatsProducts } = require('../scraper/kiwokoScraper');
const productRepository = require('../repositories/productRepository');

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
    items
  };
}

module.exports = {
  scrapeAndSaveKiwokoProducts,
  listProducts
};
