/**
 * Base AI Provider - Abstract class for AI service providers
 * All AI providers (DeepSeek, Anthropic, OpenAI) extend this class
 */

/* global axios */

class BaseAIProvider {
  constructor({ apiKey }) {
    if (!apiKey) {
      throw new Error(`${this.getProviderName()} API key is required`);
    }
    this.apiKey = apiKey;
  }

  /**
   * Abstract methods - Must be implemented by subclasses
   */
  async complete(params) {
    throw new Error('complete() must be implemented by subclass');
  }

  async summarize(data, options) {
    throw new Error('summarize() must be implemented by subclass');
  }

  getProviderName() {
    throw new Error('getProviderName() must be implemented by subclass');
  }

  getDefaultModel() {
    throw new Error('getDefaultModel() must be implemented by subclass');
  }

  /**
   * Normalize and validate input parameters
   * @param {Object} params - Input parameters
   * @returns {Object} Normalized parameters
   */
  _normalizeParams(params) {
    const {
      prompt,
      systemPrompt = 'You are a helpful assistant.',
      temperature = 1,
      maxTokens = 2000,
      model = this.getDefaultModel()
    } = params;

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    // Validate temperature range
    if (temperature < 0 || temperature > 2) {
      throw new Error('Temperature must be between 0 and 2');
    }

    return { prompt, systemPrompt, temperature, maxTokens, model };
  }

  /**
   * Create standardized response object
   * @param {string} text - Generated text
   * @param {Object} usage - Token usage information
   * @param {string} model - Model used
   * @returns {Object} Standardized response
   */
  _createResponse(text, usage, model) {
    return {
      success: true,
      text,
      usage: {
        promptTokens: usage.promptTokens || 0,
        completionTokens: usage.completionTokens || 0,
        totalTokens: usage.totalTokens || 0
      },
      model,
      provider: this.getProviderName()
    };
  }

  /**
   * Handle API errors in a standardized way
   * @param {Error} error - Original error
   * @throws {Error} Formatted error
   */
  _handleError(error) {
    const errorMessage = this._extractErrorMessage(error);
    const statusCode = error.response?.status;
    const errorInfo = statusCode ? ` (Status: ${statusCode})` : '';
    throw new Error(`${this.getProviderName()} API Error${errorInfo}: ${errorMessage}`);
  }

  /**
   * Extract error message from various error formats
   * @param {Error} error - Original error
   * @returns {string} Extracted error message
   */
  _extractErrorMessage(error) {
    return error.response?.data?.error?.message 
        || error.response?.data?.message
        || error.response?.data?.error
        || error.message
        || 'Unknown error';
  }
}

module.exports = BaseAIProvider;
