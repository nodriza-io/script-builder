/* global env, variables, setVariable axios */

/**
 * HubSpot API Adapter
 * 
 * Provides a standardized interface for interacting with HubSpot CRM using OAuth2.
 * Follows the same patterns as SalesforceApi for consistent behavior across all outbound integrations.
 * 
 * @class HubSpotApi
 * 
 * @example
 * const hubspotApi = new HubSpotApi({
 *   accessToken: 'your-access-token',
 *   clientSecret: 'your-client-secret'
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
   * @param {string} config.accessToken - HubSpot Access Token (Private App access token)
   * @param {string} config.clientSecret - HubSpot Client Secret
   * @param {string} [config.baseUrl='https://api.hubapi.com'] - HubSpot API base URL
   * @param {string} [config.apiVersion='v3'] - HubSpot API version
   */
  constructor({ accessToken, clientSecret, baseUrl = 'https://api.hubapi.com', apiVersion = 'v3' } = {}) {
    if (!accessToken) throw new Error('accessToken is required');
    if (!clientSecret) throw new Error('clientSecret is required');

    // Store credentials
    this.initialAccessToken = accessToken;
    this.clientSecret = clientSecret;
    this.baseUrl = baseUrl;
    this.apiVersion = apiVersion;
    this.tokenKey = `hubspot-token-${env}`;
    
    // Check if we're running in Prolibu server environment
    this.isServerEnvironment = typeof globalThis.setVariable === 'function' && typeof globalThis.variables !== 'undefined';
    
    // Initialize token value based on environment
    if (this.isServerEnvironment) {
      // Server environment - use variables array
      const tokenFound = globalThis.variables.find(v => v.key === this.tokenKey);
      this.tokenValue = tokenFound ? JSON.parse(tokenFound.value) : null;
    } else {
      // Local/test environment - use memory cache only
      this.tokenValue = null;
    }
    
    // Token refresh buffer - refresh token 5 minutes before expiration
    this.TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // Auto-retry configuration
    this.retryOnTokenError = true;
    this.maxRetries = 1; // Only retry once to avoid infinite loops
    
    // tokenValue format:
    // {
    //   "access_token": "...",
    //   "refresh_token": "...",
    //   "expires_in": 1800,
    //   "token_type": "bearer",
    //   "issued_at": "1758578068457"
    // }
    
    // Create axios instance for HubSpot API calls
    this.axios = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    // Authentication state
    this.accessToken = null;
    this.authenticated = false;
  }

  /**
   * Enhanced authentication method with smart token caching
   */
  async authenticate() {
    try {
      // Check if we have a valid cached token
      if (await this.isTokenValid()) {
        this.accessToken = this.tokenValue.access_token;
        this.authenticated = true;
        this.updateAxiosHeaders();
        return this.accessToken;
      }

      // Token is expired or doesn't exist, get a new one
      return await this.refreshToken();
      
    } catch (err) {
      // If refresh fails, clear cache and throw error
      await this.clearTokenCache();
      throw this.handleHubSpotAxiosError(err, 'Authentication');
    }
  }

  /**
   * Check if current token is valid and not near expiration
   */
  async isTokenValid() {
    if (!this.tokenValue || !this.tokenValue.access_token || !this.tokenValue.issued_at) {
      return false;
    }

    const now = Date.now();
    const issuedAt = parseInt(this.tokenValue.issued_at);
    
    // HubSpot access tokens expire based on expires_in (typically 30 minutes = 1800 seconds)
    const expiresIn = this.tokenValue.expires_in || 1800; // Default 30 minutes
    const tokenLifetime = expiresIn * 1000; // Convert to milliseconds
    const expirationTime = issuedAt + tokenLifetime;
    const refreshTime = expirationTime - this.TOKEN_REFRESH_BUFFER;

    const isValid = now < refreshTime;

    return isValid;
  }

  /**
   * Get new token using refresh token or initial access token
   */
  async refreshToken() {
    try {
      // If we have a refresh_token in cache, use it
      if (this.tokenValue?.refresh_token) {
        const response = await axios.post(
          `${this.baseUrl}/oauth/v1/token`,
          `grant_type=refresh_token&client_id=${encodeURIComponent(this.initialAccessToken)}&client_secret=${encodeURIComponent(this.clientSecret)}&refresh_token=${encodeURIComponent(this.tokenValue.refresh_token)}`,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            }
          }
        );

        const tokenResponse = {
          ...response.data,
          issued_at: Date.now().toString()
        };

        await this.saveToken(tokenResponse);
        return this.accessToken;
      } else {
        // First time - use the initial access token directly
        const tokenResponse = {
          access_token: this.initialAccessToken,
          token_type: 'bearer',
          expires_in: 1800, // 30 minutes default
          issued_at: Date.now().toString()
        };

        await this.saveToken(tokenResponse);
        return this.accessToken;
      }
    } catch (err) {
      console.log('❌ Token refresh failed:', err.message);
      throw this.handleHubSpotAxiosError(err, 'HubSpot token refresh');
    }
  }

  /**
   * Save token to cache
   */
  async saveToken(tokenResponse) {
    // Save to variables cache (only in server environment)
    if (this.isServerEnvironment) {
      await globalThis.setVariable(this.tokenKey, JSON.stringify(tokenResponse));
    }
    
    // Update instance state
    this.tokenValue = tokenResponse;
    this.accessToken = tokenResponse.access_token;
    this.authenticated = true;
    
    // Update axios headers
    this.updateAxiosHeaders();
  }

  /**
   * Update axios headers with current token
   */
  updateAxiosHeaders() {
    if (this.accessToken) {
      this.axios.defaults.headers.Authorization = `Bearer ${this.accessToken}`;
    }
  }

  /**
   * Clear token cache
   */
  async clearTokenCache() {
    try {
      // Clear server environment cache
      if (this.isServerEnvironment) {
        await globalThis.setVariable(this.tokenKey, '');
      } else {
        console.log('🔧 Token cache cleared from memory (local environment)');
      }
      
      this.tokenValue = null;
      this.accessToken = null;
      this.authenticated = false;
      
      // Remove authorization header
      delete this.axios.defaults.headers.Authorization;
      
    } catch (err) {
      console.log('Warning: Failed to clear token cache:', err.message);
    }
  }

  /**
   * Handle token invalidation from error responses
   */
  async handleTokenInvalidation(statusCode) {
    if (statusCode === 401) {
      console.log('🔑 Token invalidated by HubSpot (401), clearing cache...');
      await this.clearTokenCache();
      return true; // Indicates token was invalidated
    }
    return false;
  }

  /**
   * HubSpot-specific axios error handler
   */
  handleHubSpotAxiosError(err, context = 'HubSpot operation') {
    let errorMessage = 'Unknown error';
    let statusCode = null;

    if (err.response) {
      statusCode = err.response.status;
      errorMessage = err.response.statusText || 'HTTP error';
      
      if (err.response.data) {
        errorMessage = err.response.data.message || err.response.data.error || errorMessage;
      }
    } else if (err.request) {
      errorMessage = 'No response from server';
    } else {
      errorMessage = err.message || 'Unknown error';
    }
    
    const hubspotError = new Error(`${context} failed: ${errorMessage}`);
    hubspotError.statusCode = statusCode;
    return hubspotError;
  }

  /**
   * Execute method with automatic token retry
   */
  async executeWithRetry(operation, context = 'Operation') {
    let attempt = 0;
    
    while (attempt <= this.maxRetries) {
      try {
        return await operation();
      } catch (err) {
        const hubspotError = this.handleHubSpotAxiosError(err, context);
        
        // Check if we should retry due to token invalidation
        if (this.retryOnTokenError && attempt < this.maxRetries) {
          const tokenInvalidated = await this.handleTokenInvalidation(hubspotError.statusCode);
          
          if (tokenInvalidated) {
            // Re-authenticate and retry
            await this.authenticate();
            attempt++;
            continue;
          }
        }
        
        // If no retry or max retries reached, throw the error
        throw hubspotError;
      }
    }
  }

  /**
   * Method to force token refresh (useful for testing or manual refresh)
   */
  async forceRefresh() {
    await this.clearTokenCache();
    return await this.authenticate();
  }

  /**
   * Method to get token info for debugging
   */
  getTokenInfo() {
    if (!this.tokenValue) {
      return { status: 'No token cached' };
    }

    const now = Date.now();
    const issuedAt = parseInt(this.tokenValue.issued_at);
    const expiresIn = this.tokenValue.expires_in || 1800;
    const tokenLifetime = expiresIn * 1000;
    const expirationTime = issuedAt + tokenLifetime;
    const timeUntilExpiration = expirationTime - now;

    return {
      status: 'Token cached',
      issuedAt: new Date(issuedAt).toISOString(),
      expiresAt: new Date(expirationTime).toISOString(),
      timeUntilExpiration: `${Math.round(timeUntilExpiration / 1000 / 60)} minutes`,
      isValid: timeUntilExpiration > this.TOKEN_REFRESH_BUFFER
    };
  }

  /**
   * Creates a new record and returns the complete created object
   * 
   * @param {string} objectType - HubSpot object type (e.g., 'contacts', 'companies', 'deals')
   * @param {Object} data - Record data to create (field-value pairs)
   * @param {Object} [data.associations] - Optional associations to other HubSpot objects
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
   * // Create deal with associations
   * const newDeal = await hubspotApi.create('deals', {
   *   dealname: 'Q4 Software Deal',
   *   amount: '50000',
   *   dealstage: 'presentationscheduled',
   *   pipeline: 'default',
   *   associations: {
   *     contacts: ['12345'],
   *     companies: ['67890']
   *   }
   * });
   */
  async create(objectType, data) {
    const createResult = await this.executeWithRetry(async () => {
      // Ensure authenticated
      if (!this.authenticated) {
        await this.authenticate();
      }
      
      // Separate associations from properties
      const { associations, ...properties } = data;
      
      // Build request body
      const requestBody = { properties };
      
      // Add associations if provided
      if (associations && Object.keys(associations).length > 0) {
        requestBody.associations = [];
        
        // Convert associations object to HubSpot format
        // { contacts: ['123'], companies: ['456'] } 
        // → [{ to: { id: '123' }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: X }] }]
        for (const [objectType, ids] of Object.entries(associations)) {
          if (Array.isArray(ids)) {
            const associationTypeId = this._getAssociationTypeId(objectType);
            ids.forEach(id => {
              requestBody.associations.push({
                to: { id: String(id) },
                types: [{
                  associationCategory: 'HUBSPOT_DEFINED',
                  associationTypeId
                }]
              });
            });
          }
        }
      }
      
      // Create the record using POST
      const response = await this.axios.post(
        `/crm/${this.apiVersion}/objects/${objectType}`,
        requestBody,
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
          params: {
            // Request all properties including custom ones
            properties: Object.keys(data).filter(k => k !== 'associations').join(',')
          },
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
   * Get HubSpot association type ID for common object types
   * @private
   * @see https://developers.hubspot.com/docs/api/crm/associations
   */
  _getAssociationTypeId(objectType) {
    // HubSpot default association type IDs
    const associationTypeIds = {
      'contacts': 3,      // Deal to Contact
      'companies': 341,   // Deal to Company (primary)
      'deals': 4,         // Contact to Deal
    };
    
    return associationTypeIds[objectType.toLowerCase()] || 1;
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
      // Support Prolibu-style (spaces) or comma-separated field names
      properties = select ? select.replace(/\s+/g, ',').split(',').filter(f => f) : [];

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
          // HubSpot API expects properties as comma-separated string, NOT array
          params.properties = options.select;
        } else {
          // If no specific fields requested, get ALL properties (including custom)
          params.propertiesWithHistory = 'all';
        }

        try {
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
        } catch (err) {
          // Return null for 404 (not found) instead of throwing error
          if (err.response?.status === 404) {
            return null;
          }
          // For any other error, re-throw to let executeWithRetry handle it
          throw err;
        }
      }, 'Find single record');
    } catch (err) {
      // Return null for 404 (not found) that may come from handleHubSpotAxiosError
      if (err.statusCode === 404 || err.message?.includes('Not Found')) {
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
      
      // Filter out 'associations' from properties (they can't be updated this way)
      const { associations, ...properties } = data;
      
      // Update the record using PATCH
      await this.axios.patch(
        `/crm/${this.apiVersion}/objects/${objectType}/${id}`,
        { properties },
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
   * @returns {Promise<boolean>} true if deleted successfully, false if record not found (404)
   * 
   * @throws {Error} For permission issues or network problems (but NOT for 404)
   * 
   * @example
   * const deleted = await hubspotApi.delete('contacts', '12345');
   * if (deleted) {
   *   console.log('Deleted successfully');
   * } else {
   *   console.log('Record not found');
   * }
   * 
   * @example
   * // Handle delete with simple boolean check
   * const success = await hubspotApi.delete('companies', '67890');
   * if (!success) {
   *   console.log('Company not found or already deleted');
   * }
   */
  async delete(objectType, id) {
    try {
      await this.executeWithRetry(async () => {
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
      }, 'Delete record');
      
      return true; // Delete succeeded
    } catch (err) {
      // If 404 (not found), return false instead of throwing
      if (err.statusCode === 404 || (err.message && err.message.includes('404'))) {
        return false;
      }
      // For any other error, still throw
      throw err;
    }
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
