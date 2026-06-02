const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

export function isGroqConfigured() {
  return Boolean(process.env.GROQ_API_KEY);
}

export async function generateGroqText(prompt, options = {}) {
  if (!process.env.GROQ_API_KEY) {
    throw Object.assign(new Error('Groq API key is not configured'), { status: 503 });
  }

  const model = options.model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    signal: AbortSignal.timeout(options.timeoutMs ?? 12_000),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: options.temperature ?? 0.35,
      max_tokens: options.maxOutputTokens ?? options.maxTokens ?? 1600,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload.error?.message || `Groq request failed with ${response.status}`;
    throw Object.assign(new Error(message), { status: response.status });
  }

  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw Object.assign(new Error('Groq returned no text'), { status: 502 });
  }

  return text;
}

export async function generateJsonWithGroq(prompt, fallback) {
  const text = await generateGroqText(`${prompt}

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
