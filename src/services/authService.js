const crypto = require('crypto');
const userRepository = require('../repositories/userRepository');
const sessionStore = require('../auth/sessionStore');

const ADMIN_EMAIL = 'admin@ssbw.local';
const ADMIN_PASSWORD = 'Admin123!';

function hashPassword(plainText) {
  return crypto.createHash('sha256').update(String(plainText)).digest('hex');
}

function sanitizeUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    birthDate: user.birthDate,
    email: user.email,
    role: user.role
  };
}

async function ensureDefaultAdmin() {
  const existing = await userRepository.findByEmail(ADMIN_EMAIL);
  if (existing) {
    return;
  }

  await userRepository.createUser({
    firstName: 'Admin',
    lastName: 'SSBW',
    birthDate: '1990-01-01',
    email: ADMIN_EMAIL,
    passwordHash: hashPassword(ADMIN_PASSWORD),
    role: 'admin'
  });
}

async function register({ firstName, lastName, birthDate, email, password, role = 'user' }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const selectedRole = role === 'admin' ? 'admin' : 'user';

  if (!firstName || !lastName || !birthDate || !normalizedEmail || !password) {
    throw new Error('Faltan campos obligatorios');
  }

  const existing = await userRepository.findByEmail(normalizedEmail);
  if (existing) {
    throw new Error('Ya existe un usuario con ese correo');
  }

  const user = await userRepository.createUser({
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
    birthDate,
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    role: selectedRole
  });

  const token = sessionStore.createSession(user);

  return {
    token,
    user: sanitizeUser(user)
  };
}

async function login({ email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw new Error('Correo y contrasena obligatorios');
  }

  const user = await userRepository.findByEmail(normalizedEmail);
  if (!user || user.passwordHash !== hashPassword(password)) {
    throw new Error('Credenciales invalidas');
  }

  const token = sessionStore.createSession(user);

  return {
    token,
    user: sanitizeUser(user)
  };
}

async function me(token) {
  const session = sessionStore.getSession(token);
  if (!session) {
    return null;
  }

  const user = await userRepository.findById(session.userId);
  if (!user) {
    return null;
  }

  return sanitizeUser(user);
}

function logout(token) {
  sessionStore.deleteSession(token);
}

module.exports = {
  ensureDefaultAdmin,
  register,
  login,
  me,
  logout
};
