const fs = require('fs');
const path = require('path');

function getConfigPath(domain) {
  return path.join(process.cwd(), 'accounts', domain, 'config.json');
}

function ensureConfig(domain) {
  const configPath = getConfigPath(domain);
  if (!fs.existsSync(configPath)) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify({ apiKey: '', domain }, null, 2));
  }
}

function get(key, domain) {
  const configPath = getConfigPath(domain);
  if (!fs.existsSync(configPath)) return undefined;
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return config[key];
}

function set(key, value, domain) {
  const configPath = getConfigPath(domain);
  ensureConfig(domain);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  config[key] = value;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  if (key === 'apiKey') {
    console.log(`[DEBUG] apiKey for domain '${domain}' saved to ${configPath}`);
  }
}

function getScriptCodePath(domain, scriptName) {
  return path.join(process.cwd(), 'accounts', domain, scriptName, 'code.js');
}

function ensureScriptCode(domain, scriptName) {
  const codePath = getScriptCodePath(domain, scriptName);
  if (!fs.existsSync(codePath)) {
    fs.mkdirSync(path.dirname(codePath), { recursive: true });
    fs.writeFileSync(codePath, '// Your script code here\n');
  }
}

function readScriptCode(domain, scriptName) {
  const codePath = getScriptCodePath(domain, scriptName);
  if (!fs.existsSync(codePath)) return '';
  return fs.readFileSync(codePath, 'utf8');
}

function writeScriptCode(domain, scriptName, code) {
  const codePath = getScriptCodePath(domain, scriptName);
  ensureScriptCode(domain, scriptName);
  fs.writeFileSync(codePath, code);
}

module.exports = {
  get,
  set,
  getConfigPath,
  ensureConfig,
  getScriptCodePath,
  ensureScriptCode,
  readScriptCode,
  writeScriptCode,
};
