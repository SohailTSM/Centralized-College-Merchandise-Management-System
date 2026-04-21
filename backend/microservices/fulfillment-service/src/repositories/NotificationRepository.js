const Notification = require('../models/Notification');

class NotificationRepository {
  async findByUser(userId) {
    return Notification.find({ userId }).sort({ createdAt: -1 });
  }

  async create(data) {
    const notification = new Notification(data);
    return notification.save();
  }

  async createMany(dataArray) {
    return Notification.insertMany(dataArray);
  }

  async markRead(id) {
    return Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
  }

  async markAllRead(userId) {
    return Notification.updateMany({ userId, isRead: false }, { isRead: true });
  }
}

module.exports = new NotificationRepository();
