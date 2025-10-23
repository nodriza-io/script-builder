# Anthropic Provider (Claude)

Anthropic AI provider adapter for the unified AI interface featuring Claude models.

> **Note**: This is part of the AI provider adapters system. See [main AI README](../README.md) for the unified interface documentation.

## Features

- Advanced reasoning with Claude 3.5 Sonnet
- Superior context understanding
- Strong safety and alignment
- Unified interface compatible with other providers

## Setup

1. Get your API key from [Anthropic Console](https://console.anthropic.com/)
2. Add the API key to your Prolibu variables as `anthropicApiKey`

## Usage

### Using Factory (Recommended)

```javascript
const AIProviderFactory = require('../../../../lib/vendors/ai/AIProviderFactory');

// Using 'anthropic'
const ai = AIProviderFactory.create('anthropic', { 
  apiKey: vars.anthropicApiKey 
});

// Or using alias 'claude'
const ai = AIProviderFactory.create('claude', { 
  apiKey: vars.anthropicApiKey 
});
```

### Direct Usage

```javascript
const AnthropicProvider = require('../../../../lib/vendors/ai/anthropic/AnthropicProvider');

const ai = new AnthropicProvider({ 
  apiKey: vars.anthropicApiKey
});
```

## Standard Interface

All methods follow the unified AI provider interface. See [main documentation](../README.md) for details.

### complete(params)

```javascript
const result = await ai.complete({
  prompt: 'Analyze this business scenario and provide strategic recommendations',
  systemPrompt: 'You are a strategic business consultant with MBA-level expertise.',
  temperature: 0.7,
  maxTokens: 2000
});

console.log(result.text);
console.log(`Provider: ${result.provider}, Tokens: ${result.usage.totalTokens}`);
```

### summarize(data, options)

```javascript
const data = {
  quarterlyMetrics: {
    revenue: 1500000,
    growth: 0.25,
    customers: 450
  }
};

const summary = await ai.summarize(data, {
  context: 'Q4 2024 business performance',
  style: 'professional'
});

console.log(summary);
```

## Available Models

- `claude-3-5-sonnet-20241022` (default): Best balance of intelligence and speed
- `claude-3-opus-20240229`: Most powerful, best for complex tasks
- `claude-3-sonnet-20240229`: Balanced performance
- `claude-3-haiku-20240307`: Fastest, most cost-effective

```javascript
const result = await ai.complete({
  prompt: 'Complex reasoning task',
  model: 'claude-3-opus-20240229'  // Use most powerful model
});
```

## Response Format

```javascript
{
  success: true,
  text: "Generated text...",
  usage: {
    promptTokens: 15,
    completionTokens: 120,
    totalTokens: 135
  },
  model: "claude-3-5-sonnet-20241022",
  provider: "anthropic"
}
```

## Error Handling

```javascript
try {
  const result = await ai.complete({ prompt: 'Hello' });
  console.log(result.text);
} catch (error) {
  console.error('Error:', error.message);
  // Format: "anthropic API Error (Status: 401): Invalid API key"
}
```

## Best Practices

1. **Complex Reasoning**: Claude excels at nuanced, multi-step reasoning tasks
2. **Safety First**: Claude has strong safety guardrails - ideal for sensitive content
3. **Long Context**: Claude handles very long prompts effectively
4. **Temperature**: 
   - 0-0.3: Analytical, precise
   - 0.4-0.7: Balanced
   - 0.8-1.0: Creative (rarely need higher)
5. **Cost Management**: Use Haiku for simple tasks, Sonnet for most, Opus for critical

## Examples

### Example 1: Strategic Analysis

```javascript
const AIProviderFactory = require('../../../../lib/vendors/ai/AIProviderFactory');
const ai = AIProviderFactory.create('claude', { apiKey: vars.anthropicApiKey });

const result = await ai.complete({
  prompt: 'Our SaaS product has 1000 users, 5% churn, $50 MRR per user. What are the top 3 growth strategies?',
  systemPrompt: 'You are a SaaS growth expert.',
  temperature: 0.6,
  maxTokens: 1500
});

console.log(result.text);
```

### Example 2: Data Synthesis

```javascript
const ai = AIProviderFactory.create('anthropic', { apiKey: vars.anthropicApiKey });

const complexData = {
  users: [...], // Large dataset
  metrics: {...},
  trends: {...}
};

const summary = await ai.summarize(complexData, {
  context: 'Comprehensive quarterly business review',
  style: 'professional'
});

console.log(summary);
```

### Example 3: Model Selection

```javascript
// Quick task - use Haiku
const quick = await ai.complete({
  prompt: 'Summarize in one sentence: [content]',
  model: 'claude-3-haiku-20240307'
});

// Complex task - use Opus
const complex = await ai.complete({
  prompt: 'Perform deep analysis with multiple perspectives: [content]',
  model: 'claude-3-opus-20240229'
});
```

## Switching to Other Providers

```javascript
// Switch to DeepSeek
const ai = AIProviderFactory.create('deepseek', { apiKey: vars.deepseekApiKey });

// Or OpenAI
const ai = AIProviderFactory.create('openai', { apiKey: vars.openaiApiKey });

// Same code works!
const result = await ai.complete({ prompt: 'Hello' });
```

## Troubleshooting

**Error: "anthropic API key is required"**
- Make sure you've added the `anthropicApiKey` variable in Prolibu

**Error: "Invalid API key"**
- Verify your API key is correct at [Anthropic Console](https://console.anthropic.com/)
- Check key permissions

**Error: "Rate limit exceeded"**
- You've exceeded your rate limit
- Consider upgrading your plan

**Error: "Context length exceeded"**
- Your prompt + response exceeds model's context window
- Reduce prompt size or use a model with larger context

## Performance & Pricing

- **Speed**: Fast for quality (⚡⚡)
- **Cost**: Premium pricing (💰💰💰)
- **Quality**: Industry-leading (⭐⭐⭐⭐⭐)
- **Best For**: Complex reasoning, safety-critical applications, nuanced analysis

## Key Differentiators

- **Safety**: Strong ethical guardrails
- **Reasoning**: Excellent at multi-step logical tasks
- **Context**: Large context windows
- **Helpfulness**: Highly responsive to instructions
- **Transparency**: Clear about limitations

## Related Documentation

- [Main AI Providers Documentation](../README.md)
- [DeepSeek Provider](../deepseek/README.md)
- [OpenAI Provider](../openai/README.md)
- [Anthropic Official API Docs](https://docs.anthropic.com/)
- [Claude Model Comparison](https://docs.anthropic.com/en/docs/models-overview)
