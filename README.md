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

# Prompts explained:

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

./script test
# Prompts for domain, scriptCode, optionally file and watch
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

./script test \
  --domain dev10.prolibu.com \
  --scriptCode hook-sample \
  --file integration-test \
  --watch
```

### Run logic
* If you provide `--run`, the CLI will run and watch the script after build/publish.
* While in `--run` mode, you can listen to real-time console logs from your script via socket connection (live output in your terminal).
* If you do NOT provide `--run`, it will only build and publish, then exit (no prompt).

### Real-time log streaming

When you run a script in development mode with the `--run` flag (e.g., `./script dev --domain <domain> --scriptCode <scriptName> --run`), Script Builder CLI establishes a real-time connection to the Prolibu platform vis socket.io to stream console logs directly to your terminal.

- **Live Output:** Console logs from your script are streamed directly to your terminal as the script executes, allowing you to monitor behavior and debug in real time.
- **Automatic Reconnection:** If the connection drops, the CLI will attempt to reconnect automatically.
- **Log Filtering:** Only logs from the current script and environment are displayed, so you see relevant output.
- **Manual Trigger:** You can trigger a script run by pressing `R` in the terminal while in dev mode (if your terminal supports raw input).
- **Error Reporting:** Any errors or exceptions thrown by your script are also streamed and displayed instantly.

This system helps you iterate quickly, catch issues early, and understand script behavior as you develop.

---

## Project Structure

```
accounts/
  └── <domain>/
    ├── profile.json         # Domain-level config (apiKey)
    ├── <scriptName>/        # Script folder
    │   ├── code.js          # Main script code
    │   ├── variables.json   # Variables for the script
    │   ├── payload.json     # Payload data for the script
    │   ├── lifecycleHooks.json # Lifecycle hooks configuration
    │   ├── config.json      # Script-level config (e.g., minifyProductionScripts)
    │   ├── lib/             # Local script utilities
    │   │   └── Utils.js     # Example utility
    │   └── README.md        # Script documentation
    ├── suite-hooks/         # Suite-level hooks folder
    │   └── .gitignore       # Ignore files for suite-hooks
lib/
  └── utils/
    └── sleep.js             # Shared utility for sleep
cli/
  ├── bundle.js              # Bundling logic (esbuild)
  ├── commands.js            # CLI command handlers
  ├── cookieUtil.js          # Cookie utilities
  ├── flags.js               # CLI flag parsing
  ├── prompts.js             # Interactive CLI prompts
  └── socketLog.js           # Real-time log streaming
config/
  └── config.js              # Config management logic
api/
  └── client.js              # API client for Prolibu
templates/
  ├── .gitignore             # Template for .gitignore
  ├── code.js                # Template for code.js
  ├── variables.json         # Template for variables.json
  ├── payload.json           # Template for payload.json
  ├── lifecycleHooks.json    # Template for lifecycleHooks.json
  └── lib/
      └── Utils.js           # Template utility
  └── config.json            # Template for script-level config
  
 test/
  ├── commands.test.js       # Jest tests for CLI and script creation
  ├── config.json            # Test config (domain, apiKey)
  └── config.json.template   # Template for test config
.gitignore                   # Ignore files for git
README.md                    # Project documentation
index.js                     # Main CLI entrypoint
package.json                 # Project metadata and dependencies
package-lock.json            # Dependency lock file
script                       # CLI executable
node_modules/                # Installed dependencies
build/                       # Build artifacts
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


## API Contract (summary)
API endpoints:
- PATCH `/v2/script/{scriptCode}`: Update code, variables, payload, hooks, etc.
- POST `/v2/run`: Run script
- GET `/v2/run/{runId}`
Auth: `Authorization: Bearer <PROLIBU_TOKEN>`

# Test System

This project includes **two types of testing**:

## 1. CLI Framework Tests
Uses **Jest** for automated testing of CLI commands and generated script structure.

### What do the CLI tests cover?
- Script creation and template file generation
- Validation of `profile.json` and `config.json` configuration
- Execution of CLI commands (`create`, `dev`, etc.) and error handling

### Where are the CLI tests?
Tests are located in the `/test` folder, mainly in `commands.test.js`.

### How to run CLI tests?
```bash
npm test
```

## 2. Individual Script Testing

Each script can have its own test suite for integration testing with external APIs and business logic validation.

### Script Test Structure
Tests are located in each script's folder:
```
accounts/<domain>/<scriptPrefix>/test/
├── index.test.js           # Default test file
├── <custom-name>.test.js   # Custom test files
└── ...
```

### Running Script Tests

**Basic usage:**
```bash
./script test \
  --domain <domain> \
  --scriptPrefix <scriptPrefix>
```

**With custom test file:**
```bash
./script test \
  --domain <domain> \
  --scriptPrefix <scriptPrefix> \
  --file <testFileName>
```

**With watch mode (auto-rerun on changes):**
```bash
./script test \
  --domain <domain> \
  --scriptPrefix <scriptPrefix> \
  --file <testFileName> \
  --watch
```

### Interactive Testing Features
- **Watch Mode**: Automatically re-runs tests when files change
- **Manual Re-run**: Press `R` to re-run tests manually
- **Environment Variables**: Automatically injects `DOMAIN` and `SCRIPT_PREFIX`
- **Live Feedback**: Real-time test results and error reporting

## Test Environment Setup
- **Jest** (included in devDependencies)
- **Environment Variables**: `DOMAIN` and `SCRIPT_PREFIX` automatically available
- **Global Utilities**: Access to shared test utilities and API clients
- **Faker Support**: Generate realistic test data with `@faker-js/faker`

## Cleanup Notes
- CLI tests: Generated files are automatically cleaned before each test
- Script tests: Manual cleanup may be required for external API resources
- Important: Scripts created during tests are not deleted from the Prolibu platform automatically

# Pending for documentation
- explain how lifecycle events are managed