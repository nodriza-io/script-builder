
# Script Builder CLI

Script Builder is a professional CLI tool for creating, developing, and managing Prolibu v2 scripts. It provides a robust workflow for local development, API integration, and safe publishing to production.

---

## Features

- Scaffold new scripts for any domain and environment (dev/prod)
- Local file management for code, variables, and example payloads
- Automatic API sync on file save (PATCH to `/v2/script/{scriptCode}`)
- Watch mode for instant updates
- Secure API key management per domain
- Clear separation between development and production scripts

---

## Requirements

[Script Builder CLI]
- A valid Prolibu API key for each domain
---

## Installation

### Create a new script
```bash
./script create <domain> <scriptName>
```


```bash
./script prod <domain> <scriptName>
```
Syncs the current code and data to the production script in the API.

---

## Project Structure

```
accounts/
  └── <domain>/
    └── <scriptName>/
      ├── code.js
      ├── variables.json
      └── examplePayload.json
    └── config.json
.gitignore
build
README.md
```

---

## API Integration

- **Create Script**: `POST https://<domain>/v2/script`
- **Update Script**: `PATCH https://<domain>/v2/script/<scriptCode>`
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
  <kebab-script-name>/
  ├─ src/index.js
  ├─ .prolibu/script.json   # { domain, scriptCodeDev, scriptCodeProd, projectName, lastSync }
  ├─ package.json
  ```
- Persists config in `.prolibu/script.json`.

**Next step message**:
```
---

### 2) `./script dev {scriptCodeDev}`
  1. **PATCH** `/v2/script/{scriptCodeDev}` with the current file contents (`code`), including a checksum.
  3. Prints run result to the console: `status`, `timeMs`, `output`/`error`.

Flags (optional):


---

### 3) `./script publish`

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
      "variables": []
    ```

- **Update Script (dev/prod)**
  - `PATCH https://{domain}/v2/script/{scriptCode}`
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

# 1) Scaffold
./bin/builder create
# Script Name: Price Sync
# Domain: dev10.prolibu.com
# Script Code (dev): SCP-PRICE-SYNC-dev
# Script Code (prod): SCP-PRICE-SYNC-prod  # or leave blank to auto-derive

cd price-sync

# 2) Develop: watch + patch + run (against dev)
../bin/builder dev SCP-PRICE-SYNC-dev

# 3) Publish: push current code to prod
../bin/builder publish
# (confirm) Are you sure you want to publish to SCP-PRICE-SYNC-prod? yes
```

---

## Notes

- `.prolibu/` and `.env` should be in `.gitignore`.
- `scriptCode` is the single source of truth; we do not rely on `_id`.
- You can re-create or re-attach projects by editing `.prolibu/script.json` and re-running the commands.