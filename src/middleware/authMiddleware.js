const { TOKEN_COOKIE, verifyAuthToken } = require('../auth/jwtService');

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  return req.cookies?.[TOKEN_COOKIE] || null;
}

function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  const payload = verifyAuthToken(token);

  if (!payload) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  const userId = Number(payload.sub);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(401).json({ error: 'Token inválido' });
    return;
  }

  req.auth = {
    token,
    userId,
    role: payload.role,
    email: payload.email
  };

  next();
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.auth.role !== 'admin') {
      res.status(403).json({ error: 'Requiere rol administrador' });
      return;
    }
    next();
  });
}

module.exports = {
  getTokenFromRequest,
  requireAuth,
  requireAdmin
};
