const prisma = require('../prisma/client');

async function listByUser(userId) {
  return prisma.cartItem.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' }
  });
}

async function addOne(userId, product) {
  return prisma.cartItem.upsert({
    where: {
      userId_productId: {
        userId,
        productId: product.id
      }
    },
    create: {
      userId,
      productId: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      url: product.url,
      quantity: 1
    },
    update: {
      title: product.title,
      price: product.price,
      image: product.image,
      url: product.url,
      quantity: {
        increment: 1
      }
    }
  });
}

async function removeOne(userId, productId) {
  const existing = await prisma.cartItem.findUnique({
    where: {
      userId_productId: {
        userId,
        productId
      }
    }
  });

  if (!existing) {
    return null;
  }

  if (existing.quantity > 1) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: {
        quantity: {
          decrement: 1
        }
      }
    });
    return 'updated';
  }

  await prisma.cartItem.delete({
    where: { id: existing.id }
  });
  return 'deleted';
}

async function clearByUser(userId) {
  return prisma.cartItem.deleteMany({
    where: { userId }
  });
}

module.exports = {
  listByUser,
  addOne,
  removeOne,
  clearByUser
};
