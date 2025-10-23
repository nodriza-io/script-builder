# AI Providers - Agnostic AI Adapters

A unified interface for multiple AI service providers (DeepSeek, Anthropic, OpenAI). Write your code once and switch between providers without changing a single line.

## 🎯 Features

- **Provider Agnostic**: Same code works with DeepSeek, Anthropic (Claude), or OpenAI (GPT)
- **Unified Interface**: Consistent input/output across all providers
- **Easy Switching**: Change providers by modifying a single variable
- **Type Safety**: Standardized response format
- **Factory Pattern**: Simple instance creation
- **Extensible**: Easy to add new providers

## 📁 Structure

```
lib/vendors/ai/
├── BaseAIProvider.js           # Abstract base class
├── AIProviderFactory.js        # Factory for creating instances
├── README.md                   # This file
├── deepseek/
│   ├── DeepSeekProvider.js
│   └── README.md
├── anthropic/
│   ├── AnthropicProvider.js
│   └── README.md
└── openai/
    ├── OpenAIProvider.js
    └── README.md
```

## 🚀 Quick Start

### Using Factory (Recommended)

```javascript
const AIProviderFactory = require('../../../lib/vendors/ai/AIProviderFactory');

// Option 1: Create directly
const ai = AIProviderFactory.create('deepseek', { 
  apiKey: vars.deepseekApiKey 
});

// Option 2: Create from variables (automatic selection)
const ai = AIProviderFactory.createFromVars(vars);

// Use the same code for any provider
const result = await ai.complete({
  prompt: 'Explain quantum computing in simple terms',
  temperature: 0.7,
  maxTokens: 500
});

console.log(result.text);
console.log(`Provider: ${result.provider}, Tokens: ${result.usage.totalTokens}`);
```

### Using Provider Directly

```javascript
const DeepSeekProvider = require('../../../lib/vendors/ai/deepseek/DeepSeekProvider');
const ai = new DeepSeekProvider({ apiKey: vars.deepseekApiKey });

const result = await ai.complete({ prompt: 'Hello!' });
```

## 📋 Standard Interface

### Input Parameters (All Providers)

```javascript
{
  prompt: string,              // Required - The prompt text
  systemPrompt?: string,       // Optional - System context (default: "You are a helpful assistant")
  temperature?: number,        // Optional - 0-2, controls randomness (default: 1)
  maxTokens?: number,          // Optional - Maximum tokens to generate (default: 2000)
  model?: string              // Optional - Specific model (uses provider default if omitted)
}
```

### Output Format (All Providers)

```javascript
{
  success: true,
  text: string,                // Generated text
  usage: {
    promptTokens: number,      // Tokens in prompt
    completionTokens: number,  // Tokens in completion
    totalTokens: number        // Total tokens used
  },
  model: string,              // Actual model used
  provider: string            // Provider name ('deepseek', 'anthropic', 'openai')
}
```

## 🔧 Available Providers

| Provider | Alias | Default Model | Notes |
|----------|-------|---------------|-------|
| `deepseek` | - | `deepseek-chat` | Fast, cost-effective |
| `anthropic` | `claude` | `claude-3-5-sonnet-20241022` | Advanced reasoning |
| `openai` | `gpt` | `gpt-4o` | Industry standard |

## 💻 Usage Examples

### Example 1: Simple Completion

```javascript
const AIProviderFactory = require('../../../lib/vendors/ai/AIProviderFactory');

const ai = AIProviderFactory.create('anthropic', { 
  apiKey: vars.anthropicApiKey 
});

const result = await ai.complete({
  prompt: 'Write a haiku about programming',
  temperature: 0.8
});

console.log(result.text);
```

### Example 2: Data Summarization

```javascript
const ai = AIProviderFactory.create('deepseek', { 
  apiKey: vars.deepseekApiKey 
});

const data = {
  sales: [
    { user: 'Alice', deals: 25, revenue: 100000 },
    { user: 'Bob', deals: 18, revenue: 75000 }
  ]
};

const summary = await ai.summarize(data, {
  context: 'Q4 2024 sales performance',
  style: 'professional'
});

console.log(summary);
```

### Example 3: Switching Providers

```javascript
// variables.json
{
  "aiProvider": "openai",      // Change to "deepseek" or "anthropic"
  "deepseekApiKey": "sk-...",
  "anthropicApiKey": "sk-ant-...",
  "openaiApiKey": "sk-proj-..."
}

// Your code (no changes needed!)
const ai = AIProviderFactory.createFromVars(vars);
const result = await ai.complete({ prompt: 'Hello' });
```

### Example 4: Custom System Prompt

```javascript
const ai = AIProviderFactory.create('openai', { apiKey: vars.openaiApiKey });

const result = await ai.complete({
  prompt: 'Should we invest in this opportunity?',
  systemPrompt: 'You are a financial advisor with 20 years of experience. Provide conservative, risk-aware advice.',
  temperature: 0.3,
  maxTokens: 1000
});
```

## 🎨 Summarization Styles

All providers support three summarization styles:

- **friendly**: Conversational, easy to understand
- **professional**: Business-focused, key insights
- **technical**: Detailed, specific metrics

```javascript
const summary = await ai.summarize(data, {
  context: 'Monthly user activity report',
  style: 'professional'
});
```

## 🔑 Configuration

### Variables Setup

```json
{
  "aiProvider": "deepseek",           // or "anthropic", "openai"
  "deepseekApiKey": "sk-...",
  "anthropicApiKey": "sk-ant-...",
  "openaiApiKey": "sk-proj-..."
}
```

### Factory Methods

```javascript
// Get available providers
const providers = AIProviderFactory.getAvailableProviders();
console.log(providers); // ['deepseek', 'anthropic', 'openai']

// Get provider aliases
const aliases = AIProviderFactory.getProviderAliases();
console.log(aliases); // { claude: 'anthropic', gpt: 'openai' }
```

## ⚡ Performance Comparison

| Provider | Speed | Cost | Quality | Best For |
|----------|-------|------|---------|----------|
| DeepSeek | ⚡⚡⚡ | 💰 | ⭐⭐⭐ | High-volume, cost-sensitive |
| Anthropic | ⚡⚡ | 💰💰💰 | ⭐⭐⭐⭐⭐ | Complex reasoning, safety |
| OpenAI | ⚡⚡ | 💰💰 | ⭐⭐⭐⭐ | General purpose, reliable |

## 🚨 Error Handling

```javascript
try {
  const result = await ai.complete({ prompt: 'Hello' });
  console.log(result.text);
} catch (error) {
  console.error('AI Error:', error.message);
  // Error format: "{Provider} API Error (Status: 401): Invalid API key"
}
```

## 📚 Best Practices

1. **Use Factory Pattern**: Easier to switch providers
2. **Store Keys Securely**: Use variables, never hardcode
3. **Set Appropriate Temperature**:
   - 0-0.3: Deterministic, factual
   - 0.4-0.7: Balanced
   - 0.8-2.0: Creative, varied
4. **Monitor Token Usage**: Track costs via `result.usage`
5. **Handle Errors Gracefully**: Always wrap in try/catch
6. **Test Provider Switching**: Validate behavior across providers

## 🔄 Migration Guide

### From Old DeepSeekApi

```javascript
// OLD CODE
const DeepSeekApi = require('../../../lib/vendors/deepseek/DeepSeekApi');
const deepseek = new DeepSeekApi({ apiKey: vars.deepseekApiKey });
const result = await deepseek.complete({ prompt: 'Hello' });

// NEW CODE (backward compatible)
const DeepSeekProvider = require('../../../lib/vendors/ai/deepseek/DeepSeekProvider');
const ai = new DeepSeekProvider({ apiKey: vars.deepseekApiKey });
const result = await ai.complete({ prompt: 'Hello' });

// OR BETTER: Use Factory
const AIProviderFactory = require('../../../lib/vendors/ai/AIProviderFactory');
const ai = AIProviderFactory.create('deepseek', { apiKey: vars.deepseekApiKey });
const result = await ai.complete({ prompt: 'Hello' });
```

## 🛠️ Adding New Providers

To add a new provider (e.g., Google Gemini):

1. Create `lib/vendors/ai/gemini/GeminiProvider.js`
2. Extend `BaseAIProvider`
3. Implement required methods: `complete()`, `summarize()`, `getProviderName()`, `getDefaultModel()`
4. Add to `AIProviderFactory.js` providers map
5. Create provider-specific README

## 📖 Provider-Specific Documentation

- [DeepSeek Provider](./deepseek/README.md)
- [Anthropic Provider](./anthropic/README.md)
- [OpenAI Provider](./openai/README.md)

## 🔗 External Documentation

- [DeepSeek API Docs](https://platform.deepseek.com/docs)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [OpenAI API Docs](https://platform.openai.com/docs)

## 💡 Tips

- Start with DeepSeek for development (cost-effective)
- Use Anthropic for production critical tasks (high quality)
- OpenAI offers good balance of cost and quality
- Always test with multiple providers before production
- Monitor costs across providers to optimize spending
