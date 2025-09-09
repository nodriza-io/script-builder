
# Script Builder CLI

Script Builder CLI is a modern, developer-focused framework for building, testing, and deploying Prolibu v2 scripts with automation, modularity, and seamless API integration.

## What you can do with Script Builder CLI

- Scaffold new scripts interactively with domain, API key, git repo, and script code prompts
- Clone a git repository and initialize your script from templates
- Automatically copy only essential template files (code, variables, payload, lifecycle hooks, lib)
- Watch local files and sync changes to the API in real time
- Bundle and minify code for production using esbuild (configurable per domain)
- Store sensitive config per domain, including API keys and minification settings
- Sync README.md changes to the script's documentation field in the API
- Track and store git repository URL in the script model
- Modular code support via a dedicated lib/ folder for reusable logic
- Support for development and production environments with easy switching
- Patch code, variables, payload, lifecycle hooks, and libraries to the API
- Run scripts and view output, error, and execution time directly in the CLI
- Generate and manage config files automatically for each domain
- Integrate with Prolibu API for full lifecycle management

---

## Requirements

[Script Builder CLI]
- Node.js (v18 or higher recommended)
- npm (to install dependencies)
- A valid Prolibu API key for each domain
---

## Installation

### Step-by-step installation

1. **Clone the repository**
  ```bash
  git clone <your-repo-url>
  cd script-builder
  ```
2. **Install dependencies**
  ```bash
  npm install
  ```
3. **(Optional) Make the CLI executable**
  ```bash
  chmod +x script
  ```
4. **(Optional) Add to your PATH for global usage**
  ```bash
  export PATH="$PATH:$(pwd)"
  ```
5. **Create a new script**
  ```bash
  ./script create <domain> <scriptName>
  ```
6. **Publish to production**
  ```bash
  ./script prod <domain> <scriptName>
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
    └── config.json
.gitignore
build
README.md
```

---

## API Integration
-## Domain Configuration

- For each domain, a config file is generated at:
  ```
  accounts/<domain>/config.json
  ```
- This file stores sensitive and operational data for the domain, such as:
  - `apiKey`: Your Prolibu API key (never printed to console)
  - `minifyProductionScripts`: Whether production scripts are minified
  - Any other domain-specific settings
  - The domain is inferred from the folder name, not stored in the config file.

- Example:
  ```json
  {
    "apiKey": "...",
    "minifyProductionScripts": true
  }
  ```

- The CLI uses this config for all operations, ensuring security and consistency per domain.
```

---

## Workflow Example

```bash
# 1. Create a new script
./script create dev10.prolibu.com myScript

# 2. Start development (watch mode)
./script dev dev10.prolibu.com myScript

# 3. Publish to production
./script prod dev10.prolibu.com myScript
```

---
- Commit only source files; use `.gitignore` to exclude `node_modules`, local script files, and secrets.
- Document your scripts and payloads for easier maintenance.
- Always test in dev before publishing to prod.

---


## License


### 1) `./script create`

Interactive scaffolding. Prompts (in order):

1. **Script Name** — human-friendly name of your script (used to name the folder)
2. **Domain** — e.g., `dev10.prolibu.com`
3. **Script Code (dev)** — the **development** `scriptCode` (unique key, e.g., `SCP-XYZ-dev`)

What it does:

  ```
  accounts/<domain>/<scriptName>/
  ├── code.js
  ├── variables.json
  ├── payload.json
  ├── lifecycleHooks.json
  └── lib/
  config.json
  ```
- Persists config in `.prolibu/script.json`.

**Next step message**:
```
---

### 2) `./script dev {scriptCodeDev}`
  1. **PATCH** `/v2/script/{scriptCodeDev}` with the current file contents (`code`), variables, payload, lifecycle hooks, and libraries, including a checksum.
  3. Prints run result to the console: `status`, `timeMs`, `output`/`error`.

Flags (optional):


---

### 3) `./script prod <domain> <scriptName>`

Promotes your current local code to **production**.

- Reads `.prolibu/script.json` to get `scriptCodeProd`.
- Pushes the contents of `src/index.js` to `/v2/script/{scriptCodeProd}` via **PATCH**.
- Triggers a run via `POST /v2/run` with `{ scriptCode: scriptCodeProd }` (optional, can be skipped with `--no-run`).
- Prints `status`, `timeMs`, and any `output`/`error`.


Safety features:

- **Confirmation prompt** before publishing to `prod`.
- **Dry-run** mode available with `--dry-run` (shows what would be published).
- Checksums to avoid redundant PATCH if code didn’t change.
---

## API Contract (summary)
  - Body:
    {
      "scriptName": "<name>",
      "scriptCode": "<SCP-...-dev>",
      "code": "// initial",
      "payload": {},
      "lifecycleHooks": {},
      "lib": {}
  - Body:
    ```json
    { "code": "<contents of src/index.js>", "checksum": "<sha256>" }
    ```

- **Run Script**
  - `POST https://{domain}/v2/run`
  - Body:
    ```json
    { "scriptCode": "<SCP-...-dev or -prod>" }
    ```

- **Check Run Status / Logs**
  - `GET https://{domain}/v2/run/{runId}` → `{ status, output, error, timeMs }`

Auth header in all cases: `Authorization: Bearer <PROLIBU_TOKEN>`

---

## Example Workflow

```bash
export PROLIBU_TOKEN=xxxxx

# 1) Create a new script
./script create dev10.prolibu.com myScript

# 2) Start development (watch mode)
./script dev dev10.prolibu.com myScript

# 2b) Run the script immediately (no watch mode)
./script dev dev10.prolibu.com myScript exec

# 3) Publish to production
./script prod dev10.prolibu.com myScript
```

---

## Notes

- `.prolibu/` and `.env` should be in `.gitignore`.
- `scriptCode` is the single source of truth; we do not rely on `_id`.
- You can re-create or re-attach projects by editing `.prolibu/script.json` and re-running the commands.
- All script folders should contain: `code.js`, `variables.json`, `payload.json`, `lifecycleHooks.json`, and a `lib/` directory for modular code.