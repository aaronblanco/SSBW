const profileText = document.getElementById('profileText');
const ordersBox = document.getElementById('ordersBox');
const logoutBtn = document.getElementById('logoutBtn');

async function initProfile() {
  const user = await window.SSBWAuth.apiMe();
  if (!user) {
    window.location.href = '/auth.html';
    return;
  }

  if (user.role === 'admin') {
    window.location.href = '/admin.html';
    return;
  }

  profileText.textContent = `${user.firstName} ${user.lastName} · ${user.email}`;

  const response = await fetch('/api/orders/my', {
    headers: window.SSBWAuth.authHeaders()
  });
  const data = await response.json();

  if (!response.ok) {
    ordersBox.textContent = 'No se pudieron cargar los pedidos.';
    return;
  }

  if (!Array.isArray(data.items) || !data.items.length) {
    ordersBox.textContent = data.message || 'No tienes pedidos.';
    return;
  }

  ordersBox.innerHTML = data.items.map((item) => `<div>${item.id}</div>`).join('');
}

logoutBtn.addEventListener('click', async () => {
  await window.SSBWAuth.logout();
  window.location.href = '/auth.html';
});

initProfile().catch(() => {
  window.location.href = '/auth.html';
});
