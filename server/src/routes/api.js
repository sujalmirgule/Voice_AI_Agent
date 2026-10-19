import express from 'express';
import multer from 'multer';
import { getOrders, getOrderById } from '../controllers/orderController.js';
import { getPolicies } from '../controllers/policyController.js';
import { processTurn, handleTts } from '../controllers/voiceController.js';
import { createSummary } from '../controllers/summaryController.js';
import { validateTurnInput, validateSummaryInput, validateOrderIdParam } from '../middleware/validation.js';
import { isGroqConfigured } from '../config/index.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max
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
    groq_configured: isGroqConfigured()
  });
});

/**
 * Orders endpoints
 */
router.get('/orders', getOrders);
router.get('/orders/:id', validateOrderIdParam, getOrderById);

/**
 * Brand Policies reference endpoint
 */
router.get('/policies', getPolicies);

/**
 * Conversational Turn endpoint
 */
router.post('/voice/process-turn', upload.single('audio'), validateTurnInput, processTurn);

/**
 * Text-to-Speech audio synthesis endpoint
 */
router.post('/voice/tts', handleTts);

/**
 * Post-Call Summary endpoint
 */
router.post('/call/summary', validateSummaryInput, createSummary);

export default router;
