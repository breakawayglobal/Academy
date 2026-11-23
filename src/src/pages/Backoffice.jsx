import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.svg';
import './Backoffice.css';

// Breakaway Academy backoffice for the $500 → $5,000 Challenge.
// Access: any Academy login whose email is in the challenge_admins table.

const STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'in_telegram', label: 'In Telegram' },
  { value: 'trading', label: 'Trading' },
  { value: 'inactive', label: 'Inactive' },
];
const START = 500;
const TARGET = 5000;

const money = (n) =>
  n == null ? '—' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (iso) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
const waLink = (phone) => {
  const digits = (phone || '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : null;
};

function toCsv(rows) {
  const cols = ['name', 'email', 'phone', 'status', 'notes', 'created_at'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error: err } = await signIn(email, password);
    setBusy(false);
    if (err) setError(err.message);
  }

  return (
    <div className="bo-center">
      <form className="bo-card bo-signin" onSubmit={submit}>
        <img src={logo} alt="Breakaway Academy" className="bo-signin__logo" />
        <p className="bo-eyebrow">Challenge backoffice</p>
        <h1>Sign in</h1>
        <p className="bo-muted">Use your Breakaway Academy login.</p>
        <label className="bo-field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label className="bo-field">
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && <p className="bo-error">{error}</p>}
        <button className="bo-btn bo-btn--primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}

export default function Backoffice() {
  const { session, loading, signOut } = useAuth();
  const [state, setState] = useState({ status: 'idle', error: '', admin: '', members: [], progress: [] });
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [entry, setEntry] = useState({ balance: '', recorded_on: new Date().toISOString().slice(0, 10), note: '' });
  const [toast, setToast] = useState('');

  const token = session?.access_token;

  const api = useCallback(
    async (method, body) => {
      const res = await fetch('/api/challenge-admin', {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.error || 'Request failed');
        err.status = res.status;
        throw err;
      }
      return data;
    },
    [token],
  );

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: s.members.length ? 'ready' : 'loading', error: '' }));
    try {
      const data = await api('GET');
      if (!Array.isArray(data.members)) throw new Error('The backoffice API is not reachable.');
      setState({ status: 'ready', error: '', admin: data.admin, members: data.members, progress: data.progress || [] });
    } catch (err) {
      setState((s) => ({ ...s, status: err.status === 403 ? 'forbidden' : 'error', error: err.message }));
    }
  }, [api]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const members = state.members;
  const stats = useMemo(() => {
    const today = dayKey(Date.now());
    const weekAgo = Date.now() - 7 * 864e5;
    return {
      total: members.length,
      today: members.filter((m) => dayKey(m.created_at) === today).length,
      week: members.filter((m) => new Date(m.created_at).getTime() >= weekAgo).length,
      telegram: members.filter((m) => m.status === 'in_telegram' || m.status === 'trading').length,
    };
  }, [members]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter(
      (m) =>
        (statusFilter === 'all' || m.status === statusFilter) &&
        (!q || [m.name, m.email, m.phone].some((v) => (v || '').toLowerCase().includes(q))),
    );
  }, [members, query, statusFilter]);

  const latest = state.progress[0];
  const pct = latest ? Math.max(0, Math.min(100, ((latest.balance - START) / (TARGET - START)) * 100)) : 0;

  async function updateMember(id, patch) {
    setState((s) => ({ ...s, members: s.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
    try {
      await api('POST', { action: 'update', id, ...patch });
      setToast('Saved');
    } catch (err) {
      setToast(err.message);
      load();
    }
  }

  async function deleteMember(m) {
    if (!window.confirm(`Delete ${m.name} (${m.email})? This can't be undone.`)) return;
    try {
      await api('POST', { action: 'delete', id: m.id });
      setState((s) => ({ ...s, members: s.members.filter((x) => x.id !== m.id) }));
      setToast('Deleted');
    } catch (err) {
      setToast(err.message);
    }
  }

  async function addProgress(e) {
    e.preventDefault();
    try {
      const { entry: row } = await api('POST', { action: 'progress', ...entry });
      setState((s) => ({
        ...s,
        progress: [row, ...s.progress].sort((a, b) =>
          a.recorded_on === b.recorded_on ? b.created_at.localeCompare(a.created_at) : b.recorded_on.localeCompare(a.recorded_on),
        ),
      }));
      setEntry((x) => ({ ...x, balance: '', note: '' }));
      setToast('Balance recorded — live on the challenge page within a minute');
    } catch (err) {
      setToast(err.message);
    }
  }

  async function deleteProgress(p) {
    if (!window.confirm(`Delete the ${money(p.balance)} entry from ${p.recorded_on}?`)) return;
    try {
      await api('POST', { action: 'progress-delete', id: p.id });
      setState((s) => ({ ...s, progress: s.progress.filter((x) => x.id !== p.id) }));
    } catch (err) {
      setToast(err.message);
    }
  }

  function exportCsv() {
    const blob = new Blob([toCsv(filtered)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `challenge-signups-${dayKey(Date.now())}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (loading) return null;
  if (!session) return <SignIn />;

  if (state.status === 'forbidden') {
    return (
      <div className="bo-center">
        <div className="bo-card bo-signin">
          <img src={logo} alt="Breakaway Academy" className="bo-signin__logo" />
          <h1>No access</h1>
          <p className="bo-muted">{session.user.email} isn't a challenge admin.</p>
          <button className="bo-btn" onClick={signOut}>Sign in with another account</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bo">
      <header className="bo-top">
        <div className="bo-brand">
          <img src={logo} alt="" />
          <div>
            <b>Breakaway Academy</b>
            <span>$500 → $5,000 Challenge · Backoffice</span>
          </div>
        </div>
        <div className="bo-top__right">
          <a className="bo-btn bo-btn--ghost" href="/challenge" target="_blank" rel="noopener">View page ↗</a>
          <span className="bo-muted bo-hide-sm">{state.admin}</span>
          <button className="bo-btn bo-btn--ghost" onClick={signOut}>Sign out</button>
        </div>
      </header>

      {state.status === 'loading' && <p className="bo-muted bo-pad">Loading…</p>}
      {state.status === 'error' && (
        <p className="bo-error bo-pad">
          {state.error} <button className="bo-link" onClick={load}>Retry</button>
        </p>
      )}

      {state.status === 'ready' && (
        <main className="bo-main">
          <section className="bo-stats">
            <div className="bo-card bo-stat"><span>Total sign-ups</span><b>{stats.total}</b></div>
            <div className="bo-card bo-stat"><span>Today</span><b>{stats.today}</b></div>
            <div className="bo-card bo-stat"><span>Last 7 days</span><b>{stats.week}</b></div>
            <div className="bo-card bo-stat"><span>In Telegram / trading</span><b>{stats.telegram}</b></div>
          </section>

          <section className="bo-card bo-section">
            <div className="bo-section__head">
              <h2>Sign-ups</h2>
              <div className="bo-tools">
                <input
                  className="bo-input"
                  placeholder="Search name, email or phone"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <select className="bo-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All statuses</option>
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <button className="bo-btn" onClick={exportCsv} disabled={!filtered.length}>Export CSV</button>
                <button className="bo-btn bo-btn--ghost" onClick={load}>Refresh</button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className="bo-empty">{members.length ? 'No sign-ups match your filters.' : 'No sign-ups yet. They appear here as soon as someone joins at breakaway.info/challenge.'}</p>
            ) : (
              <div className="bo-table-wrap">
                <table className="bo-table">
                  <thead>
                    <tr><th>Name</th><th>Contact</th><th>Signed up</th><th>Status</th><th>Notes</th><th /></tr>
                  </thead>
                  <tbody>
                    {filtered.map((m) => (
                      <tr key={m.id}>
                        <td data-label="Name"><b>{m.name}</b></td>
                        <td data-label="Contact">
                          <a href={`mailto:${m.email}`}>{m.email}</a>
                          <div className="bo-phone">
                            <a href={`tel:${m.phone.replace(/[^\d+]/g, '')}`}>{m.phone}</a>
                            {waLink(m.phone) && <a className="bo-wa" href={waLink(m.phone)} target="_blank" rel="noopener">WhatsApp</a>}
                          </div>
                        </td>
                        <td data-label="Signed up" className="bo-nowrap">{fmtDate(m.created_at)}</td>
                        <td data-label="Status">
                          <select
                            className={`bo-input bo-status bo-status--${m.status}`}
                            value={m.status}
                            onChange={(e) => updateMember(m.id, { status: e.target.value })}
                          >
                            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </td>
                        <td data-label="Notes">
                          <textarea
                            className="bo-input bo-notes"
                            defaultValue={m.notes}
                            rows={1}
                            placeholder="Add a note"
                            onBlur={(e) => e.target.value !== m.notes && updateMember(m.id, { notes: e.target.value })}
                          />
                        </td>
                        <td>
                          <button className="bo-icon" title="Delete" aria-label={`Delete ${m.name}`} onClick={() => deleteMember(m)}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="bo-muted bo-foot">Showing {filtered.length} of {members.length}</p>
          </section>

          <section className="bo-card bo-section">
            <div className="bo-section__head">
              <h2>Challenge account progress</h2>
              <span className="bo-muted">Shown on the public page under “Follow the real account”</span>
            </div>
            <div className="bo-progress">
              <div>
                <span className="bo-muted">Latest balance</span>
                <b className="bo-big">{money(latest?.balance)}</b>
                <span className="bo-muted">{latest ? `as of ${latest.recorded_on}` : 'Not recorded yet — the page shows “To be updated”.'}</span>
              </div>
              <div className="bo-bar"><i style={{ width: `${pct}%` }} /></div>
              <div className="bo-bar__labels"><span>$500</span><span>{pct.toFixed(1)}%</span><span>$5,000</span></div>
            </div>

            <form className="bo-entry" onSubmit={addProgress}>
              <label className="bo-field">
                <span>Balance (USD)</span>
                <input type="number" step="0.01" min="0" required value={entry.balance} onChange={(e) => setEntry({ ...entry, balance: e.target.value })} placeholder="612.40" />
              </label>
              <label className="bo-field">
                <span>Date</span>
                <input type="date" required value={entry.recorded_on} onChange={(e) => setEntry({ ...entry, recorded_on: e.target.value })} />
              </label>
              <label className="bo-field bo-grow">
                <span>Note (private)</span>
                <input value={entry.note} maxLength={300} onChange={(e) => setEntry({ ...entry, note: e.target.value })} placeholder="e.g. From broker statement" />
              </label>
              <button className="bo-btn bo-btn--primary">Record balance</button>
            </form>

            {state.progress.length > 0 && (
              <ul className="bo-history">
                {state.progress.map((p) => (
                  <li key={p.id}>
                    <span className="bo-nowrap">{p.recorded_on}</span>
                    <b>{money(p.balance)}</b>
                    <span className="bo-muted bo-grow">{p.note}</span>
                    <button className="bo-icon" title="Delete entry" aria-label="Delete entry" onClick={() => deleteProgress(p)}>✕</button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      )}

      {toast && <div className="bo-toast" role="status">{toast}</div>}
    </div>
  );
}
