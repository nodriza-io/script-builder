/**
 * @jest-environment node
 */
/* global describe, it, expect, beforeAll */
global.axios = require('axios');
const fs = require('fs');
const path = require('path');

// Import Prolibu APIs
const ProlibuRestApi = require('../../../../lib/vendors/Prolibu/ProlibuRestApi');
const UserApi = require('../../../../lib/vendors/Prolibu/UserApi');

// Use DOMAIN and SCRIPT_CODE from environment variables
const domain = process.env.DOMAIN;
const scriptCode = process.env.SCRIPT_CODE;
const profilePath = path.join(__dirname, '..', '..', 'profile.json');
let apiKey;
let prolibuRestApi;
let userApi;

// Helper to fail fast if env/config is missing
beforeAll(() => {
  if (!domain) throw new Error('DOMAIN env variable is required');
  if (!scriptCode) throw new Error('SCRIPT_CODE env variable is required');
  if (!fs.existsSync(profilePath)) throw new Error(`profile.json not found at ${profilePath}`);
  const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
  apiKey = profile.apiKey;
  if (!apiKey) throw new Error('apiKey missing in profile.json');
  if (!apiKey.length) throw new Error('apiKey in profile.json is empty');
  
  // Initialize APIs
  prolibuRestApi = new ProlibuRestApi({
    domain,
    apiKey
  });

  userApi = new UserApi({
    domain,
    apiKey
  });
});

describe(`Testing script "${scriptCode}"`, () => {
  describe('Authentication & Permissions', () => {
    it('Should have valid apiKey in profile.json', () => {
      expect(apiKey).toBeDefined();
      expect(apiKey.length).toBeGreaterThan(0);
    });

    it('Should get current user info with User.me()', async () => {
        const data = await userApi.me();
        expect(data).toBeDefined();
        expect(data).toHaveProperty('profile');
        expect(data).toHaveProperty('modelSchemas');
        expect(data.modelSchemas).toHaveProperty('Script');

        let hasPermissions = false;
        if (!data.profile.isAdmin) {
          // check if 'Resource@Script.create' and 'Resource@Script.update' permission exists
          const permissions = data.permissions || [];
          hasPermissions = (permissions.includes('Resource@Script.create') && permissions.includes('Resource@Script.update'));
          expect(permissions).toContain('Resource@Script.create');
          expect(permissions).toContain('Resource@Script.update');
        } else {
          // Admin user should have all permissions
          hasPermissions = true;
        }
        expect(hasPermissions).toBe(true);
    });

    it('Should fail with invalid API key in User.me()', async () => {
      const invalidUserApi = new UserApi({
        domain,
        apiKey: 'INVALID_API_KEY'
      });
      let errorCaught = false;
      try {
        const data = await invalidUserApi.me();
        console.log('Data with invalid API key:', data);
      } catch (err) {
        errorCaught = true;
        expect(err.message).toBeDefined();
        expect(err.status).toBe(401);
      }
      expect(errorCaught).toBe(true);
    });

    it('Should get script with findOne', async () => {
      console.log('Fetching script with code:', scriptCode);
      const scriptDev = await prolibuRestApi.findOne('script', `${scriptCode}-dev`, {
        select: 'scriptName',
      });

      expect(scriptDev).toBeDefined();
      expect(scriptDev).toHaveProperty('_id');
      expect(scriptDev).toHaveProperty('scriptName');
    });
  });
});