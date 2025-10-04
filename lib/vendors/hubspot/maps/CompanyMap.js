/**
 * Company Map: Prolibu Company → HubSpot Company
 * 
 * Maps Prolibu Company fields to HubSpot Company properties
 * 
 * @see https://developers.hubspot.com/docs/api/crm/companies
 */

module.exports = {
  // Basic Company Information
  name: 'companyName',                    // Company name
  domain: 'website',                      // Company website domain
  
  // Contact Information
  phone: 'primaryPhone',                  // Primary phone number
  
  // Address Fields
  address: 'address.street',              // Street address
  city: 'address.city',                   // City
  state: 'address.state',                 // State/Province
  zip: 'address.postalCode',              // Postal/ZIP code
  country: 'address.country',             // Country
  
  // Business Information
  industry: 'industry',                   // Industry
  type: 'companyType',                    // Company type
  description: 'description',             // Company description
  
  // Financial Information
  annualrevenue: 'revenue',               // Annual revenue
  numberofemployees: 'employees',         // Number of employees
  
  // Additional Fields
  timezone: 'locale.timezone',            // Timezone
  currency: 'locale.currency',            // Currency code
  
  // Identification
  // Note: HubSpot doesn't have built-in tax ID fields
  // Consider using custom properties for:
  // - identification.docType
  // - identification.docId
};
