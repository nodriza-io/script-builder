function idRequired(id) {
  if (!id) {
    throw new Error('"id" is required for this operation');
  }
}

// Salesforce-specific axios error handler following Prolibu pattern
function handleSalesforceAxiosError(err, context = 'Salesforce operation', salesforceInstance = null) {
  let errorObj;
  let shouldInvalidateToken = false;
  
  if (err.response) {
    // Error de respuesta del servidor (4xx, 5xx)
    let errorMessage = err.response.statusText || 'HTTP error';
    
    // Check for token invalidation scenarios
    if (err.response.data) {
      // Check for INVALID_SESSION_ID or similar authentication errors
      if (Array.isArray(err.response.data) && err.response.data.length > 0) {
        const firstError = err.response.data[0];
        if (firstError.errorCode === 'INVALID_SESSION_ID' || 
            firstError.errorCode === 'INVALID_LOGIN' ||
            firstError.errorCode === 'SESSION_EXPIRED') {
          shouldInvalidateToken = true;
          console.log(`🔑 Detected token invalidation error: ${firstError.errorCode}`);
        }
      }
    }
    
    // Salesforce-specific error handling
    if (err.response.data) {
      // Salesforce returns different error formats
      if (Array.isArray(err.response.data) && err.response.data[0]) {
        // Format: [{ "message": "...", "errorCode": "..." }]
        errorMessage = err.response.data[0].message || err.response.data[0].errorCode || errorMessage;
      } else if (err.response.data.error_description) {
        // OAuth error format
        errorMessage = err.response.data.error_description;
      } else if (err.response.data.error) {
        // Generic error format
        errorMessage = err.response.data.error;
      } else if (err.response.data.message) {
        // Standard message format
        errorMessage = err.response.data.message;
      }
    }
    
    errorObj = {
      type: 'http',
      status: err.response.status,
      message: `${context} failed: ${errorMessage}`,
      details: err.response.data || null,
      shouldInvalidateToken: shouldInvalidateToken
    };
  } else if (err.request) {
    // No hubo respuesta del servidor
    errorObj = {
      type: 'network',
      status: null,
      message: `${context} failed: No response from server`,
      details: null,
    };
  } else {
    // Error de configuración o desconocido
    errorObj = {
      type: 'unknown',
      status: null,
      message: `${context} failed: ${err.message || 'Unknown error'}`,
      details: null,
    };
  }
  
  errorObj.toString = function() {
    return `[${this.type}${this.status ? ' ' + this.status : ''}] ${this.message}` + (this.details ? ` | Details: ${JSON.stringify(this.details)}` : '');
  };
  
  return errorObj;
}

class SalesforceRestApi {
  constructor({ instanceUrl, consumerKey, consumerSecret, apiVersion = '58.0', sandbox = false } = {}) {
    if (!instanceUrl) throw new Error('instanceUrl is required');
    if (!consumerKey) throw new Error('consumerKey is required');
    if (!consumerSecret) throw new Error('consumerSecret is required');
    
    // Store credentials
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
    this.apiVersion = apiVersion;
    this.sandbox = sandbox;
    this.tokenKey = `salesforce-token-${env}`;
    // find inside variables array if the key exists
    const tokenFound = variables.find(v => v.key === this.tokenKey);
    this.tokenValue = tokenFound ? JSON.parse(tokenFound.value) : null;
    
    // Token refresh buffer - refresh token 5 minutes before expiration
    this.TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // Auto-retry configuration
    this.retryOnTokenError = true;
    this.maxRetries = 1; // Only retry once to avoid infinite loops
    
    // tokenValue format:
    // {
    //   "access_token": "22DgL000001MrZq!AQEAQIUHbzPJ3VZWhPZsg67DZjxS1W.ybZ0A3fRkIYO0nd5P6wUM26NBOpS1d_vSzoQ1zuXEEhKKWZRlvlJTjL.R6yAmdh_9",
    //   "signature": "1SNITuAHY791/hCBo3VVRwIK8/u96ydnIhAtFK9Xk+M=",
    //   "scope": "api",
    //   "instance_url": "https://orgfarm-0000000000-dev-ed.develop.my.salesforce.com",
    //   "id": "https://login.salesforce.com/id/10DgL000001MrZqUAK/005gL000001A3TvQAK",
    //   "token_type": "Bearer",
    //   "issued_at": "1758578068457"
    // }
    
    // Setup URLs - use .my.salesforce.com for OAuth
    let baseURL = instanceUrl;
    if (!/^https?:\/\//.test(baseURL)) {
      baseURL = `https://${baseURL}`;
    }
    
    // For OAuth, ensure we use .my.salesforce.com
    this.authUrl = baseURL.replace('.lightning.force.com', '.my.salesforce.com');
    
    // Create axios instance for salesforce API calls
    this.axios = axios.create({
      baseURL: baseURL, // This will be updated after auth
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    // Authentication state
    this.accessToken = null;
    this.authenticated = false;
  }

  // Enhanced authentication method with smart token caching
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
      const errorObj = handleSalesforceAxiosError(err, 'Authentication');
      throw errorObj;
    }
  }

  // Check if current token is valid and not near expiration
  async isTokenValid() {
    if (!this.tokenValue || !this.tokenValue.access_token || !this.tokenValue.issued_at) {
      return false;
    }

    const now = Date.now();
    const issuedAt = parseInt(this.tokenValue.issued_at);
    
    // Salesforce tokens typically expire after 2 hours (7200 seconds)
    // But we'll be conservative and refresh after 1.5 hours (5400 seconds)
    const tokenLifetime = 5400 * 1000; // 1.5 hours in milliseconds
    const expirationTime = issuedAt + tokenLifetime;
    const refreshTime = expirationTime - this.TOKEN_REFRESH_BUFFER;

    const isValid = now < refreshTime;

    return isValid;
  }

  // Get new token and cache it
  async refreshToken() {    
    try {
      // Make the OAuth request
      const response = await axios.post(`${this.authUrl}/services/oauth2/token`, 
        `grant_type=client_credentials&client_id=${encodeURIComponent(this.consumerKey)}&client_secret=${encodeURIComponent(this.consumerSecret)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
        }
      );

      // Cache the token response
      const tokenResponse = {
        ...response.data,
        cached_at: Date.now() // Add our own timestamp for better tracking
      };

      // Save to variables cache
      await setVariable(this.tokenKey, JSON.stringify(tokenResponse));
      
      // Update instance state
      this.tokenValue = tokenResponse;
      this.accessToken = tokenResponse.access_token;
      this.authenticated = true;
      
      // Update axios configuration
      this.updateAxiosConfiguration(response.data);
      return this.accessToken;
      
    } catch (err) {
      const errorObj = handleSalesforceAxiosError(err, 'Salesforce token refresh');
      console.log('❌ Token refresh failed:', errorObj.toString());
      throw errorObj;
    }
  }

  // Update axios instance configuration
  updateAxiosConfiguration(tokenData) {
    // Update base URL if provided
    if (tokenData.instance_url) {
      this.axios.defaults.baseURL = tokenData.instance_url;
    }
    
    // Update authorization header
    this.updateAxiosHeaders();
  }

  // Update axios headers with current token
  updateAxiosHeaders() {
    if (this.accessToken) {
      this.axios.defaults.headers.Authorization = `Bearer ${this.accessToken}`;
    }
  }

  // Clear token cache
  async clearTokenCache() {
    try {
      await setVariable(this.tokenKey, '');
      this.tokenValue = null;
      this.accessToken = null;
      this.authenticated = false;
      
      // Remove authorization header
      delete this.axios.defaults.headers.Authorization;
      
    } catch (err) {
      const errorObj = handleSalesforceAxiosError(err, 'Clear token cache');
      console.log('Warning: Failed to clear token cache:', errorObj.toString());
    }
  }

  // Handle token invalidation from error responses
  async handleTokenInvalidation(errorObj) {
    if (errorObj.shouldInvalidateToken) {
      console.log('🔑 Token invalidated by Salesforce, clearing cache...');
      await this.clearTokenCache();
      return true; // Indicates token was invalidated
    }
    return false;
  }

  // Execute method with automatic token retry
  async executeWithRetry(operation, context = 'Operation') {
    let attempt = 0;
    
    while (attempt <= this.maxRetries) {
      try {
        return await operation();
      } catch (err) {
        const errorObj = handleSalesforceAxiosError(err, context, this);
        
        // Check if we should retry due to token invalidation
        if (this.retryOnTokenError && attempt < this.maxRetries) {
          const tokenInvalidated = await this.handleTokenInvalidation(errorObj);
          
          if (tokenInvalidated) {
            console.log(`🔄 Retrying ${context} after token invalidation (attempt ${attempt + 1}/${this.maxRetries})`);
            attempt++;
            continue; // Retry the operation
          }
        }
        
        // If no retry or max retries reached, throw the error
        throw errorObj;
      }
    }
  }

  // Method to force token refresh (useful for testing or manual refresh)
  async forceRefresh() {
    await this.clearTokenCache();
    return await this.authenticate();
  }

  // Method to get token info for debugging
  getTokenInfo() {
    if (!this.tokenValue) {
      return { status: 'No token cached' };
    }

    const now = Date.now();
    const issuedAt = parseInt(this.tokenValue.issued_at);
    const tokenLifetime = 5400 * 1000; // 1.5 hours
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


  /*
  Create method to insert new Salesforce objects.
  Example usage:

    const result = await sfApi.create('Contact', {
      FirstName: 'John',
      LastName: 'Doe',
      Email: 'john.doe@example.com'
    });

    returns:
    {
      "id": "003XXXXXXXXXXXX",
      "success": true,
      "errors": []
    }
  */
  async create(sobjectType, data) {
    return await this.executeWithRetry(async () => {
      // Ensure authenticated
      if (!this.authenticated) {
        await this.authenticate();
      }
      
      // Create the record using POST
      const response = await this.axios.post(`/services/data/v${this.apiVersion}/sobjects/${sobjectType}`, data, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      return response.data;
    }, 'Create record');
  }

  /*
  Find method to query Salesforce objects using SOQL.
  Example usage:

    const contacts = await sfApi.find('Contact', {
    select: 'Id, FirstName, LastName, Email, CreatedDate',
    orderBy: 'CreatedDate DESC',
    limit: 1,
  });

  */

  async find(sobjectType, options = {}) {
    return await this.executeWithRetry(async () => {
      // Ensure authenticated
      if (!this.authenticated) {
        await this.authenticate();
      }
      
      // Build SOQL query
      let select = options.select || 'Id';
      if (typeof select === 'string') {
        // replace spaces with commas and remove duplicate commas
        select = select.replace(/\s+/g, ',').replace(/,+/g, ',');
      }
      
      let soql = `SELECT ${select} FROM ${sobjectType}`;
      if (options.where) soql += ` WHERE ${options.where}`;
      if (options.orderBy) soql += ` ORDER BY ${options.orderBy}`;
      if (options.limit) soql += ` LIMIT ${options.limit}`;
      
      // Emulate the exact working curl request
      const response = await this.axios.get(`/services/data/v${this.apiVersion}/query?q=${encodeURIComponent(soql)}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json',
        }
      });
      
      return response.data;
    }, 'Query');
  }

  /*
  FindOne method to get a single Salesforce object by ID.
  Example usage:
    const contact = await sfApi.findOne('Contact', '003XXXXXXXXXXXX', {
      select: 'Id, FirstName, LastName, Email'
    });
  */
  async findOne(sobjectType, id, options = {}) {
    return await this.executeWithRetry(async () => {
      // Ensure authenticated
      if (!this.authenticated) {
        await this.authenticate();
      }

      idRequired(id);
      
      // Build field list
      let select = options.select || 'Id';
      if (typeof select === 'string') {
        // replace spaces with commas and remove duplicate commas
        select = select.replace(/\s+/g, ',').replace(/,+/g, ',');
      }
      
      // Use the retrieve API endpoint for single record by ID
      const response = await this.axios.get(`/services/data/v${this.apiVersion}/sobjects/${sobjectType}/${id}?fields=${encodeURIComponent(select)}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json',
        }
      });
      
      return response.data;
    }, 'Find single record');
  }

  /*
  Update method to modify existing Salesforce objects.
  Example usage:
    const result = await sfApi.update('Contact', '003XXXXXXXXXXXX', {
      Email: 'newemail@example.com',
      Phone: '555-1234'
    });
  */
  async update(sobjectType, id, data) {
    return await this.executeWithRetry(async () => {
      // Ensure authenticated
      if (!this.authenticated) {
        await this.authenticate();
      }

      idRequired(id);
      
      // Update the record using PATCH
      const response = await this.axios.patch(`/services/data/v${this.apiVersion}/sobjects/${sobjectType}/${id}`, data, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      // Salesforce returns 204 No Content for successful updates
      return { success: true };
    }, 'Update record');
  }

  /*
  Delete method to remove Salesforce objects.
  Example usage:
    const result = await sfApi.delete('Contact', '003XXXXXXXXXXXX');
  */
  async delete(sobjectType, id) {
    return await this.executeWithRetry(async () => {
      // Ensure authenticated
      if (!this.authenticated) {
        await this.authenticate();
      }

      idRequired(id);
      
      // Delete the record using DELETE
      const response = await this.axios.delete(`/services/data/v${this.apiVersion}/sobjects/${sobjectType}/${id}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json',
        }
      });
      
      // Salesforce returns 204 No Content for successful deletions
      return { success: true };
    }, 'Delete record');
  }

}

module.exports = SalesforceRestApi;
