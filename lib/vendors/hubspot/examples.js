/**
 * HubSpot Integration Example
 * 
 * This file demonstrates how to use the HubSpotApi adapter
 * for integrating Prolibu with HubSpot CRM using OAuth2
 */

const HubSpotApi = require('./HubSpotApi');
const ProlibuApi = require('../prolibu/ProlibuApi');
const DataMapper = require('../prolibu/DataMapper');

// Example: Initialize APIs
async function initializeApis() {
  const hubspotApi = new HubSpotApi({
    accessToken: process.env.HUBSPOT_ACCESS_TOKEN,
    clientSecret: process.env.HUBSPOT_CLIENT_SECRET
  });
  
  const prolibuApi = new ProlibuApi({
    apiKey: process.env.PROLIBU_API_KEY
  });
  
  // Authenticate with HubSpot (handles token caching & refresh automatically)
  await hubspotApi.authenticate();
  
  return { hubspotApi, prolibuApi };
}

// Example 1: Create Contact in HubSpot
async function createContact() {
  const { hubspotApi, prolibuApi } = await initializeApis();
  
  // Create contact in HubSpot
  const hubspotContact = await hubspotApi.create('contacts', {
    firstname: 'John',
    lastname: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    jobtitle: 'Software Engineer'
  });
  
  console.log('Created HubSpot contact:', hubspotContact);
  // { id: '12345', firstname: 'John', lastname: 'Doe', email: '...', createdate: '...', ... }
  
  // Store reference in Prolibu
  const refData = hubspotApi.getRefData('contacts', hubspotContact.id);
  await prolibuApi.update('Contact', prolibuContactId, refData);
  
  return hubspotContact;
}

// Example 2: Sync Company from Prolibu to HubSpot
async function syncCompany(prolibuCompanyId) {
  const { hubspotApi, prolibuApi } = await initializeApis();
  
  // Get company from Prolibu
  const prolibuCompany = await prolibuApi.findOne('Company', prolibuCompanyId);
  
  // Map Prolibu fields to HubSpot fields
  const CompanyMap = require('./maps/CompanyMap');
  const mappedData = await DataMapper.mapWithConfig({
    data: prolibuCompany,
    config: { map: CompanyMap }
  });
  
  // Create company in HubSpot
  const hubspotCompany = await hubspotApi.create('companies', mappedData);
  
  // Store reference back in Prolibu
  const refData = hubspotApi.getRefData('companies', hubspotCompany.id);
  await prolibuApi.update('Company', prolibuCompanyId, refData);
  
  return hubspotCompany;
}

// Example 3: Find Contacts with Filtering
async function findContacts() {
  const { hubspotApi } = await initializeApis();
  
  const result = await hubspotApi.find('contacts', {
    select: 'firstname, lastname, email, phone, jobtitle',
    lastname: 'Smith',
    email: { $exists: true },
    limit: 25,
    page: 1,
    sort: '-createdate'  // Sort by creation date descending
  });
  
  console.log(`Found ${result.pagination.count} contacts`);
  console.log(`Showing page ${result.pagination.page} of ${result.pagination.lastPage}`);
  
  result.data.forEach(contact => {
    console.log(`- ${contact.firstname} ${contact.lastname} (${contact.email})`);
  });
  
  return result;
}

// Example 4: Update Contact
async function updateContact(contactId) {
  const { hubspotApi } = await initializeApis();
  
  const updated = await hubspotApi.update('contacts', contactId, {
    phone: '+1-555-9876',
    city: 'San Francisco',
    jobtitle: 'Senior Software Engineer'
  });
  
  console.log('Updated contact:', updated);
  return updated;
}

// Example 5: Handle Deal with Company and Contact Associations
async function createDeal(prolibuDealId) {
  const { hubspotApi, prolibuApi } = await initializeApis();
  
  // Get deal from Prolibu with populated relationships
  const prolibuDeal = await prolibuApi.findOne('Deal', prolibuDealId, {
    select: 'dealName closeDate proposal.quote.total contact company',
    populatePath: [
      { path: 'contact', select: 'refId' },
      { path: 'company', select: 'refId' }
    ]
  });
  
  // Map deal data
  const DealMap = require('./maps/DealMap');
  const mappedData = await DataMapper.mapWithConfig({
    data: prolibuDeal,
    config: { map: DealMap }
  });
  
  // Add associations
  if (prolibuDeal.contact?.refId) {
    mappedData.associations = {
      contacts: [prolibuDeal.contact.refId]
    };
  }
  
  if (prolibuDeal.company?.refId) {
    mappedData.associations = {
      ...mappedData.associations,
      companies: [prolibuDeal.company.refId]
    };
  }
  
  // Create deal in HubSpot
  const hubspotDeal = await hubspotApi.create('deals', mappedData);
  
  // Store reference
  const refData = hubspotApi.getRefData('deals', hubspotDeal.id);
  await prolibuApi.update('Deal', prolibuDealId, refData);
  
  return hubspotDeal;
}

// Example 6: Error Handling
async function robustContactCreation(contactData) {
  const { hubspotApi } = await initializeApis();
  
  try {
    const contact = await hubspotApi.create('contacts', contactData);
    console.log('Successfully created contact:', contact.id);
    return contact;
  } catch (error) {
    if (error.message.includes('Status: 400')) {
      console.error('Validation error - invalid contact data:', error.message);
      // Handle validation error
    } else if (error.message.includes('Status: 409')) {
      console.error('Contact already exists with this email');
      // Try to find existing contact
      const existing = await hubspotApi.find('contacts', {
        email: contactData.email,
        limit: 1
      });
      return existing.data[0];
    } else if (error.message.includes('Status: 429')) {
      console.error('Rate limit exceeded - will retry automatically');
      throw error; // Will be retried by executeWithRetry
    } else {
      console.error('Unexpected error:', error.message);
      throw error;
    }
  }
}

// Example 7: Bulk Operations with Pagination
async function getAllCompanies() {
  const { hubspotApi } = await initializeApis();
  
  let allCompanies = [];
  let currentPage = 1;
  let hasMore = true;
  
  while (hasMore) {
    const result = await hubspotApi.find('companies', {
      select: 'name, domain, industry, city',
      limit: 100,
      page: currentPage
    });
    
    allCompanies = allCompanies.concat(result.data);
    
    console.log(`Fetched page ${currentPage}/${result.pagination.lastPage}`);
    
    hasMore = currentPage < result.pagination.lastPage;
    currentPage++;
  }
  
  console.log(`Total companies fetched: ${allCompanies.length}`);
  return allCompanies;
}

// Example 8: Complex Filtering
async function findQualifiedDeals() {
  const { hubspotApi } = await initializeApis();
  
  const deals = await hubspotApi.find('deals', {
    select: 'dealname, amount, dealstage, closedate',
    amount: { $gt: 10000 },                    // Amount > $10,000
    dealstage: { $ne: 'closedlost' },          // Not closed lost
    closedate: { $exists: true },              // Has close date
    limit: 50,
    sort: '-amount'                            // Sort by amount descending
  });
  
  console.log(`Found ${deals.pagination.count} qualified deals`);
  
  deals.data.forEach(deal => {
    console.log(`- ${deal.dealname}: $${deal.amount} (${deal.dealstage})`);
  });
  
  return deals;
}

// Export examples
module.exports = {
  initializeApis,
  createContact,
  syncCompany,
  findContacts,
  updateContact,
  createDeal,
  robustContactCreation,
  getAllCompanies,
  findQualifiedDeals
};

// If running directly
if (require.main === module) {
  (async () => {
    try {
      // Run example
      await findContacts();
    } catch (error) {
      console.error('Error running example:', error);
    }
  })();
}
