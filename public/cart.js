const CART_KEY = 'ssbw-cart';

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function addToCart(product) {
  const cart = readCart();
  const index = cart.findIndex((item) => item.id === product.id);
  const price = Number.isFinite(product.price) ? product.price : 0;

  if (index >= 0) {
    cart[index].quantity += 1;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: price,
      image: product.image || null,
      url: product.url || null,
      quantity: 1
    });
  }

  writeCart(cart);
  return cart;
}

function removeFromCart(productId) {
  const cart = readCart();
  const index = cart.findIndex((item) => item.id === Number(productId));

  if (index < 0) {
    return cart;
  }

  if (cart[index].quantity > 1) {
    cart[index].quantity -= 1;
  } else {
    cart.splice(index, 1);
  }

  writeCart(cart);
  return cart;
}

function clearCart() {
  writeCart([]);
  return [];
}

function cartCount() {
  return readCart().reduce((sum, item) => sum + item.quantity, 0);
}

function getItemUnitPrice(item) {
  if (Number.isFinite(item.price)) {
    return item.price;
  }
  if (Number.isFinite(item.numericPrice)) {
    return item.numericPrice;
  }
  return 0;
}

function cartTotalAmount() {
  return readCart().reduce((sum, item) => sum + getItemUnitPrice(item) * item.quantity, 0);
}

async function logCartEvent(payload) {
  try {
    await fetch('/api/logs/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    // Keep cart behavior resilient even if logging is temporarily unavailable.
  }
}

window.SSBWCart = {
  readCart,
  writeCart,
  addToCart,
  removeFromCart,
  clearCart,
  cartCount,
  cartTotalAmount,
  logCartEvent
};
