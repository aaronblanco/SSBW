const fs = require('fs/promises');
const path = require('path');

const LOG_DIR = path.resolve(__dirname, '..', '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'cart-events.log');

async function writeCartEvent({ action, product = null, cartCount = null, totalAmount = null }) {
  const event = {
    timestamp: new Date().toISOString(),
    action,
    product,
    cartCount,
    totalAmount
  };

  await fs.mkdir(LOG_DIR, { recursive: true });
  await fs.appendFile(LOG_FILE, `${JSON.stringify(event)}\n`, 'utf8');

  console.log('[cart-event]', event);

  return event;
}

module.exports = {
  writeCartEvent
};
