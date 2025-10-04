# HubSpot API Adapter

A standardized API adapter for integrating HubSpot CRM with the Prolibu platform. This adapter follows the same patterns as `ProlibuApi` and `SalesforceApi` to ensure consistent behavior across all outbound integrations.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Authentication](#authentication)
- [Usage](#usage)
- [API Methods](#api-methods)
- [HubSpot Object Types](#hubspot-object-types)
- [Field Mappings](#field-mappings)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Overview

The HubSpot API adapter provides:
- ✅ Standardized CRUD operations (Create, Read, Update, Delete)
- ✅ OAuth2 authentication with token refresh (like SalesforceApi)
- ✅ Consistent response format matching `ProlibuApi`
- ✅ Automatic retry logic with token invalidation handling
- ✅ Support for Prolibu-style query operators (`$exists`, `$ne`, `$gt`, `$lt`, `$in`)
- ✅ Pagination support
- ✅ Complete object returns (all fields populated)

## Installation

```javascript
const HubSpotApi = require('./lib/vendors/hubspot/HubSpotApi');

const hubspotApi = new HubSpotApi({
  accessToken: 'your-access-token',
  clientSecret: 'your-client-secret'
});

await hubspotApi.authenticate();
```

## Authentication

HubSpot uses **OAuth2** authentication with access tokens and client secrets.

### Setup Steps:

1. Go to HubSpot Settings → Integrations → Private Apps
2. Create a new Private App with required scopes:
   - `crm.objects.contacts.read` & `crm.objects.contacts.write`
   - `crm.objects.companies.read` & `crm.objects.companies.write`
   - `crm.objects.deals.read` & `crm.objects.deals.write`
3. Copy the **Access Token**
4. Get your **Client Secret** from the app settings

### In Prolibu:

Store credentials in Variables:
- `hubspot-accessToken-{environment}` - Your HubSpot access token
- `hubspot-clientSecret-{environment}` - Your HubSpot client secret

```javascript
const hubspotApi = new HubSpotApi({
  accessToken: await Variables.get('hubspot-accessToken-production'),
  clientSecret: await Variables.get('hubspot-clientSecret-production'),
  environment: 'production'
});

await hubspotApi.authenticate();
```

### Token Caching & Refresh

The adapter automatically:
- ✅ Caches tokens in Prolibu variables (server environment)
- ✅ Refreshes tokens before expiration (5 minute buffer)
- ✅ Handles 401 errors by clearing cache and re-authenticating
- ✅ Retries failed requests once after token refresh

```javascript
// Check token status
console.log(hubspotApi.getTokenInfo());
// {
//   status: 'Token cached',
//   issuedAt: '2024-01-15T10:30:00.000Z',
//   expiresAt: '2024-01-15T11:00:00.000Z',
//   timeUntilExpiration: '25 minutes',
//   isValid: true
// }

// Force token refresh (for testing)
await hubspotApi.forceRefresh();
```

## Usage

### Create a Record

```javascript
// Create a contact
const contact = await hubspotApi.create('contacts', {
  firstname: 'Jane',
  lastname: 'Smith',
  email: 'jane.smith@example.com',
  phone: '+1-555-0123',
  company: 'Acme Corp'
});

console.log('Created contact:', contact);
// { id: '12345', firstname: 'Jane', lastname: 'Smith', email: '...', createdate: '...', ... }
```

### Find Records

```javascript
// Find contacts with filtering
const contacts = await hubspotApi.find('contacts', {
  select: 'firstname, lastname, email, phone',
  lastname: 'Smith',
  email: { $exists: true },
  limit: 10,
  page: 1,
  sort: '-createdate'  // Sort by createdate descending
});

console.log('Found contacts:', contacts);
// {
//   pagination: { count: 150, page: 1, limit: 10, lastPage: 15, startIndex: 0 },
//   data: [ { id: '12345', firstname: 'Jane', ... }, ... ]
// }
```

### Find One Record

```javascript
// Get a specific contact by ID
const contact = await hubspotApi.findOne('contacts', '12345', {
  select: 'firstname, lastname, email'
});

if (contact) {
  console.log('Found contact:', contact);
} else {
  console.log('Contact not found');
}
```

### Update a Record

```javascript
// Update contact information
const updated = await hubspotApi.update('contacts', '12345', {
  phone: '+1-555-9876',
  city: 'San Francisco'
});

console.log('Updated contact:', updated);
// { id: '12345', firstname: 'Jane', phone: '+1-555-9876', city: 'San Francisco', ... }
```

### Delete a Record

```javascript
// Delete a contact
const result = await hubspotApi.delete('contacts', '12345');
console.log('Deleted:', result.success); // true
```

## API Methods

### `create(objectType, data)`

Creates a new record and returns the complete created object.

**Parameters:**
- `objectType` (string): HubSpot object type ('contacts', 'companies', 'deals')
- `data` (Object): Field-value pairs to create

**Returns:** Complete object with all fields

### `find(objectType, options)`

Queries multiple records with filtering and pagination.

**Parameters:**
- `objectType` (string): HubSpot object type
- `options` (Object): Query options
  - `select` (string): Comma-separated field names
  - `limit` (number): Max records to return (default: 100)
  - `page` (number): Page number (default: 1)
  - `sort` (string): Sort field (use `-` prefix for descending)
  - `...fields`: Any other fields become filter conditions

**Reserved Fields (not used in filters):**
- `select` - Fields to return
- `limit` - Records per page
- `page` - Page number
- `sort` - Sorting criteria

**Supported Operators:**
- `$exists` - Field has a value (`HAS_PROPERTY` / `NOT_HAS_PROPERTY`)
- `$ne` - Not equal (`NEQ`)
- `$gt` - Greater than (`GT`)
- `$gte` - Greater or equal (`GTE`)
- `$lt` - Less than (`LT`)
- `$lte` - Less or equal (`LTE`)
- `$in` - In array (`IN`)

**Returns:** `{ pagination, data }` object

### `findOne(objectType, id, options)`

Retrieves a single record by ID.

**Parameters:**
- `objectType` (string): HubSpot object type
- `id` (string): Record ID
- `options` (Object): Optional
  - `select` (string): Comma-separated field names (e.g., `'firstname, lastname, email'`)

**Returns:** Object or `null` if not found (404)

**Important:** The `select` parameter must be a **comma-separated string**, NOT an array. HubSpot API will ignore array format.

### `update(objectType, id, data, options)`

Updates a record and returns the complete updated object.

**Parameters:**
- `objectType` (string): HubSpot object type
- `id` (string): Record ID
- `data` (Object): Updated field values
- `options` (Object): Optional
  - `select` (string): Comma-separated field names to return

**Returns:** Complete updated object

### `delete(objectType, id)`

Deletes a record.

**Parameters:**
- `objectType` (string): HubSpot object type
- `id` (string): Record ID

**Returns:** `{ success: true }`

### `getRefData(objectType, id)`

Gets reference data for linking Prolibu records to HubSpot records.

**Returns:** `{ refId, refUrl }`

### `getRefUrl(objectType, id)`

Generates URL to view record in HubSpot UI.

**Returns:** HubSpot URL string

## HubSpot Object Types

Common HubSpot object types:

| Object Type | Description | Common Properties |
|-------------|-------------|-------------------|
| `contacts` | Contact records | `firstname`, `lastname`, `email`, `phone`, `company` |
| `companies` | Company records | `name`, `domain`, `industry`, `city`, `state` |
| `deals` | Deal/Opportunity records | `dealname`, `amount`, `dealstage`, `pipeline`, `closedate` |
| `tickets` | Support tickets | `subject`, `content`, `hs_ticket_priority`, `hs_pipeline_stage` |
| `products` | Product records | `name`, `description`, `price` |
| `quotes` | Quote records | `hs_title`, `hs_expiration_date` |

## Field Mappings

See the `/maps` directory for predefined field mappings:

- `CompanyMap.js` - Prolibu Company → HubSpot Company
- `ContactMap.js` - Prolibu Contact → HubSpot Contact
- `DealMap.js` - Prolibu Deal → HubSpot Deal

## Error Handling

The adapter implements automatic retry logic:

- **Network errors** (ECONNRESET, ETIMEDOUT): Retries with exponential backoff
- **Rate limits** (429): Retries with backoff (1s, 2s, 4s)
- **Server errors** (500+): Retries with backoff
- **Client errors** (400, 404, 403): Does NOT retry, throws immediately

```javascript
try {
  const contact = await hubspotApi.create('contacts', data);
} catch (error) {
  if (error.message.includes('Status: 400')) {
    console.error('Validation error:', error.message);
  } else if (error.message.includes('Status: 404')) {
    console.error('Not found:', error.message);
  } else {
    console.error('API error:', error.message);
  }
}
```

## Best Practices

### 1. Always Authenticate First

```javascript
await hubspotApi.authenticate();
```

### 2. Use Select to Limit Fields

```javascript
// Only fetch fields you need
const contact = await hubspotApi.findOne('contacts', id, {
  select: 'firstname, lastname, email'
});
```

### 3. Handle Pagination Properly

```javascript
const result = await hubspotApi.find('contacts', {
  limit: 50,
  page: 1
});

console.log(`Showing ${result.data.length} of ${result.pagination.count} total`);
console.log(`Page ${result.pagination.page} of ${result.pagination.lastPage}`);
```

### 4. Store Reference Data

```javascript
// After creating in HubSpot, store refId and refUrl in Prolibu
const hubspotContact = await hubspotApi.create('contacts', data);
const refData = hubspotApi.getRefData('contacts', hubspotContact.id);

await prolibuApi.update('Contact', prolibuContactId, refData);
// Stores: { refId: '12345', refUrl: 'https://app.hubspot.com/contacts/contact/12345' }
```

### 5. Use Operators for Complex Queries

```javascript
const results = await hubspotApi.find('companies', {
  industry: { $ne: 'Retail' },           // Not Retail
  numberofemployees: { $gt: 100 },       // More than 100 employees
  domain: { $exists: true },             // Has a domain
  city: { $in: ['SF', 'NYC', 'LA'] }     // In specific cities
});
```

### 6. Check for null on findOne

```javascript
const contact = await hubspotApi.findOne('contacts', id);
if (!contact) {
  console.log('Contact not found');
  return;
}
```

## HubSpot-Specific Notes

### Property Names

HubSpot uses lowercase property names with no spaces:
- `firstname` not `FirstName`
- `numberofemployees` not `NumberOfEmployees`

### Custom Properties

Custom properties use format: `custom_property_name`

### Deal Stages

Deal stages are pipeline-specific. Get available stages from HubSpot settings.

### Associations

To associate records during creation, use the `associations` parameter:

```javascript
// Create a deal and associate with contact and company
const deal = await hubspotApi.create('deals', {
  dealname: 'New Deal',
  dealstage: 'qualifiedtobuy',
  pipeline: 'default',
  associations: {
    contacts: ['160937654376'],   // Contact IDs to associate
    companies: ['40699642530']    // Company IDs to associate
  }
});
```

**Important:** The `associations` parameter is automatically filtered out during UPDATE operations (it can only be used in CREATE).

## API Rate Limits

HubSpot rate limits (as of 2024):
- **Professional**: 100 requests per 10 seconds
- **Enterprise**: 120 requests per 10 seconds

The adapter automatically handles rate limiting with retries.

## Troubleshooting

### "Authentication failed"
- Verify your API key is correct
- Check that Private App has required scopes
- Ensure API key hasn't been revoked

### "Property does not exist"
- Verify property name is correct (lowercase)
- Check if it's a custom property
- Ensure object type supports the property

### "Rate limit exceeded"
- The adapter will automatically retry
- Consider reducing request frequency
- Implement caching if possible

## Common Pitfalls

### 1. Field Mappings Must Be Source → Target

❌ **WRONG:**
```javascript
// maps/CompanyMap.js
module.exports = {
  name: 'companyName',  // BACKWARDS!
};
```

✅ **CORRECT:**
```javascript
// maps/CompanyMap.js
module.exports = {
  companyName: 'name',  // Prolibu field → HubSpot property
};
```

### 2. Properties Parameter Format

❌ **WRONG:**
```javascript
params.properties = select.split(',').map(f => f.trim());  // Array
```

✅ **CORRECT:**
```javascript
params.properties = select;  // Comma-separated string
```

### 3. Associations in UPDATE

❌ **WRONG:**
```javascript
await hubspotApi.update('deals', id, {
  amount: '100',
  associations: { contacts: ['123'] }  // Will cause error!
});
```

✅ **CORRECT:**
```javascript
// Associations are automatically filtered in update()
await hubspotApi.update('deals', id, {
  amount: '100'
  // No associations in update
});
```

### 4. Non-Existent Properties

HubSpot **silently ignores** properties that don't exist in your portal schema:
- ❌ `currency` - Doesn't exist in standard schema
- ❌ `timezone` - Doesn't exist in standard schema
- ❌ `hs_lead_source` - May not exist in deals
- ❌ `description` - May not exist in deals (depends on portal)

**Always verify property names** in HubSpot documentation before adding to maps.

### 5. Watch Mode Caching

When developing with watch mode, Node.js caches `require()` imports. If you edit a map file:
- Commenting out code may not work
- **Solution:** Restart the watch process to clear cache

---

## Related Documentation

- [HubSpot API Documentation](https://developers.hubspot.com/docs/api/overview)
- [HubSpot CRM Objects](https://developers.hubspot.com/docs/api/crm/understanding-the-crm)
- [HubSpot Search API](https://developers.hubspot.com/docs/api/crm/search)
- [Outbound API Adapter Guide](../../../accounts/dev10.prolibu.com/hook-integrations/OUTBOUND_API_ADAPTER_GUIDE.md)
