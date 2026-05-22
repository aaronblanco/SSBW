const cartRepository = require('../repositories/cartRepository');

function normalizeItemPayload(payload = {}) {
  const id = Number(payload.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('ID de producto invalido');
  }

  const title = String(payload.title || '').trim();
  if (!title) {
    throw new Error('Titulo de producto obligatorio');
  }

  const price = Number(payload.price);
  const safePrice = Number.isFinite(price) ? price : 0;

  return {
    id,
    title,
    price: safePrice,
    image: payload.image ? String(payload.image) : null,
    url: payload.url ? String(payload.url) : null
  };
}

function cartTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function cartCount(items) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

function toCartItem(row) {
  return {
    id: row.productId,
    title: row.title,
    price: row.price,
    image: row.image,
    url: row.url,
    quantity: row.quantity
  };
}

async function listCart(userId) {
  const rows = await cartRepository.listByUser(userId);
  const items = rows.map(toCartItem);
  return {
    items,
    count: cartCount(items),
    totalAmount: cartTotal(items)
  };
}

async function addToCart(userId, payload) {
  const product = normalizeItemPayload(payload);
  await cartRepository.addOne(userId, product);
  return listCart(userId);
}

async function removeFromCart(userId, productId) {
  const safeProductId = Number(productId);
  if (!Number.isInteger(safeProductId) || safeProductId <= 0) {
    throw new Error('ID de producto invalido');
  }

  await cartRepository.removeOne(userId, safeProductId);
  return listCart(userId);
}

async function clearCart(userId) {
  await cartRepository.clearByUser(userId);
  return listCart(userId);
}

module.exports = {
  listCart,
  addToCart,
  removeFromCart,
  clearCart
};
