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
  });
});

