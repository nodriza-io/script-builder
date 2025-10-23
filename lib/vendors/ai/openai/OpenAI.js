/**
 * OpenAI Provider (GPT)
 * Adapter for OpenAI API following the BaseAIProvider interface
 */

/* global axios */

const BaseAIProvider = require('../BaseAIProvider');

class OpenAI extends BaseAIProvider {
  constructor({ apiKey }) {
    super({ apiKey });
    this.baseURL = 'https://api.openai.com/v1';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  getProviderName() {
    return 'openai';
  }

  getDefaultModel() {
    return 'gpt-4o';
  }

  /**
   * Generate text completion
   * @param {Object} params - Completion parameters
   * @returns {Promise<Object>} Standardized response
   */
  async complete(params) {
    const normalized = this._normalizeParams(params);

    try {
      const response = await this.client.post('/chat/completions', {
        model: normalized.model,
        messages: [
          { role: 'system', content: normalized.systemPrompt },
          { role: 'user', content: normalized.prompt }
        ],
        temperature: normalized.temperature,
        max_tokens: normalized.maxTokens,
      });

      return this._createResponse(
        response.data.choices[0].message.content,
        {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens
        },
        response.data.model
      );
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * Summarize data in a friendly format
   * @param {Object} data - Data to summarize
   * @param {Object} options - Summarization options
   * @returns {Promise<string>} Summary text
   */
  async summarize(data, options = {}) {
    const { 
      context = '', 
      style = 'friendly' 
    } = options;

    const stylePrompts = {
      friendly: 'Create a friendly, conversational summary that is easy to understand.',
      professional: 'Create a professional business summary with key insights.',
      technical: 'Create a detailed technical summary with specific metrics.',
    };

    const systemPrompt = `You are an expert at analyzing data and creating clear, ${style} summaries. ${stylePrompts[style]}`;
    const dataString = JSON.stringify(data, null, 2);
    const prompt = `${context ? `Context: ${context}\n\n` : ''}Please analyze the following data and provide a ${style} summary:\n\n${dataString}`;

    const result = await this.complete({
      prompt,
      systemPrompt,
      temperature: 0.7,
      maxTokens: 2000,
    });

    return result.text;
  }
}

module.exports = OpenAI;
