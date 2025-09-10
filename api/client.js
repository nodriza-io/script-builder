// GET /v2/script/run with body { scriptId: scriptCode }
async function runScript(domain, apiKey, scriptCode) {
  const url = `https://${domain}/v2/script/run`;
  try {
    const response = await axios({
      method: 'get',
      url,
      data: { scriptId: scriptCode },
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    const result = response.data;
    let chalk;
    try {
      chalk = await import('chalk');
    } catch {
      chalk = null;
    }
    const color = (str, c) => chalk ? chalk.default[c](str) : str;
    const bold = (str, c) => chalk ? chalk.default[c].bold(str) : str;
    if (result.error) {
      console.log(bold('Error:', 'red'), color(result.error, 'red'));
      if (result.errorStack) {
        console.log(color('Stack trace:', 'yellow'));
        console.log(result.errorStack);
      }
    } else {
      console.log(bold('No errors.', 'yellow'));
      if (result.output !== undefined) {
        console.log(bold('Output:', 'green'));
        console.dir(result.output, { depth: null, colors: true });
      } else {
        console.log(color('No output.', 'blue'));
      }
    }
    // Always show input
    if (result.input !== undefined) {
      console.log(bold('Input:', 'cyan'));
      console.dir(result.input, { depth: null, colors: true });
    }
    // Show logs in magenta
    if (Array.isArray(result.logs) && result.logs.length > 0) {
      console.log(bold('Logs:', 'magenta'));
      result.logs.forEach(l => console.log(color(l, 'magenta')));
    }
    if (result.timeMs !== undefined) {
      console.log(color(`Execution time: ${result.timeMs} ms`, 'gray'));
    }
    return result;
  } catch (err) {
    console.error(`Failed to run script ${scriptCode}:`, err.response?.data || err.message);
  }
}
// POST initial script document to /v2/script
async function createScriptDoc(domain, apiKey, scriptCode, scriptName, code, extra = {}) {
  const url = `https://${domain}/v2/script`;
  try {
    const body = {
      scriptCode,
      scriptName,
      code,
      active: true,
      ...extra
    };
    await axios.post(url, body, {
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
