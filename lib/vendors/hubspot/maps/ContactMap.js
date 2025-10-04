/**
 * Contact Map: Prolibu Contact → HubSpot Contact
 * 
 * Maps Prolibu Contact fields to HubSpot Contact properties
 * 
 * @see https://developers.hubspot.com/docs/api/crm/contacts
 */

module.exports = {
  // Basic Contact Information
  firstName: 'firstname',                 // First name
  lastName: 'lastname',                   // Last name
  email: 'email',                         // Email address
  
  // Phone Numbers
  phone: 'phone',                         // Primary phone
  mobile: 'mobilephone',                  // Mobile phone
  
  // Job Information
  jobTitle: 'jobtitle',                   // Job title
  
  // Address Fields (nested Prolibu fields → flat HubSpot properties)
  'address.street': 'address',            // Street address
  'address.city': 'city',                 // City
  'address.state': 'state',               // State/Province
  'address.postalCode': 'zip',            // Postal/ZIP code
  'address.country': 'country',           // Country
  
  // Company Association
  // Note: Use associatedcompanyid for linking to a HubSpot company
  // This should be set via transform function to get the company's refId
  
  // Additional Contact Information
  website: 'website',                     // Personal website
  
  // Social Media (if available in Prolibu)
  // linkedinbio: 'socialMedia.linkedin',
  // twitterhandle: 'socialMedia.twitter',
  
  // Lifecycle
  lifecycleStage: 'lifecyclestage',       // Lifecycle stage
  
  // Lead Information
  status: 'hs_lead_status',               // Lead status
};
