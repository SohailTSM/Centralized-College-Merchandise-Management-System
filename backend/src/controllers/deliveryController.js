const MerchandiseRepository = require('../repositories/MerchandiseRepository');
const OrderRepository       = require('../repositories/OrderRepository');
const DeliverySlotRepository = require('../repositories/DeliverySlotRepository');
const UserRepository         = require('../repositories/UserRepository');
const eventBus               = require('../patterns/pubsub/EventBus');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getMerchIdsForClub = async (clubId) => {
  const merch = await MerchandiseRepository.findActiveByClub(clubId);
  return merch.map((m) => m._id);
};

// ─── Club Admin: get their merchandise that has >= 1 processing order ─────────
// GET /api/delivery-slots/merch-with-orders
const getMerchWithOrders = async (req, res, next) => {
  try {
    const allMerch = await MerchandiseRepository.findByClub(req.user.clubId, false);
    const results = [];
    for (const m of allMerch) {
      const count = await OrderRepository.countProcessingByMerchandise(m._id);
      if (count > 0) results.push({ ...m.toObject(), processingCount: count });
    }
    res.json(results);
  } catch (err) { next(err); }
};

// GET /api/delivery-slots  (public/student)
const getAll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.clubId) filter.clubId = req.query.clubId;
    const slots = await DeliverySlotRepository.findAll(filter);
    res.json(slots);
  } catch (err) { next(err); }
};

// GET /api/delivery-slots/mine  (club admin)
const getMySlots = async (req, res, next) => {
  try {
    const slots = await DeliverySlotRepository.findByClub(req.user.clubId);
    res.json(slots);
  } catch (err) { next(err); }
};

// POST /api/delivery-slots
const create = async (req, res, next) => {
  try {
    const { scheduledAt, location, description, merchandiseScope, merchandiseIds } = req.body;
    const slot = await DeliverySlotRepository.create({
      clubId: req.user.clubId,
      scheduledAt,
      location,
      description: description || '',
      merchandiseScope: merchandiseScope || 'all',
      merchandiseIds:   (merchandiseScope === 'specific' && merchandiseIds) ? merchandiseIds : [],
    });
    // Pub-Sub: notify all buyers of covered merchandise
    await eventBus.publish('slot:created', slot);
    res.status(201).json(slot);
  } catch (err) { next(err); }
};

// PUT /api/delivery-slots/:id
const update = async (req, res, next) => {
  try {
    const slot = await DeliverySlotRepository.findById(req.params.id);
    if (!slot) return res.status(404).json({ message: 'Delivery slot not found' });
    if (String(slot.clubId._id || slot.clubId) !== String(req.user.clubId))
      return res.status(403).json({ message: 'Not authorized' });
    const updated = await DeliverySlotRepository.update(req.params.id, req.body);
    await eventBus.publish('slot:updated', updated);
    res.json(updated);
  } catch (err) { next(err); }
};

// GET /api/delivery-slots/:id/orders
const getSlotOrders = async (req, res, next) => {
  try {
    const slot = await DeliverySlotRepository.findById(req.params.id);
    if (!slot) return res.status(404).json({ message: 'Slot not found' });

    let merchandiseIds;
    if (slot.merchandiseScope === 'specific' && slot.merchandiseIds.length > 0) {
      merchandiseIds = slot.merchandiseIds;
    } else {
      merchandiseIds = await getMerchIdsForClub(slot.clubId);
    }

    const orders = await OrderRepository.findProcessingWithDetails(merchandiseIds);
    res.json(orders);
  } catch (err) { next(err); }
};

// GET /api/delivery-slots/search-students?q=...
const searchStudents = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const students = await UserRepository.search(q);
    const results = await Promise.all(
      students.map(async (s) => {
        const orders = await OrderRepository.findByStudent(s._id);
        return { student: s, orders: orders.filter((o) => o.status === 'processing') };
      })
    );
    res.json(results.filter((r) => r.orders.length > 0));
  } catch (err) { next(err); }
};

module.exports = { getAll, getMySlots, create, update, getSlotOrders, searchStudents, getMerchWithOrders };
