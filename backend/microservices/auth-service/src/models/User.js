const mongoose = require('mongoose');

const SizeProfileSchema = new mongoose.Schema({
  tshirt: { type: String, default: 'M' },
  hoodie: { type: String, default: 'M' },
  other:  { type: String, default: 'M' },
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ['student', 'club_admin', 'central_admin'], default: 'student' },
  clubId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Club', default: null },
  sizeProfile:  { type: SizeProfileSchema, default: () => ({}) },
  // Student-specific fields
  rollNumber:   { type: String, default: '', trim: true },
  mobile:       { type: String, default: '', trim: true },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
