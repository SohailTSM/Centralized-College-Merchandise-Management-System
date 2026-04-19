/**
 * Observer Pattern — NotificationObserver (simplified for processing/delivered)
 */
const orderEventEmitter = require('./OrderEventEmitter');
const NotificationRepository = require('../../repositories/NotificationRepository');

const registerNotificationObserver = () => {
  orderEventEmitter.on('order:placed', async (order) => {
    try {
      await NotificationRepository.create({
        userId: order.studentId,
        type: 'order_processing',
        message: `✅ Order placed! #${String(order._id).slice(-8).toUpperCase()} — ₹${order.totalAmount} is now being processed.`,
      });
    } catch (err) {
      console.error('NotificationObserver [order:placed]:', err.message);
    }
  });

  orderEventEmitter.on('order:delivered', async (order) => {
    try {
      await NotificationRepository.create({
        userId: order.studentId,
        type: 'order_delivered',
        message: `📦 Your order #${String(order._id).slice(-8).toUpperCase()} has been delivered! Enjoy your merchandise.`,
      });
    } catch (err) {
      console.error('NotificationObserver [order:delivered]:', err.message);
    }
  });
};

module.exports = { registerNotificationObserver };
