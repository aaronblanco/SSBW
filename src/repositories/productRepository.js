const prisma = require('../prisma/client');

function buildSearchWhere(search) {
  if (!search) {
    return {};
  }

  return {
    OR: [
      { title: { contains: search, mode: 'insensitive' } },
      { source: { contains: search, mode: 'insensitive' } }
    ]
  };
}

async function upsertMany(products) {
  if (!Array.isArray(products) || products.length === 0) {
    return 0;
  }

  let savedCount = 0;

  for (const product of products) {
    if (!product.url) {
      continue;
    }

    await prisma.product.upsert({
      where: { url: product.url },
      create: {
        source: product.source,
        title: product.title,
        price: product.price,
        rawPrice: product.rawPrice,
        currency: product.currency || 'EUR',
        url: product.url,
        image: product.image,
        scrapedAt: new Date(product.scrapedAt)
      },
      update: {
        source: product.source,
        title: product.title,
        price: product.price,
        rawPrice: product.rawPrice,
        currency: product.currency || 'EUR',
        image: product.image,
        scrapedAt: new Date(product.scrapedAt)
      }
    });

    savedCount += 1;
  }

  return savedCount;
}

async function findMany({ take = 20, skip = 0, search = '' } = {}) {
  const where = buildSearchWhere(search);

  return prisma.product.findMany({
    where,
    orderBy: { scrapedAt: 'desc' },
    take,
    skip
  });
}

async function count({ search = '' } = {}) {
  const where = buildSearchWhere(search);
  return prisma.product.count({ where });
}

module.exports = {
  upsertMany,
  findMany,
  count
};
