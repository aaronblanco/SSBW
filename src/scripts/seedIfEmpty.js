const dotenv = require('dotenv');
const prisma = require('../prisma/client');
const productService = require('../services/productService');

dotenv.config();

async function main() {
  const existingCount = await prisma.product.count();

  if (existingCount > 0) {
    console.log(`Seed omitido: ya existen ${existingCount} productos en la base de datos.`);
    return;
  }

  const maxPages = Number(process.env.SCRAPE_MAX_PAGES || 4);
  const headless = process.env.SCRAPE_HEADLESS !== 'false';

  console.log('Base vacía: ejecutando scrape inicial de productos...');

  const { scrapedCount, savedCount } = await productService.scrapeAndSaveKiwokoProducts({
    maxPages,
    headless
  });

  console.log(`Scrape inicial completado: extraídos=${scrapedCount}, guardados=${savedCount}`);
}

main()
  .catch((error) => {
    console.error('Error ejecutando el seed inicial:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });