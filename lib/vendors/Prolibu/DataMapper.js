/**
 * DataMapper - Bidirectional data mapping system
 * Allows mapping objects using mapping dictionaries with reverse support
 * 
 * @author Juan Carlos Prieto
 */

class DataMapper {
  /**
   * Maps data using a mapping dictionary
   * @param {Object} options - Mapping options
   * @param {Object} options.data - Data to map
   * @param {Object} options.map - Mapping dictionary
   * @param {boolean} options.reverse - If true, reverses mapping (value → key), if false (default) uses (key → value)
   * @param {Object} options.additionalTransforms - Additional transforms to concatenate with map transforms
   * @returns {Object} - Mapped object
   */
  static map({ data, map, reverse = false, additionalTransforms = {} } = {}) {
    if (!data || typeof data !== 'object') {
      throw new Error('DataMapper: data must be a valid object');
    }
    
    if (!map || typeof map !== 'object') {
      throw new Error('DataMapper: map must be a valid mapping object');
    }

    const result = {};
    const { transforms = {}, ...mappings } = map;
    
    // Combine map transforms with additionalTransforms
    const allTransforms = { ...transforms, ...additionalTransforms };

    // Iterate over mapping keys
    Object.entries(mappings).forEach(([sourceKey, targetKey]) => {
      let sourceField, targetField, transformKey;
      
      if (reverse) {
        // reverse: true → map from value to key (targetKey → sourceKey)
        sourceField = targetKey;
        targetField = sourceKey;
        transformKey = sourceKey; // In reverse, look for transform by sourceKey
      } else {
        // reverse: false (default) → map from key to value (sourceKey → targetKey)
        sourceField = sourceKey;
        targetField = targetKey;
        transformKey = targetKey; // In forward, look for transform by targetKey
      }

      // Get value from source field
      const value = this.getNestedValue(data, sourceField);
      
      if (value !== undefined && value !== null) {
        // Apply transformation if exists
        let transformedValue = value;
        
        if (allTransforms && allTransforms[transformKey]) {
          const transform = allTransforms[transformKey];
          if (typeof transform === 'function') {
            // Pass value and sourceData, direction is implicit
            transformedValue = transform(value, data);
          }
        }
        
        // Assign to result object only if transformedValue is not undefined
        if (transformedValue !== undefined) {
          this.setNestedValue(result, targetField, transformedValue);
        }
        // If transformedValue is undefined, field is omitted (unset)
      }
    });

    return result;
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
}

module.exports = DataMapper;