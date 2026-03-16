const crypto = require('crypto');

const sessions = new Map();

function createSession(user) {
  const token = crypto.randomBytes(24).toString('hex');

  sessions.set(token, {
    userId: user.id,
    email: user.email,
    role: user.role,
    createdAt: Date.now()
  });

  return token;
}

function getSession(token) {
  if (!token) {
    return null;
  }
  return sessions.get(token) || null;
}

function deleteSession(token) {
  if (!token) {
    return;
  }
  sessions.delete(token);
}

module.exports = {
  createSession,
  getSession,
  deleteSession
};
