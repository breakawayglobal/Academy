import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { listTrades, createTrade, deleteTrade, tradePnl } from '../utils/trades';
import { listPlaybooks } from '../utils/playbooks';
import AppNav from '../components/AppNav';
import './Journal.css';

const emptyForm = {
  symbol: '',
  side: 'long',
  entry_price: '',
  exit_price: '',
  quantity: '',
  entry_date: '',
  exit_date: '',
  notes: '',
  playbook_id: '',
};

export default function Journal() {
  const { user } = useAuth();
  const [trades, setTrades] = useState([]);
  const [playbooks, setPlaybooks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    const [t, p] = await Promise.all([listTrades(user.id), listPlaybooks(user.id)]);
    setTrades(t);
    setPlaybooks(p);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await createTrade({
        user_id: user.id,
        symbol: form.symbol.trim().toUpperCase(),
        side: form.side,
        entry_price: Number(form.entry_price),
        exit_price: form.exit_price === '' ? null : Number(form.exit_price),
        quantity: Number(form.quantity),
        entry_date: form.entry_date,
        exit_date: form.exit_date === '' ? null : form.exit_date,
        notes: form.notes.trim() || null,
        playbook_id: form.playbook_id || null,
      });
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    await deleteTrade(id);
    await load();
  }

  const playbookName = (id) => playbooks.find((p) => p.id === id)?.name;

  return (
    <div className="journal">
      <AppNav />
      <header className="journal__header">
        <p className="journal__eyebrow">Trade Journal</p>
        <h1 className="journal__title">Log your trades</h1>
      </header>

      <form className="journal__form" onSubmit={handleSubmit}>
        <div className="journal__form-row">
          <input placeholder="Symbol" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} required />
          <select value={form.side} onChange={(e) => setForm({ ...form, side: e.target.value })}>
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
          <input type="number" step="any" placeholder="Entry price" value={form.entry_price} onChange={(e) => setForm({ ...form, entry_price: e.target.value })} required />
          <input type="number" step="any" placeholder="Exit price (optional)" value={form.exit_price} onChange={(e) => setForm({ ...form, exit_price: e.target.value })} />
          <input type="number" step="any" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
        </div>
        <div className="journal__form-row">
          <label className="journal__date-field">
            <span>Entry date</span>
            <input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} required />
          </label>
          <label className="journal__date-field">
            <span>Exit date</span>
            <input type="date" value={form.exit_date} onChange={(e) => setForm({ ...form, exit_date: e.target.value })} />
          </label>
          <select value={form.playbook_id} onChange={(e) => setForm({ ...form, playbook_id: e.target.value })}>
            <option value="">No playbook</option>
            {playbooks.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
        {error && <p className="journal__error">{error}</p>}
        <button type="submit" className="journal__submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Add trade'}
        </button>
      </form>

      <section className="journal__list">
        {loading ? (
          <p className="journal__hint">Loading…</p>
        ) : trades.length === 0 ? (
          <p className="journal__hint">No trades logged yet.</p>
        ) : (
          trades.map((t) => {
            const pnl = tradePnl(t);
            return (
              <div key={t.id} className="journal__row">
                <div className="journal__row-main">
                  <span className={`journal__side journal__side--${t.side}`}>{t.side.toUpperCase()}</span>
                  <span className="journal__symbol">{t.symbol}</span>
                  <span className="journal__meta">
                    {t.quantity} @ {t.entry_price}
                    {t.exit_price != null ? ` → ${t.exit_price}` : ' (open)'}
                  </span>
                  <span className="journal__meta">{t.entry_date}</span>
                  {playbookName(t.playbook_id) && <span className="journal__playbook-tag">{playbookName(t.playbook_id)}</span>}
                </div>
                <div className="journal__row-side">
                  {pnl != null && (
                    <span className={`journal__pnl ${pnl >= 0 ? 'is-positive' : 'is-negative'}`}>
                      {pnl >= 0 ? '+' : ''}
                      {pnl.toFixed(2)}
                    </span>
                  )}
                  <button type="button" className="journal__delete" onClick={() => handleDelete(t.id)}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
