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

    const gray = (str) => chalk ? chalk.default.gray(str) : str;
    const green = (str) => chalk ? chalk.default.green(str) : str;
    const red = (str) => chalk ? chalk.default.red(str) : str;
    // Errors block
    if (result.error) {
      console.log(`\n${red('[ERRORS] ' + '-'.repeat(60))}\n`);
      console.log(bold('Error:', 'red'), color(result.error, 'red'));
      if (result.errorStack) {
        console.log(color('Stack trace:', 'red'));
        console.log(result.errorStack);
      }
    }
    // Input block
    if (result.input !== undefined) {
      const blue = (str) => chalk ? chalk.default.blue(str) : str;
      console.log(`\n${blue('[INPUT] ' + '-'.repeat(60))}\n`);
      console.dir(result.input, { depth: null, colors: true });
    }
    // Output block
    if (result.output !== undefined) {
      console.log(`\n${green('[OUTPUT] ' + '-'.repeat(60))}\n`);
      console.dir(result.output, { depth: null, colors: true });
    }
    // Execution time
    if (result.timeMs !== undefined) {
      console.log(`\n${gray('Execution time: ' + result.timeMs + ' ms')}`);
    }
    // Message to rerun script
    console.log(gray('Press [R] to run the script again (No build/upload)'));
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
