# Salesforce API Integration

Professional Salesforce REST API client with smart token management, automatic retry logic, and comprehensive CRUD operations.

## Features

- ✅ **Smart Token Caching** - Automatic token refresh before expiration
- ✅ **Auto-Retry on Token Errors** - Seamless recovery from session expiration  
- ✅ **Flexible Query Syntax** - Object-based or string-based WHERE clauses
- ✅ **Environment Aware** - Works in both server and local/test environments
- ✅ **Comprehensive Error Handling** - Salesforce-specific error messages
- ✅ **Full CRUD Operations** - Create, Read, Update, Delete
- ✅ **404 Graceful Handling** - `findOne()` returns `null` instead of throwing
- ✅ **JSDoc Documentation** - Complete inline documentation

---

## Installation

\`\`\`javascript
const SalesforceApi = require('./lib/vendors/salesforce/SalesforceApi');
\`\`\`

---

## Quick Start

### Initialization

\`\`\`javascript
const salesforceApi = new SalesforceApi({
  instanceUrl: 'your-instance.my.salesforce.com',
  customerKey: 'YOUR_CONSUMER_KEY',
  customerSecret: 'YOUR_CONSUMER_SECRET',
  apiVersion: '58.0', // Optional, defaults to 58.0
});

// Authenticate (automatic token management)
await salesforceApi.authenticate();
\`\`\`

For complete documentation including:
- API Reference (create, find, findOne, update, delete)
- Authentication methods
- Advanced features
- Common patterns
- Best practices
- Troubleshooting

Please refer to the inline JSDoc documentation in SalesforceApi.js or check the examples in your project.

---

## Key Features

### Smart Token Management
Tokens are automatically cached and refreshed 5 minutes before expiration. No manual token management needed.

### Flexible WHERE Clauses
\`\`\`javascript
// Object format (simple)
where: { Email: 'test@example.com', IsActive: true }

// String format (complex)
where: "Email LIKE '%@acme.com' AND CreatedDate = LAST_N_DAYS:30"
\`\`\`

### Graceful 404 Handling
\`\`\`javascript
const contact = await salesforceApi.findOne('Contact', id);
if (contact === null) {
  console.log('Not found');
}
\`\`\`

---

## Setup Guide

### Creating a Connected App

1. Setup → App Manager → New Connected App
2. Enable OAuth Settings
3. Enable Client Credentials Flow
4. Copy Consumer Key and Consumer Secret
5. Configure OAuth Policies

See inline documentation for detailed setup instructions.

---

## License

Internal use - Prolibu Integration Framework
