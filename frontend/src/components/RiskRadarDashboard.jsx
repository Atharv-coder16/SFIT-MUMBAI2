import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from 'recharts';
import { getAtRiskCustomers, getOverviewMetrics } from '../api/client';

/* ═══════════════════════════════════════════
   RISK RADAR DASHBOARD — Premium UI/UX
   India Topography Map + Recharts Radar + Live Stream
   ═══════════════════════════════════════════ */

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

/* ── Custom Premium Tooltip ── */
const RadarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(10,10,15,0.85)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12, padding: '12px 18px',
      boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
      backdropFilter: 'blur(24px)', zIndex: 100
    }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: '#e8e8f0', marginBottom: 8 }}>
        {payload[0].payload.axis}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: payload[0].color, boxShadow: `0 0 8px ${payload[0].color}` }} />
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: payload[0].color, fontWeight: 700 }}>
          {payload[0].value.toFixed(1)}% Stress
        </span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   1. RISK RADAR — Recharts Premium
   ═══════════════════════════════════════════ */
function RiskRadar({ customers = [] }) {
  const radarData = useMemo(() => {
    if (!customers.length) return [];
    const n = customers.length;
    const counts = {
      'Salary Delay': 0, 'Failed Autodebit': 0, 'Lender UPI': 0,
      'High Utilization': 0, 'Utility Delay': 0, 'ATM Spike': 0
    };
    customers.forEach(c => {
      (c.recent_signals || []).forEach(sig => {
        const s = sig.toLowerCase();
        if (s.includes('salary')) counts['Salary Delay'] += 100 / n;
        else if (s.includes('fail') || s.includes('bounce')) counts['Failed Autodebit'] += 100 / n;
        else if (s.includes('upi') || s.includes('lender')) counts['Lender UPI'] += 100 / n;
        else if (s.includes('util')) counts['High Utilization'] += 100 / n;
        else if (s.includes('utilit')) counts['Utility Delay'] += 100 / n;
        else if (s.includes('atm')) counts['ATM Spike'] += 100 / n;
      });
    });
    return Object.keys(counts).map(k => ({ axis: k, value: Math.min(100, counts[k]) }));
  }, [customers]);

  return (
    <div style={{
      background: 'var(--bg-surface-1)', border: '1px solid rgba(255,255,255,0.04)',
      borderRadius: 16, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'rgba(255,71,87,0.05)', filter: 'blur(60px)', borderRadius: '50%' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: '#e8e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
            🔴 Multi-Axis Risk Signatures
          </span>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#5a5a7a', marginTop: 4 }}>
            Aggregated signal mapping across active portfolio
          </div>
        </div>
      </div>
      
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
            <defs>
              <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff4757" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#ff4757" stopOpacity={0.1} />
              </linearGradient>
              <filter id="radarGlow">
                <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#ff4757" floodOpacity="0.6" />
              </filter>
            </defs>
            <PolarGrid stroke="rgba(255,255,255,0.06)" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: '#9999bb', fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip content={<RadarTooltip />} />
            <Radar
              name="Risk Concentration %"
              dataKey="value"
              stroke="#ff4757"
              strokeWidth={3}
              fill="url(#radarFill)"
              fillOpacity={1}
              filter="url(#radarGlow)"
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   2. INDIA MAP — 2D Topography
   ═══════════════════════════════════════════ */
function IndiaRiskMap({ customers = [] }) {
  const cityData = useMemo(() => {
    const map = {};
    customers.forEach(c => {
      const city = c.city || 'Unknown';
      if (!map[city] && CITY_COORDS[city]) map[city] = { city, count: 0, highRisk: 0, totalRisk: 0, coords: CITY_COORDS[city] };
      if (map[city]) {
        map[city].count++;
        if (c.risk_level === 'HIGH') map[city].highRisk++;
        map[city].totalRisk += c.risk_score || 0;
      }
    });
    return Object.values(map);
  }, [customers]);

  // Map Lon/Lat to percentages (India approx bounds: Lon 68 to 97, Lat 8 to 38)
  const getX = (lon) => `${((lon - 68) / (97 - 68)) * 100}%`;
  const getY = (lat) => `${((38 - lat) / (38 - 8)) * 100}%`;

  return (
    <div style={{
      background: 'var(--bg-surface-1)', border: '1px solid rgba(255,255,255,0.04)',
      borderRadius: 16, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 300, background: 'rgba(0,212,255,0.05)', filter: 'blur(60px)', borderRadius: '50%' }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: '#e8e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
            🗺️ India Intelligence Matrix
          </span>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#5a5a7a', marginTop: 4 }}>
            Geographic risk density distribution
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4757', boxShadow: '0 0 8px #ff4757' }} /><span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: '#9999bb' }}>Critical</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff6b35', boxShadow: '0 0 8px #ff6b35' }} /><span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: '#9999bb' }}>Elevated</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06ffa5', boxShadow: '0 0 8px #06ffa5' }} /><span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: '#9999bb' }}>Stable</span></div>
        </div>
      </div>

      <div style={{ width: '100%', height: 300, position: 'relative' }}>
        {/* Abstract India Background SVG */}
        <svg width="100%" height="100%" preserveAspectRatio="none" style={{ position: 'absolute', opacity: 0.05 }}>
          <polygon points="20,10 50,0 80,10 95,40 100,70 80,90 50,100 20,80 5,60 10,30" fill="#00d4ff" />
        </svg>

        {cityData.map((data, i) => {
          const avgRisk = data.totalRisk / data.count;
          const color = avgRisk >= 0.7 ? '#ff4757' : avgRisk >= 0.4 ? '#ff6b35' : '#06ffa5';
          const size = Math.max(12, Math.min(30, data.count * 1.5));
          
          return (
            <div key={i} style={{
              position: 'absolute',
              left: getX(data.coords.lon),
              top: getY(data.coords.lat),
              transform: 'translate(-50%, -50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
              <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: color, animation: 'sonarPing 2s infinite', opacity: 0.3 }} />
                <span style={{ width: size * 0.4, height: size * 0.4, borderRadius: '50%', background: color, boxShadow: `0 0 12px ${color}` }} />
              </div>
              <div style={{
                position: 'absolute', top: '100%', marginTop: 2,
                background: 'rgba(10,10,15,0.8)', border: `1px solid ${color}40`,
                padding: '2px 6px', borderRadius: 4, backdropFilter: 'blur(4px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center'
              }}>
                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, color: '#e0e0f0' }}>{data.city}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color }}>Vol: {data.count}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   3. LIVE ALERTS — Real-time Streaming Feed
   ═══════════════════════════════════════════ */
function LiveAlertsFeed({ customers = [] }) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!customers.length) return;
    const initial = customers.slice(0, 8).map((c, i) => ({
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
    <div style={{
      background: 'var(--bg-surface-1)', border: '1px solid rgba(255,255,255,0.04)',
      borderRadius: 16, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      marginTop: 24
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: '#e8e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
            🔔 Intelligent Neural Feed
          </span>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#5a5a7a', marginTop: 4 }}>
            Continuous real-time anomaly detection stream
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)',
          padding: '4px 12px', borderRadius: 100,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff4757', animation: 'livePulse 1s infinite' }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#ff4757' }}>TRACKING LIVE</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
        {alerts.map((alert, i) => {
          const color = alert.level === 'HIGH' ? '#ff4757' : alert.level === 'MEDIUM' ? '#ff6b35' : '#06ffa5';
          return (
            <div key={alert.id} style={{
              padding: '16px', borderRadius: 12,
              background: alert.isNew ? `linear-gradient(90deg, ${color}15, rgba(255,255,255,0.02))` : 'rgba(255,255,255,0.02)',
              borderLeft: `4px solid ${color}`,
              border: `1px solid ${color}22`,
              animation: alert.isNew ? 'slideInLeft 400ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
              transition: 'all 400ms ease',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%', background: color,
                    boxShadow: `0 0 10px ${color}`,
                    animation: alert.level === 'HIGH' ? 'dotBlink 1s infinite' : 'none',
                  }} />
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: '#e0e0f0' }}>
                    {alert.customer}
                  </span>
                </div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#9999bb' }}>
                  {alert.time}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 11, padding: '2px 8px', borderRadius: 6,
                  background: `${color}15`, color, fontWeight: 700,
                }}>
                  {alert.score}% MODEL CONFIDENCE
                </span>
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 11, padding: '2px 8px', borderRadius: 6,
                  background: 'rgba(255,255,255,0.05)', color: '#e8e8f0', border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  {alert.signal}
                </span>
                {alert.city && (
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#5a5a7a', display: 'flex', alignItems: 'center' }}>
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

/* ═══════════════════════════════════════════
   MAIN EXPORT — Risk Radar Dashboard
   ═══════════════════════════════════════════ */
export default function RiskRadarDashboard() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    Promise.all([
      getAtRiskCustomers(null, 0.0, 600).catch(() => []),
    ]).then(([custData]) => {
      setCustomers(custData || []);
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
      <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg-surface-1)', borderRadius: 16 }}>
        <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto 12px' }} />
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#5a5a7a', letterSpacing: 2 }}>
          INITIALIZING RISK COMMAND MATRIX...
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeSlideUp 600ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
      {/* Container Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20, padding: '16px 24px',
        background: 'linear-gradient(90deg, rgba(0,212,255,0.05), transparent)',
        borderLeft: '4px solid #00d4ff', borderRadius: 8,
      }}>
        <div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 24, color: '#e0e0f0', margin: 0 }}>
            Risk Radar Matrix
          </h2>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)',
          padding: '6px 16px', borderRadius: 100,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4757', animation: 'livePulse 1s infinite' }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#ff4757', fontWeight: 700 }}>
            {customers.filter(c => c.risk_level === 'HIGH').length} CRITICAL ENTITIES DETECTED
          </span>
        </div>
      </div>

      {/* Grid Row: Radar + India Map */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <RiskRadar customers={customers} />
        <IndiaRiskMap customers={customers} />
      </div>

      {/* Full Width Live Alerts */}
      <LiveAlertsFeed customers={customers} />
    </div>
  );
}
