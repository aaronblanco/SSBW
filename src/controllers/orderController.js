function listMyOrders(_, res) {
  res.json({
    items: [],
    message: 'Aun no tienes pedidos.'
  });
}

module.exports = {
  listMyOrders
};
