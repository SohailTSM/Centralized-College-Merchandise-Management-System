const Order = require('../models/Order');

class OrderRepository {
  async findById(id) {
    return Order.findById(id).populate('studentId', 'name email').populate('items.merchandiseId', 'name type imageUrl');
  }

  async findAll(filter = {}) {
    return Order.find(filter).populate('studentId', 'name email').sort({ createdAt: -1 });
  }

  async findByStudent(studentId) {
    return Order.find({ studentId }).populate('items.merchandiseId', 'name type imageUrl price').sort({ createdAt: -1 });
  }

  async findByClub(clubId) {
    const MerchandiseRepository = require('./MerchandiseRepository');
    const clubItems = await MerchandiseRepository.findByClub(clubId, true);
    const clubItemIds = clubItems.map((m) => m._id);
    return Order.find({ 'items.merchandiseId': { $in: clubItemIds } })
      .populate('studentId', 'name email rollNumber mobile sizeProfile')
      .populate('items.merchandiseId', 'name type')
      .sort({ createdAt: -1 });
  }


  async create(data) {
    const order = new Order(data);
    return order.save();
  }

  async findProcessingStudentsForMerchandise(merchandiseIds) {
    const orders = await Order.find({ 
      'items.merchandiseId': { $in: merchandiseIds }, 
      status: 'processing' 
    }).select('studentId');
    return [...new Set(orders.map((o) => String(o.studentId)))];
  }

  async countProcessingByMerchandise(merchandiseId) {
    return Order.countDocuments({ 'items.merchandiseId': merchandiseId, status: 'processing' });
  }

  async findProcessingByMerchandiseIn(merchandiseIds) {
    return Order.find({
      'items.merchandiseId': { $in: merchandiseIds },
      status: 'processing',
    }).select('studentId');
  }

  async findProcessingWithDetails(merchandiseIds) {
    return Order.find({
      'items.merchandiseId': { $in: merchandiseIds },
      status: 'processing',
    })
      .populate('studentId', 'name email rollNumber mobile sizeProfile')
      .populate('items.merchandiseId', 'name type');
  }

  async update(id, data) {
    return Order.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id) {
    return Order.findByIdAndDelete(id);
  }
}

module.exports = new OrderRepository();
