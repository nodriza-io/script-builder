/**
 * Contact Map: Prolibu Contact → HubSpot Contact
 * 
 * Maps Prolibu Contact fields to HubSpot Contact properties
 * 
 * @see https://developers.hubspot.com/docs/api/crm/contacts
 */

module.exports = {
  // Basic Contact Information
  firstname: 'firstName',                 // First name
  lastname: 'lastName',                   // Last name
  email: 'email',                         // Email address
  
  // Phone Numbers
  phone: 'phone',                         // Primary phone
  mobilephone: 'mobile',                  // Mobile phone
  
  // Job Information
  jobtitle: 'jobTitle',                   // Job title
  
  // Address Fields
  address: 'address.street',              // Street address
  city: 'address.city',                   // City
  state: 'address.state',                 // State/Province
  zip: 'address.postalCode',              // Postal/ZIP code
  country: 'address.country',             // Country
  
  // Company Association
  // Note: Use associatedcompanyid for linking to a HubSpot company
  // This should be set via transform function to get the company's refId
  
  // Additional Contact Information
  website: 'website',                     // Personal website
  
  // Social Media (if available in Prolibu)
  // linkedinbio: 'socialMedia.linkedin',
  // twitterhandle: 'socialMedia.twitter',
  
  // Lifecycle
  lifecyclestage: 'lifecycleStage',       // Lifecycle stage
  
  // Lead Information
  hs_lead_status: 'status',               // Lead status
};
