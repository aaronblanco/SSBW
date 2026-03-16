const sessionStore = require('../auth/sessionStore');

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return null;
  }
  return authHeader.slice(7).trim();
}

function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  const session = sessionStore.getSession(token);

  if (!session) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  req.auth = {
    token,
    userId: session.userId,
    role: session.role,
    email: session.email
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
