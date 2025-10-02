/**
 * Handle Salesforce-specific axios errors
 * Salesforce API returns errors in format: [{"message": "...", "errorCode": "...", "fields": [...]}]
 * @param {Error} err - The axios error object
 * @throws {Error} - Throws an error with a meaningful message
 */
function handleSalesforceError(err) {
  if (err.response) {
    const { status, data } = err.response;
    
    // Salesforce returns errors as an array
    if (Array.isArray(data) && data.length > 0) {
      const errorDetails = data[0];
      let message = errorDetails.message || 'Salesforce API Error';
      
      // Add error code if available
      if (errorDetails.errorCode) {
        message += ` (${errorDetails.errorCode})`;
      }
      
      // Add field information if available
      if (errorDetails.fields && errorDetails.fields.length > 0) {
        message += ` - Fields: ${errorDetails.fields.join(', ')}`;
      }
      
      const error = new Error(message);
      error.status = status;
      error.salesforceError = errorDetails;
      throw error;
    }
    
    // If it's not the expected format, try to extract any message
    if (data && typeof data === 'object') {
      const message = data.message || data.error || `HTTP ${status} Error`;
      const error = new Error(message);
      error.status = status;
      throw error;
    }
    
    // Fallback for unexpected formats
    const error = new Error(`HTTP ${status}: ${err.message}`);
    error.status = status;
    throw error;
  }
  
  // Network or other errors
  throw new Error(err.message || 'Network Error');
}

module.exports = {
  handleSalesforceError
};