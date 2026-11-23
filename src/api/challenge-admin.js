import { db, requireAdmin, cleanText } from './_lib/challenge.js';

// Backoffice API for breakaway.info/backoffice. Every call needs a Supabase
// access token from a Breakaway Academy login listed in challenge_admins.
//
// GET                              → { admin, members, progress }
// POST { action: 'update', id, status?, notes? }
// POST { action: 'delete', id }
// POST { action: 'progress', balance, note?, recorded_on? }
// POST { action: 'progress-delete', id }

const STATUSES = new Set(['new', 'contacted', 'in_telegram', 'trading', 'inactive']);
const UUID_RE = /^[0-9a-f-]{36}$/i;

export default async function handler(req, res) {
  const admin = await requireAdmin(req).catch(() => null);
  if (!admin) {
    res.status(403).json({ error: 'Not authorised for the challenge backoffice.' });
    return;
  }
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method === 'GET') {
      const [members, progress] = await Promise.all([
        db('challenge_members?select=*&order=created_at.desc&limit=5000'),
        db('challenge_progress?select=*&order=recorded_on.desc,created_at.desc&limit=500'),
      ]);
      res.status(200).json({ admin, members: members.data, progress: progress.data });
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const body = req.body || {};
    const id = typeof body.id === 'string' && UUID_RE.test(body.id) ? body.id : null;

    if (body.action === 'update' && id) {
      const patch = { updated_at: new Date().toISOString() };
      if (STATUSES.has(body.status)) patch.status = body.status;
      if (typeof body.notes === 'string') patch.notes = body.notes.slice(0, 2000);
      const { data } = await db(`challenge_members?id=eq.${id}`, {
        method: 'PATCH', body: patch, prefer: 'return=representation',
      });
      res.status(200).json({ ok: true, member: data?.[0] ?? null });
      return;
    }
    if (body.action === 'delete' && id) {
      await db(`challenge_members?id=eq.${id}`, { method: 'DELETE' });
      res.status(200).json({ ok: true });
      return;
    }
    if (body.action === 'progress') {
      const balance = Number(body.balance);
      if (!Number.isFinite(balance) || balance < 0 || balance > 1e9) {
        res.status(400).json({ error: 'Enter a valid balance.' });
        return;
      }
      const row = { balance: Math.round(balance * 100) / 100, note: cleanText(body.note, 300) };
      if (/^\d{4}-\d{2}-\d{2}$/.test(body.recorded_on || '')) row.recorded_on = body.recorded_on;
      const { data } = await db('challenge_progress', { method: 'POST', body: row, prefer: 'return=representation' });
      res.status(200).json({ ok: true, entry: data?.[0] ?? null });
      return;
    }
    if (body.action === 'progress-delete' && id) {
      await db(`challenge_progress?id=eq.${id}`, { method: 'DELETE' });
      res.status(200).json({ ok: true });
      return;
    }
    res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('challenge-admin failed', err.message, err.details);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
