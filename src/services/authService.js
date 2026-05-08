const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const { signAuthToken, verifyAuthToken } = require('../auth/jwtService');

const ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@ssbw.local';
const ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!';
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

function hashPasswordLegacy(plainText) {
  return crypto.createHash('sha256').update(String(plainText)).digest('hex');
}

function isBcryptHash(value) {
  return /^\$2[aby]\$\d{2}\$/.test(String(value || ''));
}

async function hashPassword(plainText) {
  return bcrypt.hash(String(plainText), BCRYPT_ROUNDS);
}

async function verifyPasswordAndMigrate(user, plainText) {
  if (!user || !plainText) {
    return false;
  }

  if (isBcryptHash(user.passwordHash)) {
    return bcrypt.compare(String(plainText), user.passwordHash);
  }

  const matchesLegacy = user.passwordHash === hashPasswordLegacy(plainText);
  if (!matchesLegacy) {
    return false;
  }

  const upgradedHash = await hashPassword(plainText);
  await userRepository.updatePasswordHash(user.id, upgradedHash);
  return true;
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
  if (String(process.env.DISABLE_DEFAULT_ADMIN || '').trim() === 'true') {
    return;
  }

  const existing = await userRepository.findByEmail(ADMIN_EMAIL);
  if (existing) {
    return;
  }

  await userRepository.createUser({
    firstName: 'Admin',
    lastName: 'SSBW',
    birthDate: '1990-01-01',
    email: ADMIN_EMAIL,
    passwordHash: await hashPassword(ADMIN_PASSWORD),
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
    passwordHash: await hashPassword(password),
    role: selectedRole
  });

  const token = signAuthToken(user);

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
  const isValid = await verifyPasswordAndMigrate(user, password);
  if (!isValid) {
    throw new Error('Credenciales invalidas');
  }

  const token = signAuthToken(user);

  return {
    token,
    user: sanitizeUser(user)
  };
}

async function me(token) {
  const payload = verifyAuthToken(token);
  if (!payload) {
    return null;
  }

  const userId = Number(payload.sub);
  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    return null;
  }

  return sanitizeUser(user);
}

function logout(token) {
  return token;
}

module.exports = {
  ensureDefaultAdmin,
  register,
  login,
  me,
  logout
};
