/**
 * AI Provider Factory
 * Creates instances of AI providers in a provider-agnostic way
 * Uses lazy loading - only imports the provider when needed
 */

class AIProviderFactory {
  /**
   * Create an AI provider instance
   * @param {string} provider - Provider name ('deepseek', 'anthropic', 'openai')
   * @param {Object} config - Configuration object with apiKey
   * @returns {BaseAIProvider} Provider instance
   * @example
   * const ai = AIProviderFactory.create('deepseek', { apiKey: 'sk-...' });
   * const result = await ai.complete({ prompt: 'Hello' });
   */
  static create(provider, config) {
    // Lazy loading - only require the provider we need
    const providerMap = {
      'deepseek': './deepseek/DeepSeekProvider',
      'anthropic': './anthropic/AnthropicProvider',
      'claude': './anthropic/AnthropicProvider',        // Alias for Anthropic
      'openai': './openai/OpenAIProvider',
      'gpt': './openai/OpenAIProvider',                 // Alias for OpenAI
    };

    const providerPath = providerMap[provider.toLowerCase()];
    
    if (!providerPath) {
      const available = this.getAvailableProviders().join(', ');
      throw new Error(`Unknown AI provider: "${provider}". Available providers: ${available}`);
    }

    // Lazy load: only require when needed
    const ProviderClass = require(providerPath);
    return new ProviderClass(config);
  }

  /**
   * Get list of available providers
   * @returns {string[]} Array of provider names
   */
  static getAvailableProviders() {
    return ['deepseek', 'anthropic', 'openai'];
  }

  /**
   * Create provider from variables object
   * Automatically selects provider and API key from variables
   * @param {Object} vars - Variables object containing aiProvider and API keys
   * @param {string} defaultProvider - Default provider if not specified (default: 'deepseek')
   * @returns {BaseAIProvider} Provider instance
   * @example
   * const vars = {
   *   aiProvider: 'anthropic',
   *   anthropicApiKey: 'sk-ant-...'
   * };
   * const ai = AIProviderFactory.createFromVars(vars);
   */
  static createFromVars(vars, defaultProvider = 'deepseek') {
    const provider = vars.aiProvider || defaultProvider;
    const apiKeyName = `${provider}ApiKey`;
    const apiKey = vars[apiKeyName];
    
    if (!apiKey) {
      throw new Error(
        `API key not found for provider "${provider}". ` +
        `Expected variable: "${apiKeyName}". ` +
        `Available providers: ${this.getAvailableProviders().join(', ')}`
      );
    }

    return this.create(provider, { apiKey });
  }

  /**
   * Get provider aliases mapping
   * @returns {Object} Mapping of aliases to canonical provider names
   */
  static getProviderAliases() {
    return {
      'claude': 'anthropic',
      'gpt': 'openai'
    };
  }
}

module.exports = AIProviderFactory;
