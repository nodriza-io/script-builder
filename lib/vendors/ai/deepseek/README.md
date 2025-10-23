# DeepSeek Provider

DeepSeek AI provider adapter for the unified AI interface.

> **Note**: This is part of the AI provider adapters system. See [main AI README](../README.md) for the unified interface documentation.

## Features

- Fast and cost-effective AI completions
- Text summarization with customizable styles
- Unified interface compatible with other providers
- Simple promise-based API

## Installation

The DeepSeekProvider uses the global `axios` instance available in Prolibu scripts, so no additional dependencies are required.

## Setup

1. Get your API key from [DeepSeek Platform](https://platform.deepseek.com/)
2. Add the API key to your Prolibu variables as `deepseekApiKey`

## Usage

### Using Factory (Recommended)

```javascript
const AIProviderFactory = require('../../../../lib/vendors/ai/AIProviderFactory');

const ai = AIProviderFactory.create('deepseek', { 
  apiKey: vars.deepseekApiKey 
});
```

### Direct Usage

```javascript
const DeepSeekProvider = require('../../../../lib/vendors/ai/deepseek/DeepSeekProvider');

```javascript
const DeepSeekProvider = require('../../../../lib/vendors/ai/deepseek/DeepSeekProvider');

const ai = new DeepSeekProvider({ 
  apiKey: vars.deepseekApiKey
});
```

## Standard Interface

All methods follow the unified AI provider interface. See [main documentation](../README.md) for details.

### complete(params)

```javascript
const result = await ai.complete({
  prompt: 'Explain the benefits of automation in business',
  systemPrompt: 'You are a business consultant.',
  temperature: 0.7,
  maxTokens: 1000
});

console.log(result.text);
console.log(`Tokens used: ${result.usage.totalTokens}`);
```

### summarize(data, options)

```javascript
const data = {
  sales: [
    { rep: 'John', deals: 15, revenue: 50000 },
    { rep: 'Sarah', deals: 22, revenue: 75000 }
  ]
};

const summary = await ai.summarize(data, {
  context: 'Monthly sales report for Q4',
  style: 'friendly'
});

console.log(summary);
```

## Available Models

- `deepseek-chat` (default): General-purpose conversational model
- `deepseek-coder`: Optimized for code-related tasks

## Response Format

```javascript
{
  success: true,
  text: "Generated text...",
  usage: {
    promptTokens: 10,
    completionTokens: 50,
    totalTokens: 60
  },
  model: "deepseek-chat",
  provider: "deepseek"
}
```

## Error Handling

```javascript
try {
  const result = await ai.complete({ prompt: 'Hello' });
  console.log(result.text);
} catch (error) {
  console.error('Error:', error.message);
  // Format: "deepseek API Error (Status: 401): Invalid API key"
}
```

## Best Practices

1. **Cost Optimization**: DeepSeek is very cost-effective - ideal for high-volume use cases
2. **Temperature Settings**: 
   - 0-0.3: Factual, deterministic responses
   - 0.4-0.7: Balanced creativity
   - 0.8-2.0: More creative and varied
3. **Token Management**: Monitor `result.usage.totalTokens` for cost tracking
4. **Model Selection**: Use `deepseek-coder` for programming tasks

## Examples

### Example 1: Data Analysis

```javascript
const AIProviderFactory = require('../../../../lib/vendors/ai/AIProviderFactory');
const ai = AIProviderFactory.create('deepseek', { apiKey: vars.deepseekApiKey });
```

### Text Completion

```javascript
const result = await deepseek.complete({
  prompt: 'Explain the benefits of automation in business',
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt: 'You are a business consultant.'
});

console.log(result.text);
```

### Data Summarization

```javascript
const data = {
  sales: [
    { rep: 'John', deals: 15, revenue: 50000 },
    { rep: 'Sarah', deals: 22, revenue: 75000 }
  ]
};

// Friendly style
const summary = await deepseek.summarize(data, {
  context: 'Monthly sales report for Q4',
  style: 'friendly'
});

console.log(summary);
```

### Summary Styles

- **friendly**: Conversational and easy to understand
- **professional**: Business-focused with key insights
- **technical**: Detailed with specific metrics

## API Reference

### `new DeepSeekApi({ apiKey })`

Creates a new DeepSeek API client.

**Parameters:**
- `apiKey` (string, required): Your DeepSeek API key

### `complete(params)`

Generate text completion using DeepSeek AI.

**Parameters:**
- `prompt` (string, required): The prompt to send to the model
- `model` (string, optional): Model to use (default: 'deepseek-chat')
- `temperature` (number, optional): Randomness 0-2 (default: 1)
- `maxTokens` (number, optional): Maximum tokens to generate (default: 2000)
- `systemPrompt` (string, optional): System prompt for context

**Returns:** Promise resolving to:
```javascript
{
  success: true,
  text: "Generated text...",
  usage: { prompt_tokens: 10, completion_tokens: 50, total_tokens: 60 },
  model: "deepseek-chat"
}
```

### `summarize(data, options)`

Summarize data in a friendly format.

**Parameters:**
- `data` (Object, required): Data to summarize (will be JSON stringified)
- `options.context` (string, optional): Additional context for the summary
- `options.style` (string, optional): Summary style ('friendly', 'professional', 'technical')

**Returns:** Promise resolving to a string with the summary.

## Error Handling

```javascript
try {
  const result = await deepseek.complete({ prompt: 'Hello' });
  console.log(result.text);
} catch (error) {
  console.error('DeepSeek Error:', error.message);
}
```

## Best Practices

1. **API Key Security**: Store API keys in Prolibu variables, never hardcode them
2. **Token Limits**: Be mindful of token usage, especially with large data sets
3. **Temperature Settings**: 
   - Lower (0-0.5): More focused and deterministic
   - Medium (0.5-1): Balanced creativity
   - Higher (1-2): More creative and random
4. **Data Size**: For large datasets, consider summarizing sections separately
5. **Rate Limiting**: Implement delays between requests if making many calls

## Examples

### Example 1: User Activity Report Summary

```javascript
const ai = AIProviderFactory.create('deepseek', { apiKey: vars.deepseekApiKey });

const reports = {
  today: [
    { name: 'John Doe', dealsCreated: 5 },
    { name: 'Jane Smith', dealsCreated: 8 }
  ],
  last7Days: [
    { name: 'John Doe', dealsCreated: 35 },
    { name: 'Jane Smith', dealsCreated: 42 }
  ]
};

const summary = await ai.summarize(reports, {
  context: 'User activity report showing deals created',
  style: 'professional'
});

console.log(summary);
```

### Example 2: Code Analysis

```javascript
const ai = AIProviderFactory.create('deepseek', { apiKey: vars.deepseekApiKey });

const result = await ai.complete({
  prompt: 'Review this function and suggest improvements:\n\nfunction calc(a,b){return a+b}',
  systemPrompt: 'You are an expert code reviewer.',
  temperature: 0.4,
  maxTokens: 800,
  model: 'deepseek-coder'  // Use coder model
});

console.log(result.text);
```

## Switching to Other Providers

The beauty of the unified interface is that you can easily switch:

```javascript
// Switch to Anthropic
const ai = AIProviderFactory.create('anthropic', { apiKey: vars.anthropicApiKey });

// Or OpenAI
const ai = AIProviderFactory.create('openai', { apiKey: vars.openaiApiKey });

// Same code works!
const result = await ai.complete({ prompt: 'Hello' });
```

## Troubleshooting

**Error: "deepseek API key is required"**
- Make sure you've added the `deepseekApiKey` variable in Prolibu

**Error: "Invalid API key"**
- Verify your API key is correct and active at [DeepSeek Platform](https://platform.deepseek.com/)

**Error: "Rate limit exceeded"**
- You've exceeded your API rate limit
- Wait and retry, or upgrade your plan

**Error: "Temperature must be between 0 and 2"**
- Ensure temperature value is in valid range

## Performance & Pricing

- **Speed**: Very fast response times (⚡⚡⚡)
- **Cost**: Most cost-effective option (💰)
- **Quality**: Good quality for most use cases (⭐⭐⭐)
- **Best For**: High-volume applications, development/testing

## Related Documentation

- [Main AI Providers Documentation](../README.md)
- [Anthropic Provider](../anthropic/README.md)
- [OpenAI Provider](../openai/README.md)
- [DeepSeek Official API Docs](https://platform.deepseek.com/docs)
- [DeepSeek Models](https://platform.deepseek.com/docs/models)
```

### Example 2: Custom Analysis

```javascript
const result = await deepseek.complete({
  prompt: `Analyze these sales trends and provide recommendations: ${JSON.stringify(salesData)}`,
  systemPrompt: 'You are a sales analyst expert.',
  temperature: 0.6,
  maxTokens: 1500
});

console.log(result.text);
```

## Models Available

- `deepseek-chat`: General-purpose conversational model (recommended)
- `deepseek-coder`: Optimized for code-related tasks

## Troubleshooting

**Error: "DeepSeek API key is required"**
- Make sure you've added the `deepseek-apiKey` variable in Prolibu

**Error: "Invalid API key"**
- Verify your API key is correct and active
- Check that the key has proper permissions

**Error: "Rate limit exceeded"**
- You've exceeded your API rate limit
- Wait a moment and try again, or upgrade your plan

## Related Documentation

- [DeepSeek API Documentation](https://platform.deepseek.com/docs)
- [DeepSeek Models](https://platform.deepseek.com/docs/models)
