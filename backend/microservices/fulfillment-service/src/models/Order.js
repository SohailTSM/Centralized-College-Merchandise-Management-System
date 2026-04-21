const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  merchandiseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchandise', required: true },
  size:          { type: String, required: true },
  quantity:      { type: Number, required: true, min: 1, default: 1 },
  price:         { type: Number, required: true },
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  studentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:        { type: [OrderItemSchema], required: true },
  totalAmount:  { type: Number, required: true },
  status:       { type: String, enum: ['processing', 'delivered'], default: 'processing' },
  deliverySlotId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliverySlot', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
