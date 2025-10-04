const axios = require('axios');

/**
 * HubSpot API Adapter
 * 
 * Provides a standardized interface for interacting with HubSpot CRM.
 * Follows the same patterns as ProlibuApi for consistent behavior across all outbound integrations.
 * 
 * @class HubSpotApi
 * 
 * @example
 * const hubspotApi = new HubSpotApi({
 *   apiKey: 'your-hubspot-api-key',
 * });
 * 
 * await hubspotApi.authenticate();
 * 
 * // Create a contact
 * const contact = await hubspotApi.create('contacts', {
 *   firstname: 'John',
 *   lastname: 'Doe',
 *   email: 'john.doe@example.com'
 * });
 * 
 * // Find contacts
 * const contacts = await hubspotApi.find('contacts', {
 *   email: 'john.doe@example.com',
 *   limit: 10,
 *   page: 1
 * });
 * 
 * // Update a contact
 * const updated = await hubspotApi.update('contacts', contactId, {
 *   phone: '+1-555-0123'
 * });
 * 
 * // Delete a contact
 * await hubspotApi.delete('contacts', contactId);
 */
class HubSpotApi {
  /**
   * Creates an instance of HubSpotApi
   * 
   * @param {Object} config - Configuration object
   * @param {string} config.apiKey - HubSpot API Key (Private App access token)
   * @param {string} [config.baseUrl='https://api.hubapi.com'] - HubSpot API base URL
   * @param {string} [config.apiVersion='v3'] - HubSpot API version
   */
  constructor(config) {
    if (!config.apiKey) {
      throw new Error('HubSpot API key is required');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.hubapi.com';
    this.apiVersion = config.apiVersion || 'v3';
    
    this.axios = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
    });
    
    this.authenticated = false;
    this.accessToken = null;
  }

  /**
   * Authenticates with HubSpot API
   * HubSpot uses API key authentication (no separate auth call needed)
   * 
   * @returns {Promise<void>} Sets this.authenticated = true and this.accessToken
   * @throws {Error} If API key is missing
   * 
   * @example
   * await hubspotApi.authenticate();
   * console.log('Authenticated:', hubspotApi.authenticated); // true
   */
  async authenticate() {
    if (this.apiKey) {
      this.accessToken = this.apiKey;
      this.authenticated = true;
      console.log('HubSpot API key configured successfully');
    } else {
      throw new Error('HubSpot API key is required');
    }
  }

  /**
   * Executes a function with retry logic and exponential backoff
   * 
   * @param {Function} fn - Function to execute
   * @param {string} [context=''] - Context description for error messages
   * @param {number} [maxRetries=3] - Maximum number of retry attempts
   * 
   * @returns {Promise<*>} Result from the executed function
   * @throws {Error} If all retries fail
   */
  async executeWithRetry(fn, context = '', maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Check if error is retryable
        const isRetryable = 
          error.code === 'ECONNRESET' ||
          error.code === 'ETIMEDOUT' ||
          error.code === 'ENOTFOUND' ||
          error.response?.status === 429 || // Rate limit
          error.response?.status >= 500;    // Server errors
        
        if (!isRetryable || attempt === maxRetries) {
          // Add context to error message
          const errorMsg = error.response?.data?.message || error.message;
          const statusCode = error.response?.status || 'N/A';
          throw new Error(`${context} failed (Status: ${statusCode}): ${errorMsg}`);
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Creates a new record and returns the complete created object
   * 
   * @param {string} objectType - HubSpot object type (e.g., 'contacts', 'companies', 'deals')
   * @param {Object} data - Record data to create (field-value pairs)
   * 
   * @returns {Promise<Object>} Complete created record with all fields (standardized with ProlibuApi)
   * 
   * @throws {Error} For validation errors, permission issues, or network problems
   * 
   * @example
   * const newContact = await hubspotApi.create('contacts', {
   *   firstname: 'Jane',
   *   lastname: 'Smith',
   *   email: 'jane.smith@example.com',
   *   phone: '+1-555-0123'
   * });
   * console.log('Created contact:', newContact);
   * // Returns: { id: '123', firstname: 'Jane', lastname: 'Smith', email: '...', createdate: '...', ... }
   * 
   * @example
   * const newCompany = await hubspotApi.create('companies', {
   *   name: 'Acme Corporation',
   *   domain: 'acme.com',
   *   industry: 'Technology'
   * });
   * 
   * @example
   * const newDeal = await hubspotApi.create('deals', {
   *   dealname: 'Q4 Software Deal',
   *   amount: '50000',
   *   dealstage: 'presentationscheduled',
   *   pipeline: 'default'
   * });
   */
  async create(objectType, data) {
    const createResult = await this.executeWithRetry(async () => {
      // Ensure authenticated
      if (!this.authenticated) {
        await this.authenticate();
      }
      
      // Create the record using POST
      const response = await this.axios.post(
        `/crm/${this.apiVersion}/objects/${objectType}`,
        { properties: data },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      return response.data;
    }, 'Create record');
    
    // Fetch the complete created object (all fields) to match ProlibuApi behavior
    if (createResult.id) {
      const response = await this.axios.get(
        `/crm/${this.apiVersion}/objects/${objectType}/${createResult.id}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          }
        }
      );
      
      // HubSpot returns properties nested in response.data.properties
      return {
        id: response.data.id,
        ...response.data.properties
      };
    }
    
    throw new Error('Create failed');
  }

  /**
   * Queries records using native query string or object-based options
   * 
   * @param {string} objectType - HubSpot object type (e.g., 'contacts', 'companies', 'deals')
   * @param {Object} options - Query options object
   * 
   * Reserved fields (used for query structure, NOT in WHERE clause):
   * @param {string} [options.select] - Comma-separated field names to select
   * @param {number} [options.limit=100] - Maximum records to return
   * @param {string} [options.sort] - Sorting criteria (propertyName or -propertyName for DESC)
   * @param {number} [options.page=1] - Page number for pagination
   * @param {*} [options.*] - Any other field becomes a filter condition
   * 
   * @returns {Promise<Object>} Standardized response with pagination and data
   * @returns {Object} returns.pagination - Pagination metadata
   * @returns {number} returns.pagination.count - Total records matching query
   * @returns {number} returns.pagination.page - Current page number
   * @returns {number} returns.pagination.limit - Records per page
   * @returns {number} returns.pagination.lastPage - Total number of pages
   * @returns {number} returns.pagination.startIndex - Zero-based offset
   * @returns {Array} returns.data - Array of matching records
   * 
   * @example
   * // Object with filter conditions (reserved fields: select, limit, sort, page)
   * const result = await hubspotApi.find('contacts', {
   *   select: 'firstname, lastname, email',
   *   firstname: 'John',          // → Filter: firstname = 'John' AND
   *   email: { $exists: true },   // → email HAS_PROPERTY
   *   limit: 10,
   *   sort: '-createdate',        // Sort by createdate DESC
   *   page: 1
   * });
   * 
   * @example
   * // Using operators
   * const result = await hubspotApi.find('companies', {
   *   select: 'name, domain, industry',
   *   industry: { $ne: 'Retail' },        // → industry NEQ 'Retail'
   *   numberofemployees: { $gt: 100 },    // → numberofemployees GT 100
   *   domain: { $exists: true },          // → domain HAS_PROPERTY
   *   limit: 50
   * });
   */
  async find(objectType, options = {}) {
    await this.executeWithRetry(async () => {
      if (!this.authenticated) {
        await this.authenticate();
      }
    }, 'Ensure authentication');

    let limit = 100;
    let page = 1;
    let properties = [];
    let filters = [];
    let sorts = [];

    if (typeof options === 'object') {
      const {
        select,
        limit: optLimit = 100,
        sort,
        page: optPage = 1,
        ...whereFields
      } = options;

      limit = optLimit;
      page = optPage;
      properties = select ? select.split(',').map(f => f.trim()) : [];

      // Handle sorting
      if (sort) {
        const isDescending = sort.startsWith('-');
        const propertyName = isDescending ? sort.substring(1) : sort;
        sorts.push({
          propertyName,
          direction: isDescending ? 'DESCENDING' : 'ASCENDING'
        });
      }

      // Build HubSpot filters from WHERE conditions
      filters = this.buildFilters(whereFields);
    }

    const response = await this.executeWithRetry(async () => {
      return await this.axios.post(
        `/crm/${this.apiVersion}/objects/${objectType}/search`,
        {
          filterGroups: filters.length > 0 ? [{ filters }] : [],
          properties,
          sorts,
          limit,
          after: ((page - 1) * limit).toString(),
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          }
        }
      );
    }, 'Execute search');

    const totalSize = response.data.total || 0;
    const records = response.data.results?.map(r => ({
      id: r.id,
      ...r.properties
    })) || [];

    return {
      pagination: {
        count: totalSize,
        page: page,
        limit: limit,
        lastPage: Math.ceil(totalSize / limit),
        startIndex: (page - 1) * limit,
      },
      data: records,
    };
  }

  /**
   * Helper: Build HubSpot filters from object fields
   * Converts Prolibu-style operators to HubSpot-specific syntax
   * 
   * @private
   * @param {Object} fields - Field-value pairs to convert to filters
   * @returns {Array} Array of HubSpot filter objects
   */
  buildFilters(fields) {
    const filters = [];
    
    for (const [key, value] of Object.entries(fields)) {
      if (value === null || value === undefined) {
        continue;
      }

      // Handle operator objects
      if (typeof value === 'object' && !Array.isArray(value)) {
        for (const [operator, operand] of Object.entries(value)) {
          switch (operator) {
            case '$exists':
              filters.push({
                propertyName: key,
                operator: operand ? 'HAS_PROPERTY' : 'NOT_HAS_PROPERTY'
              });
              break;
            case '$ne':
              filters.push({
                propertyName: key,
                operator: 'NEQ',
                value: String(operand)
              });
              break;
            case '$gt':
              filters.push({
                propertyName: key,
                operator: 'GT',
                value: String(operand)
              });
              break;
            case '$gte':
              filters.push({
                propertyName: key,
                operator: 'GTE',
                value: String(operand)
              });
              break;
            case '$lt':
              filters.push({
                propertyName: key,
                operator: 'LT',
                value: String(operand)
              });
              break;
            case '$lte':
              filters.push({
                propertyName: key,
                operator: 'LTE',
                value: String(operand)
              });
              break;
            case '$in':
              filters.push({
                propertyName: key,
                operator: 'IN',
                values: operand.map(v => String(v))
              });
              break;
            default:
              console.warn(`Unknown operator: ${operator}`);
          }
        }
      } else {
        // Simple equality
        filters.push({
          propertyName: key,
          operator: 'EQ',
          value: String(value)
        });
      }
    }
    
    return filters;
  }

  /**
   * Retrieves a single record by ID
   * 
   * @param {string} objectType - HubSpot object type (e.g., 'contacts', 'companies', 'deals')
   * @param {string} id - Record ID to retrieve
   * @param {Object} [options] - Optional query options
   * @param {string} [options.select] - Comma-separated field names to return (default: all fields)
   * 
   * @returns {Promise<Object|null>} Record object if found, null if not found (404)
   * 
   * @throws {Error} For permission issues or network problems (but NOT for 404)
   * 
   * @example
   * const contact = await hubspotApi.findOne('contacts', '12345');
   * if (contact) {
   *   console.log('Found contact:', contact);
   * } else {
   *   console.log('Contact not found');
   * }
   * 
   * @example
   * // With specific fields
   * const contact = await hubspotApi.findOne('contacts', '12345', {
   *   select: 'firstname, lastname, email'
   * });
   */
  async findOne(objectType, id, options = {}) {
    try {
      return await this.executeWithRetry(async () => {
        if (!this.authenticated) {
          await this.authenticate();
        }

        // Build URL with optional field selection
        const url = `/crm/${this.apiVersion}/objects/${objectType}/${id}`;
        const params = {};
        
        if (options.select) {
          params.properties = options.select.split(',').map(f => f.trim());
        }

        const response = await this.axios.get(url, {
          params,
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          }
        });
        
        // HubSpot returns properties nested in response.data.properties
        return {
          id: response.data.id,
          ...response.data.properties
        };
      }, 'Find single record');
    } catch (err) {
      // Return null for 404 (not found) instead of throwing error
      if (err.response?.status === 404 || err.message.includes('Status: 404')) {
        return null;
      }
      // For any other error, still throw
      throw err;
    }
  }

  /**
   * Updates an existing record and returns the complete updated object
   * 
   * @param {string} objectType - HubSpot object type (e.g., 'contacts', 'companies', 'deals')
   * @param {string} id - Record ID to update
   * @param {Object} data - Updated field values (only changed fields)
   * @param {Object} [options] - Additional options
   * @param {string} [options.select] - Comma-separated field names to return (default: all fields)
   * 
   * @returns {Promise<Object>} Complete updated record object (standardized with ProlibuApi)
   * 
   * @throws {Error} For validation errors, record not found, permission issues, or network problems
   * 
   * @example
   * const updatedContact = await hubspotApi.update('contacts', '12345', {
   *   phone: '+1-555-9876',
   *   email: 'john.doe.updated@example.com',
   *   city: 'San Francisco'
   * });
   * console.log('Updated contact:', updatedContact);
   * // Returns: { id: '12345', firstname: 'John', phone: '+1-555-9876', email: '...', ... }
   * 
   * @example
   * // Update with specific fields to return
   * const updatedCompany = await hubspotApi.update('companies', '67890', 
   *   {
   *     industry: 'Healthcare',
   *     numberofemployees: '500'
   *   },
   *   { select: 'name, industry, numberofemployees' }
   * );
   */
  async update(objectType, id, data, options = {}) {
    // Step 1: Update the record
    await this.executeWithRetry(async () => {
      if (!this.authenticated) {
        await this.authenticate();
      }
      
      // Update the record using PATCH
      await this.axios.patch(
        `/crm/${this.apiVersion}/objects/${objectType}/${id}`,
        { properties: data },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          }
        }
      );
    }, 'Update record');
    
    // Step 2: Fetch and return the updated object
    if (options.select) {
      // If specific fields requested, use findOne with select
      return await this.findOne(objectType, id, { select: options.select });
    } else {
      // Get all fields using direct GET endpoint
      const response = await this.axios.get(
        `/crm/${this.apiVersion}/objects/${objectType}/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          }
        }
      );
      
      // HubSpot returns properties nested
      return {
        id: response.data.id,
        ...response.data.properties
      };
    }
  }

  /**
   * Deletes a record from HubSpot
   * 
   * @param {string} objectType - HubSpot object type (e.g., 'contacts', 'companies', 'deals')
   * @param {string} id - Record ID to delete
   * 
   * @returns {Promise<Object>} Success status
   * @returns {boolean} returns.success - Always true if deletion succeeds
   * 
   * @throws {Error} For record not found, permission issues, or network problems
   * 
   * @example
   * const result = await hubspotApi.delete('contacts', '12345');
   * console.log('Deleted successfully:', result.success); // true
   * 
   * @example
   * // Handle delete with error checking
   * try {
   *   await hubspotApi.delete('companies', '67890');
   *   console.log('Company deleted successfully');
   * } catch (error) {
   *   if (error.message.includes('Status: 404')) {
   *     console.error('Company not found');
   *   } else {
   *     console.error('Delete failed:', error.message);
   *   }
   * }
   */
  async delete(objectType, id) {
    return await this.executeWithRetry(async () => {
      if (!this.authenticated) {
        await this.authenticate();
      }
      
      // Delete the record using DELETE
      await this.axios.delete(
        `/crm/${this.apiVersion}/objects/${objectType}/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          }
        }
      );
      
      // Return success status
      return { success: true };
    }, 'Delete record');
  }

  /**
   * Gets reference data for linking Prolibu records to HubSpot records
   * 
   * @param {string} objectType - HubSpot object type
   * @param {string} id - HubSpot record ID
   * 
   * @returns {Object} Reference data object
   * @returns {string} returns.refId - HubSpot record ID
   * @returns {string} returns.refUrl - URL to view record in HubSpot's UI
   * 
   * @example
   * const refData = hubspotApi.getRefData('contacts', '12345');
   * await prolibuApi.update('Contact', prolibuContactId, refData);
   * // Stores: { refId: '12345', refUrl: 'https://app.hubspot.com/contacts/.../contact/12345' }
   */
  getRefData(objectType, id) {
    if (!id) {
      throw new Error('"id" is required to get refData');
    }
    return {
      refId: id,
      refUrl: this.getRefUrl(objectType, id)
    };
  }

  /**
   * Generates URL to view record in HubSpot's web interface
   * 
   * @param {string} objectType - HubSpot object type
   * @param {string} id - HubSpot record ID
   * 
   * @returns {string} URL to view record in HubSpot's UI
   * 
   * @example
   * const url = hubspotApi.getRefUrl('contacts', '12345');
   * // Returns: 'https://app.hubspot.com/contacts/contact/12345'
   */
  getRefUrl(objectType, id) {
    // HubSpot object type mapping for URLs
    const objectMap = {
      'contacts': 'contact',
      'companies': 'company',
      'deals': 'deal',
      'tickets': 'ticket',
      'products': 'product',
      'quotes': 'quote',
    };
    
    const urlType = objectMap[objectType.toLowerCase()] || objectType.toLowerCase();
    
    // HubSpot URL format (portal ID not needed in modern URLs)
    return `https://app.hubspot.com/contacts/${urlType}/${id}`;
  }
}

module.exports = HubSpotApi;
