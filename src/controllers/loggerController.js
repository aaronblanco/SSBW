const loggerService = require('../services/loggerService');

const ALLOWED_ACTIONS = new Set(['add', 'remove', 'checkout']);

async function logCartEvent(req, res) {
  const { action, product, cartCount, totalAmount } = req.body || {};

  if (!ALLOWED_ACTIONS.has(action)) {
    res.status(400).json({
      error: 'Accion de carrito no permitida'
    });
    return;
  }

  try {
    const event = await loggerService.writeCartEvent({
      action,
      product,
      cartCount: Number.isFinite(Number(cartCount)) ? Number(cartCount) : null,
      totalAmount: Number.isFinite(Number(totalAmount)) ? Number(totalAmount) : null
    });

    res.status(201).json({ ok: true, event });
  } catch (error) {
    res.status(500).json({
      error: 'No se pudo registrar evento de carrito',
      detail: error.message
    });
  }
}

module.exports = {
  logCartEvent
};
