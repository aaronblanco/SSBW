const statusText = document.getElementById('statusText');
const detailContainer = document.getElementById('detailContainer');
const cartCountBadge = document.getElementById('cartCountBadge');

function updateCartCount() {
  cartCountBadge.textContent = `Carrito: ${window.SSBWCart.cartCount()}`;
}

function getProductIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return Number(params.get('id'));
}

function renderError(message) {
  detailContainer.innerHTML = `
    <div class="alert alert-danger mb-0">${message}</div>
  `;
}

function renderProduct(product) {
  detailContainer.innerHTML = `
    <div class="row g-4 align-items-start">
      <div class="col-lg-5">
        <img
          src="${product.image || 'https://placehold.co/800x600?text=Sin+imagen'}"
          alt="${product.title}"
          class="ssbw-image"
        />
      </div>
      <div class="col-lg-7">
        <h2 class="h4 mb-3">${product.title}</h2>
        <p class="text-muted mb-2">Fuente: ${product.source}</p>
        <p class="fs-5 fw-semibold mb-3">${product.price ? product.price.toFixed(2) + ' EUR' : 'Precio no disponible'}</p>
        <p class="text-muted mb-4">Último scrapeo: ${new Date(product.scrapedAt).toLocaleString('es-ES')}</p>

        <div class="d-flex flex-wrap gap-2">
          <button type="button" id="addToCartBtn" class="btn btn-success">Añadir al carrito</button>
          <a href="${product.url}" target="_blank" rel="noreferrer" class="btn btn-primary">Abrir en tienda</a>
          <a href="/" class="btn btn-outline-secondary">Volver a portada</a>
        </div>
      </div>
    </div>
  `;

  const addToCartBtn = document.getElementById('addToCartBtn');
  addToCartBtn.addEventListener('click', async () => {
    const cart = window.SSBWCart.addToCart(product);
    updateCartCount();
    statusText.textContent = `Añadido al carrito: ${product.title}`;

    await window.SSBWCart.logCartEvent({
      action: 'add',
      product: { id: product.id, title: product.title },
      cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: window.SSBWCart.cartTotalAmount()
    });
  });
}

async function loadProductDetail() {
  const id = getProductIdFromQuery();

  if (!Number.isInteger(id) || id <= 0) {
    statusText.textContent = 'ID inválido';
    renderError('El producto solicitado no es válido.');
    return;
  }

  statusText.textContent = `Cargando producto #${id}...`;

  try {
    const response = await fetch(`/api/products/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        statusText.textContent = 'Producto no encontrado';
        renderError('No se encontró el producto solicitado.');
        return;
      }
      throw new Error(`Error HTTP ${response.status}`);
    }

    const product = await response.json();
    statusText.textContent = `Producto #${product.id} cargado`;
    renderProduct(product);
  } catch (error) {
    statusText.textContent = 'Error al cargar';
    renderError(`No se pudo cargar el detalle: ${error.message}`);
  }
}

loadProductDetail();
updateCartCount();

