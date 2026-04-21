const User = require('../models/User');

class UserRepository {
  async findById(id) {
    return User.findById(id).select('-passwordHash');
  }

  async findByIdWithPassword(id) {
    return User.findById(id);
  }

  async findByEmail(email) {
    return User.findOne({ email });
  }

  async findAll(filter = {}) {
    return User.find(filter).select('-passwordHash');
  }

  // Search students by name, email, rollNumber, or mobile
  async search(query) {
    const trimmed = (query || '').trim();
    if (!trimmed) return [];
    const regex = new RegExp(trimmed, 'i');
    return User.find({
      role: 'student',
      $or: [
        { name:       regex },
        { email:      regex },
        { rollNumber: regex },
        { mobile:     regex },
      ],
    }).select('-passwordHash');
  }

  async create(data) {
    const user = new User(data);
    return user.save();
  }

  async update(id, data) {
    return User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).select('-passwordHash');
  }

  async delete(id) {
    return User.findByIdAndDelete(id);
  }
}

module.exports = new UserRepository();
