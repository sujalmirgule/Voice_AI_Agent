import { transcribeAudioWithGroq } from './groqService.js';
import { isGroqConfigured } from '../config/index.js';

/**
 * Handles incoming audio utterances for Speech-to-Text
 */
export async function processAudioSpeech({ audioBuffer, mimeType, fallbackText }) {
  if (!audioBuffer || audioBuffer.length === 0) {
    if (fallbackText) return fallbackText;
    throw new Error('Empty or invalid audio buffer provided.');
  }

  // If Groq key is not configured, inform caller or fall back to client transcription
  if (!isGroqConfigured()) {
    if (fallbackText) {
      console.info('Server-side Whisper unavailable (no API key); utilizing browser-transcribed text fallback.');
      return fallbackText;
    }
    const err = new Error('Server-side Whisper transcription requires a GROQ_API_KEY. Please use browser speech recognition or provide an API key.');
    err.statusCode = 503;
    err.code = 'STT_SERVICE_UNAVAILABLE';
    throw err;
  }

  return transcribeAudioWithGroq({
    audioBuffer,
    mimeType: mimeType || 'audio/webm'
  });
}
