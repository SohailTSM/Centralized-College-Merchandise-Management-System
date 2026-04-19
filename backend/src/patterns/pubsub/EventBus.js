/**
 * Publish-Subscribe Pattern — EventBus
 * Decoupled event routing for delivery slot events.
 * Publishers emit events; subscribers react independently without coupling.
 */

class EventBus {
  constructor() {
    this._subscribers = {};
  }

  subscribe(event, handler) {
    if (!this._subscribers[event]) {
      this._subscribers[event] = [];
    }
    this._subscribers[event].push(handler);
  }

  unsubscribe(event, handler) {
    if (!this._subscribers[event]) return;
    this._subscribers[event] = this._subscribers[event].filter((h) => h !== handler);
  }

  async publish(event, data) {
    if (!this._subscribers[event]) return;
    const handlers = this._subscribers[event];
    await Promise.all(handlers.map((handler) => handler(data)));
  }
}

const eventBus = new EventBus();
module.exports = eventBus;
