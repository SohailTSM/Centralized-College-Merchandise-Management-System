const Club = require('../models/Club');

class ClubRepository {
  async findById(id) {
    return Club.findById(id).populate('adminId', 'name email');
  }

  async findAll() {
    return Club.find().populate('adminId', 'name email');
  }

  async create(data) {
    const club = new Club(data);
    return club.save();
  }

  async update(id, data) {
    return Club.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id) {
    return Club.findByIdAndDelete(id);
  }
}

module.exports = new ClubRepository();
