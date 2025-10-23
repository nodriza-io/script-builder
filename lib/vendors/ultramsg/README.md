# UltraMsg API Client

WhatsApp messaging integration using UltraMsg API.

## Features

- ✅ Send text messages via WhatsApp
- ✅ Send images with captions
- ✅ Multiple recipients support
- ✅ Instance status check

## Setup

### 1. Get UltraMsg Credentials

1. Sign up at [UltraMsg.com](https://ultramsg.com)
2. Create an instance
3. Get your **Instance ID** and **API Token**

### 2. Add to Variables

```json
{
  "key": "ultramsg-instanceId",
  "value": "instance12345"
},
{
  "key": "ultramsg-token",
  "value": "your_api_token_here"
}
```

## Usage

### Basic Text Message

```javascript
const UltraMsg = require('../../../lib/vendors/ultramsg/UltraMsg');

const ultramsg = new UltraMsg({
  instanceId: 'instance12345',
  token: 'your_token',
});

// Send to single recipient
await ultramsg.sendMessage({
  to: '573001234567', // Phone with country code (no + or -)
  body: '📊 Hello from UltraMsg!',
});

// Send to multiple recipients
await ultramsg.sendMessage({
  to: ['573001234567', '573007654321'],
  body: '📊 Broadcast message',
});
```

### Send Image with Caption

```javascript
await ultramsg.sendImage({
  to: '573001234567',
  image: 'https://example.com/image.jpg',
  caption: '📊 Check this out!',
});
```

### Check Instance Status

```javascript
const status = await ultramsg.getStatus();
console.log('WhatsApp status:', status);
```

## Phone Number Format

⚠️ **Important**: Phone numbers must include country code **without** `+` or `-`:

- ✅ Correct: `573001234567` (Colombia)
- ✅ Correct: `14155551234` (USA)
- ❌ Wrong: `+573001234567`
- ❌ Wrong: `57-300-1234567`

## Response Format

```javascript
{
  sent: 2,      // Number of successful sends
  failed: 0,    // Number of failed sends
  results: [
    {
      phone: '573001234567',
      success: true,
      data: { /* API response */ }
    },
    // ...
  ]
}
```

## Error Handling

```javascript
try {
  const result = await ultramsg.sendMessage({
    to: '573001234567',
    body: 'Test message',
  });
  
  console.log(`✅ Sent: ${result.sent}, Failed: ${result.failed}`);
  
  // Check individual results
  result.results.forEach(r => {
    if (r.success) {
      console.log(`✅ Message sent to ${r.phone}`);
    } else {
      console.error(`❌ Failed to send to ${r.phone}:`, r.error);
    }
  });
} catch (error) {
  console.error('UltraMsg Error:', error.message);
}
```

## API Documentation

Full API documentation: https://docs.ultramsg.com/

## Example: AI Report via WhatsApp

```javascript
const UltraMsg = require('../../../lib/vendors/ultramsg/UltraMsg');
const DeepSeek = require('../../../lib/vendors/ai/deepseek/DeepSeek');

const ai = new DeepSeek({ apiKey: 'your_key' });
const ultramsg = new UltraMsg({
  instanceId: 'instance12345',
  token: 'your_token',
});

// Generate AI analysis
const analysis = await ai.complete({
  prompt: 'Analyze this sales data...',
  systemPrompt: 'You are a data analyst.',
});

// Send via WhatsApp
await ultramsg.sendMessage({
  to: '573001234567',
  body: `📊 *AI Analysis*\n\n${analysis.text}`,
});
```

## Notes

- Messages support WhatsApp formatting: `*bold*`, `_italic_`, `~strikethrough~`
- Make sure your instance is connected and active
- Rate limits apply based on your UltraMsg plan
