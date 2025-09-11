
# Script Builder CLI


Script Builder CLI is a modern, developer-focused framework for building, testing, and deploying Prolibu v2 scripts with automation, modularity, and seamless API integration.

## What you can do with Script Builder CLI

Key features:
- Interactive script scaffolding (domain, API key, git repo, script code)
- Git repo cloning and template-based initialization
- Essential template file copying
- Real-time file watching and API sync (with run)
- Bundling/minification for production (esbuild, per domain config)
- Per-domain config (API keys, minification, git repo URL)
- Automatic README.md sync to API
- Modular code via lib/
- Dev/prod environment support
- Secure API integration and code publishing

---

## Requirements

[Script Builder CLI]
- Node.js (v18 or higher recommended)
- npm (to install dependencies)
- A valid Prolibu API key for each domain
---

## Installation

### Quick Start

```bash
git clone https://github.com/nodriza-io/script-builder.git
cd script-builder
npm install
chmod +x script # optional

## Usage

### Interactive mode
If you run a command without flags, the CLI will prompt for missing values:

```bash
./script create
# Prompts for domain, API key, scriptCode, repo, lifecycleHooks

./script dev
# Prompts for domain, scriptCode

./script prod
# Prompts for domain, scriptCode

./script import
# Prompts for domain, scriptCode, repo
```

### One-liner mode (no prompts)
If you provide all flags, the CLI runs non-interactively:

```bash
./script create \
  --domain dev10.prolibu.com \
  --scriptCode hook-sample \
  --repo https://github.com/nodriza-io/hook-sample.git \
  --lifecycleHooks "Invoice,Contact" \
  --apikey <your-api-key>

./script dev \
  --domain dev10.prolibu.com \
  --scriptCode hook-sample \
  --run # Only runs and watches if --run is present

./script prod \
  --domain dev10.prolibu.com \
  --scriptCode hook-sample \
  --run

./script import \
  --domain dev10.prolibu.com \
  --scriptCode hook-sample \
  --repo https://github.com/nodriza-io/hook-sample.git
```

### Run logic
- If you provide `--run`, the CLI will run and watch the script after build/publish.
- If you do NOT provide `--run`, it will only build and publish, then exit (no prompt).
```

---

## Project Structure


```
accounts/
└── <domain>/
  └── <scriptName>/
    ├── code.js
    ├── variables.json
    ├── payload.json
    ├── lifecycleHooks.json
    └── lib/
      ├── utils/
      ├── vendors/
      └── config.json
lib/
├── utils/
├── vendors/
└── ...
.gitignore
build/
README.md
```

## Importing libraries in your scripts

You can import libraries in your scripts from:

- **Local script lib folder** (relative to your script):
  ```js
  // Using require()
  const sleep = require('./lib/utils/sleep');
  const salesforce = require('./lib/vendors/salesforce');
  ```

- **Global project lib folder** (shared across all scripts):
  ```js
  // Using require()
  const sleep = require('lib/utils/sleep');
  const salesforce = require('lib/vendors/salesforce');
  ```

You can use either `require()` (recommended for compatibility) or `import` if your environment supports ES modules.


This allows you to share utilities and vendor integrations across all scripts in the project, or keep script-specific logic in the local lib folder.

```
<script-folder>/
├── code.js
├── variables.json
├── payload.json
├── lifecycleHooks.json
└── lib/
  └── config.json
.gitignore
build/
README.md
```

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/nodriza-io/script-builder.git
cd script-builder
npm install

# Create and deploy a script
./script create {prolibu-domain} myScript
./script dev {prolibu-domain} myScript
./script prod {prolibu-domain} myScript
```

---

## CLI Commands

See Quick Start above for main commands.

---

## Configuration Reference

All domain config is stored in `accounts/<domain>/config.json`:

```json
{
  "apiKey": "...",           // Prolibu API key (required)
  "minifyProductionScripts": true, // Minify prod scripts (default: true)
  "gitRepositoryUrl": "..." // Optional
}
```

---

## Troubleshooting

Common issues:
- API key errors: Ensure your API key is valid and present in the config file.
- Permission denied: Run `chmod +x script` if you see permission errors.
- Bundling failures: Check Node.js version and esbuild installation.
- File not syncing: Use run/watch mode for live updates.


---

## API Integration
See Configuration Reference above for config details.
```

## API Contract (summary)
API endpoints:
- PATCH `/v2/script/{scriptCode}`: Update code, variables, payload, hooks, etc.
- POST `/v2/run`: Run script
- GET `/v2/run/{runId}`: Check run status/logs
Auth: `Authorization: Bearer <PROLIBU_TOKEN>`