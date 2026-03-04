const state = {
  search: '',
  take: 12,
  skip: 0,
  total: 0
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

function setStatus(text) {
  statusText.textContent = text;
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
            <p class="mb-2 text-muted small">${item.rawPrice || 'Precio no disponible'}</p>
            <a href="${item.url}" target="_blank" rel="noreferrer" class="btn btn-sm btn-primary mt-auto">Ver producto</a>
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

loadProducts().catch((error) => {
  setStatus(`Error inicial: ${error.message}`);
});

initWebSocket();
