const Merchandise = require('../models/Merchandise');

class MerchandiseRepository {
  async findById(id) {
    return Merchandise.findById(id).populate('clubId', 'name logoUrl');
  }

  async findAll(filter = {}, page = 1, limit = 12) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Merchandise.find(filter).populate('clubId', 'name logoUrl').skip(skip).limit(limit).sort({ createdAt: -1 }),
      Merchandise.countDocuments(filter),
    ]);
    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  async findByClub(clubId, showAll = true) {
    const filter = { clubId };
    if (!showAll) filter.isActive = true;
    return Merchandise.find(filter).populate('clubId', 'name logoUrl').sort({ createdAt: -1 });
  }


  async create(data) {
    const item = new Merchandise(data);
    return item.save();
  }

  async update(id, data) {
    return Merchandise.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id) {
    return Merchandise.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }
}

module.exports = new MerchandiseRepository();
