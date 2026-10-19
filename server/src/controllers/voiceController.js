import { processAudioSpeech } from '../services/speechService.js';
import { getActiveAiProvider } from '../services/aiProvider.js';
import { generateSpeechWithGroq } from '../services/groqService.js';

export async function processTurn(req, res, next) {
  try {
    let userText = req.body.text;
    const messages = req.body.messages || [];

    // Process audio if uploaded
    if (req.file && req.file.buffer && req.file.buffer.length > 0) {
      const transcribed = await processAudioSpeech({
        audioBuffer: req.file.buffer,
        mimeType: req.file.mimetype,
        fallbackText: userText
      });
      if (transcribed && typeof transcribed === 'string' && transcribed.trim()) {
        userText = transcribed.trim();
      } else if (!userText || !userText.trim()) {
        userText = "Hello, I have an inquiry about my Aura Skincare order.";
      }
    }

    if (!userText || typeof userText !== 'string' || !userText.trim()) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_USER_INPUT',
        message: 'No user speech or text provided in turn.'
      });
    }

    const turnMessages = [
      ...messages,
      { role: 'user', content: userText.trim() }
    ];

    const provider = getActiveAiProvider();
    const result = await provider.processTurn({ messages: turnMessages });

    res.json({
      success: true,
      user_text: userText.trim(),
      agent_text: result.agent_text,
      tool_called: result.tool_called,
      provider: result.provider
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Audio Text-to-Speech handler
 */
export async function handleTts(req, res, next) {
  try {
    const { text, voice } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_TEXT',
        message: 'A valid "text" string is required for speech synthesis.'
      });
    }

    const ttsResult = await generateSpeechWithGroq({ text: text.trim(), voice });
    if (ttsResult.success && ttsResult.audioBuffer) {
      res.setHeader('Content-Type', ttsResult.contentType || 'audio/wav');
      return res.send(ttsResult.audioBuffer);
    }

    return res.json({
      success: false,
      fallback: ttsResult.fallback || 'browser_synthesis',
      reason: ttsResult.reason,
      message: ttsResult.message
    });
  } catch (error) {
    next(error);
  }
}
