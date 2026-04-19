const NotificationRepository = require('../repositories/NotificationRepository');

// GET /api/notifications
const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await NotificationRepository.findByUser(req.user._id);
    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/:id/read
const markRead = async (req, res, next) => {
  try {
    const notification = await NotificationRepository.markRead(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/read-all
const markAllRead = async (req, res, next) => {
  try {
    await NotificationRepository.markAllRead(req.user._id);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyNotifications, markRead, markAllRead };
