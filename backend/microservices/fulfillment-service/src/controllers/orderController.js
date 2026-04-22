const OrderRepository = require('../repositories/OrderRepository');
const { PlaceOrderCommand, UpdateOrderStatusCommand, commandInvoker } = require('../patterns/command/OrderCommands');
const axios = require('axios');

// Helper to stitch raw orders with Auth and Catalog data
const composeOrders = async (rawOrders) => {
  const uniqueStudents = [...new Set(rawOrders.map(o => String(o.studentId)))];
  const uniqueMerch = [...new Set(rawOrders.flatMap(o => o.items.map(i => String(i.merchandiseId))))];

  const usersMap = {};
  for (const sId of uniqueStudents) {
    try {
      const res = await axios.get(`http://localhost:5001/api/auth/internal/users/${sId}`);
      usersMap[sId] = res.data;
    } catch(e) {}
  }

  const merchMap = {};
  for (const mId of uniqueMerch) {
    try {
      const res = await axios.get(`http://localhost:5002/api/merchandise/internal/item/${mId}`);
      merchMap[mId] = res.data;
    } catch(e) {}
  }

  return rawOrders.map((order) => {
    const studentData = usersMap[order.studentId] || { _id: order.studentId };
    const itemsData = order.items.map(item => ({
      ...(item.toObject ? item.toObject() : item),
      merchandiseId: merchMap[item.merchandiseId] || { _id: item.merchandiseId }
    }));
    return { ...(order.toObject ? order.toObject() : order), studentId: studentData, items: itemsData };
  });
};

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
    const rawOrders = await OrderRepository.findByStudent(req.user._id);
    const composedOrders = await composeOrders(rawOrders);
    res.json(composedOrders);
  } catch (err) { next(err); }
};

// GET /api/orders  (club admin)
const getClubOrders = async (req, res, next) => {
  try {
    // 1. Fetch the Merchandise IDs that belong to the admin's club
    const catalogRes = await axios.get(`http://localhost:5002/api/merchandise/internal/club/${req.user.clubId}`);
    const clubItemIds = catalogRes.data.map(m => m._id);

    // 2. Fetch the Raw Orders containing those IDs
    const rawOrders = await OrderRepository.findByMerchandiseIds(clubItemIds);

    // 3. Stitch the Data Context together
    const composedOrders = await composeOrders(rawOrders);
    res.json(composedOrders);
  } catch (err) { next(err); }
};

// PATCH /api/orders/:id/status
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
