const fs = require('fs');
const path = require('path');

function loadGlobalVariables(_env = 'dev') {
  global.env = _env;
  global.scriptCode = `${process.env.SCRIPT_PREFIX}-${_env}`;
  global.localDomain = process.env.DOMAIN;
  const projectPath = path.join(process.cwd(), 'accounts', process.env.DOMAIN, process.env.SCRIPT_PREFIX);
  global.variables = JSON.parse(fs.readFileSync(path.join(projectPath, 'variables.json'), 'utf8'));
  global.lifecycleHooks = JSON.parse(fs.readFileSync(path.join(projectPath, 'lifecycleHooks.json'), 'utf8'));
  global.axios = require('axios');
  global.getVariable = require('../../lib/utils/variables').getVariable;
}

module.exports = { loadGlobalVariables };
