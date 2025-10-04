/**
 * Deal Map: Prolibu Deal → HubSpot Deal
 * 
 * Maps Prolibu Deal fields to HubSpot Deal properties
 * 
 * @see https://developers.hubspot.com/docs/api/crm/deals
 */

module.exports = {
  // Basic Deal Information
  dealname: 'dealName',                   // Deal name/title
  amount: 'proposal.quote.total',         // Deal amount
  
  // Deal Stage & Pipeline
  dealstage: 'stage',                     // Deal stage (requires transform to HubSpot stage ID)
  pipeline: 'pipeline',                   // Pipeline (default or custom)
  
  // Dates
  closedate: 'closeDate',                 // Expected close date (YYYY-MM-DD or timestamp)
  
  // Deal Source
  hs_lead_source: 'source',               // Lead source
  
  // Currency
  deal_currency_code: 'proposal.quote.quoteCurrency', // Currency code (e.g., 'USD', 'COP')
  
  // Description
  description: 'proposal.title',          // Deal description
  
  // Priority
  hs_priority: 'priority',                // Deal priority (LOW, MEDIUM, HIGH)
  
  // Associations
  // Note: Use associations for linking to contacts and companies
  // associatedvids: [contactId1, contactId2] - Contact IDs
  // associatedcompanyids: [companyId] - Company ID
  
  // Additional Deal Information
  // dealtype: 'dealType',                // Deal type
  // hs_forecast_amount: 'forecastAmount', // Forecast amount
  // hs_forecast_probability: 'probability', // Win probability
  
  // Custom Fields (examples)
  // hs_analytics_source: 'analyticsSource',
  // hs_analytics_source_data_1: 'campaign',
  // hs_analytics_source_data_2: 'medium',
};
