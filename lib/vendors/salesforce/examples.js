/**
 * Salesforce Integration Example
 * 
 * This file demonstrates how to use the SalesforceApi adapter
 * for integrating Prolibu with Salesforce CRM using OAuth2
 */

const SalesforceApi = require('./SalesforceApi');
const ProlibuApi = require('../prolibu/ProlibuApi');
const DataMapper = require('../prolibu/DataMapper');

// Example: Initialize APIs
async function initializeApis() {
  const salesforceApi = new SalesforceApi({
    instanceUrl: process.env.SALESFORCE_INSTANCE_URL,
    customerKey: process.env.SALESFORCE_CONSUMER_KEY,
    customerSecret: process.env.SALESFORCE_CONSUMER_SECRET,
    apiVersion: '58.0'
  });
  
  const prolibuApi = new ProlibuApi({
    apiKey: process.env.PROLIBU_API_KEY
  });
  
  // Authenticate with Salesforce (handles token caching & refresh automatically)
  await salesforceApi.authenticate();
  
  return { salesforceApi, prolibuApi };
}

// Example 1: Create Contact in Salesforce
async function createContact() {
  const { salesforceApi, prolibuApi } = await initializeApis();
  
  // Create contact in Salesforce
  const sfContact = await salesforceApi.create('Contact', {
    FirstName: 'John',
    LastName: 'Doe',
    Email: 'john.doe@example.com',
    Phone: '+1-555-0123',
    Title: 'Software Engineer'
  });
  
  console.log('Created Salesforce contact:', sfContact);
  // { Id: '003XXX...', FirstName: 'John', LastName: 'Doe', Email: '...', CreatedDate: '...', ... }
  
  // Store reference in Prolibu
  const refData = salesforceApi.getRefData('Contact', sfContact.Id);
  await prolibuApi.update('Contact', prolibuContactId, refData);
  
  return sfContact;
}

// Example 2: Sync Account from Prolibu to Salesforce
async function syncAccount(prolibuCompanyId) {
  const { salesforceApi, prolibuApi } = await initializeApis();
  
  // Get company from Prolibu
  const prolibuCompany = await prolibuApi.findOne('Company', prolibuCompanyId);
  
  // Map Prolibu fields to Salesforce fields
  const AccountMap = require('./maps/AccountMap');
  const mappedData = await DataMapper.mapWithConfig({
    data: prolibuCompany,
    config: { map: AccountMap }
  });
  
  // Create account in Salesforce
  const sfAccount = await salesforceApi.create('Account', mappedData);
  
  // Store reference back in Prolibu
  const refData = salesforceApi.getRefData('Account', sfAccount.Id);
  await prolibuApi.update('Company', prolibuCompanyId, refData);
  
  return sfAccount;
}

// Example 3: Find Contacts with Filtering
async function findContacts() {
  const { salesforceApi } = await initializeApis();
  
  // Object-based query
  const result = await salesforceApi.find('Contact', {
    select: 'Id FirstName LastName Email Phone Title',  // Prolibu style: spaces
    where: {
      LastName: 'Smith',
      Email: { $exists: true }
    },
    limit: 25,
    page: 1,
    sort: '-CreatedDate'  // Sort by creation date descending
  });
  
  console.log(`Found ${result.pagination.count} contacts`);
  console.log(`Showing page ${result.pagination.page} of ${result.pagination.lastPage}`);
  
  result.data.forEach(contact => {
    console.log(`- ${contact.FirstName} ${contact.LastName} (${contact.Email})`);
  });
  
  return result;
}

// Example 4: String-based SOQL Query
async function findContactsWithSOQL() {
  const { salesforceApi } = await initializeApis();
  
  // Direct SOQL query
  const result = await salesforceApi.find(
    'Contact',
    "SELECT Id, FirstName, LastName, Email FROM Contact WHERE Email LIKE '%@acme.com' AND CreatedDate = LAST_N_DAYS:30 ORDER BY CreatedDate DESC LIMIT 50"
  );
  
  console.log(`Found ${result.data.length} recent Acme contacts`);
  return result;
}

// Example 5: Update Contact
async function updateContact(contactId) {
  const { salesforceApi } = await initializeApis();
  
  const updated = await salesforceApi.update('Contact', contactId, {
    Phone: '+1-555-9876',
    MailingCity: 'San Francisco',
    Title: 'Senior Software Engineer'
  });
  
  console.log('Updated contact:', updated);
  return updated;
}

// Example 6: Find Single Contact
async function getContact(contactId) {
  const { salesforceApi } = await initializeApis();
  
  const contact = await salesforceApi.findOne('Contact', contactId, {
    select: 'Id FirstName LastName Email Phone'  // Prolibu style: spaces
  });
  
  if (!contact) {
    console.log('Contact not found');
    return null;
  }
  
  console.log('Found contact:', contact);
  return contact;
}

// Example 7: Delete Contact
async function deleteContact(contactId) {
  const { salesforceApi } = await initializeApis();
  
  const result = await salesforceApi.delete('Contact', contactId);
  console.log('Deleted:', result.success); // true
  
  return result;
}

// Example 8: Bidirectional Sync with afterCreate Handler
async function setupBidirectionalSync() {
  const { salesforceApi, prolibuApi } = await initializeApis();
  
  // When contact created in Prolibu
  const prolibuContact = await prolibuApi.create('Contact', {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com'
  });
  
  // Map and create in Salesforce
  const ContactMap = require('./maps/ContactMap');
  const mappedData = await DataMapper.mapWithConfig({
    data: prolibuContact,
    config: { map: ContactMap }
  });
  
  const sfContact = await salesforceApi.create('Contact', mappedData);
  
  // Store reference
  const refData = salesforceApi.getRefData('Contact', sfContact.Id);
  await prolibuApi.update('Contact', prolibuContact._id, refData);
  
  console.log('Bidirectional sync complete');
  return { prolibuContact, sfContact };
}

// Example 9: Complex Query with Operators
async function findOpportunities() {
  const { salesforceApi } = await initializeApis();
  
  const result = await salesforceApi.find('Opportunity', {
    select: 'Id Name Amount StageName CloseDate',  // Prolibu style: spaces
    where: {
      Amount: { $gt: 10000 },           // Amount > 10000
      StageName: { $ne: 'Closed Lost' }, // Not Closed Lost
      CloseDate: { $gte: '2024-01-01' }  // Close date >= 2024-01-01
    },
    sort: '-Amount',  // Highest amount first
    limit: 50
  });
  
  console.log(`Found ${result.pagination.count} opportunities`);
  result.data.forEach(opp => {
    console.log(`- ${opp.Name}: $${opp.Amount} (${opp.StageName})`);
  });
  
  return result;
}

// Example 10: Error Handling
async function handleErrors() {
  const { salesforceApi } = await initializeApis();
  
  try {
    // This will fail - duplicate email
    await salesforceApi.create('Contact', {
      FirstName: 'Test',
      LastName: 'User',
      Email: 'existing@example.com'
    });
  } catch (error) {
    if (error.message.includes('DUPLICATE_VALUE')) {
      console.error('Contact with this email already exists');
    } else if (error.message.includes('REQUIRED_FIELD_MISSING')) {
      console.error('Missing required field');
    } else {
      console.error('Salesforce error:', error.message);
    }
  }
  
  // Find one - returns null if not found (no error)
  const contact = await salesforceApi.findOne('Contact', 'invalid-id');
  if (!contact) {
    console.log('Contact not found - handled gracefully');
  }
}

// Example 11: Pagination
async function paginateContacts() {
  const { salesforceApi } = await initializeApis();
  
  const pageSize = 100;
  let currentPage = 1;
  let hasMore = true;
  
  while (hasMore) {
    const result = await salesforceApi.find('Contact', {
      select: 'Id FirstName LastName Email',  // Prolibu style: spaces
      limit: pageSize,
      page: currentPage
    });
    
    console.log(`Processing page ${currentPage} of ${result.pagination.lastPage}`);
    
    // Process contacts
    result.data.forEach(contact => {
      console.log(`- ${contact.FirstName} ${contact.LastName}`);
    });
    
    // Check if there are more pages
    hasMore = currentPage < result.pagination.lastPage;
    currentPage++;
  }
}

// Export examples
module.exports = {
  initializeApis,
  createContact,
  syncAccount,
  findContacts,
  findContactsWithSOQL,
  updateContact,
  getContact,
  deleteContact,
  setupBidirectionalSync,
  findOpportunities,
  handleErrors,
  paginateContacts
};

// Run example if executed directly
if (require.main === module) {
  (async () => {
    try {
      console.log('=== Salesforce API Examples ===\n');
      
      // Run one or more examples
      await findContacts();
      
    } catch (error) {
      console.error('Error running example:', error);
    }
  })();
}
