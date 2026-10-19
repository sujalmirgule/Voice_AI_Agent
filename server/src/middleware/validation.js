/**
 * Validates conversational turn input (/api/voice/process-turn)
 */
export function validateTurnInput(req, res, next) {
  const hasText = req.body && typeof req.body.text === 'string' && req.body.text.trim().length > 0;
  const hasAudio = req.file && req.file.buffer && req.file.buffer.length > 0;

  if (!hasText && !hasAudio) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_USER_INPUT',
      message: 'No user speech or text was provided. Please supply a non-empty "text" field or upload an audio file.'
    });
  }

  // Bounds check on input text
  if (hasText && req.body.text.length > 4000) {
    return res.status(400).json({
      success: false,
      error: 'PAYLOAD_TOO_LARGE',
      message: 'Text payload exceeds maximum allowed length of 4000 characters.'
    });
  }

  // Parse messages if stringified
  if (req.body && req.body.messages) {
    if (typeof req.body.messages === 'string') {
      try {
        req.body.messages = JSON.parse(req.body.messages);
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_MESSAGES_FORMAT',
          message: 'The "messages" field must be valid JSON array of conversation turns.'
        });
      }
    }

    if (!Array.isArray(req.body.messages)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_MESSAGES_FORMAT',
        message: 'The "messages" field must be an array of conversation turns.'
      });
    }

    if (req.body.messages.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'MESSAGES_TOO_LONG',
        message: 'Messages history exceeds maximum allowed limit of 100 turns.'
      });
    }
  }

  next();
}

/**
 * Validates post-call summary input (/api/call/summary)
 */
export function validateSummaryInput(req, res, next) {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'INVALID_REQUEST_BODY',
      message: 'A JSON request body is required.'
    });
  }

  const { transcript } = req.body;
  if (!transcript || !Array.isArray(transcript)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_TRANSCRIPT',
      message: 'A valid array of conversation transcript turns is required.'
    });
  }

  if (transcript.length > 200) {
    return res.status(400).json({
      success: false,
      error: 'TRANSCRIPT_TOO_LARGE',
      message: 'Transcript exceeds maximum limit of 200 turns.'
    });
  }

  next();
}

/**
 * Validates order ID parameter (/api/orders/:id)
 */
export function validateOrderIdParam(req, res, next) {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || !id.trim()) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_ORDER_ID',
      message: 'An order ID parameter is required.'
    });
  }

  if (id.length > 50) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_ORDER_ID',
      message: 'Order ID parameter exceeds maximum length.'
    });
  }

  next();
}
