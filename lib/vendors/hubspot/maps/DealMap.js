/**
 * Deal Map: Prolibu Deal → HubSpot Deal
 * 
 * Maps Prolibu Deal fields to HubSpot Deal properties
 * 
 * @see https://developers.hubspot.com/docs/api/crm/deals
 */

module.exports = {
  // Basic Deal Information
  dealName: 'dealname',                   // Deal name/title
  'proposal.quote.total': 'amount',       // Deal amount
  
  // Deal Stage & Pipeline
  stage: 'dealstage',                     // Deal stage (requires transform to HubSpot stage ID)
  pipeline: 'pipeline',                   // Pipeline (default or custom)
  
  // Dates
  closeDate: 'closedate',                 // Expected close date (YYYY-MM-DD or timestamp)
  
  // Currency
  'proposal.quote.quoteCurrency': 'deal_currency_code', // Currency code (e.g., 'USD', 'COP')
  
  // Description
  'proposal.title': 'description',        // Deal description
  
  // Priority
  priority: 'hs_priority',                // Deal priority (LOW, MEDIUM, HIGH)
  
  // Associations
  // Note: Use associations for linking to contacts and companies
  // associatedvids: [contactId1, contactId2] - Contact IDs
  // associatedcompanyids: [companyId] - Company ID
  
  // Additional Deal Information
  // dealType: 'dealtype',                // Deal type
  // forecastAmount: 'hs_forecast_amount', // Forecast amount
  // probability: 'hs_forecast_probability', // Win probability
  
  // Custom Fields (examples)
  // analyticsSource: 'hs_analytics_source',
  // campaign: 'hs_analytics_source_data_1',
  // medium: 'hs_analytics_source_data_2',
};
