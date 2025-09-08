
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

- Node.js 18+
- A valid Prolibu API key for each domain

---

## Installation

```bash
npm install
chmod +x build
```

---

## Usage

### Create a new script

```bash
./script create <domain> <scriptName>
```
Prompts for the API key if not already saved. Creates local folders and files, and registers the script in the API for both dev and prod environments.

### Start development (watch mode)

```bash
./script dev <domain> <scriptName>
```
Watches `code.js`, `variables.json`, and `examplePayload.json` in the script folder. Automatically PATCHes changes to the API.

### Publish to production

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
package.json
```

---

## API Integration

- **Create Script**: `POST https://<domain>/v2/script`
- **Update Script**: `PATCH https://<domain>/v2/script/<scriptCode>`
- **Run Script**: `POST https://<domain>/v2/run`

All requests require:
```
Authorization: Bearer <apiKey>
Content-Type: application/json
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

## Best Practices

- Keep your API keys secure; they are stored per domain in `accounts/<domain>/config.json`.
- Use separate script codes for dev and prod environments.
- Commit only source files; use `.gitignore` to exclude `node_modules`, local script files, and secrets.
- Document your scripts and payloads for easier maintenance.
- Always test in dev before publishing to prod.

---

## Contributing

Pull requests and issues are welcome! Please follow conventional commit messages and document any new features in the README.

---

## License

MIT

## Commands

### 1) `./script create`

Interactive scaffolding. Prompts (in order):

1. **Script Name** — human-friendly name of your script (used to name the folder)
2. **Domain** — e.g., `dev10.prolibu.com`
3. **Script Code (dev)** — the **development** `scriptCode` (unique key, e.g., `SCP-XYZ-dev`)
4. **Script Code (prod)** — the **production** `scriptCode` (optional; if blank, it will be derived, e.g., replace `-dev` → `-prod`)

What it does:

- Creates a folder `<kebab-script-name>/` with:
  ```
  <kebab-script-name>/
  ├─ src/index.js
  ├─ .prolibu/script.json   # { domain, scriptCodeDev, scriptCodeProd, projectName, lastSync }
  ├─ package.json
  └─ README.md
  ```
- If the provided `scriptCodeDev` doesn’t exist yet, it **creates** it in Prolibu (`POST /v2/script`).
- Persists config in `.prolibu/script.json`.

**Next step message**:

```bash
cd <kebab-script-name>
../bin/builder dev <scriptCodeDev>
```

---

### 2) `./script dev {scriptCodeDev}`

Development mode with file watcher.

- Watches **`src/index.js`** (the script `code` you are editing).
- On every **save**:
  1. **PATCH** `/v2/script/{scriptCodeDev}` with the current file contents (`code`), including a checksum.
  2. **POST** `/v2/run` with `{ scriptCode: scriptCodeDev }`.
  3. Prints run result to the console: `status`, `timeMs`, `output`/`error`.

Flags (optional):

- `--no-run` → Only PATCH, do not run after update.
- `--verbose` → More logs.

> Uses `PROLIBU_TOKEN` from your environment. It’s never printed to console.

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

All operations use `scriptCode` as the **unique key**.

- **Create Script (if needed)**
  - `POST https://{domain}/v2/script`
  - Body:
    ```json
    {
      "scriptName": "<name>",
      "scriptCode": "<SCP-...-dev>",
      "code": "// initial",
      "variables": []
    }
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