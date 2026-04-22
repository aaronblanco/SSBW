const cartsByUser = new Map();

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

function readCart(userId) {
  return cartsByUser.get(userId) || [];
}

function writeCart(userId, items) {
  cartsByUser.set(userId, items);
  return items;
}

function cartTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function cartCount(items) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

function listCart(userId) {
  const items = readCart(userId);
  return {
    items,
    count: cartCount(items),
    totalAmount: cartTotal(items)
  };
}

function addToCart(userId, payload) {
  const product = normalizeItemPayload(payload);
  const items = [...readCart(userId)];
  const index = items.findIndex((item) => item.id === product.id);

  if (index >= 0) {
    items[index] = {
      ...items[index],
      quantity: items[index].quantity + 1
    };
  } else {
    items.push({
      ...product,
      quantity: 1
    });
  }

  writeCart(userId, items);
  return listCart(userId);
}

function removeFromCart(userId, productId) {
  const safeProductId = Number(productId);
  const items = [...readCart(userId)];
  const index = items.findIndex((item) => item.id === safeProductId);

  if (index < 0) {
    return listCart(userId);
  }

  if (items[index].quantity > 1) {
    items[index] = {
      ...items[index],
      quantity: items[index].quantity - 1
    };
  } else {
    items.splice(index, 1);
  }

  writeCart(userId, items);
  return listCart(userId);
}

function clearCart(userId) {
  writeCart(userId, []);
  return listCart(userId);
}

module.exports = {
  listCart,
  addToCart,
  removeFromCart,
  clearCart
};
