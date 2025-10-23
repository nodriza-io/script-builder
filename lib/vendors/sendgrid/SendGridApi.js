/**
 * SendGrid API - Lightweight Email Service
 */

/* global axios */

class SendGridApi {
  constructor({ apiKey }) {
    if (!apiKey) {
      throw new Error('SendGrid API key is required');
    }

    this.apiKey = apiKey;
    this.baseURL = 'https://api.sendgrid.com/v3';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Send a simple email
   * @param {Object} params - Email parameters
   * @param {string|string[]} params.to - Recipient email(s)
   * @param {Object} params.from - Sender { email, name? }
   * @param {string} params.subject - Email subject
   * @param {string} params.text - Plain text content (optional if html provided)
   * @param {string} params.html - HTML content (optional if text provided)
   * @param {string|string[]} params.cc - CC emails (optional)
   * @param {string|string[]} params.bcc - BCC emails (optional)
   * @param {string} params.replyTo - Reply-to email (optional)
   */
  async sendEmail(params) {
    const { to, from, subject, text, html, cc, bcc, replyTo } = params;

    // Validations
    if (!to) throw new Error('Recipient (to) is required');
    if (!from || !from.email) throw new Error('Sender (from.email) is required');
    if (!subject) throw new Error('Subject is required');
    if (!text && !html) throw new Error('Either text or html content is required');

    // Build email payload
    const payload = {
      personalizations: [{
        to: this._formatEmails(to),
        ...(cc && { cc: this._formatEmails(cc) }),
        ...(bcc && { bcc: this._formatEmails(bcc) }),
      }],
      from: {
        email: from.email,
        ...(from.name && { name: from.name }),
      },
      subject,
      content: [
        ...(text ? [{ type: 'text/plain', value: text }] : []),
        ...(html ? [{ type: 'text/html', value: html }] : []),
      ],
      ...(replyTo && { reply_to: { email: replyTo } }),
    };

    try {
      const response = await this.client.post('/mail/send', payload);
      return {
        success: true,
        messageId: response.headers['x-message-id'],
        statusCode: response.status,
      };
    } catch (error) {
      const errorMessage = error.response?.data?.errors?.[0]?.message || error.message;
      throw new Error(`SendGrid API Error: ${errorMessage}`);
    }
  }

  /**
   * Format emails to SendGrid format
   * Supports: string, array, or comma-separated string
   * @private
   */
  _formatEmails(emails) {
    let emailArray;
    
    if (Array.isArray(emails)) {
      emailArray = emails;
    } else if (typeof emails === 'string') {
      // Check if it's comma-separated
      if (emails.includes(',')) {
        emailArray = emails.split(',').map(e => e.trim()).filter(e => e);
      } else {
        emailArray = [emails];
      }
    } else {
      emailArray = [emails];
    }
    
    return emailArray.map(email => 
      typeof email === 'string' ? { email } : email
    );
  }
}

module.exports = SendGridApi;
