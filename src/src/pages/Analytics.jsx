import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { listTrades, computeStats } from '../utils/trades';
import AppNav from '../components/AppNav';
import './Analytics.css';

function EquityCurve({ points }) {
  if (points.length < 2) {
    return <p className="analytics__hint">Log at least 2 closed trades to see your equity curve.</p>;
  }
  const width = 640;
  const height = 220;
  const pad = 24;
  const values = points.map((p) => p.equity);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (width - pad * 2);
    const y = height - pad - ((p.equity - min) / range) * (height - pad * 2);
    return `${x},${y}`;
  });

  const zeroY = height - pad - ((0 - min) / range) * (height - pad * 2);
  const last = values[values.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="analytics__chart">
      <line x1={pad} y1={zeroY} x2={width - pad} y2={zeroY} stroke="#262b3a" strokeWidth="1" />
      <polyline
        points={coords.join(' ')}
        fill="none"
        stroke={last >= 0 ? '#4fe0b8' : '#ff6b6b'}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Analytics() {
  const { user } = useAuth();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTrades(user.id).then((t) => {
      setTrades(t);
      setLoading(false);
    });
  }, [user.id]);

  const stats = useMemo(() => computeStats(trades), [trades]);

  return (
    <div className="analytics">
      <AppNav />
      <header className="analytics__header">
        <p className="analytics__eyebrow">Analytics</p>
        <h1 className="analytics__title">Your performance</h1>
      </header>

      {loading ? (
        <p className="analytics__hint">Loading…</p>
      ) : stats.closedTrades === 0 ? (
        <p className="analytics__hint">No closed trades yet — log trades in the Journal to see stats here.</p>
      ) : (
        <>
          <section className="analytics__stats">
            <div className="analytics__stat">
              <span className="analytics__stat-label">Total P&L</span>
              <span className={`analytics__stat-value ${stats.totalPnl >= 0 ? 'is-positive' : 'is-negative'}`}>
                {stats.totalPnl >= 0 ? '+' : ''}
                {stats.totalPnl.toFixed(2)}
              </span>
            </div>
            <div className="analytics__stat">
              <span className="analytics__stat-label">Win rate</span>
              <span className="analytics__stat-value">{stats.winRate.toFixed(1)}%</span>
            </div>
            <div className="analytics__stat">
              <span className="analytics__stat-label">Profit factor</span>
              <span className="analytics__stat-value">
                {Number.isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : '∞'}
              </span>
            </div>
            <div className="analytics__stat">
              <span className="analytics__stat-label">Avg win / loss</span>
              <span className="analytics__stat-value">
                {stats.avgWin.toFixed(2)} / -{stats.avgLoss.toFixed(2)}
              </span>
            </div>
            <div className="analytics__stat">
              <span className="analytics__stat-label">Closed trades</span>
              <span className="analytics__stat-value">{stats.closedTrades}</span>
            </div>
          </section>

          <section className="analytics__panel">
            <h2 className="analytics__panel-title">Equity curve</h2>
            <EquityCurve points={stats.equityCurve} />
          </section>
        </>
      )}
    </div>
  );
}
