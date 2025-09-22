const axios = require('axios');
const { handleSalesforceError } = require('./utils');

class SalesforceRestApi {
  constructor({ instanceUrl, consumerKey, consumerSecret, apiVersion = '58.0', sandbox = false }) {
    if (!instanceUrl) throw new Error('instanceUrl is required');
    if (!consumerKey) throw new Error('consumerKey is required');
    if (!consumerSecret) throw new Error('consumerSecret is required');
    
    // Ensure instanceUrl has https://
    this.instanceUrl = instanceUrl.startsWith('http') ? instanceUrl : `https://${instanceUrl}`;
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
    this.apiVersion = apiVersion;
    this.sandbox = sandbox;
    this.loginUrl = sandbox ? 'https://test.salesforce.com' : 'https://login.salesforce.com';
    
    // Authentication state
    this.accessToken = null;
    this.authenticated = false;
  }

  // Authenticate using Client Credentials flow
  async authenticate() {
    if (this.authenticated && this.accessToken) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(`${this.loginUrl}/services/oauth2/token`, null, {
        params: {
          grant_type: 'client_credentials',
          client_id: this.consumerKey,
          client_secret: this.consumerSecret
        }
      });

      this.accessToken = response.data.access_token;
      this.authenticated = true;
      
      // Update instanceUrl if received from auth response
      if (response.data.instance_url) {
        this.instanceUrl = response.data.instance_url;
      }

      return this.accessToken;
    } catch (error) {
      throw handleSalesforceError(error);
    }
  }

  // Ensure we're authenticated before making API calls
  async ensureAuthenticated() {
    if (!this.authenticated || !this.accessToken) {
      await this.authenticate();
    }
    return this.accessToken;
  }

  // Get authorization headers
  async getHeaders() {
    const token = await this.ensureAuthenticated();
    return {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  // Create a new record
  async create(sobjectType, data) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${this.instanceUrl}/services/data/v${this.apiVersion}/sobjects/${sobjectType}`,
        data,
        { headers }
      );
      return response.data;
    } catch (err) {
      throw handleSalesforceError(err);
    }
  }

  // Get a record by ID
  async findOne(sobjectType, id, options = null) {
    try {
      const headers = await this.getHeaders();
      let url = `${this.instanceUrl}/services/data/v${this.apiVersion}/sobjects/${sobjectType}/${id}`;
      
      // Handle Prolibu-style options object {select: 'field1 field2'}
      if (options && options.select) {
        let fields;
        if (typeof options.select === 'string') {
          // Convert space-separated to comma-separated: 'firstName lastName' → 'firstName,lastName'
          fields = options.select.split(' ').join(',');
        } else if (Array.isArray(options.select)) {
          // Convert array to comma-separated: ['firstName', 'lastName'] → 'firstName,lastName'
          fields = options.select.join(',');
        } else {
          fields = options.select;
        }
        
        if (fields) {
          url += `?fields=${encodeURIComponent(fields)}`;
        }
      }
      
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (err) {
      throw handleSalesforceError(err);
    }
  }

  // Search records with SOQL
  async find(sobjectType, queryParams = {}) {
    try {
      const { select, fields, where, orderBy, limit, offset } = queryParams;
      
      // Handle both Prolibu-style {select} and Salesforce-style {fields}
      let fieldsToSelect = ['Id', 'Name']; // default
      
      if (select) {
        // Prolibu style: {select: 'firstName lastName company'}
        fieldsToSelect = typeof select === 'string' 
          ? select.split(' ')
          : Array.isArray(select) 
            ? select
            : [select];
      } else if (fields) {
        // Salesforce style: {fields: ['Id', 'Name']}
        fieldsToSelect = Array.isArray(fields) ? fields : [fields];
      }
      
      // Build SOQL query
      let soql = `SELECT ${fieldsToSelect.join(',')} FROM ${sobjectType}`;
      
      if (where) {
        soql += ` WHERE ${where}`;
      }
      
      if (orderBy) {
        soql += ` ORDER BY ${orderBy}`;
      }
      
      if (limit) {
        soql += ` LIMIT ${limit}`;
      }
      
      if (offset) {
        soql += ` OFFSET ${offset}`;
      }
      
      return await this.query(soql);
    } catch (err) {
      throw handleSalesforceError(err);
    }
  }

  // Direct SOQL query (more flexible)
  async query(soql) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(
        `${this.instanceUrl}/services/data/v${this.apiVersion}/query`,
        {
          headers,
          params: { q: soql }
        }
      );
      return response.data;
    } catch (err) {
      throw handleSalesforceError(err);
    }
  }

  // Update a record
  async update(sobjectType, id, data) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.patch(
        `${this.instanceUrl}/services/data/v${this.apiVersion}/sobjects/${sobjectType}/${id}`,
        data,
        { headers }
      );
      // Salesforce PATCH returns 204 No Content on success
      return response.status === 204 ? { success: true, id } : response.data;
    } catch (err) {
      throw handleSalesforceError(err);
    }
  }

  // Delete a record
  async delete(sobjectType, id) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.delete(
        `${this.instanceUrl}/services/data/v${this.apiVersion}/sobjects/${sobjectType}/${id}`,
        { headers }
      );
      // Salesforce DELETE returns 204 No Content on success
      return response.status === 204 ? { success: true, id } : response.data;
    } catch (err) {
      throw handleSalesforceError(err);
    }
  }

  // Search with SOSL (Salesforce Object Search Language)
  async search(searchTerm, queryParams = {}) {
    try {
      const headers = await this.getHeaders();
      const { sobjectTypes = [], limit } = queryParams;
      
      let sosl = `FIND {${searchTerm}}`;
      
      if (sobjectTypes.length > 0) {
        const inClause = sobjectTypes.map(obj => {
          if (typeof obj === 'string') {
            return obj;
          } else if (obj.type && obj.fields) {
            return `${obj.type}(${obj.fields.join(',')})`;
          }
          return obj;
        }).join(',');
        
        sosl += ` IN (${inClause})`;
      }
      
      if (limit) {
        sosl += ` LIMIT ${limit}`;
      }
      
      const response = await axios.get(
        `${this.instanceUrl}/services/data/v${this.apiVersion}/search`,
        {
          headers,
          params: { q: sosl }
        }
      );
      return response.data;
    } catch (err) {
      throw handleSalesforceError(err);
    }
  }

  // Get object metadata
  async describe(sobjectType) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(
        `${this.instanceUrl}/services/data/v${this.apiVersion}/sobjects/${sobjectType}/describe`,
        { headers }
      );
      return response.data;
    } catch (err) {
      throw handleSalesforceError(err);
    }
  }

  // List all available objects
  async listSobjects() {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(
        `${this.instanceUrl}/services/data/v${this.apiVersion}/sobjects`,
        { headers }
      );
      return response.data;
    } catch (err) {
      throw handleSalesforceError(err);
    }
  }

  // Upsert (create or update based on external ID)
  async upsert(sobjectType, externalIdField, externalIdValue, data) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.patch(
        `${this.instanceUrl}/services/data/v${this.apiVersion}/sobjects/${sobjectType}/${externalIdField}/${externalIdValue}`,
        data,
        { headers }
      );
      return response.status === 204 ? { success: true, updated: true } : response.data;
    } catch (err) {
      throw handleSalesforceError(err);
    }
  }

  // Bulk operations (to handle multiple records)
  async bulkCreate(sobjectType, records) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${this.instanceUrl}/services/data/v${this.apiVersion}/composite/sobjects`,
        {
          allOrNone: false,
          records: records.map(record => ({
            attributes: { type: sobjectType },
            ...record
          }))
        },
        { headers }
      );
      return response.data;
    } catch (err) {
      throw handleSalesforceError(err);
    }
  }

  async bulkUpdate(sobjectType, records) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.patch(
        `${this.instanceUrl}/services/data/v${this.apiVersion}/composite/sobjects`,
        {
          allOrNone: false,
          records: records.map(record => ({
            attributes: { type: sobjectType },
            ...record
          }))
        },
        { headers }
      );
      return response.data;
    } catch (err) {
      throw handleSalesforceError(err);
    }
  }
}

module.exports = SalesforceRestApi;