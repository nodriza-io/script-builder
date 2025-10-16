# Event System Quick Reference

Quick lookup guide for the Prolibu Script Builder event system.

## Event Types at a Glance

| Event Type | Trigger | Auth | Common Use |
|------------|---------|------|------------|
| **ApiRun** | POST `/v2/script/run` | API Key | Manual operations, testing |
| **ScheduledTask** | Cron schedule | System | Periodic batch jobs |
| **EndpointRequest** | Custom HTTP endpoint | Optional | Webhooks, custom APIs |
| **Lifecycle Hooks** | Entity CRUD | System | Real-time sync |

## Lifecycle Hooks Quick Reference

```javascript
module.exports = {
  Handlers: {
    // BEFORE hooks - Can abort operation by throwing error
    beforeCreate: async (doc, { API, requestUser, logger }) => {},
    beforeUpdate: async (doc, beforeUpdateDoc, payload, { API, requestUser, logger }) => {},
    beforeDelete: async (doc, { API, requestUser, logger }) => {},
    
    // AFTER hooks - Cannot abort, operation already complete
    afterCreate: async (doc, { API, requestUser, logger }) => {},
    afterUpdate: async (doc, beforeUpdateDoc, payload, { API, requestUser, logger }) => {},
    afterDelete: async (doc, { API, requestUser, logger }) => {},
  },
  
  EntityConfig: [
    {
      objectName: 'Contact',
      externalObjectName: 'Contact',
      defaultEvents: ['afterCreate', 'afterUpdate', 'afterDelete'],
      globalTransforms: {},
      fieldsMap: {}
    }
  ]
};
```

## Common Parameters

### Available in All Scripts

```javascript
{
  API: {
    prolibu: ProlibuApi,      // Prolibu API client
    salesforce: SalesforceApi, // Salesforce API client (if configured)
    hubspot: HubSpotApi,      // HubSpot API client (if configured)
  },
  requestUser: Object,         // User who triggered (or null)
  logger: {
    info: Function,
    warn: Function,
    error: Function,
    debug: Function,
  },
  eventData: Object,           // Event-specific data
}
```

## Event Data by Type

### ApiRun
```javascript
eventData: {
  query: Object,    // URL query params
  body: Object,     // Request body
}
```

### ScheduledTask
```javascript
eventData: {
  scheduledAt: Date,
  periodicity: String,
  executionCount: Number,
  lastExecution: Date,
}
```

### EndpointRequest
```javascript
eventData: {
  endpoint: Object,      // Endpoint config
  authenticated: Boolean,
  headers: Object,
  query: Object,
  body: Object,
  params: Object,
  ip: String,
}
```

### Lifecycle Hooks
```javascript
eventData: {
  doc: Object,              // Current state
  beforeUpdateDoc: Object,  // Previous state (update only)
  payload: Object,          // Changed fields (update only)
  hookType: String,
  objectName: String,
}
```

## Cron Syntax Quick Reference

```
 ┌────────────── minute (0 - 59)
 │ ┌──────────── hour (0 - 23)
 │ │ ┌────────── day of month (1 - 31)
 │ │ │ ┌──────── month (1 - 12)
 │ │ │ │ ┌────── day of week (0 - 7)
 │ │ │ │ │
 * * * * *
```

| Schedule | Expression | Description |
|----------|------------|-------------|
| Every minute | `* * * * *` | Every minute |
| Every 5 minutes | `*/5 * * * *` | Every 5 minutes |
| Every hour | `0 * * * *` | At minute 0 |
| Daily at 2 AM | `0 2 * * *` | At 02:00 |
| Weekdays at 9 AM | `0 9 * * 1-5` | Mon-Fri at 09:00 |
| First of month | `0 0 1 * *` | At 00:00 on day 1 |

## API Methods Quick Reference

### Prolibu API

```javascript
// Find records
await API.prolibu.find('Contact', {
  filter: { status: 'active' },
  select: 'name email mobile',
  limit: 100,
  skip: 0,
  sort: { createdAt: -1 }
});

// Find one record
await API.prolibu.findOne('Contact', { email: 'john@example.com' });
await API.prolibu.findOne('Contact', contactId);  // By ID

// Count records
await API.prolibu.count('Contact', { filter: { status: 'active' } });

// Create record
await API.prolibu.create('Contact', {
  name: 'John Doe',
  email: 'john@example.com'
});

// Update record
await API.prolibu.update('Contact', contactId, {
  mobile: '+1234567890'
});

// Delete record (returns boolean)
const deleted = await API.prolibu.delete('Contact', contactId);
```

### Salesforce API

```javascript
// Find records
await API.salesforce.find('Contact', {
  filter: { Email: 'john@example.com' },
  select: 'Id FirstName LastName Email',
  limit: 100
});

// Find one record
await API.salesforce.findOne('Contact', { Email: 'john@example.com' });
await API.salesforce.findOne('Contact', salesforceId);  // By ID

// Create record
await API.salesforce.create('Contact', {
  FirstName: 'John',
  LastName: 'Doe',
  Email: 'john@example.com'
});

// Update record
await API.salesforce.update('Contact', salesforceId, {
  MobilePhone: '+1234567890'
});

// Upsert (create or update)
await API.salesforce.upsert('Contact', 
  { Email: 'john@example.com' },  // Match field
  { FirstName: 'John', LastName: 'Doe' }  // Data
);

// Delete record (returns boolean)
const deleted = await API.salesforce.delete('Contact', salesforceId);

// SOQL query
await API.salesforce.query(
  'SELECT Id, Name, Email FROM Contact WHERE Email = :email',
  { email: 'john@example.com' }
);
```

### HubSpot API

```javascript
// Find records
await API.hubspot.find('contacts', {
  filter: { email: 'john@example.com' },
  select: 'email firstname lastname phone',
  limit: 100
});

// Find one record
await API.hubspot.findOne('contacts', { email: 'john@example.com' });
await API.hubspot.findOne('contacts', hubspotId);  // By ID

// Create record
await API.hubspot.create('contacts', {
  email: 'john@example.com',
  firstname: 'John',
  lastname: 'Doe'
});

// Update record
await API.hubspot.update('contacts', hubspotId, {
  phone: '+1234567890'
});

// Upsert (create or update)
await API.hubspot.upsert('contacts',
  { email: 'john@example.com' },  // Match field
  { firstname: 'John', lastname: 'Doe' }  // Data
);

// Delete record (returns boolean)
const deleted = await API.hubspot.delete('contacts', hubspotId);
```

## HTTP Status Codes

### Success
- `200 OK` - Request successful
- `201 Created` - Resource created
- `204 No Content` - Successful, no response body

### Client Errors
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing/invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded

### Server Errors
- `500 Internal Server Error` - Script execution error
- `502 Bad Gateway` - External API error
- `503 Service Unavailable` - Service temporarily down

## Common Patterns

### Pattern: Basic CRUD Sync

```javascript
afterCreate: async (doc, { API, logger }) => {
  const mapped = DataMapper.mapWithConfig(doc, entityConfig, logger);
  const result = await API.salesforce.create('Contact', mapped);
  await API.prolibu.update('Contact', doc._id, { externalId: result.id });
},

afterUpdate: async (doc, beforeUpdateDoc, payload, { API, logger }) => {
  if (!doc.externalId) return;
  const mapped = DataMapper.mapWithConfig(payload, entityConfig, logger);
  await API.salesforce.update('Contact', doc.externalId, mapped);
},

afterDelete: async (doc, { API, logger }) => {
  if (!doc.externalId) return;
  await API.salesforce.delete('Contact', doc.externalId);
}
```

### Pattern: Validation in beforeHook

```javascript
beforeCreate: async (doc, { API, logger }) => {
  if (!doc.email) {
    throw new Error('Email is required');
  }
  
  const exists = await API.prolibu.findOne('Contact', { email: doc.email });
  if (exists) {
    throw new Error('Email already exists');
  }
  
  return doc;
}
```

### Pattern: Conditional Sync

```javascript
afterUpdate: async (doc, beforeUpdateDoc, payload, { API, logger }) => {
  const syncFields = ['name', 'email', 'mobile'];
  const shouldSync = Object.keys(payload).some(key => syncFields.includes(key));
  
  if (!shouldSync) {
    logger.debug('No syncable fields changed');
    return;
  }
  
  // Perform sync...
}
```

### Pattern: Error Handling in afterHook

```javascript
afterCreate: async (doc, { API, logger }) => {
  try {
    await API.salesforce.create('Contact', mappedData);
    logger.info('Synced successfully');
  } catch (error) {
    logger.error('Sync failed', error);
    // Don't throw - log and optionally queue for retry
    await API.prolibu.create('SyncQueue', {
      contactId: doc._id,
      error: error.message,
      retryCount: 0
    });
  }
}
```

### Pattern: Prevent Infinite Loops

```javascript
afterUpdate: async (doc, beforeUpdateDoc, payload, { API, logger }) => {
  // Skip if update came from sync
  if (payload._skipHooks) return;
  
  // Sync to external system
  await API.salesforce.update('Contact', doc.externalId, mappedData);
  
  // Update with skip flag
  await API.prolibu.update('Contact', doc._id, {
    lastSyncedAt: new Date(),
    _skipHooks: true
  });
}
```

### Pattern: Batch Processing

```javascript
module.exports = async ({ API, logger }) => {
  const BATCH_SIZE = 100;
  let offset = 0;
  
  while (true) {
    const batch = await API.prolibu.find('Contact', {
      filter: { status: 'pending' },
      limit: BATCH_SIZE,
      skip: offset
    });
    
    if (batch.length === 0) break;
    
    await Promise.all(batch.map(record => processRecord(record)));
    offset += BATCH_SIZE;
    
    logger.info(`Processed ${offset} records`);
  }
}
```

## Testing Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test -- accounts/dev10.prolibu.com/hook-integrations/test/outbound-salesforce.test.js

# Run with coverage
npm test -- --coverage

# Watch mode for development
npm test -- --watch
```

## Environment Variables

```bash
# API Configuration
PROLIBU_API_URL=https://api.prolibu.com
PROLIBU_API_KEY=your_api_key

# Salesforce
SALESFORCE_CLIENT_ID=your_client_id
SALESFORCE_CLIENT_SECRET=your_client_secret
SALESFORCE_USERNAME=your_username
SALESFORCE_PASSWORD=your_password

# HubSpot
HUBSPOT_API_KEY=your_api_key
HUBSPOT_CLIENT_ID=your_client_id
HUBSPOT_CLIENT_SECRET=your_client_secret

# Security
WEBHOOK_SECRET=your_webhook_secret
```

## Useful Links

- **[Full Documentation](../README.md)** - Complete event system guide
- **[ApiRun Events](./events/01-api-run.md)** - Manual execution
- **[ScheduledTask Events](./events/02-scheduled-task.md)** - Cron jobs
- **[EndpointRequest Events](./events/03-endpoint-request.md)** - Custom endpoints
- **[Lifecycle Hooks](./events/04-lifecycle-hooks.md)** - Real-time sync

---

**Quick Reference** | [Main Documentation](../README.md)
