# Salesforce REST API Client

REST client to interact with Salesforce API using the same pattern as the Prolibu client.

## Installation

```javascript
const SalesforceRestApi = require('./lib/vendors/Salesforce/SalesforceRestApi');
```

## Configuration

The client uses **External Client App** credentials for automatic authentication.

### Required Parameters

#### 1. Instance URL (`instanceUrl`)
Your Salesforce organization's URL:
- **Production**: `https://mycompany.salesforce.com`
- **Sandbox**: `https://mycompany--sandbox.sandbox.my.salesforce.com`
- **My Domain**: `https://mycompany.my.salesforce.com`

#### 2. Consumer Key & Consumer Secret
From your Salesforce External Client App (see setup below).

```javascript
const salesforce = new SalesforceRestApi({
  instanceUrl: 'https://myorg.salesforce.com',
  consumerKey: 'your_consumer_key_here',
  consumerSecret: 'your_consumer_secret_here',
  sandbox: false // true for sandbox environments
});
```

## Available Methods

### Basic CRUD Operations

#### Create a record
```javascript
const account = await salesforce.create('Account', {
  Name: 'New Company',
  Industry: 'Technology'
});
console.log('Created ID:', account.id);
```

## 🎯 Prolibu Compatibility

This client maintains **100% compatibility** with Prolibu's interface while adding Salesforce-specific features:

```javascript
// ✅ Same code works for both Prolibu and Salesforce
const contact = await restApi.findOne('Contact', contactId, {
  select: 'FirstName LastName Company'
});

const contacts = await restApi.find('Contact', {
  select: 'FirstName LastName Email',
  where: "Company = 'Acme Corp'",
  limit: 10
});
```

#### Get a record by ID
```javascript
const account = await salesforce.findOne('Account', '0011234567890ABC');

// With specific fields (Prolibu-compatible format)
const account = await salesforce.findOne('Account', '0011234567890ABC', {
  select: 'Id Name Industry'
});

// Or with array format
const account = await salesforce.findOne('Account', '0011234567890ABC', {
  select: ['Id', 'Name', 'Industry']
});
```

#### Search records with SOQL
```javascript
// Simple search (Prolibu-compatible format)
const accounts = await salesforce.find('Account', {
  select: 'Id Name Industry',
  where: "Industry = 'Technology'",
  orderBy: 'Name ASC',
  limit: 10
});

// Also supports Salesforce-native format
const accounts = await salesforce.find('Account', {
  fields: ['Id', 'Name', 'Industry'],
  where: "Industry = 'Technology'",
  orderBy: 'Name ASC',
  limit: 10
});

// Direct SOQL query (more flexible)
const contacts = await salesforce.query("SELECT Id, Name, Email FROM Contact WHERE Account.Name = 'Acme Corp'");
```

#### Update a record
```javascript
const result = await salesforce.update('Account', '0011234567890ABC', {
  Name: 'Updated Company',
  Industry: 'Finance'
});
```

#### Delete a record
```javascript
const result = await salesforce.delete('Account', '0011234567890ABC');
```

### SOSL Search

```javascript
// Simple search
const results = await salesforce.search('Acme');

// Search in specific objects
const results = await salesforce.search('John Smith', {
  sobjectTypes: [
    { type: 'Contact', fields: ['Id', 'Name', 'Email'] },
    { type: 'Lead', fields: ['Id', 'Name', 'Company'] }
  ],
  limit: 20
});
```

### Advanced Operations

#### Upsert (create or update)
```javascript
// Using external field as identifier
const result = await salesforce.upsert('Account', 'External_Id__c', 'EXT123', {
  Name: 'Upsert Company',
  Industry: 'Technology'
});
```

#### Bulk operations
```javascript
// Create multiple records
const results = await salesforce.bulkCreate('Contact', [
  { FirstName: 'John', LastName: 'Doe', Email: 'john@example.com' },
  { FirstName: 'Jane', LastName: 'Smith', Email: 'jane@example.com' }
]);

// Update multiple records
const results = await salesforce.bulkUpdate('Contact', [
  { Id: '0031234567890ABC', Email: 'newemail1@example.com' },
  { Id: '0031234567890DEF', Email: 'newemail2@example.com' }
]);
```

#### Metadata

```javascript
// Describe an object
const metadata = await salesforce.describe('Account');
console.log('Available fields:', metadata.fields.map(f => f.name));

// List all objects
const sobjects = await salesforce.listSobjects();
console.log('Available objects:', sobjects.sobjects.map(obj => obj.name));
```

## Error Handling

The client uses the same error handling system as the Prolibu client:

```javascript
try {
  const account = await salesforce.findOne('Account', 'NONEXISTENT_ID');
} catch (error) {
  console.error('Error:', error.message);
  // Error will contain Salesforce-specific details if available
}
```

## Authentication Methods

### Prerequisites: Create a Connected App
1. Go to **Setup** → **App Manager** → **New Connected App**
2. Fill required fields:
   - **Connected App Name**: Your app name
   - **API Name**: Auto-generated
   - **Contact Email**: Your email
3. **API (Enable OAuth Settings)**:
   - ✅ Enable OAuth Settings
   - **Callback URL**: `https://localhost` (or your callback)
   - **Selected OAuth Scopes**: Add "Full access (full)" or specific scopes

### Method 1: Username-Password Flow (Server-to-Server)
**Best for**: Backend services, scripts, automation

```javascript
const axios = require('axios');

async function getAccessTokenPassword() {
  try {
    const response = await axios.post('https://login.salesforce.com/services/oauth2/token', null, {
      params: {
        grant_type: 'password',
        client_id: 'YOUR_CONSUMER_KEY',           // From Connected App
        client_secret: 'YOUR_CONSUMER_SECRET',    // From Connected App  
        username: 'your_username@company.com',
        password: 'your_password' + 'security_token'  // Password + Security Token
      }
    });
    
    return {
      accessToken: response.data.access_token,
      instanceUrl: response.data.instance_url,
      tokenType: response.data.token_type
    };
  } catch (error) {
    console.error('Authentication failed:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
const auth = await getAccessTokenPassword();
const salesforce = new SalesforceRestApi({
  instanceUrl: auth.instanceUrl,
  accessToken: auth.accessToken
});
```

### Method 2: Web Server Flow (Interactive)
**Best for**: Web applications with user login

```javascript
// Step 1: Redirect user to Salesforce login
const authUrl = 'https://login.salesforce.com/services/oauth2/authorize' +
  '?response_type=code' +
  '&client_id=YOUR_CONSUMER_KEY' +
  '&redirect_uri=https://yourapp.com/callback' +
  '&scope=full';

// Step 2: Exchange code for token (in your callback handler)
async function exchangeCodeForToken(authCode) {
  const response = await axios.post('https://login.salesforce.com/services/oauth2/token', null, {
    params: {
      grant_type: 'authorization_code',
      client_id: 'YOUR_CONSUMER_KEY',
      client_secret: 'YOUR_CONSUMER_SECRET',
      redirect_uri: 'https://yourapp.com/callback',
      code: authCode
    }
  });
  
  return response.data;
}
```

### Method 3: JWT Bearer Flow (Certificate-based)
**Best for**: Server applications with certificates

```javascript
const jwt = require('jsonwebtoken');
const fs = require('fs');

async function getAccessTokenJWT() {
  const privateKey = fs.readFileSync('path/to/private.key');
  
  const payload = {
    iss: 'YOUR_CONSUMER_KEY',
    sub: 'username@company.com',
    aud: 'https://login.salesforce.com',
    exp: Math.floor(Date.now() / 1000) + (3 * 60) // 3 minutes
  };
  
  const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
  
  const response = await axios.post('https://login.salesforce.com/services/oauth2/token', null, {
    params: {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: token
    }
  });
  
  return response.data;
}
```

### Getting Your Security Token
If using Username-Password flow:
1. Go to **Personal Settings** → **Reset My Security Token**
2. Click **Reset Security Token**
3. Check your email for the new security token
4. Append it to your password: `'mypassword' + 'securitytoken'`

### Sandbox vs Production
```javascript
// Production
const loginUrl = 'https://login.salesforce.com';

// Sandbox
const loginUrl = 'https://test.salesforce.com';
```

## Complete Examples

### Account and Contact Management
```javascript
const SalesforceRestApi = require('./lib/vendors/Salesforce/SalesforceRestApi');

async function manageAccountsAndContacts() {
  const salesforce = new SalesforceRestApi({
    instanceUrl: 'https://myorg.salesforce.com',
    accessToken: process.env.SALESFORCE_ACCESS_TOKEN
  });

  try {
    // Create an account
    const account = await salesforce.create('Account', {
      Name: 'Demo Company',
      Industry: 'Technology',
      Type: 'Customer'
    });

    // Create contacts for that account
    const contacts = await salesforce.bulkCreate('Contact', [
      {
        FirstName: 'John',
        LastName: 'Smith',
        Email: 'john.smith@demo-company.com',
        AccountId: account.id
      },
      {
        FirstName: 'Jane',
        LastName: 'Doe',
        Email: 'jane.doe@demo-company.com',
        AccountId: account.id
      }
    ]);

    // Find contacts for the account
    const accountContacts = await salesforce.query(`
      SELECT Id, Name, Email 
      FROM Contact 
      WHERE AccountId = '${account.id}'
    `);

    console.log('Account created:', account);
    console.log('Contacts created:', contacts);
    console.log('Account contacts:', accountContacts.records);

  } catch (error) {
    console.error('Management error:', error.message);
  }
}
```

### Data Synchronization
```javascript
async function synchronizeData() {
  const salesforce = new SalesforceRestApi({
    instanceUrl: process.env.SALESFORCE_INSTANCE_URL,
    accessToken: process.env.SALESFORCE_ACCESS_TOKEN
  });

  try {
    // Get recently modified records
    const recentAccounts = await salesforce.query(`
      SELECT Id, Name, Industry, LastModifiedDate 
      FROM Account 
      WHERE LastModifiedDate >= YESTERDAY
    `);

    console.log(`${recentAccounts.totalSize} recently modified accounts`);

    // Process each account
    for (const account of recentAccounts.records) {
      console.log(`Processing: ${account.Name} (modified: ${account.LastModifiedDate})`);
      
      // Here you could sync with another system
      // await syncWithExternalSystem(account);
    }

  } catch (error) {
    console.error('Synchronization error:', error.message);
  }
}
```

### Using with Environment Variables
```javascript
// .env file
SALESFORCE_INSTANCE_URL=https://mycompany.salesforce.com
SALESFORCE_ACCESS_TOKEN=your_token_here
SALESFORCE_CLIENT_ID=your_consumer_key
SALESFORCE_CLIENT_SECRET=your_consumer_secret
SALESFORCE_USERNAME=user@company.com
SALESFORCE_PASSWORD=password
SALESFORCE_SECURITY_TOKEN=security_token

// usage.js
require('dotenv').config();

async function initSalesforce() {
  // Option 1: Use existing token
  if (process.env.SALESFORCE_ACCESS_TOKEN) {
    return new SalesforceRestApi({
      instanceUrl: process.env.SALESFORCE_INSTANCE_URL,
      accessToken: process.env.SALESFORCE_ACCESS_TOKEN
    });
  }
  
  // Option 2: Authenticate with username/password
  const auth = await getAccessTokenPassword();
  return new SalesforceRestApi({
    instanceUrl: auth.instanceUrl,
    accessToken: auth.accessToken
  });
}
```