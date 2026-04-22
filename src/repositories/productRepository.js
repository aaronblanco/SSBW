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

function resolveOrderBy(sortBy = 'scrapedAt', sortDir = 'desc') {
  const allowedFields = new Set(['id', 'title', 'price', 'source', 'scrapedAt', 'createdAt', 'updatedAt']);
  const safeField = allowedFields.has(sortBy) ? sortBy : 'scrapedAt';
  const safeDir = sortDir === 'asc' ? 'asc' : 'desc';
  return { [safeField]: safeDir };
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

async function findMany({ take = 20, skip = 0, search = '', sortBy = 'scrapedAt', sortDir = 'desc' } = {}) {
  const where = buildSearchWhere(search);
  const orderBy = resolveOrderBy(sortBy, sortDir);

  return prisma.product.findMany({
    where,
    orderBy,
    take,
    skip
  });
}

async function count({ search = '' } = {}) {
  const where = buildSearchWhere(search);
  return prisma.product.count({ where });
}

async function findById(id) {
  return prisma.product.findUnique({
    where: { id }
  });
}

async function createProduct(data) {
  return prisma.product.create({ data });
}

async function updateProduct(id, data) {
  return prisma.product.update({
    where: { id },
    data
  });
}

async function deleteProduct(id) {
  return prisma.product.delete({ where: { id } });
}

module.exports = {
  upsertMany,
  findMany,
  count,
  findById,
  createProduct,
  updateProduct,
  deleteProduct
};
