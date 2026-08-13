import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTopicProgress } from '../utils/progress';
import './RadialLauncher.css';

const SIZE = 680;
const CENTER = SIZE / 2;
const R_TICK = 284;
const R_OUTER = 268;
const R_INNER = 138;
const R_PROGRESS_OUT = 262;
const R_PROGRESS_IN = 252;
const HUB_R = 116;
const GAP_DEG = 3;

const R_DASH = 296;
const R_BEZEL = 306;
const R_MINOR_TICK_IN = 300;
const R_MINOR_TICK_OUT = 306;
const R_MAJOR_TICK_IN = 296;
const R_MAJOR_TICK_OUT = 312;
const R_BLIP = 320;

const BLIP_ANGLES = [25, 145, 205, 335];

const toRad = (deg) => ((deg - 90) * Math.PI) / 180;

function polar(radius, angleDeg) {
  const rad = toRad(angleDeg);
  return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) };
}

function wedgePath(rOuter, rInner, startAngle, endAngle) {
  const so = polar(rOuter, startAngle);
  const eo = polar(rOuter, endAngle);
  const si = polar(rInner, endAngle);
  const ei = polar(rInner, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${so.x} ${so.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${eo.x} ${eo.y}`,
    `L ${si.x} ${si.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${ei.x} ${ei.y}`,
    'Z',
  ].join(' ');
}

function arcPath(radius, startAngle, endAngle) {
  const s = polar(radius, startAngle);
  const e = polar(radius, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
}

export default function RadialLauncher({ topics }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const step = 360 / topics.length;

  const bezelTicks = useMemo(() => {
    const ticks = [];
    for (let deg = 0; deg < 360; deg += 6) {
      const isMajor = deg % 30 === 0;
      ticks.push({
        deg,
        isMajor,
        inner: isMajor ? R_MAJOR_TICK_IN : R_MINOR_TICK_IN,
        outer: isMajor ? R_MAJOR_TICK_OUT : R_MINOR_TICK_OUT,
      });
    }
    return ticks;
  }, []);

  const segments = useMemo(
    () =>
      topics.map((topic, i) => {
        const start = i * step;
        const end = start + step;
        const mid = (start + end) / 2;
        const progress = getTopicProgress(topic.id, topic.videos.length);
        return {
          topic,
          start: start + GAP_DEG / 2,
          end: end - GAP_DEG / 2,
          mid,
          progress,
        };
      }),
    [topics, step]
  );

  const overallProgress = useMemo(() => {
    if (!segments.length) return 0;
    const total = segments.reduce((sum, s) => sum + s.progress, 0);
    return Math.round((total / segments.length) * 100);
  }, [segments]);

  return (
    <div className="radial-launcher">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="radial-launcher__svg" role="img" aria-label="Topic launcher wheel">
        <defs>
          <radialGradient id="hubGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#3a2410" />
            <stop offset="100%" stopColor="#140d08" />
          </radialGradient>
          <filter id="segGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="auraBlue" cx="35%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#2dd4ff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#2dd4ff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="auraOrange" cx="70%" cy="75%" r="60%">
            <stop offset="0%" stopColor="#ff8a3d" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#ff8a3d" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ambient dual-tone glow */}
        <circle cx={CENTER} cy={CENTER} r={R_BLIP + 20} fill="url(#auraBlue)" style={{ pointerEvents: 'none' }} />
        <circle cx={CENTER} cy={CENTER} r={R_BLIP + 20} fill="url(#auraOrange)" style={{ pointerEvents: 'none' }} />

        {/* sci-fi bezel: static ring + fine ticks */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={R_BEZEL}
          className="radial-launcher__bezel-ring"
          style={{ pointerEvents: 'none' }}
        />
        <g className="radial-launcher__bezel-ticks" style={{ pointerEvents: 'none' }}>
          {bezelTicks.map((t) => {
            const p1 = polar(t.inner, t.deg);
            const p2 = polar(t.outer, t.deg);
            return (
              <line
                key={`bezel-${t.deg}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                className={t.isMajor ? 'is-major' : 'is-minor'}
              />
            );
          })}
        </g>

        {/* slow-rotating dashed HUD ring */}
        <g className="radial-launcher__spin" style={{ pointerEvents: 'none' }}>
          <circle cx={CENTER} cy={CENTER} r={R_DASH} className="radial-launcher__dash-ring" />
        </g>

        {/* sensor blips */}
        <g className="radial-launcher__blips" style={{ pointerEvents: 'none' }}>
          {BLIP_ANGLES.map((deg, i) => {
            const inner = polar(R_BEZEL, deg);
            const outer = polar(R_BLIP, deg);
            return (
              <g key={`blip-${deg}`} className="radial-launcher__blip" style={{ animationDelay: `${i * 0.6}s` }}>
                <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} />
                <circle cx={outer.x} cy={outer.y} r="3" />
              </g>
            );
          })}
        </g>

        {/* outer tick ring */}
        {segments.map((s, i) => (
          <text
            key={`tick-${s.topic.id}`}
            x={polar(R_TICK, s.mid).x}
            y={polar(R_TICK, s.mid).y}
            className="radial-launcher__tick"
          >
            {i + 1}
          </text>
        ))}

        {/* base segment wedges */}
        {segments.map((s) => (
          <path
            key={s.topic.id}
            d={wedgePath(R_OUTER, R_INNER, s.start, s.end)}
            className={`radial-launcher__wedge ${hovered === s.topic.id ? 'is-hovered' : ''}`}
            style={{
              '--accent': s.topic.color,
            }}
            onMouseEnter={() => setHovered(s.topic.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => navigate(`/topics/${s.topic.id}`)}
          />
        ))}

        {/* progress arcs */}
        {segments.map((s) => {
          const progressEnd = s.start + (s.end - s.start) * s.progress;
          return (
            <g key={`progress-${s.topic.id}`} className="radial-launcher__progress-track">
              <path
                d={arcPath((R_PROGRESS_OUT + R_PROGRESS_IN) / 2, s.start, s.end)}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={R_PROGRESS_OUT - R_PROGRESS_IN}
                fill="none"
              />
              {s.progress > 0 && (
                <path
                  d={arcPath((R_PROGRESS_OUT + R_PROGRESS_IN) / 2, s.start, progressEnd)}
                  stroke={s.topic.color}
                  strokeWidth={R_PROGRESS_OUT - R_PROGRESS_IN}
                  fill="none"
                  strokeLinecap="round"
                />
              )}
            </g>
          );
        })}

        {/* icons + labels, non-interactive overlay so clicks pass to wedge below */}
        {segments.map((s) => {
          const iconPos = polar((R_OUTER + R_INNER) / 2 + 22, s.mid);
          const labelPos = polar((R_OUTER + R_INNER) / 2 - 32, s.mid);
          return (
            <g key={`label-${s.topic.id}`} className="radial-launcher__content" style={{ pointerEvents: 'none' }}>
              <text x={iconPos.x} y={iconPos.y} className="radial-launcher__icon">
                {s.topic.icon}
              </text>
              <text x={labelPos.x} y={labelPos.y} className="radial-launcher__label">
                {s.topic.name.toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* hub */}
        <g className="radial-launcher__hub" onClick={() => navigate('/')}>
          <circle cx={CENTER} cy={CENTER} r={HUB_R + 22} className="radial-launcher__hub-pulse" />
          <circle cx={CENTER} cy={CENTER} r={HUB_R + 10} className="radial-launcher__hub-ring" />
          {[0, 90, 180, 270].map((deg) => {
            const p1 = polar(HUB_R + 4, deg);
            const p2 = polar(HUB_R + 14, deg);
            return (
              <line
                key={`crosshair-${deg}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                className="radial-launcher__hub-crosshair"
              />
            );
          })}
          <circle cx={CENTER} cy={CENTER} r={HUB_R} fill="url(#hubGlow)" stroke="#ff8a3d" strokeWidth="1.5" />
          <text x={CENTER} y={CENTER - 14} className="radial-launcher__hub-icon">
            🎓
          </text>
          <text x={CENTER} y={CENTER + 22} className="radial-launcher__hub-percent">
            {overallProgress}%
          </text>
          <text x={CENTER} y={CENTER + 42} className="radial-launcher__hub-caption">
            Complete
          </text>
        </g>
      </svg>
    </div>
  );
}
