const DeliverySlot = require('../models/DeliverySlot');

class DeliverySlotRepository {
  async findById(id) {
    return DeliverySlot.findById(id).lean();
  }

  async findAll(filter = {}) {
    return DeliverySlot.find(filter).sort({ scheduledAt: -1 }).lean();
  }

  async findByClub(clubId) {
    return DeliverySlot.find({ clubId }).sort({ scheduledAt: -1 }).lean();
  }

  async create(data) {
    const slot = new DeliverySlot(data);
    return slot.save();
  }

  async update(id, data) {
    return DeliverySlot.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }
}

module.exports = new DeliverySlotRepository();
