import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { listPlaybooks, createPlaybook, deletePlaybook } from '../utils/playbooks';
import { listTrades, computeStats } from '../utils/trades';
import AppNav from '../components/AppNav';
import './Playbooks.css';

export default function Playbooks() {
  const { user } = useAuth();
  const [playbooks, setPlaybooks] = useState([]);
  const [trades, setTrades] = useState([]);
  const [name, setName] = useState('');
  const [rules, setRules] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    const [p, t] = await Promise.all([listPlaybooks(user.id), listTrades(user.id)]);
    setPlaybooks(p);
    setTrades(t);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statsByPlaybook = useMemo(() => {
    const map = {};
    for (const p of playbooks) {
      map[p.id] = computeStats(trades.filter((t) => t.playbook_id === p.id));
    }
    return map;
  }, [playbooks, trades]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    await createPlaybook({ user_id: user.id, name: name.trim(), rules: rules.trim() || null });
    setName('');
    setRules('');
    await load();
    setSubmitting(false);
  }

  async function handleDelete(id) {
    await deletePlaybook(id);
    await load();
  }

  return (
    <div className="playbooks">
      <AppNav />
      <header className="playbooks__header">
        <p className="playbooks__eyebrow">Playbooks</p>
        <h1 className="playbooks__title">Your trading strategies</h1>
      </header>

      <form className="playbooks__form" onSubmit={handleSubmit}>
        <input placeholder="Strategy name (e.g. Breakout Momentum)" value={name} onChange={(e) => setName(e.target.value)} required />
        <textarea placeholder="Rules — when do you take this trade?" value={rules} onChange={(e) => setRules(e.target.value)} rows={3} />
        <button type="submit" className="playbooks__submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Add playbook'}
        </button>
      </form>

      <section className="playbooks__list">
        {loading ? (
          <p className="playbooks__hint">Loading…</p>
        ) : playbooks.length === 0 ? (
          <p className="playbooks__hint">No playbooks yet. Define your strategies above, then tag trades to them in the Journal.</p>
        ) : (
          playbooks.map((p) => {
            const stats = statsByPlaybook[p.id];
            return (
              <div key={p.id} className="playbooks__card">
                <div className="playbooks__card-header">
                  <h3>{p.name}</h3>
                  <button type="button" className="playbooks__delete" onClick={() => handleDelete(p.id)}>
                    Delete
                  </button>
                </div>
                {p.rules && <p className="playbooks__rules">{p.rules}</p>}
                <div className="playbooks__card-stats">
                  <span>{stats.closedTrades} closed trades</span>
                  <span className={stats.totalPnl >= 0 ? 'is-positive' : 'is-negative'}>
                    {stats.closedTrades ? `${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)} P&L` : '—'}
                  </span>
                  <span>{stats.closedTrades ? `${stats.winRate.toFixed(0)}% win rate` : ''}</span>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
