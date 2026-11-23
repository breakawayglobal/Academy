// Shared helpers for the $500 → $5,000 Challenge API (Breakaway Academy).
// Uses the Academy Supabase project via REST with the service role key, the
// same way the other /api functions in this project do.

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

export async function db(path, { method = 'GET', body, prefer } = {}) {
  const headers = {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(data?.message || `Supabase ${res.status}`);
    err.status = res.status;
    err.details = data;
    throw err;
  }
  return { data, headers: res.headers };
}

// Returns the signed-in user's email if they are a challenge admin, else null.
export async function requireAdmin(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: ANON_KEY },
  });
  if (!res.ok) return null;
  const user = await res.json();
  const email = (user?.email || '').toLowerCase();
  if (!email) return null;
  const { data } = await db(`challenge_admins?select=email&email=eq.${encodeURIComponent(email)}`);
  return data?.length ? email : null;
}

export function cleanText(v, max = 200) {
  return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '';
}
