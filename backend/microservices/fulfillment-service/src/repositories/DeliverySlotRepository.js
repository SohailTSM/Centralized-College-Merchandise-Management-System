const DeliverySlot = require('../models/DeliverySlot');

class DeliverySlotRepository {
  async findById(id) {
    return DeliverySlot.findById(id)
      .populate('clubId', 'name')
      .populate('merchandiseIds', 'name type');
  }

  async findAll(filter = {}) {
    return DeliverySlot.find(filter)
      .populate('clubId', 'name')
      .populate('merchandiseIds', 'name type')
      .sort({ scheduledAt: -1 }); // newest first
  }

  async findByClub(clubId) {
    return DeliverySlot.find({ clubId })
      .populate('merchandiseIds', 'name type')
      .sort({ scheduledAt: -1 }); // newest first
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
