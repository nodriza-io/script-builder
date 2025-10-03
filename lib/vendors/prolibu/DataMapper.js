/**
 * DataMapper - Enhanced bidirectional data mapping system
 * Supports array-based configuration with globalTransforms/globalAfterTransforms
 * and event-specific overrides
 */

const ConfigValidator = require('./ConfigValidator');

class DataMapper {
  /**
   * Maps data using array-based configuration format with resolved transforms
   * @param {Object} options - Mapping options
   * @param {Object} options.data - Data to map
   * @param {Object} options.config - Object configuration (from array format)
   * @param {Object} options.event - Event configuration
   * @param {boolean} options.reverse - If true, reverses mapping
   * @returns {Object|Promise<Object>} - Mapped object
   */
  static async mapWithConfig({ data, config, event, reverse = false } = {}) {
    // Validate inputs
    if (!config || !event) {
      throw new Error('DataMapper.mapWithConfig: config and event are required');
    }

    // Execute globalPreMapping hook if defined at config level
    if (config.globalPreMapping && typeof config.globalPreMapping === 'function') {
      try {
        await config.globalPreMapping(data, config, event);
      } catch (error) {
        console.error('❌ globalPreMapping error:', error);
      }
    }

    // Execute preMapping hook if defined in the event
    if (event.preMapping && typeof event.preMapping === 'function') {
      try {
        await event.preMapping(data, config, event);
      } catch (error) {
        console.error('❌ preMapping error:', error);
      }
    }

    // Resolve transforms using the override strategy
    const { transforms, afterTransforms } = ConfigValidator.resolveTransforms(config, event);

    const mappedData = await this._processMapping({ 
      data, 
      map: config.map, 
      reverse, 
      transforms, 
      afterTransforms 
    });

    // Execute postMapping hook if defined in the event
    if (event.postMapping && typeof event.postMapping === 'function') {
      try {
        await event.postMapping(data, config, event, mappedData);
      } catch (error) {
        console.error('❌ postMapping error:', error);
      }
    }

    // Execute globalPostMapping hook if defined at config level
    if (config.globalPostMapping && typeof config.globalPostMapping === 'function') {
      try {
        await config.globalPostMapping(data, config, event, mappedData);
      } catch (error) {
        console.error('❌ globalPostMapping error:', error);
      }
    }

    return mappedData;
  }

  /**
   * Legacy map method for backward compatibility
   * @deprecated Use mapWithConfig for new array-based configurations
   */
  static map({ data, map, reverse = false, transforms = {}, afterTransforms = {} } = {}) {
    return this._processMapping({ data, map, reverse, transforms, afterTransforms });
  }

  /**
   * Core mapping logic that handles both sync and async transforms elegantly
   * @private
   */
  static async _processMapping({ data, map, reverse = false, transforms = {}, afterTransforms = {} }) {
    if (!data || typeof data !== 'object') {
      throw new Error('DataMapper: data must be a valid object');
    }
    
    if (!map || typeof map !== 'object') {
      throw new Error('DataMapper: map must be a valid mapping object');
    }

    const result = {};
    const { transforms: mapTransforms = {}, ...mappings } = map;
    
    // Concatenate map transforms with additional transforms (additional takes precedence)
    const allTransforms = { ...mapTransforms, ...transforms };
    
    // Collect mapping operations
    const mappingOperations = Object.entries(mappings).map(([sourceKey, targetKey]) => {
      const { sourceField, targetField, transformKey } = this._getMappingFields(sourceKey, targetKey, reverse);
      const value = this.getNestedValue(data, sourceField);
      
      return { sourceField, targetField, transformKey, value };
    });

    // Process all operations and detect if any are async
    const transformResults = mappingOperations.map(({ targetField, transformKey, value }) => {
      if (value === undefined) return null; // Skip undefined values
      
      return this._applyTransform(value, data, allTransforms[transformKey], targetField);
    });

    // Check if any result is a Promise (async transform)
    const hasAsyncTransforms = transformResults.some(result => 
      result && typeof result.then === 'function'
    );

    let mappedResult;
    if (hasAsyncTransforms) {
      // Handle async case
      mappedResult = await this._handleAsyncTransforms(transformResults, mappingOperations, result);
    } else {
      // Handle sync case
      this._applySyncResults(transformResults, mappingOperations, result);
      mappedResult = result;
    }

    // Apply afterTransforms if provided
    if (afterTransforms && Object.keys(afterTransforms).length > 0) {
      return this._applyAfterTransforms(mappedResult, afterTransforms, data);
    }

    return mappedResult;
  }

  /**
   * Determines mapping field directions based on reverse flag
   * @private
   */
  static _getMappingFields(sourceKey, targetKey, reverse) {
    if (reverse) {
      return {
        sourceField: targetKey,
        targetField: sourceKey,
        transformKey: sourceKey
      };
    } else {
      return {
        sourceField: sourceKey,
        targetField: targetKey,
        transformKey: targetKey
      };
    }
  }

  /**
   * Applies a transform function (sync or async) to a value
   * @private
   */
  static _applyTransform(value, sourceData, transform, targetField) {
    if (!transform || typeof transform !== 'function') {
      return { type: 'direct', value, targetField };
    }

    try {
      const transformResult = transform(value, sourceData);
      
      if (transformResult && typeof transformResult.then === 'function') {
        // Async transform - return Promise wrapped with metadata
        return transformResult.then(result => ({ 
          type: 'async', 
          value: result, 
          targetField 
        })).catch(error => {
          console.error(`❌ Transform error for field ${targetField}:`, error);
          return { type: 'error', value: undefined, targetField };
        });
      } else {
        // Sync transform
        return { type: 'sync', value: transformResult, targetField };
      }
    } catch (error) {
      console.error(`❌ Sync transform error for field ${targetField}:`, error);
      return { type: 'error', value: undefined, targetField };
    }
  }

  /**
   * Handles async transforms using Promise.all
   * @private
   */
  static async _handleAsyncTransforms(transformResults, mappingOperations, result) {
    const resolvedResults = await Promise.all(
      transformResults.map(result => {
        if (result && typeof result.then === 'function') {
          return result; // Already a Promise
        } else if (result) {
          return Promise.resolve(result); // Wrap sync result in Promise
        } else {
          return Promise.resolve(null); // Handle null/undefined
        }
      })
    );

    this._applySyncResults(resolvedResults, mappingOperations, result);
    return result;
  }

  /**
   * Applies resolved transform results to the result object
   * @private
   */
  static _applySyncResults(transformResults, mappingOperations, result) {
    transformResults.forEach((transformResult, index) => {
      if (!transformResult) {
        // Check if the original value was null and should be mapped
        const { targetField, value } = mappingOperations[index];
        if (value === null) {
          this.setNestedValue(result, targetField, null);
        }
        return;
      }
      
      const { targetField } = mappingOperations[index];
      const { type, value } = transformResult;
      
      if (type !== 'error') {
        this.setNestedValue(result, targetField, value);
      }
    });
  }

  /**
   * Gets a value from an object using dot notation
   * @param {Object} obj - Source object
   * @param {string} path - Path with dot notation (e.g. 'company.name')
   * @returns {*} - Found value or undefined
   */
  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Assigns a value to an object using dot notation
   * @param {Object} obj - Target object
   * @param {string} path - Path with dot notation
   * @param {*} value - Value to assign
   */
  static setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    
    target[lastKey] = value;
  }

  /**
   * Applies afterTransforms to the already mapped result (supports async)
   * @private
   */
  static async _applyAfterTransforms(mappedResult, afterTransforms, originalData) {
    const afterTransformEntries = Object.entries(afterTransforms);
    const afterResults = [];

    // Process all afterTransforms
    for (const [fieldPath, transform] of afterTransformEntries) {
      if (typeof transform !== 'function') {
        console.warn(`⚠️ afterTransform for ${fieldPath} is not a function, skipping`);
        continue;
      }

      const currentValue = this.getNestedValue(mappedResult, fieldPath);
      
      try {
        const transformResult = transform(currentValue, mappedResult, originalData);
        
        if (transformResult && typeof transformResult.then === 'function') {
          // Async afterTransform
          afterResults.push(
            transformResult
              .then(result => ({ fieldPath, value: result, type: 'success' }))
              .catch(error => {
                console.error(`❌ afterTransform error for field ${fieldPath}:`, error);
                return { fieldPath, value: currentValue, type: 'error' };
              })
          );
        } else {
          // Sync afterTransform
          afterResults.push({ fieldPath, value: transformResult, type: 'success' });
        }
      } catch (error) {
        console.error(`❌ Sync afterTransform error for field ${fieldPath}:`, error);
        afterResults.push({ fieldPath, value: currentValue, type: 'error' });
      }
    }

    // Check if we have any async afterTransforms
    const hasAsyncAfterTransforms = afterResults.some(result => 
      result && typeof result.then === 'function'
    );

    let resolvedAfterResults;
    if (hasAsyncAfterTransforms) {
      resolvedAfterResults = await Promise.all(afterResults);
    } else {
      resolvedAfterResults = afterResults;
    }

    // Apply all afterTransform results to mappedResult
    resolvedAfterResults.forEach(({ fieldPath, value, type }) => {
      if (type === 'success') {
        this.setNestedValue(mappedResult, fieldPath, value);
      }
    });

    return mappedResult;
  }
}

module.exports = DataMapper;