const Events = require('./EventManager');

/**
 * Outbound Integration Gateway
 * Handles event registration and execution for outbound integrations (Prolibu → External Systems)
 */
class OutboundGateway {
  constructor(config = {}) {
    this.config = config;
    this.validateConfig();
  }

  validateConfig() {
    if (!this.config || Object.keys(this.config).length === 0) {
      throw new Error('Configuration is required');
    }
  }

  async registerEvents() {
    const integratedObjects = Object.keys(this.config);
    
    for (let i = 0; i < integratedObjects.length; i++) {
      const objectName = integratedObjects[i];
      const config = this.config[objectName];

      if (!config.active) {
        continue;
      }

      // Set default mapToObject if not provided
      config.mapToObject = config.mapToObject || objectName;
      config.additionalTransforms = config.additionalTransforms || {};

      if (config.events && typeof config.events !== 'object') {
        throw new Error(`'events' key in config for '${objectName}' must be an object.`);
      }

      const eventNames = Object.keys(config.events);

      for (let j = 0; j < eventNames.length; j++) {
        const event = eventNames[j];
        const eventHandler = config.events[event];

        if (typeof eventHandler !== 'function') {
          throw new Error(`Event handler for '${event}' in config for '${objectName}' must be a function.`);
        }

        Events.on(event, async () => {
          await eventHandler(objectName, config);
        });
      }
    }
  }

  async initialize() {
    await this.registerEvents();
    await Events.init();
  }
}

module.exports = OutboundGateway;