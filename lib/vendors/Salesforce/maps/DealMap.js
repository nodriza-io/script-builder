/**
 * Data mapping between Prolibu Deal and Salesforce Opportunity
 * 
 * reverse: false (default) → Prolibu Deal → Salesforce Opportunity
 * reverse: true → Salesforce Opportunity → Prolibu Deal
 */

module.exports = {
  // Basic mappings: prolibuField → salesforceField
  dealName: 'Name',
  closeDate: 'CloseDate',
  assignee: 'OwnerId',
  contact: 'ContactId',
  company: 'AccountId',
  stage: 'StageName',
  source: 'LeadSource',
  
  // Additional mappings
  // 'proposal.title': 'Description',
  
  /*
  transforms: {
    // FORWARD TRANSFORMS (Prolibu → Salesforce)
    
    // Transform for StageName - convert Stage ObjectId to Stage name
    StageName: async (value, sourceData, DataMapper) => {
      if (!value) return undefined;
      
      // If value is already a string (stage name), return it
      if (typeof value === 'string') return value;
      
      // If it's an ObjectId, we need to resolve it to stage name
      // This would require a lookup to the Stage collection
      // For now, return a default stage or the value as string
      return value.toString();
    },
    
    // Transform for Amount - extract from proposal.quote if available
    Amount: (value, sourceData) => {
      // If there's a direct amount field, use it
      if (value) return parseFloat(value);
      
      // Try to extract from proposal quote
      const quote = sourceData?.proposal?.quote;
      if (quote?.total) {
        return parseFloat(quote.total);
      }
      
      // Try to extract from proposal quote subtotal
      if (quote?.subtotal) {
        return parseFloat(quote.subtotal);
      }
      
      return null;
    },
    
    // Transform for Probability - calculate based on stage or set default
    Probability: (value, sourceData) => {
      if (value) return parseFloat(value);
      
      // Set default probability based on stage or other logic
      const stageName = sourceData?.stage;
      if (stageName) {
        // You could map stages to probabilities here
        // For now, return a default
        return 50;
      }
      
      return 10; // Default low probability
    },
    
    // Transform for Type - map from deal type or set default
    Type: (value, sourceData) => {
      if (value) return value;
      
      // Set default opportunity type
      return 'New Customer';
    },
    
    // Transform for CloseDate - ensure proper date format
    CloseDate: (value) => {
      if (!value) return null;
      
      // Convert to ISO date string for Salesforce
      const date = new Date(value);
      if (isNaN(date.getTime())) return null;
      
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    },
    
    // Transform for Description - combine proposal title and other info
    Description: (value, sourceData) => {
      const parts = [];
      
      // Add proposal title if exists
      if (value) {
        parts.push(value);
      }
      
      // Add deal source if available
      if (sourceData?.source) {
        parts.push(`Source: ${sourceData.source}`);
      }
      
      // Add any tags if available
      if (sourceData?.tags && Array.isArray(sourceData.tags)) {
        const tagNames = sourceData.tags.map(tag => 
          typeof tag === 'string' ? tag : tag.name || tag.toString()
        ).filter(Boolean);
        
        if (tagNames.length > 0) {
          parts.push(`Tags: ${tagNames.join(', ')}`);
        }
      }
      
      return parts.length > 0 ? parts.join('\n\n') : null;
    },
    
    // REVERSE TRANSFORMS (Salesforce → Prolibu)
    
    // Reverse transform for dealName
    dealName: (value) => {
      return value || null;
    },
    
    // Reverse transform for closeDate
    closeDate: (value) => {
      if (!value) return null;
      
      const date = new Date(value);
      if (isNaN(date.getTime())) return null;
      
      return date;
    },
    
    // Reverse transform for proposal.title from Description
    'proposal.title': (value) => {
      if (!value) return null;
      
      // Extract the first line/part of the description as proposal title
      const lines = value.split('\n\n');
      if (lines.length > 0 && !lines[0].startsWith('Source:') && !lines[0].startsWith('Tags:')) {
        return lines[0];
      }
      
      return null;
    }
  }

  */
};