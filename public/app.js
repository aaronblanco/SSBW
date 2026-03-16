const state = {
  search: '',
  take: 12,
  skip: 0,
  total: 0,
  currentUser: null
};

const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const scrapeBtn = document.getElementById('scrapeBtn');
const results = document.getElementById('results');
const totalBadge = document.getElementById('totalBadge');
const statusText = document.getElementById('statusText');
const pageInfo = document.getElementById('pageInfo');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const wsBadge = document.getElementById('wsBadge');
const cartCountBadge = document.getElementById('cartCountBadge');
const cartItems = document.getElementById('cartItems');
const cartTotalText = document.getElementById('cartTotalText');
const clearCartBtn = document.getElementById('clearCartBtn');
const checkoutBtn = document.getElementById('checkoutBtn');
const authBadge = document.getElementById('authBadge');
const profileLink = document.getElementById('profileLink');
const adminLink = document.getElementById('adminLink');
const logoutBtn = document.getElementById('logoutBtn');

function setStatus(text) {
  statusText.textContent = text;
}

function formatPrice(value) {
  return Number.isFinite(value) ? `${value.toFixed(2)} EUR` : 'Precio no disponible';
}

function updateCartBadge() {
  if (!cartCountBadge || !window.SSBWCart) {
    return;
  }
  cartCountBadge.textContent = `${window.SSBWCart.cartCount()} productos`;
}

function renderCart() {
  if (!window.SSBWCart || !cartItems || !cartTotalText) {
    return;
  }

  const items = window.SSBWCart.readCart();

  if (!items.length) {
    cartItems.innerHTML = 'El carrito esta vacio.';
    cartTotalText.textContent = 'Total estimado: 0.00 EUR';
    updateCartBadge();
    return;
  }

  cartItems.innerHTML = items
    .map(
      (item) => `
        <div class="d-flex justify-content-between align-items-center border-bottom py-2">
          <div>
            <div class="fw-semibold">${item.title}</div>
            <div class="small text-muted">${formatPrice(item.price)} · Cantidad: ${item.quantity}</div>
          </div>
          <button class="btn btn-sm btn-outline-danger js-remove-cart" data-id="${item.id}" type="button">Quitar</button>
        </div>
      `
    )
    .join('');

  cartTotalText.textContent = `Total estimado: ${window.SSBWCart.cartTotalAmount().toFixed(2)} EUR`;
  updateCartBadge();
}

async function syncAuthUi() {
  if (!window.SSBWAuth) {
    return;
  }

  try {
    const user = await window.SSBWAuth.apiMe();
    state.currentUser = user;

    if (!user) {
      authBadge.textContent = 'No autenticado';
      authBadge.className = 'badge text-bg-secondary';
      profileLink.classList.add('d-none');
      adminLink.classList.add('d-none');
      logoutBtn.classList.add('d-none');
      return;
    }

    authBadge.textContent = `${user.firstName} (${user.role})`;
    authBadge.className = user.role === 'admin' ? 'badge text-bg-warning' : 'badge text-bg-success';
    profileLink.classList.remove('d-none');
    logoutBtn.classList.remove('d-none');

    if (user.role === 'admin') {
      adminLink.classList.remove('d-none');
    } else {
      adminLink.classList.add('d-none');
    }
  } catch {
    state.currentUser = null;
    authBadge.textContent = 'No autenticado';
    authBadge.className = 'badge text-bg-secondary';
    profileLink.classList.add('d-none');
    adminLink.classList.add('d-none');
    logoutBtn.classList.add('d-none');
  }
}

function renderProducts(items) {
  if (!items.length) {
    results.innerHTML = `
      <div class="col-12">
        <div class="alert alert-warning mb-0">No hay productos para esta búsqueda.</div>
      </div>
    `;
    return;
  }

  results.innerHTML = items
    .map(
      (item) => `
      <article class="col-md-6 col-xl-4">
        <div class="card h-100 shadow-sm border-0">
          <img
            src="${item.image || 'https://placehold.co/600x400?text=Sin+imagen'}"
            class="card-img-top"
            alt="${item.title}"
            style="object-fit: cover; height: 220px"
          />
          <div class="card-body d-flex flex-column">
            <h2 class="h6">${item.title}</h2>
            <p class="mb-2 text-muted small">${formatPrice(item.price)}</p>
            <div class="d-flex gap-2 mt-auto">
              <a href="/product.html?id=${item.id}" class="btn btn-sm btn-primary">Detalle</a>
              <a href="${item.url}" target="_blank" rel="noreferrer" class="btn btn-sm btn-outline-primary">Web tienda</a>
              <button type="button" class="btn btn-sm btn-success js-add-cart" data-id="${item.id}">Añadir</button>
            </div>
          </div>
        </div>
      </article>
    `
    )
    .join('');
}

async function loadProducts() {
  setStatus('Cargando productos...');

  const query = new URLSearchParams({
    take: String(state.take),
    skip: String(state.skip)
  });

  if (state.search) {
    query.set('search', state.search);
  }

  const response = await fetch(`/api/products?${query.toString()}`);
  const data = await response.json();

  state.total = data.total;

  totalBadge.textContent = `Total: ${data.total}`;
  pageInfo.textContent = `Página ${Math.floor(state.skip / state.take) + 1}`;
  prevBtn.disabled = state.skip === 0;
  nextBtn.disabled = state.skip + state.take >= data.total;

  renderProducts(data.items);
  setStatus(`Mostrando ${data.items.length} productos`);
}

async function triggerScrape() {
  scrapeBtn.disabled = true;
  setStatus('Ejecutando scraping y guardado...');

  try {
    const response = await fetch('/api/products/scrape/kiwoko?maxPages=4&headless=true', {
      method: 'POST'
    });
    const data = await response.json();

    setStatus(`Scraping completado: ${data.savedCount} guardados`);
    state.skip = 0;
    await loadProducts();
  } catch (error) {
    setStatus(`Error scraping: ${error.message}`);
  } finally {
    scrapeBtn.disabled = false;
  }
}

function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

  ws.addEventListener('open', () => {
    wsBadge.className = 'badge text-bg-success';
    wsBadge.textContent = 'WS: conectado';
  });

  ws.addEventListener('message', async (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload?.type === 'scrape-completed') {
        setStatus(`WS: scraping completado (${payload.data.savedCount} guardados)`);
        state.skip = 0;
        await loadProducts();
      }
    } catch {
      setStatus('WS: mensaje no reconocido');
    }
  });

  ws.addEventListener('close', () => {
    wsBadge.className = 'badge text-bg-danger';
    wsBadge.textContent = 'WS: desconectado';
  });
}

searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  state.search = searchInput.value.trim();
  state.skip = 0;
  await loadProducts();
});

prevBtn.addEventListener('click', async () => {
  state.skip = Math.max(0, state.skip - state.take);
  await loadProducts();
});

nextBtn.addEventListener('click', async () => {
  state.skip = state.skip + state.take;
  await loadProducts();
});

scrapeBtn.addEventListener('click', triggerScrape);

results.addEventListener('click', async (event) => {
  const addBtn = event.target.closest('.js-add-cart');
  if (!addBtn) {
    return;
  }

  const productId = Number(addBtn.dataset.id);
  if (!Number.isInteger(productId)) {
    return;
  }

  try {
    const response = await fetch(`/api/products/${productId}`);
    if (!response.ok) {
      throw new Error(`No se pudo cargar el producto ${productId}`);
    }

    const product = await response.json();
    const cart = window.SSBWCart.addToCart(product);
    renderCart();
    setStatus(`Anadido al carrito: ${product.title}`);

    await window.SSBWCart.logCartEvent({
      action: 'add',
      product: { id: product.id, title: product.title },
      cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: window.SSBWCart.cartTotalAmount()
    });
  } catch (error) {
    setStatus(`Error al anadir al carrito: ${error.message}`);
  }
});

cartItems.addEventListener('click', async (event) => {
  const removeBtn = event.target.closest('.js-remove-cart');
  if (!removeBtn) {
    return;
  }

  const productId = Number(removeBtn.dataset.id);
  const previous = window.SSBWCart.readCart();
  const product = previous.find((item) => item.id === productId);
  const cart = window.SSBWCart.removeFromCart(productId);
  renderCart();

  await window.SSBWCart.logCartEvent({
    action: 'remove',
    product: product ? { id: product.id, title: product.title } : null,
    cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: window.SSBWCart.cartTotalAmount()
  });
});

clearCartBtn.addEventListener('click', async () => {
  window.SSBWCart.clearCart();
  renderCart();
  setStatus('Carrito vaciado.');
});

checkoutBtn.addEventListener('click', async () => {
  const currentCart = window.SSBWCart.readCart();
  if (!currentCart.length) {
    setStatus('El carrito esta vacio.');
    return;
  }

  const itemCount = currentCart.reduce((sum, item) => sum + item.quantity, 0);
  const total = window.SSBWCart.cartTotalAmount();

  await window.SSBWCart.logCartEvent({
    action: 'checkout',
    product: null,
    cartCount: itemCount,
    totalAmount: total
  });

  window.SSBWCart.clearCart();
  renderCart();
  setStatus(`Pedido simulado completado (${itemCount} items).`);
});

logoutBtn.addEventListener('click', async () => {
  await window.SSBWAuth.logout();
  await syncAuthUi();
  setStatus('Sesion cerrada.');
});

Promise.all([syncAuthUi(), loadProducts()])
  .then(() => {
    renderCart();
    initWebSocket();
  })
  .catch((error) => {
    setStatus(`Error inicial: ${error.message}`);
  });

