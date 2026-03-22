const jwt = require('jsonwebtoken');

const TOKEN_COOKIE = 'access_token';
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const TOKEN_TTL = `${TOKEN_TTL_SECONDS}s`;

const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.SECRET_KEY ||
  'ssbw-dev-secret-change-in-production';

function signAuthToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

function verifyAuthToken(token) {
  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function buildAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_TTL_SECONDS * 1000,
    path: '/'
  };
}

module.exports = {
  TOKEN_COOKIE,
  signAuthToken,
  verifyAuthToken,
  buildAuthCookieOptions
};
