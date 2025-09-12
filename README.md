# Script Builder CLI


Script Builder CLI is a modern, developer-focused framework for building, testing, and deploying Prolibu v2 scripts with automation, modularity, and seamless API integration.

## What you can do with Script Builder CLI

Key features:
- Interactive script scaffolding (domain, API key, git repo, script code)
- Git repo cloning and template-based initialization
- Real-time file watching and API sync while in "run" mode
- Bundling/minification for production (esbuild, per domain config)
- Per-domain config (API keys, minification, git repo URL)
- Automatic README.md sync to API
- Modular code via lib/ or load from global lib/
- Dev/prod environment support
- Live log streaming while in run mode
- Error handling and debugging support
- Comprehensive testing framework

---

## Requirements

[Script Builder CLI]
- Node.js (v18 or higher recommended)
- npm (to install dependencies)
- A valid Prolibu API key for each domain
- Git (for cloning repos)
---

## Installation

### Quick Start

```bash
git clone https://github.com/nodriza-io/script-builder.git
cd script-builder
npm install
chmod +x script # To make the script executable
```

## Usage

### Interactive mode
If you run a command without flags, the CLI will prompt for missing values:

```bash
./script create
# Prompts for domain, API key, scriptCode, repo, lifecycleHooks

# Domain: Use your Prolibu domain, e.g. my-company.prolibu.com

# API key: Generate an API key from your Prolibu account, by clicking on your profile picture in the top right corner, selecting "Api Keys", and creating a new key with appropriate permissions.

# ScriptCode: Enter a unique name for your script (e.g. "erp-integration").

# Repo: Create a new repository and paste the repo URL here.

# Lifecycle Hooks: Specify any lifecycle hooks you want to use (e.g. "Invoice,Contact").

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
  --apikey <your-api-key> \
  --scriptCode hook-sample \
  --repo https://github.com/nodriza-io/hook-sample.git \
  --lifecycleHooks "Invoice,Contact"

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
* If you provide `--run`, the CLI will run and watch the script after build/publish.
* While in `--run` mode, you can listen to real-time console logs from your script via socket connection (live output in your terminal).
* If you do NOT provide `--run`, it will only build and publish, then exit (no prompt).

---

## Project Structure


```
accounts/
  └── <domain>/
    ├── config.json
    ├── <scriptName>/
    │   ├── code.js
    │   ├── variables.json
    │   ├── payload.json
    │   ├── lifecycleHooks.json
    │   ├── lib/
    │   │   └── Utils.js
    │   └── README.md
    ├── suite-hooks/
    │   └── .gitignore
lib/
  └── utils/
    └── sleep.js
cli/
  ├── bundle.js
  ├── commands.js
  ├── cookieUtil.js
  ├── flags.js
  ├── prompts.js
  └── socketLog.js
config/
  └── config.js
api/
  └── client.js
templates/
  ├── .gitignore
  ├── code.js
  ├── variables.json
  ├── payload.json
  ├── lifecycleHooks.json
  └── lib/
      └── Utils.js
test/
  ├── commands.test.js
  ├── config.json # Clone the config.json.template and fill in with test domain and API key
  └── config.json.template
.gitignore
README.md
index.js
package.json
package-lock.json
script
node_modules/
build/
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

This allows you to share utilities and vendor integrations across all scripts in the project, or keep script-specific logic in the local lib folder.

## Configuration Reference

All domain config is stored in `accounts/<domain>/config.json`:

```json
{
  "apiKey": "...",           // Prolibu API key (required)
  "minifyProductionScripts": true, // Minify prod scripts (default: true)
}
```
---

## API Contract (summary)
API endpoints:
- PATCH `/v2/script/{scriptCode}`: Update code, variables, payload, hooks, etc.
- POST `/v2/run`: Run script
- GET `/v2/run/{runId}`
Auth: `Authorization: Bearer <PROLIBU_TOKEN>`

# Test System

This project uses **Jest** for automated testing of CLI commands and generated script structure.

## What do the tests cover?
- Script creation and template file generation
- Validation of `profile.json` and `config.json` configuration
- Execution of CLI commands (`create`, `dev`, etc.) and error handling

## Where are the tests?
Tests are located in the `/test` folder, mainly in `commands.test.js`.

## How to run the tests?
Run the following command from the project root:

```bash
npm test
```

This will execute all tests and display results in the console.

## Automatic cleanup
Before each test, generated files and folders are removed to ensure a clean and reproducible environment.

## Required dependencies
- Jest (already included in devDependencies)

## Notes
You can add more tests in the `/test` folder to cover new cases or features.