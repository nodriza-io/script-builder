const Events = require('./EventManager');
const ConfigValidator = require('./ConfigValidator');

/**
 * Outbound Integration Gateway
 * Handles event registration and execution for outbound integrations (Prolibu → External Systems)
 * Enhanced to support array-based configuration with globalTransforms/globalAfterTransforms
 */
class OutboundIntegration {
  constructor(configs = []) {
    this.configs = configs;
    this.validateConfigs();
  }

  /**
   * Validates the array-based configuration using ConfigValidator
   */
  validateConfigs() {
    if (!Array.isArray(this.configs)) {
      throw new Error('OutboundIntegration: Configuration must be an array');
    }

    try {
      this.validatedConfigs = ConfigValidator.validateConfigs(this.configs);
    } catch (error) {
      throw new Error(`OutboundIntegration validation failed: ${error.message}`);
    }
  }

  /**
   * Registers events for all configurations
   */
  async registerEvents() {
    for (const config of this.validatedConfigs) {
      if (!config.active) {
        continue;
      }
      
      for (const event of config.events) {
        const eventName = `${config.source}.${event.name}`;
        
        if (typeof event.handler !== 'function') {
          throw new Error(`Event handler for '${eventName}' must be a function`);
        }

        // Register event with enhanced context
        Events.on(eventName, async () => {
          try {
            await event.handler(config.source, config, event);
          } catch (error) {
            console.error(`❌ Error in event handler for '${eventName}':`, error.message);
            throw error;
          }
        });
      }
    }
  }

  /**
   * Gets configuration for a specific source object
   * @param {string} source - Source object name
   * @returns {Object|null} - Configuration object or null if not found
   */
  getConfig(source) {
    return this.validatedConfigs.find(config => config.source === source) || null;
  }

  /**
   * Gets event configuration for a specific source object and event name
   * @param {string} source - Source object name
   * @param {string} eventName - Event name (e.g., 'afterCreate')
   * @returns {Object|null} - Event configuration or null if not found
   */
  getEventConfig(source, eventName) {
    const config = this.getConfig(source);
    if (!config) return null;
    
    return config.events.find(event => event.name === eventName) || null;
  }

  /**
   * Lists all active configurations
   * @returns {Array} - Array of active configurations
   */
  getActiveConfigs() {
    return this.validatedConfigs.filter(config => config.active);
  }

  /**
   * Initializes the outbound integration system
   */
  async initialize() {
    await this.registerEvents();
    await Events.init();
  }
}

module.exports = OutboundIntegration;