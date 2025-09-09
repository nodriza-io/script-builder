const apiClient = require('../api/client');
const config = require('../config/config');
const path = require('path');
const fs = require('fs');
const { bundleScript } = require('./bundle');


// Runs the script in the specified environment and watches code.js for changes
async function runDevScript(scriptName, env, domain, exec = false) {
  const scriptCode = `${scriptName}-${env}`;
  const apiKey = config.get('apiKey', domain);
  // Get git repository URL and minifyProductionScripts from config.json if present
  const configPath = require('path').join(process.cwd(), 'accounts', domain, 'config.json');
  let minifyProductionScripts = false;
  let gitRepositoryUrl = '';
  if (require('fs').existsSync(configPath)) {
    try {
      const configData = JSON.parse(require('fs').readFileSync(configPath, 'utf8'));
      minifyProductionScripts = !!configData.minifyProductionScripts;
      gitRepositoryUrl = configData.gitRepositoryUrl || '';
    } catch {}
  }
  const codePath = config.getScriptCodePath(domain, scriptName);
  const scriptFolder = path.dirname(codePath);
  const distPath = path.join(scriptFolder, 'dist', 'bundle.js');
  const variablesPath = codePath.replace('code.js', 'variables.json');
  const payloadPath = codePath.replace('code.js', 'payload.json');
  const hooksPath = codePath.replace('code.js', 'lifecycleHooks.json');

  config.ensureScriptCode(domain, scriptName);
  if (!fs.existsSync(variablesPath)) fs.writeFileSync(variablesPath, '[]');
  if (!fs.existsSync(payloadPath)) fs.writeFileSync(payloadPath, '{}');
  if (!fs.existsSync(hooksPath)) fs.writeFileSync(hooksPath, '[]');

  // Initial bundle and PATCH for code.js
  fs.mkdirSync(path.dirname(distPath), { recursive: true });
  let bundledCode;
  if (env === 'prod' && minifyProductionScripts) {
    // Minify and bundle for production if config is set
    const esbuild = require('esbuild');
    const minPath = require('path').join(path.dirname(distPath), 'bundle.min.js');
    await esbuild.build({
      entryPoints: [codePath],
      outfile: minPath,
      minify: true,
      bundle: true,
      platform: 'node',
      format: 'cjs',
    });
    bundledCode = require('fs').readFileSync(minPath, 'utf8');
  } else {
    await bundleScript(codePath, distPath);
    bundledCode = require('fs').readFileSync(distPath, 'utf8');
  }
  // Upload variables
  const variables = JSON.parse(fs.readFileSync(variablesPath, 'utf8'));
  await apiClient.patchScript(domain, apiKey, scriptCode, variables, 'variables');
  // Upload lifecycleHooks
  const hooks = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
  await apiClient.patchScript(domain, apiKey, scriptCode, hooks, 'lifecycleHooks');
  // Upload payload only in dev
  if (env === 'dev') {
    const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
    await apiClient.patchScript(domain, apiKey, scriptCode, payload, 'payload');
  }
  // Upload code and git repository URL
  await apiClient.patchScript(domain, apiKey, scriptCode, bundledCode, 'code');
  if (gitRepositoryUrl) {
    await apiClient.patchScript(domain, apiKey, scriptCode, { repositoryUrl: gitRepositoryUrl }, 'git');
  }
  if (exec) await apiClient.runScript(domain, apiKey, scriptCode);

  // Watch code.js and lib/
  const libPath = path.join(scriptFolder, 'lib');
  const chokidar = require('chokidar');
  const watcher = chokidar.watch([codePath, libPath], {
    persistent: true,
    ignoreInitial: true,
    depth: 99,
    awaitWriteFinish: true,
  });
  const triggerBundle = async (event, filePath) => {
    console.log(`[WATCH] ${event} detected in ${filePath}. Bundling and uploading...`);
    try {
      await bundleScript(codePath, distPath);
      const bundledCode = fs.readFileSync(distPath, 'utf8');
      await apiClient.patchScript(domain, apiKey, scriptCode, bundledCode, 'code');
      if (exec) await apiClient.runScript(domain, apiKey, scriptCode);
      console.log(`[SYNC] Bundled code uploaded for ${scriptCode}`);
    } catch (err) {
      console.error(`[ERROR] Bundling/upload failed: ${err.message}`);
    }
  };
  watcher.on('add', (filePath) => triggerBundle('add', filePath));
  watcher.on('change', (filePath) => triggerBundle('change', filePath));
  watcher.on('unlink', (filePath) => triggerBundle('unlink', filePath));

  // Watch variables.json
  fs.watchFile(variablesPath, { interval: 500 }, async (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
      const variables = JSON.parse(fs.readFileSync(variablesPath, 'utf8'));
      await apiClient.patchScript(domain, apiKey, scriptCode, variables, 'variables');
      if (exec) await apiClient.runScript(domain, apiKey, scriptCode);
      console.log(`Variables for '${scriptCode}' updated after save.`);
    }
  });

  // Watch payload.json only in dev mode
  if (env === 'dev') {
    fs.watchFile(payloadPath, { interval: 500 }, async (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
        await apiClient.patchScript(domain, apiKey, scriptCode, payload, 'payload');
        if (exec) await apiClient.runScript(domain, apiKey, scriptCode);
        console.log(`Payload for '${scriptCode}' updated after save (dev only).`);
      }
    });
    // Watch lifecycleHooks.json
    fs.watchFile(hooksPath, { interval: 500 }, async (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        const hooks = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
        await apiClient.patchScript(domain, apiKey, scriptCode, hooks, 'lifecycleHooks');
        if (exec) await apiClient.runScript(domain, apiKey, scriptCode);
        console.log(`lifecycleHooks for '${scriptCode}' updated after save (dev only).`);
      }
    });
  }
}


// Creates a script for the specified environment
async function createScript(scriptName, env, domain, gitRepo) {
  const scriptCode = `${scriptName}-${env}`;
  const apiKey = config.get('apiKey', domain);
  config.ensureScriptCode(domain, scriptName);
  const code = config.readScriptCode(domain, scriptName);
  const envLabel = env === 'dev' ? 'Dev' : 'Prod';
  const scriptNameLabel = `${scriptName} - ${envLabel}`;
  // Add git.repositoryUrl if provided
  const extra = {};
  if (gitRepo) {
    extra.git = { repositoryUrl: gitRepo };
  }
  await apiClient.createScriptDoc(domain, apiKey, scriptCode, scriptNameLabel, code, extra);
  console.log(`Creating script: ${scriptCode} (domain: ${domain}) as '${scriptNameLabel}'`);
}

const esbuild = require('esbuild');

// Minify the bundled code and save as bundle.min.js
async function minifyScript(scriptName, env, domain) {
  const codePath = config.getScriptCodePath(domain, scriptName);
  const scriptFolder = path.dirname(codePath);
  const minPath = path.join(scriptFolder, 'dist', 'bundle.min.js');
  await esbuild.build({
    entryPoints: [codePath],
    outfile: minPath,
    minify: true,
    bundle: true,
    platform: 'node',
    format: 'cjs',
  });
  console.log(`[MINIFY] Minified code saved to ${minPath}`);
}

module.exports = { runDevScript, createScript, minifyScript };
