/**
 * DeepSeek API - Backward Compatibility Wrapper
 * 
 * This file maintains backward compatibility with existing code.
 * New code should use the AI provider adapters in lib/vendors/ai/
 * 
 * @deprecated Use lib/vendors/ai/deepseek/DeepSeek.js instead
 */

const DeepSeek = require('../ai/deepseek/DeepSeek');

// Export the new provider with the old name for backward compatibility
module.exports = DeepSeek;
