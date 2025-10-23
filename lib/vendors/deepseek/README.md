# DeepSeek API

> **⚠️ Notice**: This module has been moved to the unified AI providers system at `lib/vendors/ai/deepseek/`.
> 
> For backward compatibility, this wrapper still works, but new code should use the AI provider adapters.

## Migration Guide

### Old Code (Still Works)

```javascript
const DeepSeekApi = require('../../../lib/vendors/deepseek/DeepSeekApi');
const deepseek = new DeepSeekApi({ apiKey: vars.deepseekApiKey });
const result = await deepseek.complete({ prompt: 'Hello' });
```

### New Code (Recommended)

```javascript
// Option 1: Using Factory (Best)
const AIProviderFactory = require('../../../lib/vendors/ai/AIProviderFactory');
const ai = AIProviderFactory.create('deepseek', { apiKey: vars.deepseekApiKey });
const result = await ai.complete({ prompt: 'Hello' });

// Option 2: Direct import
const DeepSeekProvider = require('../../../lib/vendors/ai/deepseek/DeepSeekProvider');
const ai = new DeepSeekProvider({ apiKey: vars.deepseekApiKey });
const result = await ai.complete({ prompt: 'Hello' });
```

## Benefits of New System

✅ **Provider Agnostic**: Switch between DeepSeek, Anthropic, OpenAI with one line change  
✅ **Unified Interface**: Same API across all providers  
✅ **Better Organization**: Centralized AI vendor management  
✅ **Factory Pattern**: Simplified instance creation  
✅ **Extensible**: Easy to add new AI providers  

## Documentation

For complete documentation, see:
- [Main AI Providers Documentation](../ai/README.md)
- [DeepSeek Provider Documentation](../ai/deepseek/README.md)
- [Anthropic Provider Documentation](../ai/anthropic/README.md)
- [OpenAI Provider Documentation](../ai/openai/README.md)

## Quick Example: Provider Switching

```javascript
const AIProviderFactory = require('../../../lib/vendors/ai/AIProviderFactory');

// Easy to switch between providers
const provider = 'deepseek'; // or 'anthropic', 'openai'
const ai = AIProviderFactory.create(provider, { 
  apiKey: vars[`${provider}ApiKey`] 
});

// Same code works with all providers!
const result = await ai.complete({
  prompt: 'Analyze this data',
  temperature: 0.7,
  maxTokens: 1000
});

console.log(result.text);
console.log(`Provider: ${result.provider}`);
```

## Backward Compatibility

This wrapper ensures all existing code continues to work without modifications. The `DeepSeekApi` class is now an alias to `DeepSeekProvider` from the new system.

## Deprecation Timeline

- **Current**: Fully supported, backward compatible
- **Future**: Will continue to work indefinitely
- **Recommendation**: Migrate to new system for new code

No breaking changes are planned. This wrapper will remain for backward compatibility.
