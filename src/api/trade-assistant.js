import Anthropic from '@anthropic-ai/sdk';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getUserFromToken(accessToken) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: process.env.VITE_SUPABASE_ANON_KEY,
    },
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchTrades(userId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/trades?user_id=eq.${userId}&order=entry_date.desc&limit=200`, {
    headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY },
  });
  if (!res.ok) return [];
  return res.json();
}

async function fetchPlaybooks(userId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/playbooks?user_id=eq.${userId}`, {
    headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY },
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ error: 'AI assistant is not configured yet. Add ANTHROPIC_API_KEY to enable it.' });
    return;
  }

  const authHeader = req.headers.authorization || '';
  const accessToken = authHeader.replace(/^Bearer\s+/i, '');
  if (!accessToken) {
    res.status(401).json({ error: 'Missing access token' });
    return;
  }

  const user = await getUserFromToken(accessToken);
  if (!user?.id) {
    res.status(401).json({ error: 'Invalid session' });
    return;
  }

  const { question } = req.body || {};
  if (!question || typeof question !== 'string') {
    res.status(400).json({ error: 'Missing question' });
    return;
  }

  try {
    const [trades, playbooks] = await Promise.all([fetchTrades(user.id), fetchPlaybooks(user.id)]);

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: 'claude-opus-5',
      max_tokens: 1024,
      system:
        'You are a trading-journal analytics assistant for a stock market masterclass student. ' +
        'You answer questions about their own trade history and playbooks, which are provided as JSON below. ' +
        'Be concise, specific, and reference actual numbers from their data. ' +
        'You are not a licensed financial advisor and must not give personalized investment advice on what to buy or sell next — ' +
        'focus on analyzing their past trading behavior, patterns, and discipline against their stated playbooks.\n\n' +
        `TRADES:\n${JSON.stringify(trades)}\n\nPLAYBOOKS:\n${JSON.stringify(playbooks)}`,
      messages: [{ role: 'user', content: question }],
    });

    const text = response.content.find((b) => b.type === 'text')?.text || '';
    res.status(200).json({ answer: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
