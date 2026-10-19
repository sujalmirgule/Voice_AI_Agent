import { generateCallSummary } from '../services/summaryService.js';

export async function createSummary(req, res, next) {
  try {
    const { transcript } = req.body;
    const summary = await generateCallSummary({ transcript });
    res.json({
      success: true,
      summary
    });
  } catch (error) {
    next(error);
  }
}
