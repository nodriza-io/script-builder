// EventHandler.js - Simple event listener/dispatcher for script hooks
// Usage:
// const EventHandler = require('../../../lib/vendors/Prolibu/EventHandler');
// EventHandler.on('Contact.beforeCreate', (payload) => { ... });
// EventHandler.emit('Contact.beforeCreate', { ... });

class EventHandler {
  constructor() {
    this.listeners = {};
  }

  on(event, handler) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(handler);
  }

  off(event, handler) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(fn => fn !== handler);
  }

  emit(event, payload) {
    if (!this.listeners[event]) return;
    for (const handler of this.listeners[event]) {
      try {
        handler(payload);
      } catch (err) {
        // Optionally log or handle errors in handlers
        console.error(`[EventHandler] Error in handler for ${event}:`, err);
      }
    }
  }

  clear(event) {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}

// Singleton instance for global usage
const EventHandlerInstance = new EventHandler();

// Automatically emit the event named in eventName (if defined), after handlers are registered
if (typeof eventName === 'string') {
  setImmediate(() => {
    EventHandlerInstance.emit(eventName, typeof eventData !== 'undefined' ? eventData : {});
  });
}

module.exports = EventHandlerInstance;
