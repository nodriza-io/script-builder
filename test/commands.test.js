const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const config = require('./config.json');

describe('Script Builder CLI Commands', () => {
  let scriptCode;
  let scriptFolder;
  let createError = null;

  beforeAll(() => {
    // Remove profile.json so it is created by the test
    const profilePath = path.join(__dirname, '..', 'accounts', config.domain, 'profile.json');
    if (fs.existsSync(profilePath)) {
      fs.unlinkSync(profilePath);
    }
    // Remove all folders inside the domain that start with 'hook-test-'
    const domainPath = path.join(__dirname, '..', 'accounts', config.domain);
    if (fs.existsSync(domainPath)) {
      fs.readdirSync(domainPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('hook-test-'))
        .forEach(dirent => {
          const folderPath = path.join(domainPath, dirent.name);
          fs.rmSync(folderPath, { recursive: true, force: true });
        });
    }
    const timestamp = Date.now();
    scriptCode = `hook-test-${timestamp}`;
    scriptFolder = path.join(__dirname, '..', 'accounts', config.domain, scriptCode);
    const cmd = `./script create \
      --domain ${config.domain} \
      --scriptCode ${scriptCode} \
      --repo ${config.repo} \
      --lifecycleHooks "Invoice,Contact" \
      --apikey ${config.apiKey}`;
    try {
      execSync(cmd, { stdio: 'inherit' });
    } catch (e) {
      createError = e;
    }
  });

  describe('Create Command', () => {
    it('should exit successfully when creating a new script', () => {
      expect(createError).toBeNull();
    });

    it('should create all template files in the new script folder', () => {
      const expectedFiles = [
        'code.js',
        'variables.json',
        'payload.json',
        'lifecycleHooks.json',
        'lib',
        'config.json',
        'README.md'
      ];
      expectedFiles.forEach(file => {
        expect(fs.existsSync(path.join(scriptFolder, file))).toBe(true);
      });
    });

    it('should have lifecycleHooks.json with ["Invoice", "Contact"]', () => {
      const hooksPath = path.join(scriptFolder, 'lifecycleHooks.json');
      expect(fs.existsSync(hooksPath)).toBe(true);
      const hooks = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
      expect(Array.isArray(hooks)).toBe(true);
      expect(hooks).toEqual(expect.arrayContaining(["Invoice", "Contact"]));
    });

    it('should exists the profile.json with correct apiKey', () => {
      const profilePath = path.join(__dirname, '..', 'accounts', config.domain, 'profile.json');
      expect(fs.existsSync(profilePath)).toBe(true);
      const profileData = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
      expect(profileData.apiKey).toBe(config.apiKey);
      expect(profileData.domain).toBeUndefined(); // domain should not be saved in profile.json
    });
  });

  describe('dev Command', () => {
    it('should execute dev command "no --run" without errors', () => {
      let devError = null;
      const cmd = `./script dev \
        --domain ${config.domain} \
        --scriptCode ${scriptCode}`;
        
      try {
        execSync(cmd, { stdio: 'inherit' });
      } catch (e) {
        devError = e;
      }
      expect(devError).toBeNull();
    });

    it('should check all have been uploaded after dev command', () => {
      const axios = require('axios');
      const apiKey = config.apiKey;
      const domain = config.domain;
      const scriptName = scriptCode;
      const scriptCodeRemote = `${scriptName}-dev`;
      const baseUrl = `https://${domain}/v2/script/${scriptCodeRemote}`;
      const headers = { Authorization: `Bearer ${apiKey}` };

      return axios.get(baseUrl, { headers }).then(response => {
        const remote = response.data;
        // check for code 200
        expect(response.status).toBe(200);
        
        expect(remote.variables.length).toBe(1);
        expect(remote.variables[0]).toHaveProperty('key', 'foo');
        expect(remote.variables[0]).toHaveProperty('value', 'bar');
        
        expect(remote).toHaveProperty('code');
        // Compare remote.code agains dist/bundle.js length
        const distPath = path.join(scriptFolder, 'dist', 'bundle.js');
        expect(fs.existsSync(distPath)).toBe(true);
        const localCode = fs.readFileSync(distPath, 'utf8');
        expect(remote.code.length).toBe(localCode.length);
        
        expect(remote).toHaveProperty('readme');
        const localReadme = fs.readFileSync(path.join(scriptFolder, 'README.md'), 'utf8');
        expect(remote.readme).toBe(localReadme);
        
        expect(remote).toHaveProperty('lifecycleHooks');
        expect(remote.lifecycleHooks).toEqual(expect.arrayContaining(["Invoice", "Contact"]));
        
        expect(remote).toHaveProperty('active', true);

        expect(remote).toHaveProperty('scriptCode', scriptCodeRemote);

        expect(remote.git).toHaveProperty('repositoryUrl', config.repo);
      });
    });

    it('should run the script', () => {
      const axios = require('axios');
      const apiKey = config.apiKey;
      const domain = config.domain;
      const scriptName = scriptCode;
      const scriptCodeRemote = `${scriptName}-dev`;
      const baseUrl = `https://${domain}/v2/script/run`;
      const headers = { Authorization: `Bearer ${apiKey}` };
      const params = { scriptId: scriptCodeRemote, test: 123 };

      return axios.get(baseUrl, { headers, params }).then(response => {
        const remote = response.data;

        // check for code 200
        expect(response.status).toBe(200);
        expect(remote).toHaveProperty('output');
        expect(remote).toHaveProperty('input');
        expect(remote.input).toHaveProperty('test');
        expect(remote).toHaveProperty('error', null);
      });
    });

    it('should update code.js with console.log and publish with dev', () => {
      const newCode = `console.log('hola mundo!');\nmodule.exports = async function() { return 'changed!'; }`;
      fs.writeFileSync(path.join(scriptFolder, 'code.js'), newCode);
      let devError = null;
      const cmd = `./script dev --domain ${config.domain} --scriptCode ${scriptCode}`;
      try {
        execSync(cmd, { stdio: 'inherit' });
      } catch (e) {
        devError = e;
      }
      expect(devError).toBeNull();
    });

    it('should check all code has been uploaded after dev command', () => {
      const axios = require('axios');
      const apiKey = config.apiKey;
      const domain = config.domain;
      const scriptName = scriptCode;
      const scriptCodeRemote = `${scriptName}-dev`;
      const baseUrl = `https://${domain}/v2/script/${scriptCodeRemote}`;
      const headers = { Authorization: `Bearer ${apiKey}` };

      return axios.get(baseUrl, { headers }).then(response => {
        const remote = response.data;
        // check for code 200
        expect(response.status).toBe(200);
        
        expect(remote).toHaveProperty('code');
        // Compare remote.code agains dist/bundle.js length
        const distPath = path.join(scriptFolder, 'dist', 'bundle.js');
        expect(fs.existsSync(distPath)).toBe(true);
        const localCode = fs.readFileSync(distPath, 'utf8');
        expect(remote.code.length).toBe(localCode.length);
        expect(remote.code).toContain('hola mundo!');
      });

    });

    
  });
});

