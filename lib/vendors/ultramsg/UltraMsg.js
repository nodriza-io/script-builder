/**
 * UltraMsg API Client
 * Send WhatsApp messages via UltraMsg API
 * 
 * API Documentation: https://docs.ultramsg.com/
 */

/* global axios */

class UltraMsg {
  /**
   * Initialize UltraMsg client
   * @param {Object} config - Configuration object
   * @param {string} config.instanceId - Your UltraMsg instance ID
   * @param {string} config.token - Your UltraMsg API token
   */
  constructor({ instanceId, token }) {
    if (!instanceId || !token) {
      throw new Error('UltraMsg requires instanceId and token');
    }

    this.instanceId = instanceId;
    this.token = token;
    this.baseURL = `https://api.ultramsg.com/${instanceId}`;

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Clean phone number: remove +, -, spaces
   * @param {string} phone - Phone number to clean
   * @returns {string} Clean phone number
   * @private
   */
  _cleanPhone(phone) {
    return phone.trim().replace(/[\s\-+]/g, '');
  }

  /**
   * Format recipients: handle string (comma-separated) or array
   * @param {string|string[]} recipients - Phone number(s)
   * @returns {string[]} Array of clean phone numbers
   * @private
   */
  _formatRecipients(recipients) {
    const phoneList = typeof recipients === 'string' 
      ? recipients.split(',') 
      : recipients;
    
    return phoneList.map(phone => this._cleanPhone(phone));
  }

  /**
   * Send a text message via WhatsApp
   * @param {Object} params - Message parameters
   * @param {string|string[]} params.to - Phone number(s) with country code (e.g., '573001234567', '+57 300 1234567', or ['573001234567', '573007654321'])
   * @param {string} params.body - Message text content
   * @returns {Promise<Object>} API response
   */
  async sendMessage({ to, body }) {
    if (!to || !body) {
      throw new Error('sendMessage requires "to" and "body" parameters');
    }

    // Format and clean recipients
    const recipients = this._formatRecipients(to);
    const results = [];

    for (const phone of recipients) {
      try {
        const response = await this.client.post('/messages/chat', {
          token: this.token,
          to: phone,
          body: body,
        });

        results.push({
          phone,
          success: true,
          data: response.data,
        });
      } catch (error) {
        results.push({
          phone,
          success: false,
          error: error.response?.data || error.message,
        });
      }
    }

    return {
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }

  /**
   * Send a message with image
   * @param {Object} params - Message parameters
   * @param {string|string[]} params.to - Phone number(s) with country code (accepts +, -, spaces, comma-separated)
   * @param {string} params.image - Image URL
   * @param {string} params.caption - Image caption text
   * @returns {Promise<Object>} API response
   */
  async sendImage({ to, image, caption = '' }) {
    if (!to || !image) {
      throw new Error('sendImage requires "to" and "image" parameters');
    }

    // Format and clean recipients
    const recipients = this._formatRecipients(to);
    const results = [];

    for (const phone of recipients) {
      try {
        const response = await this.client.post('/messages/image', {
          token: this.token,
          to: phone,
          image: image,
          caption: caption,
        });

        results.push({
          phone,
          success: true,
          data: response.data,
        });
      } catch (error) {
        results.push({
          phone,
          success: false,
          error: error.response?.data || error.message,
        });
      }
    }

    return {
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }

  /**
   * Check instance status
   * @returns {Promise<Object>} Instance status
   */
  async getStatus() {
    try {
      const response = await this.client.get('/instance/status', {
        params: { token: this.token },
      });
      return response.data;
    } catch (error) {
      throw new Error(`UltraMsg API Error: ${error.response?.data?.error || error.message}`);
    }
  }
}

module.exports = UltraMsg;
