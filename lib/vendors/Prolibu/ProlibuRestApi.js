const { handleAxiosError } = require('./utils');

function stringify(obj, key) {
  if (obj?.[key]) {
    obj[key] = JSON.stringify(obj[key]);
  }
}

class ProlibuRestApi {
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
      stringify(queryParams, 'populatePath');
      const queryString = new URLSearchParams(queryParams).toString();
      const response = await this.axios.get(`${this.prefix}/${modelName}/${id}?${queryString}`);
      return response.data;
    } catch (err) {
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
      const response = await this.axios.patch(`${this.prefix}/${modelName}/${id}`, data);
      return response.data;
    } catch (err) {
      throw handleAxiosError(err);
    }
  }

  async delete(modelName, id) {
    try {
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
}

module.exports = ProlibuRestApi;