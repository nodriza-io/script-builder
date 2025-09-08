// GET /v2/script/run with body { id: scriptCode }
async function runScript(domain, apiKey, scriptCode) {
  const url = `https://${domain}/v2/script/run`;
  try {
    const response = await axios({
      method: 'get',
      url,
      data: { id: scriptCode },
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    console.log(`[RUN] Script ${scriptCode} executed. Result:`);
    console.dir(response.data, { depth: null });
    return response.data;
  } catch (err) {
    console.error(`Failed to run script ${scriptCode}:`, err.response?.data || err.message);
  }
}
// POST initial script document to /v2/script
async function createScriptDoc(domain, apiKey, scriptCode, scriptName, code) {
  const url = `https://${domain}/v2/script`;
  try {
    await axios.post(url, {
      scriptCode,
      scriptName,
      code,
      active: true
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    // Success
  } catch (err) {
    console.error(`Failed to create script ${scriptCode}:`, err.response?.data || err.message);
  }
}
const axios = require('axios');


// PATCH field to /v2/script/{scriptCode}
async function patchScript(domain, apiKey, scriptCode, value, field) {
  const url = `https://${domain}/v2/script/${scriptCode}`;
  try {
    await axios.patch(url, { [field]: value }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    // Success
  } catch (err) {
    console.error(`Failed to PATCH ${field} for ${scriptCode}:`, err.response?.data || err.message);
  }
}

module.exports = {
  patchScript,
  createScriptDoc,
  runScript,
};
