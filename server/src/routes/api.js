import express from 'express';
import multer from 'multer';
import { getAllOrders, getOrderDetails } from '../tools/orderTool.js';
import { BRAND_INFO } from '../policies/brandPolicies.js';
import { processConversationTurn, transcribeAudioWithGroq } from '../services/groqService.js';
import { generateCallSummary } from '../services/summaryService.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max audio
});

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Aura Skincare Voice CX API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    groq_configured: Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'gsk_your_groq_api_key_placeholder')
  });
});

/**
 * Get all sample orders
 */
router.get('/orders', (req, res) => {
  res.json({
    success: true,
    orders: getAllOrders()
  });
});

/**
 * Get single order details by ID
 */
router.get('/orders/:id', (req, res) => {
  const result = getOrderDetails(req.params.id);
  res.json(result);
});

/**
 * Get brand policies reference
 */
router.get('/policies', (req, res) => {
  res.json({
    success: true,
    brand: BRAND_INFO
  });
});

/**
 * Process a conversational turn (accepts JSON or audio multipart)
 */
router.post('/voice/process-turn', upload.single('audio'), async (req, res) => {
  try {
    let userText = req.body.text;
    let messages = [];

    // Parse messages history if provided
    if (req.body.messages) {
      try {
        messages = typeof req.body.messages === 'string'
          ? JSON.parse(req.body.messages)
          : req.body.messages;
      } catch (err) {
        messages = [];
      }
    }

    // If audio file was uploaded, transcribe it
    if (req.file) {
      try {
        userText = await transcribeAudioWithGroq({
          audioBuffer: req.file.buffer,
          mimeType: req.file.mimetype,
          apiKey: process.env.GROQ_API_KEY
        });
      } catch (sttError) {
        console.warn('Audio transcription failed or Groq key not configured, checking fallback text:', sttError.message);
        if (!userText) {
          return res.status(400).json({
            success: false,
            error: "TRANSCRIPTION_FAILED",
            message: "Could not transcribe audio. " + sttError.message
          });
        }
      }
    }

    if (!userText || typeof userText !== 'string' || !userText.trim()) {
      return res.status(400).json({
        success: false,
        error: "MISSING_USER_INPUT",
        message: "No user speech or text provided in turn."
      });
    }

    // Append current user message to conversation history
    const turnMessages = [
      ...messages,
      { role: 'user', content: userText.trim() }
    ];

    const turnResult = await processConversationTurn({
      messages: turnMessages,
      apiKey: process.env.GROQ_API_KEY
    });

    res.json({
      success: true,
      user_text: userText.trim(),
      agent_text: turnResult.agent_text,
      tool_called: turnResult.tool_called,
      provider: turnResult.provider
    });
  } catch (error) {
    console.error('Error in /api/voice/process-turn:', error);
    res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: error.message
    });
  }
});

/**
 * Post-call summary generator
 */
router.post('/call/summary', async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript || !Array.isArray(transcript)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_TRANSCRIPT",
        message: "A valid array of conversation transcript turns is required."
      });
    }

    const summary = await generateCallSummary({
      transcript,
      apiKey: process.env.GROQ_API_KEY
    });

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error in /api/call/summary:', error);
    res.status(500).json({
      success: false,
      error: "SUMMARY_GENERATION_FAILED",
      message: error.message
    });
  }
});

export default router;
