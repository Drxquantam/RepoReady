const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta';

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generateGeminiText(prompt, options = {}) {
  if (!process.env.GEMINI_API_KEY) {
    throw Object.assign(new Error('Gemini API key is not configured'), { status: 503 });
  }

  const model = options.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const generationConfig = {
    temperature: options.temperature ?? 0.35,
    maxOutputTokens: options.maxOutputTokens ?? 1600,
  };
  if (/^gemini-3/i.test(model)) {
    generationConfig.thinkingConfig = { thinkingLevel: options.thinkingLevel || 'minimal' };
  }

  const response = await fetch(`${GEMINI_ENDPOINT}/models/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload.error?.message || `Gemini request failed with ${response.status}`;
    throw Object.assign(new Error(message), { status: response.status });
  }

  const text = payload.candidates
    ?.flatMap((candidate) => candidate.content?.parts || [])
    .map((part) => part.text || '')
    .join('')
    .trim();

  if (!text) {
    const finishReason = payload.candidates?.[0]?.finishReason;
    const blockReason = payload.promptFeedback?.blockReason;
    const details = [
      finishReason ? `finishReason: ${finishReason}` : null,
      blockReason ? `blocked: ${blockReason}` : null,
    ].filter(Boolean);

    throw Object.assign(
      new Error(`Gemini returned no text${details.length ? ` (${details.join(', ')})` : ''}`),
      { status: 502 },
    );
  }

  return text;
}

export async function generateJsonWithGemini(prompt, fallback) {
  const text = await generateGeminiText(`${prompt}

Return only valid JSON. Do not wrap it in markdown fences.`);

  try {
    return JSON.parse(stripJsonFence(text));
  } catch {
    return fallback;
  }
}

function stripJsonFence(text) {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) return cleaned.slice(start, end + 1);
  return cleaned;
}
