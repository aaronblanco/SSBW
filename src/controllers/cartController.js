const cartService = require('../services/cartService');

async function listCart(req, res) {
  try {
    const result = await cartService.listCart(req.auth.userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'No se pudo listar el carrito', detail: error.message });
  }
}

async function addToCart(req, res) {
  try {
    const result = await cartService.addToCart(req.auth.userId, req.body || {});
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: 'No se pudo anadir al carrito', detail: error.message });
  }
}

async function removeFromCart(req, res) {
  try {
    const result = await cartService.removeFromCart(req.auth.userId, req.params.productId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: 'No se pudo quitar del carrito', detail: error.message });
  }
}

async function clearCart(req, res) {
  try {
    const result = await cartService.clearCart(req.auth.userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'No se pudo vaciar el carrito', detail: error.message });
  }
}

module.exports = {
  listCart,
  addToCart,
  removeFromCart,
  clearCart
};
