// Example Jest test for per-script testing
// Save as test/index.test.js inside your script folder

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Read apiKey from profile.json
const domain = process.env.TEST_DOMAIN || '<your-domain-here>';
const profilePath = path.join(__dirname, '..', 'profile.json');
let apiKey = '';
if (fs.existsSync(profilePath)) {
  const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
  apiKey = profile.apiKey;
}

describe('Script API Key Test', () => {
  it('should GET /v2/user/me and return 200', async () => {
    const url = `https://${domain}/v2/user/me`;
    const headers = { Authorization: `Bearer ${apiKey}` };
    const response = await axios.get(url, { headers });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('email'); // or any expected property
  });
});
(async function() {
    // Trigger event: beforeCreate
    if (input?.eventName === 'Contact.beforeCreate') {
      const nameModified = input?.doc?.firstName + ' modified';
      input.doc.firstName = nameModified;
    // Trigger event: beforeUpdate
    } else if (input?.eventName === 'Contact.beforeUpdate') {
      const nameModified = input?.doc?.firstName + ' updated';
      input.doc.firstName = nameModified;
    // Trigger event: afterCreate
    } else if(input?.eventName === 'Contact.afterCreate') {
      output = 'Contact.afterCreate Event';
    // Trigger event: afterUpdate
    } else if(input?.eventName === 'Contact.afterUpdate') {
      output = 'Contact.afterUpdate Event';
    // Trigger event: beforeDelete
    } else if(input?.eventName === 'Contact.beforeDelete') {
      output = 'Contact.beforeDelete Event';
    // Trigger event: afterDelete
    } else if(input?.eventName === 'Contact.afterDelete') {
      output = 'Contact.afterDelete Event';
    }
    // Trigger: error
    if (input?.doc?.throwError === 'Got Error') {
      throw new Error('Something Invalid');
    }
})();
