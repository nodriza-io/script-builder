/**
 * Data mapping between Prolibu Contact and Salesforce Contact
 * 
 * reverse: false (default) → Prolibu Contact → Salesforce Contact
 * reverse: true → Salesforce Contact → Prolibu Contact
 */

const Countries = require('../dictionaries/Countries');
const States = {
  US: require('../dictionaries/StateUS'),
};

module.exports = {
  // Basic mappings: prolibuField → salesforceField
  firstName: 'FirstName',
  lastName: 'LastName',
  email: 'Email',
  jobTitle: 'Title',
  mobile: 'MobilePhone',
  assignee: 'OwnerId',

  // Nested address mappings
  'address.street': 'MailingStreet',
  'address.city': 'MailingCity',
  'address.state': 'MailingState',
  'address.postalCode': 'MailingPostalCode',
  'address.country': 'MailingCountry',
  'address.location.lat': 'MailingLatitude',
  'address.location.long': 'MailingLongitude',
  
  // Transformations
  transforms: {
    // FORWARD TRANSFORMS (Prolibu → Salesforce)
    
    // Transform for MailingStreet - combines street + neighborhood
    MailingStreet: (value, sourceData) => {
      if (!value) return value;
      
      // Combine street + neighborhood if exists
      const neighborhood = sourceData?.address?.neighborhood;
      if (neighborhood) {
        return `${value}, ${neighborhood}`;
      }
      
      return value;
    },
    
    // Transform for MailingCountry - normalize country codes using Countries dictionary
    MailingCountry: (value, sourceData) => {
      if (!value) return undefined;
      
      // Convert to uppercase for consistent lookup
      const upperValue = value.toString().toUpperCase();
      
      // Use Countries dictionary to normalize country codes
      // Return undefined if not found in dictionary to avoid Salesforce errors
      return Countries[upperValue] || undefined;
    },
    
    // Transform for MailingState - dynamic state handling based on country code
    MailingState: (value, sourceData) => {
      if (!value) return undefined; // No state value, unset the field
      
      // Get the country code from source data (already in international format)
      const countryCode = sourceData?.address?.country?.toUpperCase();
      if (!countryCode) return undefined; // No country, unset state
      
      // Check if we have a states dictionary for this country
      if (States[countryCode]) {
        // Use the states dictionary to normalize the state
        const upperState = value.toString().toUpperCase();
        // Return undefined if state not found in dictionary
        return States[countryCode][upperState] || undefined;
      }
      
      // No states dictionary for this country, unset the field to avoid Salesforce error
      return undefined;
    },

    // Transform for coordinates
    MailingLatitude: (value) => {
      if (!value || isNaN(value)) return null;
      return parseFloat(value);
    },
    
    MailingLongitude: (value) => {
      if (!value || isNaN(value)) return null;
      return parseFloat(value);
    },
    
    // REVERSE TRANSFORMS (Salesforce → Prolibu)
    
    // Reverse transform for address.street - extract street from combined value
    'address.street': (value) => {
      if (!value) return value;
      
      // If value contains comma, extract only the street part
      const commaIndex = value.indexOf(',');
      if (commaIndex > 0) {
        return value.substring(0, commaIndex).trim();
      }
      
      return value;
    },
    
    // Reverse transform for address.country - convert full country name back to code
    'address.country': (value) => {
      if (!value) return undefined;
      
      // Find country code by searching for the value in Countries dictionary
      for (const [code, countryName] of Object.entries(Countries)) {
        if (countryName === value) {
          // Return the first matching code (prefer shorter codes)
          return code;
        }
      }
      
      // Return undefined if not found in dictionary
      return undefined;
    },
    
    // Reverse transform for address.state - convert full state name back to code
    'address.state': (value, sourceData) => {
      if (!value) return undefined;
      
      // Get the country to determine which states dictionary to use
      const country = sourceData?.MailingCountry;
      if (!country) return undefined;
      
      // Map country name back to country code
      let countryCode = null;
      for (const [code, countryName] of Object.entries(Countries)) {
        if (countryName === country) {
          countryCode = code;
          break;
        }
      }
      
      if (countryCode && States[countryCode]) {
        // Find state code by searching for the value in States dictionary
        for (const [code, stateName] of Object.entries(States[countryCode])) {
          if (stateName === value) {
            return code; // Return the state code
          }
        }
      }
      
      // Return undefined if not found in dictionary
      return undefined;
    }
  }
};
