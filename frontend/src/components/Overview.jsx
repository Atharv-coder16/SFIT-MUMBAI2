import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import { getOverviewMetrics, getInterventionLog, getModelInfo, getAtRiskCustomers } from '../api/client';
import Loader from './ui/Loader';
import RiskRadarDashboard from './RiskRadarDashboard';

/* ═══════════════════════════════════════════
   OVERVIEW — Ultra-Premium Dashboard v4.0
   ═══════════════════════════════════════════ */

/* ── Custom Hooks & Utilities ── */
function useMousePosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e) => setPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  return position;
}

/* ── Ambient Spotlight Hover Card (Linear/Vercel style) ── */
function PremiumHoverCard({ children, style, accentColor = 'rgba(255,255,255,0.1)', delay = 0, noPadding = false, className = '' }) {
  const cardRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        background: 'var(--bg-surface-1)',
        borderRadius: 20,
        padding: noPadding ? 0 : '28px 26px',
        border: '1px solid rgba(255,255,255,0.04)',
        opacity: entered ? 1 : 0,
        transform: entered ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)',
        transition: 'opacity 600ms cubic-bezier(0.2, 0.8, 0.2, 1), transform 600ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 400ms ease, border-color 400ms ease',
        boxShadow: isHovered ? `0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px ${accentColor.replace(/[\d.]+\)$/g, '0.3)')}` : '0 8px 24px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        ...style
      }}
    >
      {/* Spotlight Effect Layer */}
      <div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, ${accentColor}, transparent 40%)`,
          opacity: isHovered ? 1 : 0, transition: 'opacity 400ms ease',
          mixBlendMode: 'screen'
        }}
      />
      {/* Glassmorphism Inner Shell */}
      <div
        style={{
          position: 'absolute', inset: 1, pointerEvents: 'none', zIndex: 0,
          background: 'var(--bg-surface-1)', borderRadius: 19,
        }}
      />
      {/* Content wrapper */}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}

/* ── Animated Counter ── */
function AnimatedNumber({ target, duration = 1800, suffix = '', prefix = '', color = 'inherit', decimals = 0 }) {
  const [val, setVal] = useState(0);
  const rafRef = useRef(null);
  const prevTarget = useRef(0);

  useEffect(() => {
    const from = prevTarget.current;
    const to = target;
    prevTarget.current = to;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4); // Quartic ease out
      setVal(from + (to - from) * ease);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  const formatted = val.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return <span style={{ color }}>{prefix}{formatted}{suffix}</span>;
}

/* ── Custom Recharts Tooltip ── */
const PremiumTooltip = ({ active, payload, label, labelPrefix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(10,10,15,0.85)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12, padding: '12px 18px',
      boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
      backdropFilter: 'blur(24px) saturate(180%)',
      zIndex: 100
    }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: '#e8e8f0', marginBottom: 8, letterSpacing: '0.5px' }}>
        {labelPrefix}{label}
      </div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
          <div style={{ position: 'relative', width: 10, height: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', background: p.color, opacity: 0.2, filter: 'blur(4px)' }} />
            <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: p.color, boxShadow: `0 0 8px ${p.color}` }} />
          </div>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#9999bb' }}>{p.name}</span>
          <div style={{ flex: 1, borderBottom: '1px dashed rgba(255,255,255,0.1)', margin: '0 8px' }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: p.color, fontWeight: 700 }}>
            {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
            {p.name?.includes('AUC') || p.name?.includes('Score') || p.name?.includes('Stress') || p.name?.includes('%') ? '%' : ''}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ── SVG Animated Premium Donut ── */
function PremiumDonut({ data }) {
  const [progress, setProgress] = useState(0);
  const [hovered, setHovered] = useState(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 130, cy = 130, r = 94, sw = 24; // Larger, more impressive dimensions
  const circ = 2 * Math.PI * r;

  useEffect(() => {
    let start = null;
    const run = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1400, 1);
      setProgress(1 - Math.pow(1 - p, 4));
      if (p < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }, [data]);

  let accum = 0;
  const segments = data.map((d, i) => {
    const frac = d.value / total;
    const offset = circ * (1 - frac * progress);
    const rot = (accum / total) * 360 * progress - 90;
    accum += d.value;
    const midAngle = rot + (frac * 360 * progress) / 2;
    const tx = hovered === i ? Math.cos(midAngle * Math.PI / 180) * 8 : 0;
    const ty = hovered === i ? Math.sin(midAngle * Math.PI / 180) * 8 : 0;
    return (
      <g key={i} transform={`rotate(${rot} ${cx} ${cy}) translate(${tx} ${ty})`} style={{ transition: 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
        {/* Glow behind stroked active segment */}
        {hovered === i && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={sw + 8} opacity={0.2} strokeDasharray={`${circ}`} strokeDashoffset={offset} filter="blur(8px)" />
        )}
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={d.color} strokeWidth={hovered === i ? sw + 4 : sw}
          strokeDasharray={`${circ}`} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-width 300ms ease', cursor: 'pointer' }}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
        />
      </g>
    );
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flexShrink: 0, width: 260, height: 260 }}>
        {/* Deep background shadow */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 140, height: 140, borderRadius: '50%', background: hovered !== null ? data[hovered]?.color : '#00d4ff', filter: 'blur(60px)', opacity: 0.15, transition: 'background 400ms ease, opacity 400ms ease' }} />
        
        <svg width="100%" height="100%" viewBox="0 0 260 260" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}>
          {/* Track */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={sw} />
          {segments}
        </svg>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          {hovered !== null ? (
            <>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 42, color: data[hovered]?.color, textShadow: `0 0 20px ${data[hovered]?.color}66`, transition: 'color 300ms' }}>{data[hovered]?.value}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: '#9999bb', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: 4 }}>{data[hovered]?.name}</div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 42, color: '#e8e8f0', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{total}</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: '#5a5a7a', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: 4 }}>Total Profiles</div>
            </>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minWidth: 160 }}>
        {data.map((d, i) => (
          <div key={i}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
            style={{
              cursor: 'pointer', padding: '12px 16px', borderRadius: 12,
              background: hovered === i ? `linear-gradient(90deg, ${d.color}18, transparent)` : 'rgba(255,255,255,0.015)',
              border: `1px solid ${hovered === i ? d.color + '66' : 'rgba(255,255,255,0.03)'}`,
              boxShadow: hovered === i ? `0 8px 24px rgba(0,0,0,0.2), inset 0 0 0 1px ${d.color}22` : 'none',
              transform: hovered === i ? 'translateX(6px)' : 'translateX(0)',
              transition: 'all 300ms cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, boxShadow: `0 0 12px ${d.color}aa` }} />
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 14, color: hovered === i ? '#fff' : '#9999bb', transition: 'color 300ms' }}>{d.name}</span>
              </div>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 15, fontWeight: 700, color: d.color, textShadow: hovered === i ? `0 0 12px ${d.color}66` : 'none' }}>
                <AnimatedNumber target={d.value} duration={1200} />
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 100, background: `linear-gradient(90deg, transparent, ${d.color})`,
                width: `${(d.value / total) * 100 * progress}%`,
                transition: 'width 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)', boxShadow: `0 0 10px ${d.color}cc`
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Animated Portfolio Bar ── */
function PortfolioBar({ label, value, maxVal, color, delay, index }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const pct = Math.min((value / maxVal) * 100, 100);
  return (
    <div ref={ref} style={{ marginBottom: 20, animation: `fadeSlideRight 600ms cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}ms both` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'flex-end' }}>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, color: '#e8e8f0' }}>{label}</span>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, fontWeight: 700, color }}>
          <AnimatedNumber target={value} suffix="%" color={color} duration={1000} />
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 100, background: 'rgba(255,255,255,0.03)', overflow: 'hidden', position: 'relative', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' }}>
        <div style={{
          height: '100%', borderRadius: 100,
          background: `linear-gradient(90deg, ${color}44, ${color})`,
          width: visible ? `${pct}%` : '0%',
          transition: `width 1.2s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
          boxShadow: `0 0 16px ${color}80, inset 0 2px 4px rgba(255,255,255,0.4)`,
        }} />
      </div>
    </div>
  );
}

/* ── Model Performance Bar ── */
function ModelPerfBar({ name, value, color, delay }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ marginBottom: 20, animation: `fadeSlideUp 600ms cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}ms both` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 14, color: '#9999bb' }}>{name}</span>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700, color, textShadow: `0 0 12px ${color}66` }}>
          <AnimatedNumber target={value} suffix="%" color={color} decimals={1} duration={1200} />
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 100, background: 'rgba(255,255,255,0.03)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 100,
          background: `linear-gradient(90deg, ${color}60, ${color})`,
          width: visible ? `${value}%` : '0%',
          transition: `width 1.4s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
          boxShadow: `0 0 16px ${color}80`,
        }} />
      </div>
    </div>
  );
}

/* ── Live Ticker ── */
function AlertTicker({ atRiskData }) {
  const alerts = atRiskData?.length > 0
    ? atRiskData.slice(0, 10).map(c => ({
        severity: c.risk_level === 'HIGH' || c.anomaly_flag ? '#ff4757' : '#f59e0b',
        text: `${c.anomaly_flag ? '🔴' : '⚠️'} ${c.name} — Risk ${Math.round((c.risk_score || 0) * 100)}%  ${c.top_signal ? '· ' + c.top_signal : ''}`
      }))
    : [{ severity: '#00d4ff', text: '● Loading live intelligent tracking feed...' }];
  const doubled = [...alerts, ...alerts];
  return (
    <div className="alert-ticker" style={{ borderBottom: '1px solid rgba(0,212,255,0.15)', background: 'linear-gradient(90deg, rgba(10,10,15,0.95), rgba(15,20,35,0.8), rgba(10,10,15,0.95))', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
      <div className="alert-ticker-badge" style={{ background: 'linear-gradient(90deg, #0a0a0f 85%, transparent)' }}>
        <span className="dot" style={{ boxShadow: '0 0 12px rgba(6,255,165,0.8)' }} />
        <span style={{ letterSpacing: '2px' }}>NEURAL NETWORK LIVE STREAM</span>
      </div>
      <div className="alert-ticker-track">
        {doubled.map((a, i) => (
          <div key={i} className="alert-ticker-item" style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            <span className="severity" style={{ background: a.severity, boxShadow: `0 0 10px ${a.severity}` }} />{a.text}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Premium KPI Hero Card ── */
function KpiCard({ icon, label, value, delta, deltaColor, accentColor, prefix = '', suffix = '', decimals = 0, delay = 0, critical = false }) {
  const [entered, setEntered] = useState(false);
  useEffect(() => { const t = setTimeout(() => setEntered(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <PremiumHoverCard
      accentColor={critical ? 'rgba(255,71,87,0.15)' : `${accentColor.replace(')', ',0.15)').replace('rgb', 'rgba')}`}
      delay={delay}
      className={critical ? 'critical-pulse-card' : ''}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`, opacity: 0.8 }} />
      <div style={{ position: 'absolute', top: -50, right: -50, width: 140, height: 140, borderRadius: '50%', background: accentColor, opacity: 0.08, filter: 'blur(30px)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#9999bb' }}>{label}</span>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: `${accentColor}11`, border: `1px solid ${accentColor}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 16px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.05)` }}>
          {icon}
        </div>
      </div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(28px, 3vw, 42px)', color: accentColor, marginBottom: 8, letterSpacing: '-1px', textShadow: `0 0 30px ${accentColor}55` }}>
        <AnimatedNumber target={value} prefix={prefix} suffix={suffix} decimals={decimals} color={accentColor} duration={1600} />
      </div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, fontWeight: 500, color: deltaColor || '#5a5a7a', display: 'flex', alignItems: 'center', gap: 6 }}>
        {delta}
      </div>
    </PremiumHoverCard>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export default function Overview({ clock }) {
  const [metrics, setMetrics] = useState(null);
  const [modelInfoData, setModelInfoData] = useState(null);
  const [atRisk, setAtRisk] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRadar, setShowRadar] = useState(false);

  const refresh = useCallback(() => {
    Promise.all([
      getOverviewMetrics().catch(() => null),
      getModelInfo().catch(() => null),
      getAtRiskCustomers(null, 0.40, 12).catch(() => [])
    ]).then(([m, mInfo, riskList]) => {
      setMetrics(m || {});
      setModelInfoData(mInfo);
      setAtRisk(riskList || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 20000);
    return () => clearInterval(t);
  }, [refresh]);

  if (loading) return <Loader message="INITIALISING NEURAL RISK ENGINE..." />;

  const m = metrics || {};
  const velocity = m.risk_velocity || [];
  const donutData = (m.donut_data || []).filter(d => d.value > 0);
  const exposure = m.portfolio_exposure || [];
  const performance = m.model_performance || [];
  const confDist = m.confidence_distribution || [];

  return (
    <div style={{ animation: 'pageEnter 800ms cubic-bezier(0.2, 0.8, 0.2, 1) both', paddingBottom: 64 }}>
      
      {/* Background Ambient Glows */}
      <div style={{ position: 'fixed', top: '10%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: -1, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '40%', right: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: -1, pointerEvents: 'none' }} />

      {/* Live Ticker */}
      <AlertTicker atRiskData={atRisk} />

      {/* Constraints wrapper to fix width issues and center content beautifully */}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 32px' }}>
        
        {/* Page Header */}
        <div style={{ padding: '48px 0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 'clamp(32px, 3.5vw, 42px)', letterSpacing: '-1.5px', margin: '0 0 8px', background: 'linear-gradient(135deg, #fff 30%, #9999bb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Risk Command Center
            </h1>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: '#9999bb', margin: 0, fontWeight: 400 }}>
              Live intelligence matrix analyzing <strong style={{ color: '#00d4ff', textShadow: '0 0 10px rgba(0,212,255,0.3)' }}>{m.total_customers?.toLocaleString() || 0}</strong> portfolios in real-time.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: 'rgba(15,15,26,0.5)', padding: '10px 16px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: '#e8e8f0', fontWeight: 500 }}>{clock}</span>
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
            <span style={{
              fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 11, background: 'linear-gradient(90deg, rgba(6,255,165,0.15), rgba(6,255,165,0.05))',
              border: '1px solid rgba(6,255,165,0.3)', color: '#06ffa5', padding: '5px 12px', borderRadius: 100, display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 0 20px rgba(6,255,165,0.1)'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#06ffa5', animation: 'livePulse 1.5s infinite', boxShadow: '0 0 8px #06ffa5' }} />
              LIVE DATA
            </span>
            <span style={{
              fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 11, background: 'rgba(0,212,255,0.08)',
              border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff', padding: '5px 12px', borderRadius: 100
            }}>
              {modelInfoData?.models_loaded ? 'ENSEMBLE ONLINE' : 'MODELS OFFLINE'}
            </span>
          </div>
        </div>

        {/* KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
          <KpiCard delay={100} accentColor="rgba(6,255,165,1)" label="Total Portfolio" prefix="₹" suffix=" Cr" decimals={1}
            value={m.total_portfolio || 0} delta={m.portfolio_delta || 'Stable Baseline'} deltaColor="#06ffa5"
            icon={<svg width={20} height={20} fill="#06ffa5" viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>}
          />
          <KpiCard delay={200} accentColor="rgba(0,212,255,1)" label="Monitored Clients"
            value={m.total_customers || 0} delta={m.at_risk_delta || 'Active sync'} deltaColor="#00d4ff"
            icon={<svg width={20} height={20} fill="#00d4ff" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>}
          />
          <KpiCard delay={300} accentColor="rgba(255,71,87,1)" label="Loss Avoided" prefix="₹" suffix=" Cr" decimals={1}
            critical value={m.avoided_loss_cr || 0}
            delta={<><span style={{ color: '#ff4757', display: 'inline-block', marginRight: 4 }}>►</span> AI Intervention Returns</>} deltaColor="#ff4757"
            icon={<svg width={20} height={20} fill="#ff4757" viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>}
          />
          <KpiCard delay={400} accentColor="rgba(255,107,53,1)" label="Auto Handlers"
            value={m.interventions_sent_today || 0} delta={m.intervention_delta || 'Executions today'} deltaColor="#ff6b35"
            icon={<span style={{ fontSize: 18, filter: 'drop-shadow(0 0 8px rgba(255,107,53,0.5))' }}>🤖</span>}
          />
          <KpiCard delay={500} accentColor="rgba(6,255,165,1)" label="Recovery Alpha" suffix="%" decimals={1}
            value={m.recovery_rate || 0} delta={m.recovery_delta || 'Positive trend'} deltaColor="#06ffa5"
            icon={<svg width={20} height={20} fill="#06ffa5" viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>}
          />
        </div>

        {/* --- ROW 1: Donut + Risk Velocity --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 480px) 1fr', gap: 24, marginBottom: 24 }}>

          {/* Donut Card */}
          <PremiumHoverCard delay={600} accentColor="rgba(0,212,255,0.15)">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>Risk Distribution Matrix</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 10, padding: '4px 10px', borderRadius: 6, background: 'rgba(255,71,87,0.1)', color: '#ff4757', border: '1px solid rgba(255,71,87,0.3)', textTransform: 'uppercase' }}>Crit ≥70%</span>
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 10, padding: '4px 10px', borderRadius: 6, background: 'rgba(255,107,53,0.1)', color: '#ff6b35', border: '1px solid rgba(255,107,53,0.3)', textTransform: 'uppercase' }}>High 40–70%</span>
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 10, padding: '4px 10px', borderRadius: 6, background: 'rgba(6,255,165,0.1)', color: '#06ffa5', border: '1px solid rgba(6,255,165,0.3)', textTransform: 'uppercase' }}>Low &lt;40%</span>
              </div>
            </div>
            {donutData.length > 0
              ? <PremiumDonut data={donutData} />
              : <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a5a7a', fontFamily: "'DM Sans',sans-serif", fontSize: 15 }}>No operational data available</div>}
          </PremiumHoverCard>

          {/* Risk Velocity Chart */}
          <PremiumHoverCard delay={700} accentColor="rgba(255,71,87,0.15)">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>Global Portfolio Velocity</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#9999bb', marginTop: 4 }}>Aggregated stress trajectory over temporal window</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(6,255,165,0.1)', border: '1px solid rgba(6,255,165,0.3)', padding: '6px 14px', borderRadius: 100, boxShadow: '0 0 20px rgba(6,255,165,0.05)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06ffa5', animation: 'livePulse 1.5s infinite', display: 'inline-block' }} />
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 11, color: '#06ffa5' }}>SYNCED</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={velocity} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="velGradPremium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff4757" stopOpacity={0.6} />
                    <stop offset="50%" stopColor="#ff4757" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#ff4757" stopOpacity={0} />
                  </linearGradient>
                  <filter id="shadowPremium" height="200%">
                    <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#ff4757" floodOpacity="0.4" />
                  </filter>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 6" vertical={false} />
                <XAxis dataKey="week" tick={{ fontFamily: "'DM Mono',monospace", fontSize: 11, fill: '#5a5a7a' }}
                  tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} tickMargin={10} />
                <YAxis tickFormatter={v => `${v}%`} tick={{ fontFamily: "'DM Mono',monospace", fontSize: 11, fill: '#5a5a7a' }}
                  tickLine={false} axisLine={false} domain={[0, 'auto']} tickMargin={10} />
                <Tooltip content={<PremiumTooltip labelPrefix="Temporal Window: Week " />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <ReferenceLine y={40} stroke="rgba(245,158,11,0.4)" strokeDasharray="4 4" label={{ value: 'Elevated Risk Level', fill: '#f59e0b', fontSize: 10, fontFamily: "'DM Mono',monospace", position: 'insideTopLeft' }} />
                <ReferenceLine y={70} stroke="rgba(255,71,87,0.4)" strokeDasharray="4 4" label={{ value: 'Critical Threshold', fill: '#ff4757', fontSize: 10, fontFamily: "'DM Mono',monospace", position: 'insideTopLeft' }} />
                <Area type="monotone" dataKey="stress" name="Global Stress Level"
                  stroke="#ff4757" strokeWidth={3} fill="url(#velGradPremium)" filter="url(#shadowPremium)"
                  dot={false} activeDot={{ r: 6, fill: '#1a1a30', stroke: '#ff4757', strokeWidth: 3, filter: 'drop-shadow(0 0 10px rgba(255,71,87,1))' }}
                  animationDuration={1800} animationEasing="ease-in-out" />
              </AreaChart>
            </ResponsiveContainer>
          </PremiumHoverCard>
        </div>

        {/* --- ROW 2: Portfolio Exposure + Model Performance + Confidence Dist --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>

          {/* Portfolio Exposure */}
          <PremiumHoverCard delay={800} accentColor="rgba(0,212,255,0.1)">
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>Sector Exposure</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#9999bb', marginTop: 4 }}>Demographic allocation matrix</div>
            </div>
            {exposure.length > 0
              ? exposure.map((p, i) => <PortfolioBar key={i} label={p.label} value={p.value} maxVal={100} color={p.color} delay={i * 100} index={i} />)
              : <div style={{ color: '#5a5a7a', fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>No exposure data collected</div>}
          </PremiumHoverCard>

          {/* Model Performance */}
          <PremiumHoverCard delay={900} accentColor="rgba(124,58,237,0.1)">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>Ensemble Efficacy</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#9999bb', marginTop: 4 }}>OOF Prediction Confidence</div>
              </div>
              <span style={{
                fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 10, padding: '4px 10px', borderRadius: 6,
                background: modelInfoData?.models_loaded ? 'rgba(6,255,165,0.1)' : 'rgba(255,71,87,0.1)',
                color: modelInfoData?.models_loaded ? '#06ffa5' : '#ff4757',
                border: `1px solid ${modelInfoData?.models_loaded ? 'rgba(6,255,165,0.3)' : 'rgba(255,71,87,0.3)'}`,
                boxShadow: modelInfoData?.models_loaded ? '0 0 16px rgba(6,255,165,0.15)' : 'none'
              }}>
                {modelInfoData?.models_loaded ? '● ACTIVE' : '✗ OFFLINE'}
              </span>
            </div>
            {performance.map((p, i) => <ModelPerfBar key={i} name={p.name} value={p.value} color={p.color} delay={i * 90} />)}
          </PremiumHoverCard>

          {/* Confidence Distribution */}
          <PremiumHoverCard delay={1000} accentColor="rgba(6,255,165,0.1)">
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>Prediction Topology</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#9999bb', marginTop: 4 }}>Account scoring spread analysis</div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={confDist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={42}>
                <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 6" vertical={false} />
                <XAxis dataKey="bucket" tick={{ fontFamily: "'DM Mono',monospace", fontSize: 11, fill: '#5a5a7a' }} tickLine={false} axisLine={{stroke:'rgba(255,255,255,0.05)'}} tickMargin={10} />
                <YAxis tick={{ fontFamily: "'DM Mono',monospace", fontSize: 11, fill: '#5a5a7a' }} tickLine={false} axisLine={false} tickMargin={10} />
                <Tooltip content={<PremiumTooltip labelPrefix="Probability Segment: " />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="count" name="Identified Entities" radius={[6, 6, 0, 0]} animationDuration={1600} animationEasing="cubic-bezier(0.2, 0.8, 0.2, 1)">
                  {confDist.map((entry, i) => (
                    <Cell key={i} fill={i === 0 ? '#06ffa5' : i === 1 ? '#f59e0b' : '#ff4757'} fillOpacity={0.9} style={{ filter: `drop-shadow(0 -4px 12px ${i === 0 ? '#06ffa544' : i === 1 ? '#f59e0b44' : '#ff475744'})` }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 16, background: 'rgba(0,0,0,0.2)', padding: '10px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.03)' }}>
              {[['#06ffa5', 'Low'], ['#f59e0b', 'Medium'], ['#ff4757', 'High Priority']].map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: c, boxShadow: `0 0 8px ${c}88` }} />
                  <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 11, color: '#e8e8f0', textTransform: 'uppercase', letterSpacing: '1px' }}>{l}</span>
                </div>
              ))}
            </div>
          </PremiumHoverCard>
        </div>

        {/* --- ROW 3: Stats Strip --- */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16, marginBottom: 40,
          background: 'linear-gradient(135deg, rgba(15,15,25,0.8), rgba(20,20,35,0.9))',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '24px 32px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5), inset 0 2px 20px rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px) saturate(150%)',
          animation: 'fadeSlideUp 800ms cubic-bezier(0.2, 0.8, 0.2, 1) 1100ms both'
        }}>
          {[
            { label: 'Forecasted Default', value: m.default_rate || 0, suffix: '%', decimals: 1, color: '#ff4757' },
            { label: 'High Risk Assets', value: m.high_risk_volume || 0, prefix: '₹', suffix: ' Cr', decimals: 1, color: '#ff6b35' },
            { label: 'Identified Targets', value: m.at_risk_count || 0, suffix: '', decimals: 0, color: '#f59e0b' },
            { label: 'Detection Lead Time', value: m.avg_ttd_days || 0, suffix: ' Days', decimals: 0, color: '#00d4ff' },
            { label: 'Precision F1-Score', value: performance.find(p => p.name === 'F1-Score')?.value || 0, suffix: '%', decimals: 1, color: '#7c3aed' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '8px 0', borderRight: i === 4 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 'clamp(22px, 2.5vw, 32px)', color: s.color, textShadow: `0 0 24px ${s.color}55` }}>
                <AnimatedNumber target={s.value} prefix={s.prefix || ''} suffix={s.suffix} decimals={s.decimals} color={s.color} duration={1600} />
              </div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 11, color: '#9999bb', marginTop: 6, textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Risk Radar Toggle */}
        <div style={{ textAlign: 'center', marginBottom: 40, animation: 'fadeIn 1s ease 1300ms both' }}>
          <button
            onClick={() => setShowRadar(p => !p)}
            style={{
              fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 14,
              padding: '16px 48px', borderRadius: 12, cursor: 'pointer',
              border: 'none',
              background: showRadar
                ? 'linear-gradient(135deg, rgba(255,71,87,0.15), rgba(255,71,87,0.05))'
                : 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))',
              color: showRadar ? '#ff4757' : '#00d4ff',
              letterSpacing: '2px', textTransform: 'uppercase', transition: 'all 400ms cubic-bezier(0.2, 0.8, 0.2, 1)',
              boxShadow: showRadar
                ? '0 12px 30px rgba(255,71,87,0.2), inset 0 0 0 1px rgba(255,71,87,0.3)'
                : '0 12px 30px rgba(0,212,255,0.2), inset 0 0 0 1px rgba(0,212,255,0.3)',
              textShadow: showRadar ? '0 0 12px rgba(255,71,87,0.5)' : '0 0 12px rgba(0,212,255,0.5)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
              e.currentTarget.style.boxShadow = showRadar
                ? '0 20px 40px rgba(255,71,87,0.3), inset 0 0 0 1px rgba(255,71,87,0.5)'
                : '0 20px 40px rgba(0,212,255,0.3), inset 0 0 0 1px rgba(0,212,255,0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = showRadar
                ? '0 12px 30px rgba(255,71,87,0.2), inset 0 0 0 1px rgba(255,71,87,0.3)'
                : '0 12px 30px rgba(0,212,255,0.2), inset 0 0 0 1px rgba(0,212,255,0.3)';
            }}
          >
            {showRadar ? '✕ DEACTIVATE RISK RADAR' : '● INITIALIZE RISK COMMAND HUB'}
          </button>
        </div>
        
        {showRadar && (
          <div style={{ marginBottom: 40, animation: 'fadeSlideUp 600ms cubic-bezier(0.2, 0.8, 0.2, 1) both' }}>
            <RiskRadarDashboard />
          </div>
        )}
        
      </div>
    </div>
  );
}

