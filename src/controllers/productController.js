const productService = require('../services/productService');
const { broadcast } = require('../websocket/wsHub');

async function scrapeAndSaveKiwokoProducts(req, res) {
  const maxPages = Number(req.query.maxPages || req.body?.maxPages || 4);
  const headless = (req.query.headless || req.body?.headless || 'true') !== 'false';

  try {
    const result = await productService.scrapeAndSaveKiwokoProducts({
      maxPages,
      headless
    });

    broadcast('scrape-completed', {
      scrapedCount: result.scrapedCount,
      savedCount: result.savedCount
    });

    res.json({
      source: 'https://www.kiwoko.com/gatos/',
      scrapedCount: result.scrapedCount,
      savedCount: result.savedCount,
      items: result.items
    });
  } catch (error) {
    res.status(500).json({
      error: 'No se pudo completar el scraping/guardado',
      detail: error.message
    });
  }
}

async function listProducts(req, res) {
  const take = Number(req.query.take || 20);
  const skip = Number(req.query.skip || 0);
  const search = String(req.query.search || '').trim();

  try {
    const result = await productService.listProducts({
      take,
      skip,
      search
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'No se pudieron listar los productos',
      detail: error.message
    });
  }
}

module.exports = {
  scrapeAndSaveKiwokoProducts,
  listProducts
};
