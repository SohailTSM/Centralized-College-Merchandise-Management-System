const Club = require('../models/Club');

class ClubRepository {
  async findById(id) {
    return Club.findById(id).lean();
  }

  async findAll() {
    return Club.find().lean();
  }

  async create(data) {
    const club = new Club(data);
    return club.save();
  }

  async update(id, data) {
    return Club.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
  }

  async delete(id) {
    return Club.findByIdAndDelete(id);
  }
}

module.exports = new ClubRepository();
