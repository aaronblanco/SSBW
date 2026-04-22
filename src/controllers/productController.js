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
  const hasDesdeHasta = req.query.desde != null || req.query.hasta != null;
  const desde = Number(req.query.desde || 1);
  const hasta = Number(req.query.hasta || 20);
  const take = hasDesdeHasta ? Math.max(1, hasta - desde + 1) : Number(req.query.take || 20);
  const skip = hasDesdeHasta ? Math.max(0, desde - 1) : Number(req.query.skip || 0);
  const search = String(req.query.search || '').trim();
  const sortBy = String(req.query.sortBy || req.query.ordenacionCampo || req.query.orderBy || 'scrapedAt').trim();
  const sortDir = String(req.query.sortDir || req.query.ordenacion || req.query.order || 'desc').trim();

  try {
    const result = await productService.listProducts({
      take,
      skip,
      search,
      sortBy,
      sortDir
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'No se pudieron listar los productos',
      detail: error.message
    });
  }
}

async function getProductDetail(req, res) {
  const id = Number(req.params.id);

  try {
    const item = await productService.getProductById(id);

    if (!item) {
      res.status(404).json({
        error: 'Producto no encontrado'
      });
      return;
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({
      error: 'No se pudo obtener el detalle del producto',
      detail: error.message
    });
  }
}

async function createProduct(req, res) {
  try {
    const item = await productService.createProduct(req.body || {});
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({
      error: 'No se pudo crear el producto',
      detail: error.message
    });
  }
}

async function updateProduct(req, res) {
  try {
    const item = await productService.updateProduct(req.params.id, req.body || {});
    if (!item) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }
    res.json(item);
  } catch (error) {
    res.status(400).json({
      error: 'No se pudo actualizar el producto',
      detail: error.message
    });
  }
}

async function deleteProduct(req, res) {
  try {
    const item = await productService.deleteProduct(req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }
    res.json({ ok: true, id: item.id });
  } catch (error) {
    res.status(400).json({
      error: 'No se pudo eliminar el producto',
      detail: error.message
    });
  }
}

module.exports = {
  scrapeAndSaveKiwokoProducts,
  listProducts,
  getProductDetail,
  createProduct,
  updateProduct,
  deleteProduct
};
