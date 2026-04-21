const mongoose = require('mongoose');

const ClubSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, unique: true },
  description: { type: String, default: '' },
  adminId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  logoUrl:     { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Club', ClubSchema);
