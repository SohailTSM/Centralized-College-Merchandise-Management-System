const Order = require('../models/Order');

class OrderRepository {
  async findById(id) {
    return Order.findById(id).lean();
  }

  async findAll(filter = {}) {
    return Order.find(filter).sort({ createdAt: -1 }).lean();
  }

  async findByStudent(studentId) {
    return Order.find({ studentId }).sort({ createdAt: -1 }).lean();
  }

  async countProcessingByMerchandise(merchandiseId) {
    return Order.countDocuments({ 'items.merchandiseId': merchandiseId, status: 'processing' });
  }

  async findByMerchandiseIds(merchandiseIds) {
    return Order.find({ 'items.merchandiseId': { $in: merchandiseIds } }).sort({ createdAt: -1 }).lean();
  }

  async findProcessingByMerchandiseIds(merchandiseIds) {
    return Order.find({ 'items.merchandiseId': { $in: merchandiseIds }, status: 'processing' }).sort({ createdAt: -1 }).lean();
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

  async update(id, data) {
    return Order.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id) {
    return Order.findByIdAndDelete(id);
  }
}

module.exports = new OrderRepository();
