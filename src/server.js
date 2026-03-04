const dotenv = require('dotenv');
const http = require('http');
const app = require('./app');
const { initWebSocket } = require('./websocket/wsHub');

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const server = http.createServer(app);

initWebSocket(server);

server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
