#!/usr/bin/env node

const { runPrompts } = require('./cli/prompts');
const { runDevScript, createScript, minifyScript } = require('./cli/commands');



const args = process.argv.slice(2);
const command = args[0];
const domain = args[1];
const scriptName = args[2];
const exec = args[3] === 'exec';

console.log('[DEBUG] Parsed arguments:');
console.log('  command:', command);
console.log('  domain:', domain);
console.log('  scriptName:', scriptName);


(async () => {
  if ((command === 'dev' || command === 'prod') && domain && scriptName) {
    await runPrompts(command, scriptName, domain);
  await runDevScript(scriptName, command, domain, exec);
  } else if (command === 'create' && domain && scriptName) {
    // Prompt for gitRepo first
    const inquirer = await import('inquirer');
    const { gitRepo } = await inquirer.default.prompt({
      type: 'input',
      name: 'gitRepo',
      message: 'Enter the git repository URL to clone:',
      validate: input => input ? true : 'Git repository URL is required.'
    });
    if (!gitRepo) {
      console.log('Git repository URL is required.');
      process.exit(1);
    }
    // Clone the git repository
    const fs = require('fs');
    const { execSync } = require('child_process');
    const path = require('path');
    const repoDir = path.join(process.cwd(), 'accounts', domain, scriptName);
    if (fs.existsSync(repoDir) && fs.readdirSync(repoDir).length > 0) {
      const { confirmDelete } = await inquirer.default.prompt({
        type: 'confirm',
        name: 'confirmDelete',
        message: `The folder ${repoDir} already exists and is not empty. Delete it and continue?`,
        default: false
      });
      if (!confirmDelete) {
        console.log('Aborted by user.');
        process.exit(1);
      }
      fs.rmSync(repoDir, { recursive: true, force: true });
      console.log(`[CLEANUP] Deleted existing folder: ${repoDir}`);
    }
    try {
      execSync(`git clone ${gitRepo} ${repoDir}`, { stdio: 'inherit' });
      console.log(`[GIT] Repository cloned to ${repoDir}`);
      // Copy template files from /templates after successful clone
      const templateDir = path.join(process.cwd(), 'templates');
      const copyRecursiveSync = (src, dest) => {
        const exists = fs.existsSync(src);
        const stats = exists && fs.statSync(src);
        const isDirectory = exists && stats.isDirectory();
        if (isDirectory) {
          fs.mkdirSync(dest, { recursive: true });
          fs.readdirSync(src).forEach(child => {
            copyRecursiveSync(path.join(src, child), path.join(dest, child));
          });
        } else {
          fs.copyFileSync(src, dest);
        }
      };
      copyRecursiveSync(templateDir, repoDir);
      console.log(`[INIT] Script structure initialized from templates in ${repoDir}`);
    } catch (err) {
      console.error(`[ERROR] Failed to clone repository: ${err.message}`);
      process.exit(1);
    }
    // Now prompt for apiKey only if not present in config.json
    let apiKey;
    try {
      const configPath = path.join(process.cwd(), 'accounts', domain, 'config.json');
      if (fs.existsSync(configPath)) {
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        apiKey = configData.apiKey;
      }
    } catch {}
    if (!apiKey) {
      const response = await inquirer.default.prompt({
        type: 'input',
        name: 'apiKey',
        message: `Enter API key for domain '${domain}':`,
        validate: input => input ? true : 'API key is required.'
      });
      apiKey = response.apiKey;
      // Save to config.json for future use, default minifyProductionScripts true
      const configPath = path.join(process.cwd(), 'accounts', domain, 'config.json');
      fs.writeFileSync(configPath, JSON.stringify({ apiKey, domain, minifyProductionScripts: true }, null, 2));
    }
    // Prompt for lifecycleHooks
    const { lifecycleHooks } = await inquirer.default.prompt({
      type: 'input',
      name: 'lifecycleHooks',
      message: 'Add lifecycleHooks? (comma separated, e.g. Invoice,Contact)',
      default: '',
    });
    if (lifecycleHooks && lifecycleHooks.trim()) {
      const hooksArr = lifecycleHooks.split(',').map(h => h.trim()).filter(Boolean);
      const hooksPath = path.join(repoDir, 'lifecycleHooks.json');
      fs.writeFileSync(hooksPath, JSON.stringify(hooksArr, null, 2));
      console.log(`[INFO] lifecycleHooks.json created: ${JSON.stringify(hooksArr)}`);
    }
    await createScript(scriptName, 'dev', domain);
    await createScript(scriptName, 'prod', domain);
    console.log(`Scripts '${scriptName}-dev' and '${scriptName}-prod' created for domain '${domain}'.`);
    console.log('\nNext steps:');
    console.log(`To start development, run:\n  ./script dev ${domain} ${scriptName}`);
    console.log(`To start production, run:\n  ./script prod ${domain} ${scriptName}`);
  } else {
    console.log('Usage: ./script <dev|prod|create> <domain> <scriptName> [exec] [min]');
  }
})();
