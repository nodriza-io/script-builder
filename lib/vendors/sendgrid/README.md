# SendGrid API Vendor

Lightweight SendGrid email service for Prolibu scripts.

## Setup

```javascript
const SendGridApi = require('../../../lib/vendors/sendgrid/SendGridApi');

const sendgrid = new SendGridApi({ 
  apiKey: vars.sendgridApiKey 
});
```

## Usage

### Send Simple Email

```javascript
await sendgrid.sendEmail({
  to: 'user@example.com',
  from: { 
    email: 'no-reply@prolibu.com', 
    name: 'Prolibu' 
  },
  subject: 'Daily Activity Report',
  html: '<h1>Your Report</h1><p>Details here...</p>',
  text: 'Your Report\n\nDetails here...', // Fallback
});
```

### Send to Multiple Recipients

```javascript
await sendgrid.sendEmail({
  to: ['user1@example.com', 'user2@example.com'],
  from: { email: 'no-reply@prolibu.com' },
  subject: 'Team Update',
  html: '<p>Message</p>',
});
```

### With CC and BCC

```javascript
await sendgrid.sendEmail({
  to: 'user@example.com',
  cc: 'manager@example.com',
  bcc: ['admin@example.com', 'audit@example.com'],
  from: { email: 'no-reply@prolibu.com', name: 'System' },
  subject: 'Important Notice',
  html: '<p>Message</p>',
  replyTo: 'support@prolibu.com',
});
```

## API Reference

### `sendEmail(params)`

**Required:**
- `to` - string | string[] - Recipient email(s)
- `from` - { email: string, name?: string } - Sender info
- `subject` - string - Email subject
- `text` or `html` - string - Email content

**Optional:**
- `cc` - string | string[] - CC recipients
- `bcc` - string | string[] - BCC recipients
- `replyTo` - string - Reply-to email

**Returns:** 
```javascript
{
  success: true,
  messageId: 'xxxxx',
  statusCode: 202
}
```

## Error Handling

```javascript
try {
  await sendgrid.sendEmail({ ... });
  console.log('Email sent successfully!');
} catch (error) {
  console.error('Failed to send email:', error.message);
}
```
