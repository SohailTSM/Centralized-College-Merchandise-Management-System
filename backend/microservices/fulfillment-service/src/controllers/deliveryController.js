const DeliverySlotRepository = require('../repositories/DeliverySlotRepository');
const OrderRepository        = require('../repositories/OrderRepository');
const eventBus               = require('../patterns/pubsub/EventBus');
const axios                  = require('axios');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getMerchIdsForClub = async (clubId) => {
  try {
    const res = await axios.get(`http://localhost:5002/api/merchandise/internal/club/${clubId}`);
    return res.data.map(m => m._id);
  } catch (err) { return []; }
};

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

// ─── Club Admin: get their merchandise that has >= 1 processing order ─────────
const getMerchWithOrders = async (req, res, next) => {
  try {
    const allMerchRes = await axios.get(`http://localhost:5002/api/merchandise/internal/club/${req.user.clubId}`);
    const results = [];
    for (const m of allMerchRes.data) {
      const count = await OrderRepository.countProcessingByMerchandise(m._id);
      if (count > 0) results.push({ ...m, processingCount: count });
    }
    res.json(results);
  } catch (err) { next(err); }
};

const composeDeliverySlots = async (rawSlots) => {
  // Fetch all clubs at once to prevent N+1 queries
  let clubsMap = {};
  try {
    const clubsRes = await axios.get('http://localhost:5002/api/admin/clubs');
    clubsMap = clubsRes.data.reduce((acc, c) => ({ ...acc, [c._id]: { _id: c._id, name: c.name } }), {});
  } catch(e) {}

  return Promise.all(rawSlots.map(async (slot) => {
    let clubData = clubsMap[slot.clubId] || { _id: slot.clubId };
    
    let itemsData = await Promise.all((slot.merchandiseIds || []).map(async (mId) => {
      try {
        const catRes = await axios.get(`http://localhost:5002/api/merchandise/internal/item/${mId}`);
        return { _id: mId, name: catRes.data.name, type: catRes.data.type };
      } catch(e) { return { _id: mId }; }
    }));

    return { ...slot, clubId: clubData, merchandiseIds: itemsData };
  }));
};

const getAll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.clubId) filter.clubId = req.query.clubId;
    const rawSlots = await DeliverySlotRepository.findAll(filter);
    const slots = await composeDeliverySlots(rawSlots);
    res.json(slots);
  } catch (err) { next(err); }
};

const getMySlots = async (req, res, next) => {
  try {
    const rawSlots = await DeliverySlotRepository.findByClub(req.user.clubId);
    const slots = await composeDeliverySlots(rawSlots);
    res.json(slots);
  } catch (err) { next(err); }
};

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
    await eventBus.publish('slot:created', slot);
    res.status(201).json(slot);
  } catch (err) { next(err); }
};

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

const getSlotOrders = async (req, res, next) => {
  try {
    const slot = await DeliverySlotRepository.findById(req.params.id);
    if (!slot) return res.status(404).json({ message: 'Slot not found' });
    let merchandiseIds = (slot.merchandiseScope === 'specific' && slot.merchandiseIds.length > 0)
      ? slot.merchandiseIds
      : await getMerchIdsForClub(slot.clubId);

    const rawOrders = await OrderRepository.findProcessingByMerchandiseIds(merchandiseIds);
    const composedOrders = await composeOrders(rawOrders);
    res.json(composedOrders);
  } catch (err) { next(err); }
};

const searchStudents = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const studentsRes = await axios.get(`http://localhost:5001/api/auth/internal/search-students?q=${q}`);
    const students = studentsRes.data;
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
