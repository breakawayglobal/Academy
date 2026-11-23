import { db } from './_lib/challenge.js';

// Public: latest challenge account balance for the landing page. Returns
// { balance: null } until the first entry is recorded in the backoffice.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { data } = await db(
      'challenge_progress?select=balance,recorded_on&order=recorded_on.desc,created_at.desc&limit=1',
    );
    const row = data?.[0];
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json({
      balance: row ? Number(row.balance) : null,
      recorded_on: row?.recorded_on ?? null,
    });
  } catch (err) {
    console.error('challenge-progress failed', err.message);
    res.status(500).json({ error: 'Unavailable' });
  }
}
