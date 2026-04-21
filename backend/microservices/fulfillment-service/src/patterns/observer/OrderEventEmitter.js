/**
 * Observer Pattern — OrderEventEmitter
 * Emits order lifecycle events; observers react independently.
 */
const EventEmitter = require('events');

class OrderEventEmitter extends EventEmitter {
  emitOrderPlaced(order) {
    this.emit('order:placed', order);
  }
  emitOrderDelivered(order) {
    this.emit('order:delivered', order);
  }
}

const orderEventEmitter = new OrderEventEmitter();
module.exports = orderEventEmitter;
