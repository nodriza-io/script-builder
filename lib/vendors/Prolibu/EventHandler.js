// SandboxEventBus.js - Ultra-simple sync event system for sandboxed VM environments
// Designed specifically for restricted JS environments where async error propagation fails

class SandboxEventBus {
  constructor() {
    this.handlers = {};
    this.errorMode = 'immediate'; // immediate, delayed, silent
    this.autoTriggerEvents = ['ApiRun']; // Events that auto-trigger based on global variables
  }

  // Register a handler (supports both sync and async)
  on(eventName, handler) {
    if (!this.handlers[eventName]) {
      this.handlers[eventName] = [];
    }
    
    this.handlers[eventName].push(handler);
    
    // NO AUTO-TRIGGER during registration to prevent infinite loops
    // Auto-trigger will be handled at the end of module loading
    
    return this;
  }

  // Immediate synchronous trigger (main method)
  async triggerImmediate(eventName, payload = {}) {
    if (!this.handlers[eventName] || this.handlers[eventName].length === 0) {
      return this;
    }
    
    for (let i = 0; i < this.handlers[eventName].length; i++) {
      const handler = this.handlers[eventName][i];
      
      try {
        const result = handler(payload);
        
        // Handle async functions - await them to ensure completion
        if (result && typeof result.then === 'function') {
          await result;
        }
      } catch (error) {
        this.handleError(error, eventName, i + 1);
      }
    }
    
    return this;
  }

  // Synchronous trigger that handles async internally for sandbox compatibility
  triggerImmediateSync(eventName, payload = {}) {
    if (!this.handlers[eventName] || this.handlers[eventName].length === 0) {
      return this;
    }
    
    for (let i = 0; i < this.handlers[eventName].length; i++) {
      const handler = this.handlers[eventName][i];
      
      try {
        const result = handler(payload);
        
        // Handle async functions - force immediate error propagation
        if (result && typeof result.then === 'function') {
          result.catch(error => {
            console.error('[SandboxEventBus] Async handler error detected:', error.message);
            console.error('[SandboxEventBus] Error stack:', error.stack);
            
            // Use only setTimeout which is available in sandbox
            setTimeout(() => { throw error; }, 0);
            
            // Also call handleError for additional strategies
            this.handleError(error, eventName, i + 1);
            
            // Force immediate throw
            throw error;
          });
        }
      } catch (error) {
        console.error('[SandboxEventBus] Sync handler error detected:', error.message);
        console.error('[SandboxEventBus] Error stack:', error.stack);
        this.handleError(error, eventName, i + 1);
      }
    }
    
    return this;
  }

  // Aggressive error handling for sandbox environments
  handleError(error, eventName, handlerIndex) {
    // Set global error markers
    if (typeof global !== 'undefined') {
      global.__lastEventError = {
        event: eventName,
        handler: handlerIndex,
        error: error.message,
        stack: error.stack,
        timestamp: Date.now()
      };
    }

    // Different error strategies
    switch (this.errorMode) {
      case 'immediate':
        throw error;
        
      case 'delayed':
        // Only use setTimeout which is available in sandbox
        setTimeout(() => { throw error; }, 0);
        break;
        
      case 'silent':
        break;
        
      default:
        throw error;
    }
  }

  // Alternative trigger using global variable detection
  autoTriggerFromGlobals() {
    try {
      if (typeof global !== 'undefined' && global.eventName === 'ApiRun') {
        this.triggerImmediate('ApiRun', global.eventData || {});
      }
    } catch {
      // Ignore errors accessing global variables
    }
  }

  setErrorMode(mode) {
    this.errorMode = mode;
    return this;
  }

  off(eventName, handler) {
    if (this.handlers[eventName]) {
      this.handlers[eventName] = this.handlers[eventName].filter(h => h !== handler);
    }
    return this;
  }

  clear() {
    this.handlers = {};
    return this;
  }

  getStats() {
    const events = Object.keys(this.handlers);
    const totalHandlers = events.reduce((sum, event) => sum + this.handlers[event].length, 0);
    
    return {
      events: events.length,
      totalHandlers,
      eventList: events.map(event => ({
        event,
        handlerCount: this.handlers[event].length
      }))
    };
  }

  getEvents() {
    return Object.keys(this.handlers).map(event => ({
      event,
      handlerCount: this.handlers[event].length
    }));
  }


}

// Create singleton instance
const eventBus = new SandboxEventBus();

// Auto-detect global variables and trigger events at module load
try {
  // Check for global eventName in different ways
  let globalEventName = undefined;
  
  if (typeof global !== 'undefined' && global.eventName) {
    globalEventName = global.eventName;
  } else if (typeof eval !== 'undefined') {
    try {
      globalEventName = eval('eventName');
    } catch {
      // eventName not available in current scope
    }
  }
  
  if (globalEventName && eventBus.autoTriggerEvents.includes(globalEventName)) {
    eventBus.triggerImmediateSync(globalEventName);
  }
} catch {
  // Ignore errors accessing global variables
}

module.exports = eventBus;
