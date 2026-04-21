const mongoose = require('mongoose');

const MerchandiseSchema = new mongoose.Schema({
  clubId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  type:           { type: String, enum: ['tshirt', 'hoodie', 'cap', 'mug'], required: true },
  name:           { type: String, required: true, trim: true },
  description:    { type: String, default: '' },
  price:          { type: Number, required: true, min: 0 },
  availableSizes: [{ type: String }],
  imageUrl:       { type: String, default: '' },
  isActive:       { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Merchandise', MerchandiseSchema);
