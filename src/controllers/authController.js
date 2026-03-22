const authService = require('../services/authService');
const { getTokenFromRequest } = require('../middleware/authMiddleware');
const { TOKEN_COOKIE, buildAuthCookieOptions } = require('../auth/jwtService');

async function register(req, res) {
  try {
    const result = await authService.register(req.body || {});
    res.cookie(TOKEN_COOKIE, result.token, buildAuthCookieOptions());
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function login(req, res) {
  try {
    const result = await authService.login(req.body || {});
    res.cookie(TOKEN_COOKIE, result.token, buildAuthCookieOptions());
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

async function me(req, res) {
  try {
    const token = getTokenFromRequest(req);
    const user = await authService.me(token);

    if (!user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

function logout(req, res) {
  const token = getTokenFromRequest(req);
  authService.logout(token);
  res.clearCookie(TOKEN_COOKIE, { path: '/' });
  res.json({ ok: true });
}

module.exports = {
  register,
  login,
  me,
  logout
};
