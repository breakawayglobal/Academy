const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
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

  const { name } = req.body || {};
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'Missing name' });
    return;
  }

  try {
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: `Welcome back, ${name}. Let's pick up where you left off.`,
        model_id: 'eleven_multilingual_v2',
      }),
    });

    if (!ttsRes.ok) {
      const errText = await ttsRes.text();
      res.status(502).json({ error: 'ElevenLabs request failed', detail: errText });
      return;
    }

    const audioBuffer = Buffer.from(await ttsRes.arrayBuffer());
    const objectPath = `${user.id}.mp3`;

    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/welcome-audio/${objectPath}?upsert=true`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          apikey: SERVICE_ROLE_KEY,
          'Content-Type': 'audio/mpeg',
        },
        body: audioBuffer,
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      res.status(502).json({ error: 'Storage upload failed', detail: errText });
      return;
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/welcome-audio/${objectPath}`;

    const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ welcome_audio_url: publicUrl }),
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      res.status(502).json({ error: 'Profile update failed', detail: errText });
      return;
    }

    res.status(200).json({ url: publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
