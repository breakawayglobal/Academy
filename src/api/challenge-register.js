import { db, cleanText } from './_lib/challenge.js';

// Free opt-in for the $500 → $5,000 Challenge (breakaway.info/challenge/join).
// Saves name, email and phone; the page then sends the person to Telegram.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }
  const body = req.body || {};

  // Honeypot: pretend success so bots don't learn the submission failed.
  if (body.website) {
    res.status(200).json({ ok: true });
    return;
  }

  const name = cleanText(body.name);
  const email = cleanText(body.email).toLowerCase();
  const phone = cleanText(body.phone, 40);
  const digits = phone.replace(/\D/g, '');

  if (!name || !email || !phone) {
    res.status(400).json({ ok: false, error: 'Please fill in your name, email and phone number.' });
    return;
  }
  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
    return;
  }
  if (digits.length < 7 || digits.length > 15 || !/^\+?[\d\s().-]+$/.test(phone)) {
    res.status(400).json({ ok: false, error: 'Please enter a valid phone number.' });
    return;
  }
  if (body.terms_ack !== true) {
    res.status(400).json({ ok: false, error: 'Please accept the terms and risk disclosure.' });
    return;
  }

  try {
    // Signing up again with the same email refreshes name/phone only; the
    // admin's status and notes are left alone.
    await db('challenge_members?on_conflict=email', {
      method: 'POST',
      body: { name, email, phone, terms_ack: true, updated_at: new Date().toISOString() },
      prefer: 'resolution=merge-duplicates,return=minimal',
    });
  } catch (err) {
    console.error('challenge-register failed', err.message, err.details);
    res.status(500).json({ ok: false, error: 'Could not save your sign-up. Please try again.' });
    return;
  }
  res.status(200).json({ ok: true });
}
