import React, { useState, useEffect, lazy, Suspense } from 'react';
import LandingHero from './components/LandingHero';
import { login, getAtRiskCustomers } from './api/client';

const Overview = lazy(() => import('./components/Overview'));
const LiveFlagging = lazy(() => import('./components/LiveFlagging'));
const RulesShap = lazy(() => import('./components/RulesShap'));

const ModelPredict = lazy(() => import('./components/ModelPredict'));

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [scrolled, setScrolled] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [clock, setClock] = useState('');
  const [fadeKey, setFadeKey] = useState(0);
  const [badgeFlash, setBadgeFlash] = useState(false);

  const [liveCount, setLiveCount] = useState('...');
  const [liveCustomers, setLiveCustomers] = useState([]);
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('light-mode', isLightMode);
  }, [isLightMode]);

  useEffect(() => {
    if (activeTab === 'landing') return;

    const refreshLiveFeed = () => {
      getAtRiskCustomers(null, 0.40, 200)
        .then(data => {
          const rows = Array.isArray(data) ? data : [];
          setLiveCustomers(rows);
          setLiveCount(rows.filter(c => (c?.risk_score || 0) >= 0.70).length);
        })
        .catch(() => {
          setLiveCustomers([]);
          setLiveCount('!');
        });
    };

    login().then(() => {
      setLoggedIn(true);
      refreshLiveFeed();
    }).catch(() => {
      setLoggedIn(true);
      refreshLiveFeed();
    });

    const feedTimer = setInterval(refreshLiveFeed, 15000);
    const timer = setInterval(() => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);

    // Badge flash every 30s
    const flashTimer = setInterval(() => {
      setBadgeFlash(true);
      setTimeout(() => setBadgeFlash(false), 1500);
    }, 30000);

    return () => {
      clearInterval(feedTimer);
      clearInterval(timer);
      clearInterval(flashTimer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activeTab]);

  const handleTabChange = (tab) => {
    setFadeKey(k => k + 1);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'predict', label: 'AI Predict' },
    { id: 'live', label: 'Live Flagging', liveDot: true, badge: liveCount, badgeColor: 'rgba(255,71,87,0.15)', badgeText: '#ff4757' },
    { id: 'rules', label: 'Rules & SHAP' },
  ];

  // Landing page = no navbar
  if (activeTab === 'landing') {
    return (
      <LandingHero onEnterDashboard={() => handleTabChange('overview')} />
    );
  }

  return (
    <>
      {/* NAVBAR */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-logo" onClick={() => handleTabChange('landing')}>
          <div className="dot"></div>
          <span>Praeven<span className="cyan">tix</span></span>
        </div>

        <div className="nav-tabs">
          {tabs.map(t => (
            <button key={t.id}
              className={`nav-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => handleTabChange(t.id)}>
              {t.label}
              {t.liveDot && <span className="live-dot" />}
              {t.badge && (
                <span
                  className="nav-badge"
                  style={{
                    background: badgeFlash ? 'rgba(245,158,11,0.25)' : t.badgeColor,
                    color: t.badgeText,
                    transition: 'background 300ms ease',
                  }}
                >
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="nav-right">
          <div className="status-badge">
            <div className="dot"></div>
            <span>System Live</span>
          </div>
          
          <button 
            className="theme-toggle-btn"
            onClick={() => setIsLightMode(!isLightMode)}
            aria-label="Toggle Light Mode"
          >
            {isLightMode ? (
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
              </svg>
            ) : (
               <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                 <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z" />
               </svg>
            )}
          </button>

          <div className="nav-bell">
            <svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 002 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" /></svg>
          </div>
          <div className="nav-avatar">AD</div>
        </div>
      </nav>

      {/* PAGE CONTENT */}
      <div className="page-content" key={fadeKey}>
        <Suspense fallback={<div style={{ padding: '32px 0', color: '#9999bb', fontFamily: 'DM Mono, monospace' }}>Loading module...</div>}>
          {activeTab === 'overview' && <Overview clock={clock} />}
          {activeTab === 'predict' && <ModelPredict seedCustomer={liveCustomers[0] || null} />}
          {activeTab === 'live' && <LiveFlagging />}
          {activeTab === 'rules' && <RulesShap defaultCustomerId={liveCustomers[0]?.customer_id || ''} />}

        </Suspense>
      </div>

      {/* TOAST CONTAINER */}
      <div id="toast-container" className="toast-container"></div>
    </>
  );
}
