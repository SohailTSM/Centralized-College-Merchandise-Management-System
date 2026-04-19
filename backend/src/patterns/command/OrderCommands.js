/**
 * Command Pattern — Order Commands
 * Uses named emitter methods matching current OrderEventEmitter API
 */
const OrderRepository = require('../../repositories/OrderRepository');
const orderEventEmitter = require('../observer/OrderEventEmitter');

class PlaceOrderCommand {
  constructor(orderData) {
    this.orderData = orderData;
    this.createdOrder = null;
  }
  async execute() {
    const order = await OrderRepository.create(this.orderData);
    this.createdOrder = order;
    orderEventEmitter.emitOrderPlaced(order);   // → 'order:placed' → NotificationObserver creates DB notification
    return order;
  }
}

class UpdateOrderStatusCommand {
  constructor(orderId, newStatus) {
    this.orderId = orderId;
    this.newStatus = newStatus;
    this.previousStatus = null;
  }
  async execute() {
    const order = await OrderRepository.findById(this.orderId);
    if (!order) throw new Error('Order not found');
    this.previousStatus = order.status;
    const updated = await OrderRepository.update(this.orderId, { status: this.newStatus });
    if (this.newStatus === 'delivered') {
      orderEventEmitter.emitOrderDelivered(updated); // → 'order:delivered' → NotificationObserver
    }
    return updated;
  }
  async undo() {
    if (this.previousStatus)
      await OrderRepository.update(this.orderId, { status: this.previousStatus });
  }
}

class CommandInvoker {
  constructor() { this.history = []; }
  async run(command) {
    const result = await command.execute();
    this.history.push(command);
    return result;
  }
}

const commandInvoker = new CommandInvoker();
module.exports = { PlaceOrderCommand, UpdateOrderStatusCommand, commandInvoker };
