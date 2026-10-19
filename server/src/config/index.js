import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    sttModel: process.env.GROQ_STT_MODEL || process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo',
    ttsModel: process.env.GROQ_TTS_MODEL || 'canopylabs/orpheus-v1-english',
    ttsVoice: process.env.GROQ_TTS_VOICE || 'troy',
    timeoutMs: parseInt(process.env.GROQ_TIMEOUT_MS || '10000', 10)
  }
};

/**
 * Checks whether a genuine Groq API key is configured
 */
export function isGroqConfigured() {
  const key = config.groq.apiKey;
  return Boolean(
    key &&
    key.trim() !== '' &&
    key !== 'gsk_your_groq_api_key_placeholder' &&
    key.startsWith('gsk_')
  );
}

/**
 * Asserts that Groq key is present before invoking remote APIs
 */
export function assertGroqKey(featureName = 'AI Feature') {
  if (!isGroqConfigured()) {
    const error = new Error(`${featureName} requires a valid GROQ_API_KEY. None configured in environment.`);
    error.statusCode = 503;
    error.code = 'GROQ_API_KEY_MISSING';
    throw error;
  }
}
