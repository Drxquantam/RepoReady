import { Router } from 'express';
import { generateGroqText, isGroqConfigured } from '../services/groq.js';

const router = Router();

router.get('/status', (_req, res) => {
  res.json({
    provider: 'groq',
    configured: isGroqConfigured(),
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  });
});

router.post('/generate', async (req, res, next) => {
  try {
    const prompt = req.body?.prompt;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required' });
    }
    const text = await generateGroqText(prompt, {
      temperature: req.body.temperature,
      maxOutputTokens: req.body.maxOutputTokens,
    });
    res.json({ text });
  } catch (error) {
    next(error);
  }
});

export default router;
