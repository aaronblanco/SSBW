const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const statusBox = document.getElementById('statusBox');
const formTitle = document.getElementById('formTitle');
const switchToLogin = document.getElementById('switchToLogin');
const switchToRegister = document.getElementById('switchToRegister');
const loginPassword = document.getElementById('loginPassword');
const registerPassword = document.getElementById('registerPassword');
const loginPasswordHint = document.getElementById('loginPasswordHint');
const registerPasswordHint = document.getElementById('registerPasswordHint');

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
  document.getElementById('loginEmail')?.focus();
}

function showRegisterForm() {
  registerForm.classList.remove('d-none');
  loginForm.classList.add('d-none');
  formTitle.textContent = 'Registro';
  switchToRegister.classList.add('active');
  switchToLogin.classList.remove('active');
  document.getElementById('registerFirstName')?.focus();
}

function showFieldHint(node, message = '') {
  if (!node) {
    return;
  }

  if (!message) {
    node.textContent = '';
    node.classList.add('d-none');
    return;
  }

  node.textContent = message;
  node.classList.remove('d-none');
}

function validatePasswordFormat(value) {
  const text = String(value || '');
  if (text.length < 8) {
    return 'La contrasena debe tener al menos 8 caracteres.';
  }
  if (!/[A-Za-z]/.test(text)) {
    return 'La contrasena debe incluir al menos una letra.';
  }
  if (!/\d/.test(text)) {
    return 'La contrasena debe incluir al menos un numero.';
  }
  return '';
}

document.querySelectorAll('.js-toggle-password').forEach((button) => {
  button.addEventListener('click', () => {
    const targetId = button.dataset.target;
    const input = document.getElementById(targetId);
    if (!input) {
      return;
    }

    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    button.textContent = isPassword ? 'Ocultar' : 'Ver';
    input.focus();
  });
});

loginPassword?.addEventListener('blur', () => {
  const message = validatePasswordFormat(loginPassword.value);
  showFieldHint(loginPasswordHint, message);
});

registerPassword?.addEventListener('blur', () => {
  const message = validatePasswordFormat(registerPassword.value);
  showFieldHint(registerPasswordHint, message);
});

switchToLogin.addEventListener('click', showLoginForm);
switchToRegister.addEventListener('click', showRegisterForm);

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(registerForm);
  const payload = Object.fromEntries(formData.entries());
  payload.role = 'user';

  const registerPasswordError = validatePasswordFormat(payload.password);
  if (registerPasswordError) {
    showFieldHint(registerPasswordHint, registerPasswordError);
    setStatus('Corrige la contrasena antes de continuar.', 'warning');
    return;
  }

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

  const loginPasswordError = validatePasswordFormat(password);
  if (loginPasswordError) {
    showFieldHint(loginPasswordHint, loginPasswordError);
    setStatus('La contrasena introducida no cumple el formato esperado.', 'warning');
    return;
  }

  try {
    const user = await window.SSBWAuth.login(email, password);
    setStatus(`Sesion iniciada. Hola ${user.firstName}.`, 'success');
    window.location.href = user.role === 'admin' ? '/admin.html' : '/profile.html';
  } catch (error) {
    setStatus(error.message, 'danger');
  }
});
