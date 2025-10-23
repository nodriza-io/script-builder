# OpenAI Provider (GPT)

OpenAI provider adapter for the unified AI interface featuring GPT models.

> **Note**: This is part of the AI provider adapters system. See [main AI README](../README.md) for the unified interface documentation.

## Features

- Industry-standard GPT-4 and GPT-3.5 models
- Reliable, well-documented API
- Strong general-purpose capabilities
- Unified interface compatible with other providers

## Setup

1. Get your API key from [OpenAI Platform](https://platform.openai.com/)
2. Add the API key to your Prolibu variables as `openaiApiKey`

## Usage

### Using Factory (Recommended)

```javascript
const AIProviderFactory = require('../../../../lib/vendors/ai/AIProviderFactory');

// Using 'openai'
const ai = AIProviderFactory.create('openai', { 
  apiKey: vars.openaiApiKey 
});

// Or using alias 'gpt'
const ai = AIProviderFactory.create('gpt', { 
  apiKey: vars.openaiApiKey 
});
```

### Direct Usage

```javascript
const OpenAIProvider = require('../../../../lib/vendors/ai/openai/OpenAIProvider');

const ai = new OpenAIProvider({ 
  apiKey: vars.openaiApiKey
});
```

## Standard Interface

All methods follow the unified AI provider interface. See [main documentation](../README.md) for details.

### complete(params)

```javascript
const result = await ai.complete({
  prompt: 'Write a product description for a smart home device',
  systemPrompt: 'You are an expert copywriter specializing in tech products.',
  temperature: 0.8,
  maxTokens: 500
});

console.log(result.text);
console.log(`Model: ${result.model}, Tokens: ${result.usage.totalTokens}`);
```

### summarize(data, options)

```javascript
const data = {
  feedback: [
    { user: 'Alice', rating: 5, comment: 'Great product!' },
    { user: 'Bob', rating: 3, comment: 'Good but expensive' }
  ]
};

const summary = await ai.summarize(data, {
  context: 'Customer feedback analysis',
  style: 'professional'
});

console.log(summary);
```

## Available Models

- `gpt-4o` (default): Latest GPT-4 Optimized, best balance
- `gpt-4-turbo`: Fast GPT-4 variant
- `gpt-4`: Original GPT-4, most capable
- `gpt-3.5-turbo`: Fast and cost-effective

```javascript
// Use GPT-4 for complex tasks
const result = await ai.complete({
  prompt: 'Complex analysis task',
  model: 'gpt-4'
});

// Use GPT-3.5-turbo for simple tasks
const quickResult = await ai.complete({
  prompt: 'Simple question',
  model: 'gpt-3.5-turbo'
});
```

## Response Format

```javascript
{
  success: true,
  text: "Generated text...",
  usage: {
    promptTokens: 12,
    completionTokens: 85,
    totalTokens: 97
  },
  model: "gpt-4o",
  provider: "openai"
}
```

## Error Handling

```javascript
try {
  const result = await ai.complete({ prompt: 'Hello' });
  console.log(result.text);
} catch (error) {
  console.error('Error:', error.message);
  // Format: "openai API Error (Status: 401): Invalid API key"
}
```

## Best Practices

1. **Model Selection**: 
   - GPT-4o: Best for most use cases
   - GPT-4: When you need maximum capability
   - GPT-3.5-turbo: High-volume, cost-sensitive tasks
2. **Temperature Control**: 
   - 0-0.3: Factual, deterministic
   - 0.4-0.7: Balanced (recommended)
   - 0.8-2.0: Creative writing
3. **Token Management**: Monitor usage for cost control
4. **Prompt Engineering**: Clear, specific prompts yield best results
5. **Rate Limits**: Be aware of tier-based rate limits

## Examples

### Example 1: Content Generation

```javascript
const AIProviderFactory = require('../../../../lib/vendors/ai/AIProviderFactory');
const ai = AIProviderFactory.create('gpt', { apiKey: vars.openaiApiKey });

const result = await ai.complete({
  prompt: 'Write a professional email declining a meeting request politely',
  systemPrompt: 'You are a professional communications expert.',
  temperature: 0.7,
  maxTokens: 300
});

console.log(result.text);
```

### Example 2: Data Analysis

```javascript
const ai = AIProviderFactory.create('openai', { apiKey: vars.openaiApiKey });

const salesData = {
  jan: 50000,
  feb: 52000,
  mar: 48000,
  apr: 55000
};

const analysis = await ai.complete({
  prompt: `Analyze these monthly sales: ${JSON.stringify(salesData)}. Identify trends and provide recommendations.`,
  systemPrompt: 'You are a business analyst.',
  temperature: 0.5,
  maxTokens: 1000
});

console.log(analysis.text);
```

### Example 3: Cost Optimization

```javascript
// Fast and cheap for simple tasks
const summary = await ai.complete({
  prompt: 'Summarize: [short content]',
  model: 'gpt-3.5-turbo',
  temperature: 0.3,
  maxTokens: 100
});

// More capable for complex tasks
const analysis = await ai.complete({
  prompt: 'Complex multi-step analysis',
  model: 'gpt-4o',
  temperature: 0.6,
  maxTokens: 2000
});
```

### Example 4: Structured Data Summary

```javascript
const ai = AIProviderFactory.create('openai', { apiKey: vars.openaiApiKey });

const userActivity = {
  today: [{ name: 'John', deals: 5 }, { name: 'Jane', deals: 8 }],
  thisWeek: [{ name: 'John', deals: 25 }, { name: 'Jane', deals: 32 }]
};

const summary = await ai.summarize(userActivity, {
  context: 'User activity metrics for sales team',
  style: 'professional'
});

console.log(summary);
```

## Switching to Other Providers

```javascript
// Switch to DeepSeek
const ai = AIProviderFactory.create('deepseek', { apiKey: vars.deepseekApiKey });

// Or Anthropic
const ai = AIProviderFactory.create('anthropic', { apiKey: vars.anthropicApiKey });

// Same code works!
const result = await ai.complete({ prompt: 'Hello' });
```

## Troubleshooting

**Error: "openai API key is required"**
- Make sure you've added the `openaiApiKey` variable in Prolibu

**Error: "Invalid API key"**
- Verify your API key at [OpenAI Platform](https://platform.openai.com/)
- Check key is active and has credits

**Error: "Rate limit exceeded"**
- You've hit your rate limit
- Check your tier limits and usage
- Consider upgrading tier

**Error: "Insufficient quota"**
- Your account has run out of credits
- Add billing information or purchase credits

**Error: "Model not found"**
- Verify model name is correct
- Check you have access to that model

## Performance & Pricing

- **Speed**: Fast and reliable (⚡⚡)
- **Cost**: Mid-range, varies by model (💰💰)
- **Quality**: Excellent, industry standard (⭐⭐⭐⭐)
- **Best For**: General-purpose, production-ready applications

## Model Comparison

| Model | Speed | Cost | Quality | Best Use Case |
|-------|-------|------|---------|---------------|
| gpt-4o | ⚡⚡⚡ | 💰💰 | ⭐⭐⭐⭐ | General purpose (recommended) |
| gpt-4-turbo | ⚡⚡ | 💰💰💰 | ⭐⭐⭐⭐⭐ | Complex tasks |
| gpt-4 | ⚡ | 💰💰💰💰 | ⭐⭐⭐⭐⭐ | Maximum capability |
| gpt-3.5-turbo | ⚡⚡⚡ | 💰 | ⭐⭐⭐ | High volume, simple tasks |

## Key Features

- **Reliability**: Industry-proven, stable API
- **Ecosystem**: Extensive community and resources
- **Versatility**: Strong across many task types
- **Documentation**: Comprehensive official docs
- **Support**: Active community and official support

## Rate Limits by Tier

OpenAI uses tier-based rate limits. Check your tier at [OpenAI Platform](https://platform.openai.com/settings/organization/limits).

## Related Documentation

- [Main AI Providers Documentation](../README.md)
- [DeepSeek Provider](../deepseek/README.md)
- [Anthropic Provider](../anthropic/README.md)
- [OpenAI Official API Docs](https://platform.openai.com/docs)
- [OpenAI Models Overview](https://platform.openai.com/docs/models)
- [OpenAI Pricing](https://openai.com/pricing)
