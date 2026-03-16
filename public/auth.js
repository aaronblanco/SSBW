const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const statusBox = document.getElementById('statusBox');
const formTitle = document.getElementById('formTitle');
const switchToLogin = document.getElementById('switchToLogin');
const switchToRegister = document.getElementById('switchToRegister');

function setStatus(message, type = 'info') {
  statusBox.className = `alert alert-${type} mt-3 mb-0`;
  statusBox.textContent = message;
}

function showLoginForm() {
  loginForm.classList.remove('d-none');
  registerForm.classList.add('d-none');
  formTitle.textContent = 'Inicio de sesion';
  switchToLogin.classList.add('active');
  switchToRegister.classList.remove('active');
}

function showRegisterForm() {
  registerForm.classList.remove('d-none');
  loginForm.classList.add('d-none');
  formTitle.textContent = 'Registro';
  switchToRegister.classList.add('active');
  switchToLogin.classList.remove('active');
}

switchToLogin.addEventListener('click', showLoginForm);
switchToRegister.addEventListener('click', showRegisterForm);

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(registerForm);
  const payload = Object.fromEntries(formData.entries());
  payload.role = 'user';

  try {
    const user = await window.SSBWAuth.register(payload);
    setStatus(`Cuenta creada. Bienvenido ${user.firstName}.`, 'success');
    window.location.href = '/profile.html';
  } catch (error) {
    setStatus(error.message, 'danger');
  }
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');

  try {
    const user = await window.SSBWAuth.login(email, password);
    setStatus(`Sesion iniciada. Hola ${user.firstName}.`, 'success');
    window.location.href = user.role === 'admin' ? '/admin.html' : '/profile.html';
  } catch (error) {
    setStatus(error.message, 'danger');
  }
});
