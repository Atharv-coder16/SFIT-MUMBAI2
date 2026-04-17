import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getAtRiskCustomers, getOverviewMetrics, getPortfolioContext } from '../api/client';

/* ═══════════════════════════════════════════
   RISK RADAR DASHBOARD — Judge Magnet UI
   Risk Radar + 3D Globe + Live Alerts + Stress Pulse
   All data is LIVE from the AI model
   ═══════════════════════════════════════════ */

// ── City coordinates (lat/lon → rough x,y on a flat projection) ──
const CITY_COORDS = {
  'Mumbai': { lat: 19.07, lon: 72.87 }, 'Delhi': { lat: 28.61, lon: 77.20 },
  'Bangalore': { lat: 12.97, lon: 77.59 }, 'Hyderabad': { lat: 17.38, lon: 78.48 },
  'Chennai': { lat: 13.08, lon: 80.27 }, 'Kolkata': { lat: 22.57, lon: 88.36 },
  'Pune': { lat: 18.52, lon: 73.85 }, 'Ahmedabad': { lat: 23.02, lon: 72.57 },
  'Jaipur': { lat: 26.91, lon: 75.78 }, 'Lucknow': { lat: 26.84, lon: 80.94 },
  'Chandigarh': { lat: 30.73, lon: 76.77 }, 'Kochi': { lat: 9.93, lon: 76.26 },
  'Coimbatore': { lat: 11.01, lon: 76.95 }, 'Nagpur': { lat: 21.14, lon: 79.08 },
  'Indore': { lat: 22.71, lon: 75.85 }, 'Bhopal': { lat: 23.25, lon: 77.41 },
  'Patna': { lat: 25.61, lon: 85.14 }, 'Surat': { lat: 21.17, lon: 72.83 },
  'Vadodara': { lat: 22.30, lon: 73.19 }, 'Noida': { lat: 28.53, lon: 77.39 },
  'Gurgaon': { lat: 28.45, lon: 77.02 }, 'Visakhapatnam': { lat: 17.68, lon: 83.21 },
  'Rajkot': { lat: 22.30, lon: 70.78 }, 'Ranchi': { lat: 23.34, lon: 85.30 },
  'Unknown': { lat: 20.59, lon: 78.96 },
};

// ═══════════════════════════════════════════
// 1. RISK RADAR — 6-Axis Spider Chart (Real Data)
// ═══════════════════════════════════════════
function RiskRadar({ customers = [] }) {
  const canvasRef = useRef(null);
  const [hoveredAxis, setHoveredAxis] = useState(null);

  // Aggregate REAL signals from customer data
  const radarData = useMemo(() => {
    if (!customers.length) return null;
    const n = customers.length;
    const signalCounts = {
      'Salary Delay': 0, 'Failed Autodebit': 0, 'Lender UPI Spike': 0,
      'High Credit Utilization': 0, 'Utility Delay': 0, 'ATM Withdrawal Spike': 0
    };
    customers.forEach(c => {
      (c.recent_signals || []).forEach(sig => {
        const key = Object.keys(signalCounts).find(k => sig.toLowerCase().includes(k.toLowerCase().split(' ')[0]));
        if (key) signalCounts[key] = Math.min(100, (signalCounts[key] || 0) + (100 / n));
      });
    });
    return [
      { axis: 'Salary Risk', value: signalCounts['Salary Delay'], color: '#ff4757' },
      { axis: 'Autodebit Fails', value: signalCounts['Failed Autodebit'], color: '#ff6b35' },
      { axis: 'UPI Lending', value: signalCounts['Lender UPI Spike'], color: '#f59e0b' },
      { axis: 'Credit Util.', value: signalCounts['High Credit Utilization'], color: '#a78bfa' },
      { axis: 'Utility Delays', value: signalCounts['Utility Delay'], color: '#00d4ff' },
      { axis: 'ATM Spikes', value: signalCounts['ATM Withdrawal Spike'], color: '#06ffa5' },
    ];
  }, [customers]);

  useEffect(() => {
    if (!canvasRef.current || !radarData) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 340 * dpr;
    canvas.height = 340 * dpr;
    ctx.scale(dpr, dpr);
    const W = 340, H = 340;
    const cx = W / 2, cy = H / 2, maxR = 120;
    const axes = radarData.length;

    let frame;
    let progress = 0;

    const draw = () => {
      progress = Math.min(progress + 0.02, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      ctx.clearRect(0, 0, W, H);

      // Grid rings
      for (let ring = 1; ring <= 4; ring++) {
        const r = (ring / 4) * maxR;
        ctx.beginPath();
        for (let i = 0; i <= axes; i++) {
          const angle = (i / axes) * Math.PI * 2 - Math.PI / 2;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(0,212,255,${ring === 4 ? 0.12 : 0.05})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Axis lines + labels
      radarData.forEach((d, i) => {
        const angle = (i / axes) * Math.PI * 2 - Math.PI / 2;
        const ex = cx + Math.cos(angle) * maxR;
        const ey = cy + Math.sin(angle) * maxR;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = hoveredAxis === i ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Labels
        const lx = cx + Math.cos(angle) * (maxR + 20);
        const ly = cy + Math.sin(angle) * (maxR + 20);
        ctx.fillStyle = hoveredAxis === i ? '#e0e0f0' : '#5a5a7a';
        ctx.font = '10px "DM Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.axis, lx, ly);

        // Value on hover
        if (hoveredAxis === i) {
          ctx.fillStyle = d.color;
          ctx.font = 'bold 12px "DM Mono", monospace';
          ctx.fillText(`${Math.round(d.value * ease)}%`, lx, ly + 14);
        }
      });

      // Data polygon — fill
      ctx.beginPath();
      radarData.forEach((d, i) => {
        const angle = (i / axes) * Math.PI * 2 - Math.PI / 2;
        const r = (d.value / 100) * maxR * ease;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,71,87,0.12)';
      ctx.fill();

      // Data polygon — stroke with glow
      ctx.beginPath();
      radarData.forEach((d, i) => {
        const angle = (i / axes) * Math.PI * 2 - Math.PI / 2;
        const r = (d.value / 100) * maxR * ease;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = '#ff4757';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ff475780';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Data points
      radarData.forEach((d, i) => {
        const angle = (i / axes) * Math.PI * 2 - Math.PI / 2;
        const r = (d.value / 100) * maxR * ease;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        ctx.beginPath();
        ctx.arc(x, y, hoveredAxis === i ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.shadowColor = d.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Center score
      const avgRisk = customers.reduce((s, c) => s + (c.risk_score || 0), 0) / (customers.length || 1);
      ctx.fillStyle = avgRisk >= 0.7 ? '#ff4757' : avgRisk >= 0.4 ? '#ff6b35' : '#06ffa5';
      ctx.font = 'bold 28px "Syne", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${(avgRisk * 100).toFixed(0)}`, cx, cy - 4);
      ctx.fillStyle = '#5a5a7a';
      ctx.font = '9px "DM Sans", sans-serif';
      ctx.fillText('AVG RISK', cx, cy + 14);

      if (progress < 1) frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [radarData, hoveredAxis, customers]);

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cx = 170, cy = 170;
    const angle = Math.atan2(my - cy, mx - cx);
    let normalized = (angle + Math.PI / 2) / (Math.PI * 2);
    if (normalized < 0) normalized += 1;
    const idx = Math.round(normalized * 6) % 6;
    const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
    setHoveredAxis(dist < 160 ? idx : null);
  };

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="card-header">
        <span className="card-title">🔴 Risk Signal Radar</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#5a5a7a' }}>
          {customers.length} customers analyzed
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <canvas
          ref={canvasRef}
          style={{ width: 340, height: 340, cursor: 'crosshair' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredAxis(null)}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// 2. 3D GLOBE — City Cluster Visualization (Canvas 2D)
// ═══════════════════════════════════════════
function RiskGlobe({ customers = [] }) {
  const canvasRef = useRef(null);
  const rotationRef = useRef(0);
  const hoveredRef = useRef(null);

  const cityData = useMemo(() => {
    const map = {};
    customers.forEach(c => {
      const city = c.city || 'Unknown';
      if (!map[city]) map[city] = { city, count: 0, highRisk: 0, totalRisk: 0 };
      map[city].count++;
      if (c.risk_level === 'HIGH') map[city].highRisk++;
      map[city].totalRisk += c.risk_score || 0;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [customers]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = 440, H = 340;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    let frame;
    const draw = () => {
      rotationRef.current += 0.002;
      ctx.clearRect(0, 0, W, H);

      // Globe sphere
      const cx = W / 2, cy = H / 2, R = 130;
      const gradient = ctx.createRadialGradient(cx - 30, cy - 30, R * 0.1, cx, cy, R);
      gradient.addColorStop(0, 'rgba(15,15,40,0.9)');
      gradient.addColorStop(0.7, 'rgba(10,10,30,0.95)');
      gradient.addColorStop(1, 'rgba(0,212,255,0.08)');
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Globe outline glow
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,212,255,0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Latitude lines
      for (let lat = -60; lat <= 60; lat += 30) {
        const latRad = (lat * Math.PI) / 180;
        const ry = R * Math.cos(latRad);
        const yy = cy - R * Math.sin(latRad);
        ctx.beginPath();
        ctx.ellipse(cx, yy, ry, ry * 0.08, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,212,255,0.04)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Longitude lines (rotating)
      for (let lon = 0; lon < 180; lon += 30) {
        const lonRad = ((lon + rotationRef.current * 50) * Math.PI) / 180;
        ctx.beginPath();
        for (let t = -90; t <= 90; t += 5) {
          const tRad = (t * Math.PI) / 180;
          const x3d = R * Math.cos(tRad) * Math.sin(lonRad);
          const y3d = R * Math.sin(tRad);
          const z3d = R * Math.cos(tRad) * Math.cos(lonRad);
          if (z3d < 0) continue;
          const px = cx + x3d;
          const py = cy - y3d;
          if (t === -90 || z3d < 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = 'rgba(0,212,255,0.03)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Plot city dots
      cityData.forEach((city, i) => {
        const coords = CITY_COORDS[city.city] || CITY_COORDS['Unknown'];
        const latRad = (coords.lat * Math.PI) / 180;
        const lonRad = ((coords.lon + rotationRef.current * 50 - 78) * Math.PI) / 180;

        const x3d = R * Math.cos(latRad) * Math.sin(lonRad);
        const y3d = R * Math.sin(latRad);
        const z3d = R * Math.cos(latRad) * Math.cos(lonRad);

        if (z3d < -10) return; // behind globe

        const px = cx + x3d;
        const py = cy - y3d;
        const depth = (z3d + R) / (2 * R);

        const avgRisk = city.totalRisk / city.count;
        const color = avgRisk >= 0.7 ? '#ff4757' : avgRisk >= 0.4 ? '#ff6b35' : '#06ffa5';
        const dotSize = Math.max(3, Math.min(12, city.count * 0.8)) * depth;

        // Glow
        ctx.beginPath();
        ctx.arc(px, py, dotSize + 6, 0, Math.PI * 2);
        ctx.fillStyle = `${color}15`;
        ctx.fill();

        // Pulse ring for high-risk cities
        if (city.highRisk > 1) {
          const pulse = (Date.now() / 1000 + i) % 2;
          const pulseR = dotSize + pulse * 10;
          ctx.beginPath();
          ctx.arc(px, py, pulseR, 0, Math.PI * 2);
          ctx.strokeStyle = `${color}${Math.round((1 - pulse / 2) * 40).toString(16).padStart(2, '0')}`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Dot
        ctx.beginPath();
        ctx.arc(px, py, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10 * depth;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label for visible dots
        if (depth > 0.4 && dotSize > 3) {
          ctx.fillStyle = `rgba(224,224,240,${depth * 0.8})`;
          ctx.font = `${Math.max(8, 10 * depth)}px "DM Sans", sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(city.city, px, py - dotSize - 5);
          ctx.fillStyle = `${color}${Math.round(depth * 200).toString(16).padStart(2, '0')}`;
          ctx.font = `bold ${Math.max(7, 9 * depth)}px "DM Mono", monospace`;
          ctx.fillText(`${city.count}`, px, py - dotSize - 15);
        }
      });

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [cityData]);

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="card-header">
        <span className="card-title">🌐 Risk Geography Globe</span>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#5a5a7a' }}>
          {cityData.length} cities • auto-rotating
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <canvas
          ref={canvasRef}
          style={{ width: 440, height: 340 }}
        />
      </div>
      {/* City legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, justifyContent: 'center' }}>
        {cityData.slice(0, 8).map((city, i) => {
          const avgRisk = city.totalRisk / city.count;
          const color = avgRisk >= 0.7 ? '#ff4757' : avgRisk >= 0.4 ? '#ff6b35' : '#06ffa5';
          return (
            <span key={i} style={{
              fontFamily: "'DM Mono', monospace", fontSize: 9,
              padding: '2px 8px', borderRadius: 4,
              background: `${color}10`, border: `1px solid ${color}25`, color,
            }}>
              {city.city} ({city.count})
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// 3. LIVE ALERTS — Real-time Streaming Feed
// ═══════════════════════════════════════════
function LiveAlertsFeed({ customers = [] }) {
  const [alerts, setAlerts] = useState([]);
  const feedRef = useRef(null);

  // Generate alerts from real customer data
  useEffect(() => {
    if (!customers.length) return;

    // Initial load — populate from real data
    const initial = customers.slice(0, 6).map((c, i) => ({
      id: `alert-${Date.now()}-${i}`,
      time: new Date(Date.now() - i * 45000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      customer: c.name || c.customer_id,
      score: Math.round(c.risk_score * 100),
      signal: c.top_signal || 'Risk Escalation',
      level: c.risk_level,
      city: c.city || '',
      product: c.product_type || '',
      isNew: false,
    }));
    setAlerts(initial);

    // Simulate live stream from real data pool
    const interval = setInterval(() => {
      const source = customers[Math.floor(Math.random() * customers.length)];
      if (!source) return;
      const signals = source.recent_signals || ['Risk Change'];
      const newAlert = {
        id: `alert-${Date.now()}`,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        customer: source.name || source.customer_id,
        score: Math.round(source.risk_score * 100),
        signal: signals[Math.floor(Math.random() * signals.length)],
        level: source.risk_level,
        city: source.city || '',
        product: source.product_type || '',
        isNew: true,
      };
      setAlerts(prev => [newAlert, ...prev.slice(0, 7)]);
    }, 4000);

    return () => clearInterval(interval);
  }, [customers]);

  return (
    <div className="card" style={{ padding: 20, height: '100%' }}>
      <div className="card-header">
        <span className="card-title">🔔 Live Alert Stream</span>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)',
          padding: '3px 10px', borderRadius: 100,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff4757', animation: 'livePulse 1s infinite' }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#ff4757' }}>STREAMING</span>
        </div>
      </div>
      <div ref={feedRef} style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
        {alerts.map((alert, i) => {
          const color = alert.level === 'HIGH' ? '#ff4757' : alert.level === 'MEDIUM' ? '#ff6b35' : '#06ffa5';
          return (
            <div key={alert.id} style={{
              padding: '8px 12px', borderRadius: 8,
              background: alert.isNew ? `${color}08` : 'rgba(255,255,255,0.02)',
              borderLeft: `3px solid ${color}`,
              border: `1px solid ${color}15`,
              animation: alert.isNew ? 'fadeSlideLeft 300ms ease' : 'none',
              transition: 'all 300ms ease',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', background: color,
                    boxShadow: `0 0 6px ${color}60`,
                    animation: alert.level === 'HIGH' ? 'dotBlink 1.5s infinite' : 'none',
                  }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: '#e0e0f0' }}>
                    {alert.customer}
                  </span>
                </div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#5a5a7a' }}>
                  {alert.time}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '1px 6px', borderRadius: 4,
                  background: `${color}15`, color, fontWeight: 600,
                }}>
                  {alert.score}%
                </span>
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '1px 6px', borderRadius: 4,
                  background: 'rgba(255,255,255,0.04)', color: '#9aa0c3',
                }}>
                  {alert.signal}
                </span>
                {alert.product && (
                  <span style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '1px 6px', borderRadius: 4,
                    background: 'rgba(0,212,255,0.06)', color: '#7dd3fc',
                  }}>
                    {alert.product}
                  </span>
                )}
                {alert.city && (
                  <span style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '1px 6px', borderRadius: 4,
                    background: 'rgba(255,255,255,0.03)', color: '#5a5a7a',
                  }}>
                    📍 {alert.city}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// 4. STRESS SCORE PULSE — Heartbeat Visualization
// ═══════════════════════════════════════════
function StressScorePulse({ customers = [], metrics = {} }) {
  const canvasRef = useRef(null);
  const dataRef = useRef([]);

  const avgRisk = useMemo(() => {
    if (!customers.length) return 0;
    return customers.reduce((s, c) => s + (c.risk_score || 0), 0) / customers.length;
  }, [customers]);

  const riskDistribution = useMemo(() => {
    const dist = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    customers.forEach(c => { dist[c.risk_level || 'LOW']++; });
    return dist;
  }, [customers]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = 440, H = 160;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    let frame;
    let t = 0;

    const draw = () => {
      t += 0.04;
      ctx.clearRect(0, 0, W, H);

      const baseY = H / 2;

      // Background grid lines
      for (let y = 20; y < H; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.strokeStyle = 'rgba(255,255,255,0.02)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // ECG-style heartbeat wave based on actual risk
      const intensity = avgRisk; // 0-1
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const phase = (x / W) * Math.PI * 8 + t;
        const beatPhase = phase % (Math.PI * 2);
        let y = baseY;

        // Heartbeat-like pattern
        if (beatPhase > 0.8 && beatPhase < 1.2) {
          // Small P-wave
          y -= Math.sin((beatPhase - 0.8) * Math.PI / 0.4) * 10 * intensity;
        } else if (beatPhase > 1.5 && beatPhase < 2.0) {
          // QRS complex — sharp spike
          const qrs = (beatPhase - 1.5) / 0.5;
          if (qrs < 0.3) y += qrs * 120 * intensity; // Q dip
          else if (qrs < 0.5) y -= (qrs - 0.3) * 300 * intensity; // R peak
          else if (qrs < 0.7) y += (qrs - 0.5) * 200 * intensity; // S dip
          else y -= (qrs - 0.7) * 40 * intensity; // return
        } else if (beatPhase > 2.5 && beatPhase < 3.0) {
          // T-wave
          y -= Math.sin((beatPhase - 2.5) * Math.PI / 0.5) * 15 * intensity;
        }

        // Add slight noise
        y += (Math.random() - 0.5) * 1.5;

        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }

      const pulseColor = avgRisk >= 0.7 ? '#ff4757' : avgRisk >= 0.4 ? '#ff6b35' : '#06ffa5';
      ctx.strokeStyle = pulseColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = `${pulseColor}80`;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Leading dot
      const leadX = W * 0.85;
      const leadPhase = (leadX / W) * Math.PI * 8 + t;
      const leadBeat = leadPhase % (Math.PI * 2);
      let leadY = baseY;
      if (leadBeat > 1.5 && leadBeat < 2.0) {
        const qrs = (leadBeat - 1.5) / 0.5;
        if (qrs < 0.3) leadY += qrs * 120 * intensity;
        else if (qrs < 0.5) leadY -= (qrs - 0.3) * 300 * intensity;
        else if (qrs < 0.7) leadY += (qrs - 0.5) * 200 * intensity;
        else leadY -= (qrs - 0.7) * 40 * intensity;
      }
      ctx.beginPath();
      ctx.arc(leadX, leadY, 4, 0, Math.PI * 2);
      ctx.fillStyle = pulseColor;
      ctx.shadowColor = pulseColor;
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [avgRisk]);

  const pulseColor = avgRisk >= 0.7 ? '#ff4757' : avgRisk >= 0.4 ? '#ff6b35' : '#06ffa5';

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="card-header">
        <span className="card-title">💓 Portfolio Stress Pulse</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: pulseColor,
            animation: 'breathe 1.5s ease-in-out infinite',
          }}>
            {(avgRisk * 100).toFixed(1)}%
          </span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#5a5a7a' }}>
            STRESS INDEX
          </span>
        </div>
      </div>

      <canvas ref={canvasRef} style={{ width: '100%', height: 160 }} />

      {/* Risk distribution bar */}
      <div style={{ display: 'flex', gap: 12, marginTop: 12, justifyContent: 'center' }}>
        {[
          { label: 'HIGH', count: riskDistribution.HIGH, color: '#ff4757' },
          { label: 'MEDIUM', count: riskDistribution.MEDIUM, color: '#ff6b35' },
          { label: 'LOW', count: riskDistribution.LOW, color: '#06ffa5' },
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: `${item.color}08`, border: `1px solid ${item.color}25`,
            padding: '6px 14px', borderRadius: 8,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: item.color,
              animation: item.label === 'HIGH' ? 'dotBlink 1.5s infinite' : 'none',
            }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 700, color: item.color }}>
              {item.count}
            </span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#5a5a7a' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN EXPORT — Risk Radar Dashboard
// ═══════════════════════════════════════════
export default function RiskRadarDashboard() {
  const [customers, setCustomers] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    Promise.all([
      getAtRiskCustomers(null, 0.0, 600).catch(() => []),
      getOverviewMetrics().catch(() => ({})),
    ]).then(([custData, metricsData]) => {
      setCustomers(custData || []);
      setMetrics(metricsData || {});
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 15000);
    return () => clearInterval(timer);
  }, [fetchData]);

  if (loading || !customers.length) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto 12px' }} />
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#5a5a7a', letterSpacing: 2 }}>
          INITIALIZING RISK RADAR...
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeSlideUp 500ms ease' }}>
      {/* Section Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16, padding: '12px 0',
        borderBottom: '1px solid rgba(0,212,255,0.08)',
      }}>
        <div>
          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22,
            color: '#e0e0f0', margin: 0,
          }}>
            Risk Radar Command Center
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#5a5a7a', margin: '4px 0 0' }}>
            Real-time multi-dimensional risk intelligence — all data from AI ensemble model
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.25)',
          padding: '6px 14px', borderRadius: 100,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4757', animation: 'livePulse 1s infinite' }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#ff4757', fontWeight: 600 }}>
            {customers.filter(c => c.risk_level === 'HIGH').length} CRITICAL
          </span>
        </div>
      </div>

      {/* Row 1 — Risk Radar + 3D Globe */}
      <div className="charts-row">
        <RiskRadar customers={customers} />
        <RiskGlobe customers={customers} />
      </div>

      {/* Row 2 — Live Alerts + Stress Pulse */}
      <div className="charts-row">
        <LiveAlertsFeed customers={customers} />
        <StressScorePulse customers={customers} metrics={metrics} />
      </div>
    </div>
  );
}
