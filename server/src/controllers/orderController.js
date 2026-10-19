import { getAllOrders, getOrderDetails } from '../tools/orderTool.js';

export function getOrders(req, res) {
  res.json({
    success: true,
    orders: getAllOrders()
  });
}

export function getOrderById(req, res) {
  const result = getOrderDetails(req.params.id);
  if (!result.success) {
    return res.status(404).json(result);
  }
  res.json(result);
}
