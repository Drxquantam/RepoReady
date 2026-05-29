import { Router } from 'express';
import { generateGeminiText, isGeminiConfigured } from '../services/gemini.js';

const router = Router();

router.get('/status', (_req, res) => {
  res.json({
    provider: 'gemini',
    configured: isGeminiConfigured(),
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  });
});

router.post('/generate', async (req, res, next) => {
  try {
    const prompt = req.body?.prompt;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required' });
    }
    const text = await generateGeminiText(prompt, {
      temperature: req.body.temperature,
      maxOutputTokens: req.body.maxOutputTokens,
    });
    res.json({ text });
  } catch (error) {
    next(error);
  }
});

export default router;
