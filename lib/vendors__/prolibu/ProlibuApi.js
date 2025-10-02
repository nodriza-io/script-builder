const { handleAxiosError } = require('./utils');

function stringify(obj, key) {
  if (obj?.[key]) {
    obj[key] = JSON.stringify(obj[key]);
  }
}

function validateId(id) {
  if (!id || typeof id !== 'string') {
    throw new Error(`Invalid id "${id}". It must be a string.`);
  }
}

class ProlibuApi {
  constructor({ domain, apiKey }) {
    if (!domain) domain = localDomain;
    if(!domain) throw new Error('domain is required');
    if (!apiKey) throw new Error('apiKey is required');
    this.prefix = '/v2';
    let baseURL = domain;
    if (!/^https?:\/\//.test(baseURL)) {
      baseURL = `https://${baseURL}`;
    }
    this.axios = axios.create({
      baseURL,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'user-agent': 'ProlibuApi',
      },
    });
  }

  async create(modelName, data) {
    try {
      const response = await this.axios.post(`${this.prefix}/${modelName}`, data);
      return response.data;
    } catch (err) {
      throw handleAxiosError(err);
    }
  }

  async findOne(modelName, id, queryParams = {}) {
    try {
      validateId(id);
      stringify(queryParams, 'populatePath');
      const queryString = new URLSearchParams(queryParams).toString();
      const response = await this.axios.get(`${this.prefix}/${modelName}/${id}?${queryString}`);
      return response.data;
    } catch (err) {
      // Return null for 404 (not found) instead of throwing error
      if (err.response && err.response.status === 404) {
        return null;
      }
      // For any other error, still throw
      throw handleAxiosError(err);
    }
  }

  async find(modelName, queryParams = {}) {
    try {
      stringify(queryParams, 'populatePath');
      stringify(queryParams, 'xquery');
      const queryString = new URLSearchParams(queryParams).toString();
      const response = await this.axios.get(`${this.prefix}/${modelName}?${queryString}`);
      return response.data;
    } catch (err) {
      throw handleAxiosError(err);
    }
  }

  async update(modelName, id, data) {
    try {
      validateId(id);
      const response = await this.axios.patch(`${this.prefix}/${modelName}/${id}`, data);
      return response.data;
    } catch (err) {
      throw handleAxiosError(err);
    }
  }

  async delete(modelName, id) {
    try {
      validateId(id);
      const response = await this.axios.delete(`${this.prefix}/${modelName}/${id}`);
      return response.data;
    } catch (err) {
      throw handleAxiosError(err);
    }
  }

  async search(modelName, term, queryParams = {}) {
    try {
      stringify(queryParams, 'populatePath');
      stringify(queryParams, 'xquery');
      const queryString = new URLSearchParams({ ...queryParams, term }).toString();
      const response = await this.axios.get(`${this.prefix}/${modelName}/search?${queryString}`);
      return response.data;
    } catch (err) {
      throw handleAxiosError(err);
    }
  }

  async findOneOrCreate(entity, id, options = {}, data) {
    if (!data) {
      throw new Error(`Data as fourth argument is required when using findOneOrCreate`);
    }
    
    // Now much simpler since findOne returns null instead of throwing
    let record = await this.findOne(entity, id, options);
    if (record) {
      return record;
    }
    
    // Record doesn't exist, create it
    record = await this.create(entity, data);
    return record;
  }
}

module.exports = ProlibuApi;