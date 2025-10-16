# API Adapter Blueprint

## 📋 Purpose

This blueprint is a **comprehensive questionnaire** designed to collect all necessary information for building a complete API adapter. By filling out this document thoroughly, you enable an AI agent to generate a fully functional adapter **without ambiguity and without errors**.

## 📝 Instructions

1. **Fill out ALL sections** - Every piece of information helps ensure accuracy
2. **Be specific** - Use exact URLs, field names, and parameter names from the vendor's API documentation
3. **Provide examples** - Real API examples help clarify expected formats
4. **Include test credentials** - Sandbox/test environment access enables validation
5. **Reference documentation** - Link to specific pages in the vendor's API docs when possible

---

## 📋 SECTION 1: VENDOR IDENTIFICATION

### 1.1 Basic Information

**Vendor Name** (e.g., Salesforce, HubSpot, Zendesk):  
_Answer:_

**Vendor Website**:  
_Answer:_

**Primary Use Case** (CRM, Marketing Automation, Support, Accounting, etc.):  
_Answer:_

---

### 1.2 API Documentation

**Official API Documentation URL**:  
_Answer:_

**API Version to Use** (e.g., v3, v59.0, 2024-01):  
_Answer:_

**Is the API RESTful?** (Yes/No):  
_Answer:_

**If not RESTful, specify type** (GraphQL, SOAP, gRPC, etc.):  
_Answer:_

---

## 🔐 SECTION 2: AUTHENTICATION

### 2.1 Authentication Method

**Select ONE authentication method:**

- [ ] OAuth2 - Client Credentials Flow
- [ ] OAuth2 - Authorization Code Flow
- [ ] OAuth2 - Refresh Token Flow
- [ ] API Key (Header-based)
- [ ] API Key (Query Parameter)
- [ ] Basic Authentication (Username/Password)
- [ ] JWT (JSON Web Token)
- [ ] Custom (describe below)

---

### 2.2 Authentication Details

#### If OAuth2:

**Token Endpoint URL**:  
_Answer:_

**Authorization Endpoint URL** (if Authorization Code flow):  
_Answer:_

**Scopes Required** (comma-separated):  
_Answer:_

**Token Expiry Time** (seconds, e.g., 3600):  
_Answer:_

**Does it support token refresh?** (Yes/No):  
_Answer:_

**Refresh Token Endpoint** (if different from token endpoint):  
_Answer:_

**Request Body Format for Token Request** (JSON/Form-urlencoded):  
_Answer:_

**Example Token Request Body**:
```json
{
  "grant_type": "client_credentials",
  "client_id": "xxx",
  "client_secret": "xxx"
}
```

**Example Token Response**:
```json
{
  "access_token": "xxx",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

#### If API Key:

**Where is the key sent?**
- [ ] Header (specify header name below)
- [ ] Query Parameter (specify parameter name below)

**Header/Parameter Name**:  
_Answer:_

**Key Format** (e.g., `Bearer {key}`, `ApiKey {key}`, just `{key}`):  
_Answer:_

**Example Request with API Key**:
```
GET /api/v3/contacts
Authorization: Bearer YOUR_API_KEY
```

---

#### If Basic Auth:

**Is it username:password encoded in Base64?** (Yes/No):  
_Answer:_

**Header Format** (e.g., `Authorization: Basic {encoded}`):  
_Answer:_

**Example**:
```
Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
```

---

#### If JWT:

**JWT Generation Endpoint** (if applicable):  
_Answer:_

**JWT Signing Algorithm** (e.g., HS256, RS256):  
_Answer:_

**Claims Required** (list all required JWT claims):  
_Answer:_

**JWT Expiry Time** (seconds):  
_Answer:_

---

#### If Custom:

**Describe the full authentication flow** (step by step with examples):  
_Answer:_

---

### 2.3 Authentication Credentials Required

**List ALL credentials needed from users** (e.g., clientId, clientSecret, apiKey, instanceUrl, username, password):

1. _Credential Name:_ `___________` - Description: `___________`
2. _Credential Name:_ `___________` - Description: `___________`
3. _Credential Name:_ `___________` - Description: `___________`
4. _(Add more as needed)_

---

### 2.4 Token Caching Strategy (CRITICAL for OAuth2/JWT)

> **⚠️ IMPORTANT:** If your API uses OAuth2 or any authentication with expiring tokens, token caching is **MANDATORY** to avoid hitting rate limits and improve performance.

**Does the authentication token expire?** (Yes/No):  
_Answer:_

**If Yes, complete this section:**

---

#### Token Lifetime & Refresh

**Token Expiry Duration** (in seconds, e.g., 3600 = 1 hour, 7200 = 2 hours):  
_Answer:_

**Does the token response include an expiry timestamp or duration?** (Yes/No):  
_Answer:_

**If Yes, what field contains the expiry info?**
- [ ] `expires_in` (seconds until expiration)
- [ ] `issued_at` (timestamp when token was issued)
- [ ] `expires_at` (timestamp when token expires)
- [ ] Other (specify): _______

**Example token response with expiry information**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "issued_at": "1758578068457",
  "scope": "api"
}
```

---

#### Prolibu Token Caching Implementation

**⚠️ CRITICAL:** The adapter MUST use Prolibu's `setVariable()` and `variables` array to cache tokens.

**Token Cache Key Format**:  
Use this pattern: `{vendor-name}-token-{env}`

Example: `salesforce-token-production` or `hubspot-token-dev`

_Your token cache key will be:_ `___________-token-{env}`

---

#### Token Refresh Buffer

**How long before expiry should the token be refreshed?** (recommended: 5-10 minutes)  
_Answer:_ _______ minutes

**Why this matters:**
- Prevents token expiration during long-running operations
- Avoids race conditions when multiple scripts run simultaneously
- Reduces authentication errors

---

#### Token Validation Logic

**Complete this checklist for token validation:**

The adapter should check if cached token is valid by:
- [ ] Token exists in cache (`variables` array)
- [ ] Token is not null/empty
- [ ] Token has not expired (current time < expiry time - buffer)
- [ ] Token structure is valid (has required fields like `access_token`)

**If ANY check fails → fetch new token**

---

#### Example Token Flow (Salesforce Pattern)

```javascript
// 1. Check if token exists and is valid
async isTokenValid() {
  if (!this.tokenValue || !this.tokenValue.access_token) {
    return false;
  }
  
  const now = Date.now();
  const issuedAt = parseInt(this.tokenValue.issued_at);
  const tokenLifetime = 5400 * 1000; // 1.5 hours (conservative)
  const expirationTime = issuedAt + tokenLifetime;
  const refreshBuffer = 5 * 60 * 1000; // 5 minutes
  const refreshTime = expirationTime - refreshBuffer;
  
  return now < refreshTime;
}

// 2. Get token from cache or refresh
async authenticate() {
  // Load from Prolibu variables cache
  const tokenFound = globalThis.variables.find(v => v.key === this.tokenKey);
  this.tokenValue = tokenFound ? JSON.parse(tokenFound.value) : null;
  
  // Check if valid
  if (await this.isTokenValid()) {
    this.accessToken = this.tokenValue.access_token;
    this.authenticated = true;
    return this.accessToken;
  }
  
  // Token expired or doesn't exist - get new one
  return await this.refreshToken();
}

// 3. Fetch new token and cache it
async refreshToken() {
  const response = await axios.post(tokenEndpoint, credentials);
  
  const tokenResponse = {
    ...response.data,
    cached_at: Date.now()
  };
  
  // Cache in Prolibu variables
  await globalThis.setVariable(this.tokenKey, JSON.stringify(tokenResponse));
  
  this.tokenValue = tokenResponse;
  this.accessToken = tokenResponse.access_token;
  this.authenticated = true;
  
  return this.accessToken;
}
```

---

#### Token Invalidation Scenarios

**When should the cached token be invalidated (cleared)?**

Check all that apply:
- [ ] When API returns 401 Unauthorized
- [ ] When API returns specific error codes (list them): _______
- [ ] When authentication fails
- [ ] When user manually triggers re-authentication
- [ ] Other (describe): _______

**What error codes/messages indicate token is invalid?**  
_Answer:_ (e.g., `INVALID_SESSION_ID`, `SESSION_EXPIRED`, `INVALID_TOKEN`)

**Example error response that triggers token invalidation**:
```json
{
  "errorCode": "INVALID_SESSION_ID",
  "message": "Session expired or invalid"
}
```

---

#### Auto-Retry on Token Error

**Should the adapter automatically retry operations after token refresh?** (Yes/No - Recommended: Yes):  
_Answer:_

**If Yes:**

**Maximum retry attempts** (recommended: 1):  
_Answer:_

**Example auto-retry logic**:
```javascript
async executeWithRetry(operation, context = 'Operation') {
  let attempt = 0;
  
  while (attempt <= this.maxRetries) {
    try {
      return await operation();
    } catch (err) {
      // Check if it's a token error
      if (isTokenError(err) && attempt < this.maxRetries) {
        console.log('Token invalid, clearing cache and retrying...');
        await this.clearTokenCache();
        await this.authenticate();
        attempt++;
        continue; // Retry
      }
      throw err; // Not token error or max retries reached
    }
  }
}
```

---

#### Environment Detection

**Does the adapter need to detect if it's running in Prolibu server environment?**

```javascript
// Check if globalThis.setVariable and globalThis.variables exist
this.isServerEnvironment = 
  typeof globalThis.setVariable === 'function' && 
  typeof globalThis.variables !== 'undefined';

// Use different caching strategy based on environment:
// - Server: Use setVariable() and variables array
// - Local/Test: Use in-memory cache only
```

---

#### Token Cache Structure

**Provide the complete structure of the cached token object**:

```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "issued_at": "1758578068457",
  "scope": "api",
  "instance_url": "https://customer.vendor.com",
  "cached_at": 1758578068457
}
```

**Required fields:**
1. `access_token` - The actual token string
2. `issued_at` OR `expires_in` - For expiry calculation
3. _(List any other required fields)_

**Optional but recommended:**
- `cached_at` - Timestamp when token was cached (for debugging)
- `instance_url` - If base URL can change per token

---

#### Token Debugging Support

**Should the adapter provide token info for debugging?** (Recommended: Yes)

**Example debug method**:
```javascript
getTokenInfo() {
  if (!this.tokenValue) {
    return { status: 'No token cached' };
  }
  
  const now = Date.now();
  const issuedAt = parseInt(this.tokenValue.issued_at);
  const expirationTime = issuedAt + tokenLifetime;
  const timeUntilExpiration = expirationTime - now;
  
  return {
    status: 'Token cached',
    issuedAt: new Date(issuedAt).toISOString(),
    expiresAt: new Date(expirationTime).toISOString(),
    timeUntilExpiration: `${Math.round(timeUntilExpiration / 1000 / 60)} minutes`,
    isValid: timeUntilExpiration > refreshBuffer
  };
}
```

---

#### Summary Checklist

**Token caching implementation must include:**

- [ ] Token cache key using pattern: `{vendor}-token-{env}`
- [ ] Load token from `globalThis.variables` on initialization
- [ ] Validate token expiry before each use
- [ ] Refresh buffer (5-10 minutes before expiry)
- [ ] Automatic token refresh when expired
- [ ] Cache new tokens using `globalThis.setVariable()`
- [ ] Clear cache on token invalidation errors (401, SESSION_EXPIRED)
- [ ] Auto-retry logic with max 1 retry
- [ ] Environment detection (server vs local)
- [ ] Debug method to check token status

---

## 🌐 SECTION 3: API ENDPOINTS

### 3.1 Base Configuration

**Base URL / Instance URL**:  
_Answer:_

**Is the base URL static or dynamic?**
- [ ] Static (e.g., `https://api.vendor.com`)
- [ ] Dynamic per customer (e.g., `https://{customer}.vendor.com` or `https://{instance}.vendor.com`)

**If dynamic, what determines it?** (subdomain, region, custom domain, user-provided):  
_Answer:_

**Example of full base URL**:  
_Answer:_

---

### 3.2 Endpoint Structure for CRUD Operations

#### CREATE (Create a new record)

**HTTP Method**: (POST/PUT)  
_Answer:_

**Endpoint Pattern**: (e.g., `/api/v3/objects/{objectType}`, `/crm/v3/objects/contacts`)  
_Answer:_

**Request Body Format**: (JSON/XML/Form-data)  
_Answer:_

**Example Request Body**:
```json
{
  "FirstName": "John",
  "LastName": "Doe",
  "Email": "john@example.com"
}
```

**Example Response**:
```json
{
  "id": "003XXXXXXXXXXXX",
  "success": true
}
```

**Does the response contain the complete created object?** (Yes/No):  
_Answer:_

**If No, how do you fetch the complete object after creation?**  
_Answer:_

**Are there any special headers required?** (e.g., Content-Type, Accept):  
_Answer:_

---

#### READ - Single Record (Get one record by ID)

**HTTP Method**: (GET)  
_Answer:_

**Endpoint Pattern**: (e.g., `/api/v3/objects/{objectType}/{id}`)  
_Answer:_

**How to specify which fields to return?** (query param, headers, request body):  
_Answer:_

**Parameter name for field selection** (e.g., `fields`, `properties`, `select`):  
_Answer:_

**Example Request URL**:  
_Answer:_ `https://api.vendor.com/api/v3/contacts/12345?fields=id,firstName,lastName,email`

**Example Response**:
```json
{
  "id": "12345",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**What happens if record is not found (404)?** (Empty response, error message, null):  
_Answer:_

---

#### READ - Multiple Records (Query/Search)

**HTTP Method**: (GET/POST)  
_Answer:_

**Endpoint Pattern**: (e.g., `/api/v3/query`, `/api/v3/search`, `/api/v3/objects/{objectType}`)  
_Answer:_

**Query Language/Format**: (Native SQL-like, Vendor-specific like SOQL, Filter objects, URL parameters)  
_Answer:_

**How to pass the query?** (query parameter, request body):  
_Answer:_

**Parameter name for query** (e.g., `q`, `query`, `filter`, `where`):  
_Answer:_

**Example Query Request**:
```
GET /api/v3/query?q=SELECT Id, Name, Email FROM Contact WHERE Email != null LIMIT 10
```
OR
```json
POST /api/v3/search
{
  "filters": [
    { "field": "email", "operator": "exists" }
  ],
  "limit": 10
}
```

**Example Response**:
```json
{
  "totalSize": 150,
  "records": [
    { "id": "001", "name": "John Doe", "email": "john@example.com" },
    { "id": "002", "name": "Jane Smith", "email": "jane@example.com" }
  ]
}
```

**How is pagination handled?**
- [ ] Offset-based (offset/limit parameters)
- [ ] Cursor-based (next_cursor/after token)
- [ ] Page-based (page number)
- [ ] Other (describe):

**Parameter names for pagination** (e.g., `limit`, `offset`, `page`, `after`, `next_cursor`):  
_Answer:_

**How is total record count provided?** (field name in response, e.g., `totalSize`, `count`, `total`):  
_Answer:_

**Maximum records per request** (if limited):  
_Answer:_

---

#### UPDATE (Update an existing record)

**HTTP Method**: (PATCH/PUT)  
_Answer:_

**Endpoint Pattern**: (e.g., `/api/v3/objects/{objectType}/{id}`)  
_Answer:_

**Request Body Format**: (JSON/XML/Form-data)  
_Answer:_

**Example Request Body** (only changed fields):
```json
{
  "Phone": "+1-555-9876",
  "Email": "newemail@example.com"
}
```

**Example Response**:
```json
{
  "success": true
}
```

**Does the response contain the complete updated object?** (Yes/No):  
_Answer:_

**If No, how do you fetch the complete object after update?**  
_Answer:_

---

#### DELETE (Delete a record)

**HTTP Method**: (DELETE)  
_Answer:_

**Endpoint Pattern**: (e.g., `/api/v3/objects/{objectType}/{id}`)  
_Answer:_

**Response Format** (Empty 204 No Content, Success JSON with message, etc.):  
_Answer:_

**Example Response**:
```json
{
  "success": true
}
```
OR
```
204 No Content
```

---

## 📦 SECTION 4: OBJECT TYPES (ENTITIES)

### 4.1 Supported Objects

**List the objects/entities this integration will support:**

| Prolibu Entity | Vendor Object Name | Vendor API Endpoint (if specific) |
|----------------|-------------------|-----------------------------------|
| Contact | _(e.g., Contact, contacts)_ | _(e.g., /crm/v3/objects/contacts)_ |
| Company | _(e.g., Account, companies)_ | |
| Deal | _(e.g., Opportunity, deals)_ | |
| _(Add more rows as needed)_ | | |

---

### 4.2 Object-Specific Notes

**For each object, document any special behavior:**

#### Contact

**Required fields** (fields that MUST be provided when creating):  
_Answer:_

**Read-only fields** (fields that cannot be set/updated):  
_Answer:_

**Unique fields** (fields that must be unique, e.g., email):  
_Answer:_

**Special validations** (e.g., email format, phone format):  
_Answer:_

---

#### Company

**Required fields**:  
_Answer:_

**Read-only fields**:  
_Answer:_

**Unique fields**:  
_Answer:_

**Special validations**:  
_Answer:_

---

#### Deal (if applicable)

**Required fields**:  
_Answer:_

**Read-only fields**:  
_Answer:_

**Unique fields**:  
_Answer:_

**Special validations**:  
_Answer:_

---

## 🗺️ SECTION 5: FIELD MAPPINGS

### 5.1 Contact Fields

**Map Prolibu fields to Vendor fields:**

| Prolibu Field | Vendor Field Name | Data Type | Required? | Notes |
|---------------|-------------------|-----------|-----------|-------|
| firstName | _(e.g., FirstName, first_name)_ | string | Yes/No | |
| lastName | | string | Yes/No | |
| email | | string | Yes/No | |
| phone | | string | Yes/No | |
| mobile | | string | Yes/No | |
| mailingStreet | | string | Yes/No | |
| mailingCity | | string | Yes/No | |
| mailingState | | string | Yes/No | |
| mailingPostalCode | | string | Yes/No | |
| mailingCountry | | string | Yes/No | |
| linkedinUrl | | string | Yes/No | Custom field? |
| companyId | | reference | Yes/No | Foreign key to Company |
| ownerId | | reference | Yes/No | |
| _(Add custom fields below)_ | | | | |

---

### 5.2 Company Fields

**Map Prolibu fields to Vendor fields:**

| Prolibu Field | Vendor Field Name | Data Type | Required? | Notes |
|---------------|-------------------|-----------|-----------|-------|
| name | | string | Yes/No | |
| website | | string | Yes/No | |
| industry | | string | Yes/No | |
| numberOfEmployees | | number | Yes/No | |
| phone | | string | Yes/No | |
| billingStreet | | string | Yes/No | |
| billingCity | | string | Yes/No | |
| billingState | | string | Yes/No | |
| billingPostalCode | | string | Yes/No | |
| billingCountry | | string | Yes/No | |
| _(Add custom fields below)_ | | | | |

---

### 5.3 Deal Fields (if applicable)

**Map Prolibu fields to Vendor fields:**

| Prolibu Field | Vendor Field Name | Data Type | Required? | Notes |
|---------------|-------------------|-----------|-----------|-------|
| name | | string | Yes/No | |
| amount | | number | Yes/No | |
| stage | | string | Yes/No | |
| closeDate | | date | Yes/No | |
| probability | | number | Yes/No | |
| companyId | | reference | Yes/No | |
| contactId | | reference | Yes/No | |
| ownerId | | reference | Yes/No | |
| _(Add custom fields below)_ | | | | |

---

## 🔍 SECTION 6: QUERY CAPABILITIES

### 6.1 Filtering Support

**Does the API support filtering/querying records?** (Yes/No):  
_Answer:_

**If Yes:**

**Query Language/Format**: (e.g., SOQL, GraphQL filters, JSON filter objects, URL query parameters)  
_Answer:_

**Provide example query to find contacts with non-null email:**  
_Answer:_
```
Example: SELECT Id, Name, Email FROM Contact WHERE Email != null
```

**Provide example query to find companies in a specific industry:**  
_Answer:_

---

### 6.2 Supported Operators

**Check all operators that the API supports:**

- [ ] Equals (=, eq)
- [ ] Not Equals (!=, ne)
- [ ] Greater Than (>, gt)
- [ ] Greater Than or Equal (>=, gte)
- [ ] Less Than (<, lt)
- [ ] Less Than or Equal (<=, lte)
- [ ] IN (value in list)
- [ ] NOT IN
- [ ] LIKE (partial match)
- [ ] IS NULL / IS NOT NULL
- [ ] Contains (substring match)
- [ ] Starts With
- [ ] Ends With
- [ ] Custom operators (describe): _______

**Provide examples for 2-3 operators:**  
_Answer:_

---

### 6.3 Field Selection

**Can you select specific fields to return in queries?** (Yes/No):  
_Answer:_

**If Yes, how?** (e.g., `?fields=Id,Name,Email`, `?properties=id,name`, in request body)  
_Answer:_

**Example request with field selection**:  
_Answer:_

---

### 6.4 Sorting

**Can results be sorted?** (Yes/No):  
_Answer:_

**If Yes, how?** (e.g., `?sort=CreatedDate DESC`, `?orderBy=name ASC`, in request body)  
_Answer:_

**Example request with sorting**:  
_Answer:_

---

## ⚠️ SECTION 7: ERROR HANDLING

### 7.1 HTTP Status Codes

**Document the status codes the API returns:**

| Status Code | Meaning | When It Occurs | Recommended Action |
|-------------|---------|----------------|-------------------|
| 200 | Success | Successful GET/PATCH | Return data |
| 201 | Created | Successful POST | Return created object |
| 204 | No Content | Successful DELETE | Return success |
| 400 | Bad Request | Invalid data/validation error | Throw error with details |
| 401 | Unauthorized | Invalid/expired token | Re-authenticate |
| 403 | Forbidden | No permission | Throw error |
| 404 | Not Found | Record doesn't exist | Return null (findOne) or throw |
| 429 | Rate Limit Exceeded | Too many requests | Retry with backoff |
| 500 | Server Error | Vendor API issue | Retry with backoff |
| 503 | Service Unavailable | Vendor maintenance | Retry with backoff |
| _(Add others)_ | | | |

---

### 7.2 Error Response Format

**Provide example error responses for common scenarios:**

**400 Bad Request:**
```json
{
  "error": "INVALID_EMAIL",
  "message": "Email format is invalid",
  "field": "email"
}
```

**401 Unauthorized:**
```json
{
  "error": "INVALID_TOKEN",
  "message": "Access token has expired"
}
```

**404 Not Found:**
```json
{
  "error": "NOT_FOUND",
  "message": "Contact with ID 12345 not found"
}
```

**429 Rate Limit:**
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests",
  "retryAfter": 60
}
```

**What fields are always present in error responses?** (e.g., `error`, `message`, `code`):  
_Answer:_

---

### 7.3 Rate Limiting

**Is there a rate limit?** (Yes/No):  
_Answer:_

**If Yes:**

**Limit**: (e.g., 100 requests per 10 seconds, 1000 requests per day)  
_Answer:_

**Rate limit headers in response** (if any):
- Header name for remaining requests: _Answer:_
- Header name for limit reset time: _Answer:_
- Header name for retry-after: _Answer:_

**Example response headers when rate limited**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1634567890
Retry-After: 60
```

**Does the API return 429 status when rate limited?** (Yes/No):  
_Answer:_

---

## 🔗 SECTION 8: RELATIONSHIPS & ASSOCIATIONS

### 8.1 Relationship Handling

**How are relationships between objects managed in the API?**

#### Example: Contact → Company

**Field Name in Contact object that references Company**: (e.g., AccountId, companyId)  
_Answer:_

**Is it a simple ID reference?** (Yes/No):  
_Answer:_

**Can you create a Contact with a Company reference in the same API call?** (Yes/No):  
_Answer:_

**If Yes, provide example**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "companyId": "company-123"
}
```

---

#### Example: Deal → Contact & Company

**Field Name in Deal object that references Company**:  
_Answer:_

**Field Name in Deal object that references Contact**:  
_Answer:_

**How to associate multiple contacts to one deal?** (Separate API call, array in body, junction object):  
_Answer:_

**Provide example if associations are sent in create/update body**:
```json
{
  "name": "Big Deal",
  "amount": 50000,
  "companyId": "company-123",
  "contactId": "contact-456"
}
```

---

### 8.2 Creating Related Records

**Can you create a Contact and Company in one API call?** (Yes/No):  
_Answer:_

**If Yes, describe the format and provide example**:  
_Answer:_

**Can you create a Deal with Contact and Company references in one call?** (Yes/No):  
_Answer:_

**If Yes, provide example**:  
_Answer:_

---

### 8.3 Associations API (if separate)

**Is there a separate API endpoint for managing associations?** (Yes/No):  
_Answer:_

**If Yes:**

**Endpoint Pattern**: (e.g., `/api/v3/associations/{objectType}/{id}`)  
_Answer:_

**Example request to associate Contact with Company**:  
_Answer:_

---

## 🌍 SECTION 9: SPECIAL FEATURES

### 9.1 Bulk Operations

**Does the API support bulk create/update/delete?** (Yes/No):  
_Answer:_

**If Yes:**

**Maximum records per bulk operation**:  
_Answer:_

**Endpoint for bulk create**:  
_Answer:_

**Endpoint for bulk update**:  
_Answer:_

**Endpoint for bulk delete**:  
_Answer:_

**Example bulk create request**:
```json
{
  "records": [
    { "firstName": "John", "lastName": "Doe", "email": "john@example.com" },
    { "firstName": "Jane", "lastName": "Smith", "email": "jane@example.com" }
  ]
}
```

**Example bulk response**:
```json
{
  "results": [
    { "id": "001", "success": true },
    { "id": "002", "success": true }
  ]
}
```

---

### 9.2 Webhooks (for future inbound integration)

**Does the vendor support webhooks?** (Yes/No):  
_Answer:_

**If Yes:**

**Webhook configuration endpoint**:  
_Answer:_

**Events available** (e.g., contact.created, contact.updated, contact.deleted):  
_Answer:_

**Webhook payload format example**:
```json
{
  "event": "contact.created",
  "data": {
    "id": "12345",
    "firstName": "John",
    "lastName": "Doe"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### 9.3 Custom Fields

**Does the API support custom fields?** (Yes/No):  
_Answer:_

**If Yes:**

**Custom field naming convention** (e.g., `CustomField__c`, `custom_field`, `cf_fieldname`):  
_Answer:_

**Example of custom field in API request**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "customField__c": "Custom Value"
}
```

**Do custom fields need to be created in vendor UI first?** (Yes/No):  
_Answer:_

---

### 9.4 Multi-tenancy

**Is the API multi-tenant?** (Yes/No):  
_Answer:_

**If Yes:**

**How is tenant identified?** (subdomain, header, API key, account ID in request):  
_Answer:_

**Example showing tenant identification**:  
_Answer:_

---

### 9.5 File/Attachment Support

**Does the API support file uploads/attachments?** (Yes/No):  
_Answer:_

**If Yes:**

**Endpoint for file uploads**:  
_Answer:_

**Maximum file size**:  
_Answer:_

**Supported file types**:  
_Answer:_

---

## 🧪 SECTION 10: TESTING INFORMATION

### 10.1 Sandbox Environment

**Does the vendor provide a sandbox/test environment?** (Yes/No):  
_Answer:_

**If Yes:**

**Sandbox Base URL**:  
_Answer:_

**How to obtain sandbox credentials** (link to instructions or describe):  
_Answer:_

**Are sandbox and production APIs identical?** (Yes/No):  
_Answer:_

**If No, list differences**:  
_Answer:_

---

### 10.2 Test Credentials

**Can you provide test credentials for development?** (Yes/No):  
_Answer:_

**If Yes, provide test credentials (will be used only for development):**

- **Client ID / API Key**:  
  _Answer:_

- **Client Secret** (if applicable):  
  _Answer:_

- **Instance URL** (if applicable):  
  _Answer:_

- **Username** (if applicable):  
  _Answer:_

- **Password** (if applicable):  
  _Answer:_

**OR provide instructions to create a test account:**  
_Answer:_

---

### 10.3 Test Data Availability

**Does the sandbox come with test data?** (Yes/No):  
_Answer:_

**If No, can test records be created easily?** (Yes/No):  
_Answer:_

**Any restrictions on test data** (e.g., cannot use real emails, limited records):  
_Answer:_

---

## 📝 SECTION 11: VENDOR-SPECIFIC NOTES

### 11.1 Known Limitations

**List any known API limitations:**

1. _Example: Cannot delete records created in the last 24 hours_
2. _Example: Maximum 200 records per query_
3. _Answer:_
4. _Answer:_
5. _Answer:_

---

### 11.2 Special Behaviors & Quirks

**Any quirks or non-standard behaviors:**

1. _Example: API returns 200 OK even on validation errors, with error in response body_
2. _Example: Date fields must be in YYYY-MM-DD format, not ISO 8601_
3. _Answer:_
4. _Answer:_
5. _Answer:_

---

### 11.3 Required Headers

**List any additional required headers for all requests:**

| Header Name | Value | Purpose |
|-------------|-------|---------|
| _(e.g., X-API-Version)_ | _(e.g., 2024-01)_ | _(API versioning)_ |
| _(e.g., Content-Type)_ | _(e.g., application/json)_ | _(Request format)_ |
| _(e.g., Accept)_ | _(e.g., application/json)_ | _(Response format)_ |

---

### 11.4 Timezone Handling

**Are dates/times in UTC?** (Yes/No):  
_Answer:_

**If No, what timezone is used?**  
_Answer:_

**Date/Time format** (e.g., ISO 8601, Unix timestamp, custom format):  
_Answer:_

**Example date/time value**:  
_Answer:_ `2024-01-15T10:30:00Z`

---

### 11.5 Pagination Specifics

**When paginating, does the API provide:**
- [ ] Next page URL
- [ ] Next page cursor/token
- [ ] Total record count
- [ ] Current page number
- [ ] Total pages

**Example pagination response**:
```json
{
  "data": [...],
  "pagination": {
    "total": 500,
    "page": 1,
    "pageSize": 50,
    "totalPages": 10,
    "nextPage": "https://api.vendor.com/contacts?page=2"
  }
}
```

---

### 11.6 Field Naming Convention

**What naming convention does the API use?**
- [ ] camelCase (e.g., `firstName`)
- [ ] PascalCase (e.g., `FirstName`)
- [ ] snake_case (e.g., `first_name`)
- [ ] kebab-case (e.g., `first-name`)

**Are field names case-sensitive?** (Yes/No):  
_Answer:_

---

### 11.7 Null vs Empty Values

**How does the API handle null/empty values?**

**When sending updates, how to:**
- **Set field to null**: (e.g., send `null`, send empty string `""`, omit field, send specific null value)  
  _Answer:_

- **Clear a field**: (e.g., send `null`, send empty string `""`, use DELETE request)  
  _Answer:_

**When receiving data:**
- **Missing fields are**: (not included in response, included with `null`, included with empty string)  
  _Answer:_

---

### 11.8 ID Format

**What format are record IDs?**
- [ ] UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`)
- [ ] Integer (e.g., `12345`)
- [ ] Alphanumeric (e.g., `003XXXXXXXXXXXX`)
- [ ] Other (describe): _______

**Are IDs always the same length?** (Yes/No):  
_Answer:_

**Example ID**:  
_Answer:_

---

### 11.9 Case Sensitivity

**Is the API case-sensitive for:**
- **Object type names** (Yes/No): _Answer:_
- **Field names** (Yes/No): _Answer:_
- **Query values** (Yes/No): _Answer:_

---

### 11.10 Additional Notes

**Any other important information the AI agent should know:**

_Answer:_

---

## ✅ SECTION 12: VALIDATION CHECKLIST

### 12.1 Completeness Check

**Before submitting, verify that you have provided:**

- [ ] Vendor name, website, and API documentation URL
- [ ] Complete authentication details (method, endpoints, credentials)
- [ ] Base URL and all CRUD endpoint patterns
- [ ] At least one object type fully mapped (Contact or Company)
- [ ] Example request/response for create, read, update, delete
- [ ] Error response format and status codes
- [ ] Pagination details (if applicable)
- [ ] Rate limits documented (if applicable)
- [ ] Field mappings for at least Contact entity
- [ ] Test credentials or sandbox access information

---

### 12.2 Testing Readiness

**Confirm:**

- [ ] I have access to the vendor's API documentation
- [ ] I have valid credentials (production or sandbox)
- [ ] I can make test API calls successfully using provided credentials
- [ ] I understand the vendor's authentication flow
- [ ] I have tested at least one CRUD operation manually
- [ ] I know where to find field names in vendor's documentation

---

### 12.3 Documentation Quality

**Verify:**

- [ ] All URLs are complete and correct
- [ ] All field names match vendor's exact casing
- [ ] Examples use real data formats from vendor's API
- [ ] Special quirks and limitations are documented
- [ ] Any custom or unusual behavior is explained

---

## 🎯 SUBMISSION

Once you have completed all sections and checked all boxes above, this blueprint is ready for the AI agent to generate your adapter!

**Date Completed**: _________________

**Completed By**: _________________

**Vendor Contact** (if available for questions): _________________

---

## 📚 Additional Resources

- **Adapter Development Guide**: See `README.md` in this folder
- **Reference Implementations**: 
  - SalesforceApi: `/lib/vendors/salesforce/`
  - HubSpotApi: `/lib/vendors/hubspot/`
- **Outbound Integration Guide**: `/accounts/dev10.prolibu.com/hook-integrations/OUTBOUND_API_ADAPTER_GUIDE.md`

---

**Thank you for providing comprehensive information! This will enable the AI agent to build a robust, error-free adapter for your integration.**
