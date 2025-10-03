// Parse CLI flags for script-builder
const minimist = require('minimist');

function parseFlags(argv) {
  // Remove node and script path
  const args = argv.slice(2);
  const parsed = minimist(args, {
    string: [
      'domain',
      'scriptPrefix',
      'repo',
      'lifecycleHooks',
      'apikey',
      'file'
    ],
    boolean: [
      'watch',
      'run'
    ],
    alias: {
      domain: 'd',
      scriptPrefix: 's',
      repo: 'r',
      lifecycleHooks: 'l',
      apikey: 'a',
      file: 'f',
      watch: 'w'
    },
    default: {}
  });
  return parsed;
}

module.exports = { parseFlags };
