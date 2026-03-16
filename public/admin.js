const adminInfo = document.getElementById('adminInfo');
const adminStatus = document.getElementById('adminStatus');
const productsTable = document.getElementById('productsTable');
const createForm = document.getElementById('createForm');
const logoutBtn = document.getElementById('logoutBtn');

function setStatus(message) {
  adminStatus.textContent = message;
}

async function requireAdmin() {
  const user = await window.SSBWAuth.apiMe();
  if (!user) {
    window.location.href = '/auth.html';
    return null;
  }

  if (user.role !== 'admin') {
    window.location.href = '/profile.html';
    return null;
  }

  adminInfo.textContent = `${user.firstName} ${user.lastName} · ${user.email}`;
  return user;
}

function renderProducts(items) {
  if (!Array.isArray(items) || !items.length) {
    productsTable.innerHTML = '<p class="text-muted mb-0">No hay productos.</p>';
    return;
  }

  productsTable.innerHTML = `
    <div class="table-responsive">
      <table class="table table-sm align-middle">
        <thead>
          <tr>
            <th>ID</th>
            <th>Titulo</th>
            <th>Precio visible</th>
            <th>URL</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item) => `
                <tr>
                  <td>${item.id}</td>
                  <td><input class="form-control form-control-sm" data-field="title" data-id="${item.id}" value="${item.title || ''}" /></td>
                  <td><input class="form-control form-control-sm" data-field="rawPrice" data-id="${item.id}" value="${item.rawPrice || ''}" /></td>
                  <td><input class="form-control form-control-sm" data-field="url" data-id="${item.id}" value="${item.url || ''}" /></td>
                  <td class="d-flex gap-1">
                    <button class="btn btn-sm btn-outline-primary js-save" data-id="${item.id}" type="button">Guardar</button>
                    <button class="btn btn-sm btn-outline-danger js-delete" data-id="${item.id}" type="button">Eliminar</button>
                  </td>
                </tr>
              `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

function getRowPayload(id) {
  const read = (field) => {
    const node = document.querySelector(`input[data-id="${id}"][data-field="${field}"]`);
    return node ? node.value : '';
  };

  return {
    title: read('title'),
    rawPrice: read('rawPrice'),
    url: read('url')
  };
}

async function loadProducts() {
  const response = await fetch('/api/products?take=100&skip=0');
  const data = await response.json();
  renderProducts(data.items || []);
  setStatus(`Productos cargados: ${data.total || 0}`);
}

async function createProduct(payload) {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...window.SSBWAuth.authHeaders()
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'No se pudo crear');
  }
}

async function saveProduct(id, payload) {
  const response = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...window.SSBWAuth.authHeaders()
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'No se pudo guardar');
  }
}

async function deleteProduct(id) {
  const response = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
    headers: window.SSBWAuth.authHeaders()
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'No se pudo eliminar');
  }
}

createForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(createForm).entries());

  try {
    await createProduct(payload);
    createForm.reset();
    setStatus('Producto creado correctamente.');
    await loadProducts();
  } catch (error) {
    setStatus(error.message);
  }
});

productsTable.addEventListener('click', async (event) => {
  const saveBtn = event.target.closest('.js-save');
  const deleteBtn = event.target.closest('.js-delete');

  try {
    if (saveBtn) {
      const id = Number(saveBtn.dataset.id);
      await saveProduct(id, getRowPayload(id));
      setStatus(`Producto ${id} actualizado.`);
      await loadProducts();
    }

    if (deleteBtn) {
      const id = Number(deleteBtn.dataset.id);
      await deleteProduct(id);
      setStatus(`Producto ${id} eliminado.`);
      await loadProducts();
    }
  } catch (error) {
    setStatus(error.message);
  }
});

logoutBtn.addEventListener('click', async () => {
  await window.SSBWAuth.logout();
  window.location.href = '/auth.html';
});

requireAdmin().then((user) => {
  if (!user) {
    return;
  }

  loadProducts().catch((error) => {
    setStatus(error.message);
  });
});
