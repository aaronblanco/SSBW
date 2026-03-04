const fs = require('fs/promises');
const path = require('path');
const dotenv = require('dotenv');
const productService = require('../services/productService');

dotenv.config();

async function main() {
  const maxPages = Number(process.env.SCRAPE_MAX_PAGES || 4);
  const headless = process.env.SCRAPE_HEADLESS !== 'false';

  const { items, scrapedCount, savedCount } = await productService.scrapeAndSaveKiwokoProducts({
    maxPages,
    headless
  });
  const outPath = path.resolve(process.cwd(), 'data', 'kiwoko-products.json');

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(items, null, 2), 'utf-8');

  console.log(`Productos extraídos: ${scrapedCount}`);
  console.log(`Productos guardados (upsert): ${savedCount}`);
  console.log(`JSON generado en: ${outPath}`);
}

main().catch((error) => {
  console.error('Error ejecutando el scraping:', error);
  process.exitCode = 1;
});
