/**
 * Centralized API Client for Aura Skincare Voice CX
 * Matches docs/api-reference.md specification with relative paths for Vercel/Express same-origin deployment.
 */

const DEFAULT_TIMEOUT_MS = 10000;

export function createApiClient(baseUrl = '') {
  async function request(endpoint, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || DEFAULT_TIMEOUT_MS);

    try {
      const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}${endpoint}` : endpoint;
      const res = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const data = isJson ? await res.json() : await res.text();

      if (!res.ok) {
        const errorMessage = isJson && data.message ? data.message : `API request failed with status ${res.status}`;
        const error = new Error(errorMessage);
        error.status = res.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        const timeoutErr = new Error('Network request timed out. Please check your internet connection or backend service.');
        timeoutErr.code = 'TIMEOUT';
        throw timeoutErr;
      }
      throw err;
    }
  }

  return {
    async getHealth() {
      return request('/api/health');
    },

    async getOrders() {
      return request('/api/orders');
    },

    async getOrderById(orderId) {
      return request(`/api/orders/${encodeURIComponent(orderId)}`);
    },

    async getPolicies() {
      return request('/api/policies');
    },

    async processVoiceTurn({ text, messages = [], audioBlob = null }) {
      if (audioBlob) {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'utterance.webm');
        if (text) formData.append('text', text);
        if (messages && messages.length > 0) formData.append('messages', JSON.stringify(messages));

        return request('/api/voice/process-turn', {
          method: 'POST',
          body: formData
        });
      }

      return request('/api/voice/process-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, messages })
      });
    },

    async synthesizeSpeech(text, voice = 'troy') {
      return request('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice })
      });
    },

    async generateSummary(transcript) {
      return request('/api/call/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      });
    }
  };
}

export const apiClient = createApiClient();
