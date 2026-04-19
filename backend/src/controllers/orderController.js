const OrderRepository = require('../repositories/OrderRepository');
const { PlaceOrderCommand, UpdateOrderStatusCommand, commandInvoker } = require('../patterns/command/OrderCommands');

// POST /api/orders
const placeOrder = async (req, res, next) => {
  try {
    const { items, totalAmount, deliverySlotId } = req.body;
    const cmd = new PlaceOrderCommand({
      studentId: req.user._id,
      items,
      totalAmount,
      ...(deliverySlotId && { deliverySlotId }),
    });
    const order = await commandInvoker.run(cmd);
    res.status(201).json(order);
  } catch (err) { next(err); }
};

// GET /api/orders/my
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await OrderRepository.findByStudent(req.user._id);
    res.json(orders);
  } catch (err) { next(err); }
};

// GET /api/orders  (club admin)
const getClubOrders = async (req, res, next) => {
  try {
    const orders = await OrderRepository.findByClub(req.user.clubId);
    res.json(orders);
  } catch (err) { next(err); }
};

// PATCH /api/orders/:id/status  (club admin — only 'delivered' allowed)
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (status !== 'delivered')
      return res.status(400).json({ message: 'Only "delivered" status is allowed' });
    const cmd = new UpdateOrderStatusCommand(req.params.id, status);
    const updated = await commandInvoker.run(cmd);
    res.json(updated);
  } catch (err) { next(err); }
};

module.exports = { placeOrder, getMyOrders, getClubOrders, updateStatus };
