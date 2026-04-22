let cartState = {
  items: [],
  count: 0,
  totalAmount: 0
};

function authHeaders() {
  if (!window.SSBWAuth) {
    return {};
  }

  return window.SSBWAuth.authHeaders();
}

async function requestCart(path = '', options = {}) {
  const response = await fetch(`/api/cart${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {})
    },
    credentials: 'include'
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo operar con el carrito');
  }

  cartState = {
    items: Array.isArray(data.items) ? data.items : [],
    count: Number(data.count) || 0,
    totalAmount: Number(data.totalAmount) || 0
  };

  return cartState;
}

async function loadCart() {
  return requestCart();
}

async function addToCart(product) {
  return requestCart('', {
    method: 'POST',
    body: JSON.stringify({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      url: product.url
    })
  });
}

async function removeFromCart(productId) {
  return requestCart(`/${Number(productId)}`, {
    method: 'DELETE'
  });
}

async function clearCart() {
  return requestCart('', {
    method: 'DELETE'
  });
}

function readCart() {
  return [...cartState.items];
}

function cartCount() {
  return Number(cartState.count) || 0;
}

function cartTotalAmount() {
  return Number(cartState.totalAmount) || 0;
}

function resetCartState() {
  cartState = {
    items: [],
    count: 0,
    totalAmount: 0
  };
  return cartState;
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
  loadCart,
  readCart,
  addToCart,
  removeFromCart,
  clearCart,
  resetCartState,
  cartCount,
  cartTotalAmount,
  logCartEvent
};
