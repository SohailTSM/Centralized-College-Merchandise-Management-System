const mongoose = require('mongoose');

const DeliverySlotSchema = new mongoose.Schema({
  clubId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  scheduledAt:      { type: Date, required: true },
  location:         { type: String, required: true },
  description:      { type: String, default: '' },
  // 'all' covers all merchandise of this club; 'specific' uses merchandiseIds
  merchandiseScope: { type: String, enum: ['all', 'specific'], default: 'all' },
  merchandiseIds:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Merchandise' }],
}, { timestamps: true });

module.exports = mongoose.model('DeliverySlot', DeliverySlotSchema);
