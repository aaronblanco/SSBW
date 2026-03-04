const { WebSocketServer } = require('ws');

let wss;

function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket) => {
    socket.send(
      JSON.stringify({
        type: 'connected',
        data: { message: 'Conexión WebSocket establecida' }
      })
    );
  });
}

function broadcast(type, data) {
  if (!wss) {
    return;
  }

  const payload = JSON.stringify({ type, data, emittedAt: new Date().toISOString() });

  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
}

module.exports = {
  initWebSocket,
  broadcast
};
