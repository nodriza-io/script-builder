/**
 * Company Map: Prolibu Company → HubSpot Company
 * 
 * Maps Prolibu Company fields to HubSpot Company properties
 * 
 * @see https://developers.hubspot.com/docs/api/crm/companies
 */

module.exports = {
  // Basic Company Information
  companyName: 'name',                    // Company name
  website: 'domain',                      // Company website domain
  
  // Contact Information
  primaryPhone: 'phone',                  // Primary phone number
  
  // Address Fields (nested Prolibu fields → flat HubSpot properties)
  'address.street': 'address',            // Street address
  'address.city': 'city',                 // City
  'address.state': 'state',               // State/Province
  'address.postalCode': 'zip',            // Postal/ZIP code
  'address.country': 'country',           // Country
  
  // Business Information
  industry: 'industry',                   // Industry
  companyType: 'type',                    // Company type
  description: 'description',             // Company description
  
  // Financial Information
  revenue: 'annualrevenue',               // Annual revenue
  employees: 'numberofemployees',         // Number of employees
  
  // Identification
  // Note: HubSpot doesn't have built-in tax ID fields
  // Consider using custom properties for:
  // - identification.docType
  // - identification.docId
};
