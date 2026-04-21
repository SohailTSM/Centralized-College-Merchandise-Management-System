/**
 * Pub-Sub Pattern — DeliverySubscribers
 * On slot:created → notify all buyers of covered merchandise
 * No socket.io — DB notifications only
 */
const eventBus = require('./EventBus');
const NotificationRepository = require('../../repositories/NotificationRepository');
const Order       = require('../../models/Order');
const Merchandise = require('../../models/Merchandise');

const registerDeliverySubscribers = () => {
  eventBus.subscribe('slot:created', async (slot) => {
    try {
      let merchandiseIds = [];

      if (slot.merchandiseScope === 'specific' && slot.merchandiseIds && slot.merchandiseIds.length > 0) {
        merchandiseIds = slot.merchandiseIds;
      } else {
        // All active merchandise of this club
        const clubMerch = await Merchandise.find({ clubId: slot.clubId, isActive: true }).select('_id');
        merchandiseIds = clubMerch.map((m) => m._id);
      }

      if (merchandiseIds.length === 0) return;

      // Find all processing orders for these merchandise items
      const orders = await Order.find({
        'items.merchandiseId': { $in: merchandiseIds },
        status: 'processing',
      }).select('studentId');

      // Unique student IDs
      const studentIds = [...new Set(orders.map((o) => String(o.studentId)))];

      const scheduledStr = new Date(slot.scheduledAt).toLocaleString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
      });

      // Create a notification for each buyer
      await Promise.all(studentIds.map((studentId) =>
        NotificationRepository.create({
          userId: studentId,
          type: 'delivery_update',
          message: `📍 Delivery slot scheduled: ${scheduledStr} at ${slot.location}. Check the Delivery page for details.`,
        })
      ));

      console.log(`DeliverySubscribers: notified ${studentIds.length} student(s) for slot ${slot._id}`);
    } catch (err) {
      console.error('DeliverySubscribers [slot:created]:', err.message);
    }
  });

  eventBus.subscribe('slot:updated', async (slot) => {
    try {
      const scheduledStr = new Date(slot.scheduledAt).toLocaleString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
      });

      let merchandiseIds = [];
      if (slot.merchandiseScope === 'specific' && slot.merchandiseIds?.length > 0) {
        merchandiseIds = slot.merchandiseIds;
      } else {
        const clubMerch = await Merchandise.find({ clubId: slot.clubId, isActive: true }).select('_id');
        merchandiseIds = clubMerch.map((m) => m._id);
      }

      const orders = await Order.find({ 'items.merchandiseId': { $in: merchandiseIds }, status: 'processing' }).select('studentId');
      const studentIds = [...new Set(orders.map((o) => String(o.studentId)))];

      await Promise.all(studentIds.map((studentId) =>
        NotificationRepository.create({
          userId: studentId,
          type: 'delivery_update',
          message: `🔄 Delivery slot updated: ${scheduledStr} at ${slot.location}.`,
        })
      ));
    } catch (err) {
      console.error('DeliverySubscribers [slot:updated]:', err.message);
    }
  });
};

module.exports = { registerDeliverySubscribers };
