const esbuild = require('esbuild');
const path = require('path');

esbuild.build({
  entryPoints: ['accounts/dev10.prolibu.com/suite-hooks/code.js'],
  bundle: true,
  outfile: 'accounts/dev10.prolibu.com/suite-hooks/dist/bundle.js',
  platform: 'node',
  alias: {
    lib: path.resolve(__dirname, 'lib')
  },
}).catch(() => process.exit(1));
