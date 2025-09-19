/**
 * @jest-environment node
 */
/* global describe, it, expect, beforeAll */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Use DOMAIN and SCRIPT_CODE from environment variables
const domain = process.env.DOMAIN;
const scriptCode = process.env.SCRIPT_CODE;
const profilePath = path.join(__dirname, '..', '..', 'profile.json');
let apiKey = '';

// Helper to fail fast if env/config is missing
beforeAll(() => {
  if (!domain) throw new Error('DOMAIN env variable is required');
  if (!scriptCode) throw new Error('SCRIPT_CODE env variable is required');
  if (!fs.existsSync(profilePath)) throw new Error(`profile.json not found at ${profilePath}`);
  const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
  apiKey = profile.apiKey;
  if (!apiKey) throw new Error('apiKey missing in profile.json');
  if (!apiKey.length) throw new Error('apiKey in profile.json is empty');
});

describe(`Script "${scriptCode}" Test`, () => {
  it('Should exist an apiKey in profile.json', () => {
    expect(apiKey).toBeDefined();
    expect(apiKey.length).toBeGreaterThan(0);
  });

  it('Should validate if the apiKey has Script create/update permissions', async () => {
    const url = `https://${domain}/v2/user/me`;
    const headers = { Authorization: `Bearer ${apiKey}` };
    let response;
    try {
      response = await axios.get(url, { headers });
    } catch (err) {
      throw new Error(`API request failed: ${err.message}`);
    }
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(response.data).toHaveProperty('profile');
    expect(response.data).toHaveProperty('modelSchemas');
    expect(response.data.modelSchemas).toHaveProperty('Script');
    let hasPermissions = false;
    if (!response.data.profile.isAdmin) {
      // check if 'Resource@Script.create' and 'Resource@Script.update' permission exists
      const permissions = response.data.permissions || [];
      hasPermissions = (permissions.includes('Resource@Script.create') && permissions.includes('Resource@Script.update'));
      expect(permissions).toContain('Resource@Script.create');
      expect(permissions).toContain('Resource@Script.update');
    } else {
      // Admin user should have all permissions
      hasPermissions = true;
    }
    expect(hasPermissions).toBe(true);
  });

  it('Should fail with invalid API key', async () => {
    const url = `https://${domain}/v2/user/me`;
    const headers = { Authorization: `Bearer INVALID_API_KEY` };
    let errorCaught = false;
    try {
      await axios.get(url, { headers });
    } catch (err) {
      errorCaught = true;
      expect(err.response).toBeDefined();
      expect(err.response.status).toBe(401);
    }
    expect(errorCaught).toBe(true);
  });
});
