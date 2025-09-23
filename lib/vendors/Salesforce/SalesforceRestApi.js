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
    
    // Setup URLs - use .my.salesforce.com for OAuth
    let baseURL = instanceUrl;
    if (!/^https?:\/\//.test(baseURL)) {
      baseURL = `https://${baseURL}`;
    }
    
    // For OAuth, ensure we use .my.salesforce.com
    this.authUrl = baseURL.replace('.lightning.force.com', '.my.salesforce.com');
    
    // Create axios instance like ProlibuRestApi does
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

  // Authentication method following Prolibu pattern
  async authenticate() {
    if (this.authenticated && this.accessToken) {
      return this.accessToken;
    }

    try {
      // Replicate the exact curl command that works
      const response = await axios.post(`${this.authUrl}/services/oauth2/token`, 
        `grant_type=client_credentials&client_id=${encodeURIComponent(this.consumerKey)}&client_secret=${encodeURIComponent(this.consumerSecret)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.authenticated = true;
      
      // Update axios instance baseURL and headers like ProlibuRestApi
      if (response.data.instance_url) {
        this.axios.defaults.baseURL = response.data.instance_url;
      }
      
      // Update authorization header like ProlibuRestApi does
      this.axios.defaults.headers.Authorization = `Bearer ${this.accessToken}`;
      
      return this.accessToken;
      
    } catch (err) {
      // Follow ProlibuRestApi error handling pattern
      const errorMessage = err.response?.data?.error_description || 
                          err.response?.data?.error || 
                          err.message;
      throw new Error(`Salesforce authentication failed: ${errorMessage}`);
    }
  }

  // Find method following ProlibuRestApi pattern exactly
  async find(sobjectType, options = {}) {
    try {
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
      
    } catch (err) {
      // console.log('____err:', err);
      // Follow ProlibuRestApi error handling pattern
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message;
      throw new Error(`Salesforce query failed: ${errorMessage}`);
    }
  }

  // Test methods following ProlibuRestApi pattern
  async testAuthOnly() {
    try {
      const token = await this.authenticate();
      return { 
        success: true, 
        authenticated: true, 
        instanceUrl: this.axios.defaults.baseURL,
        token: token ? 'RECEIVED' : 'MISSING'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testConnection() {
    try {
      // First authenticate
      await this.authenticate();
      
      // Then make a real query
      const users = await this.find('User', { select: 'Id, Name, Email', limit: 3 });
      
      return { 
        success: true, 
        authenticated: true, 
        instanceUrl: this.axios.defaults.baseURL,
        queryResult: users 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = SalesforceRestApi;
