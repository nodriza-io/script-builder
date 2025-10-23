/**
 * DeepSeek API - AI-Powered Text Generation
 */

/* global axios */

class DeepSeekApi {
  constructor({ apiKey }) {
    if (!apiKey) {
      throw new Error('DeepSeek API key is required');
    }

    this.apiKey = apiKey;
    this.baseURL = 'https://api.deepseek.com/v1';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Generate text completion using DeepSeek AI
   * @param {Object} params - Generation parameters
   * @param {string} params.prompt - The prompt to send to the model
   * @param {string} params.model - Model to use (default: 'deepseek-chat')
   * @param {number} params.temperature - Randomness (0-2, default: 1)
   * @param {number} params.maxTokens - Maximum tokens to generate (default: 2000)
   * @param {string} params.systemPrompt - Optional system prompt
   * @returns {Promise<Object>} Response with generated text
   */
  async complete(params) {
    const { 
      prompt, 
      model = 'deepseek-chat',
      temperature = 1,
      maxTokens = 2000,
      systemPrompt = 'You are a helpful assistant.'
    } = params;

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    try {
      const response = await this.client.post('/chat/completions', {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      });

      return {
        success: true,
        text: response.data.choices[0].message.content,
        usage: response.data.usage,
        model: response.data.model,
      };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      throw new Error(`DeepSeek API Error: ${errorMessage}`);
    }
  }

  /**
   * Summarize data in a friendly format
   * @param {Object} data - Data to summarize
   * @param {Object} options - Summarization options
   * @param {string} options.context - Additional context for the summary
   * @param {string} options.style - Summary style ('friendly', 'professional', 'technical')
   * @returns {Promise<string>} Friendly summary
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

module.exports = DeepSeekApi;
