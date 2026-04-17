import React, { useEffect, useRef } from 'react';
import { TextRevealCardPreview } from './ui/TextRevealCard';
import TubesCursor from 'threejs-components/build/cursors/tubes1.min.js';

/* ═══════════════════════════════════════════
   LANDING HERO — TextRevealCard + Tubes Cursor + Neural Net
   Matches reference: https://codepen.io/kevin-levron/
   ═══════════════════════════════════════════ */

// ── Neural Brain Cells (Particle Network) Background ──
function NeuralBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let mouse = { x: null, y: null, radius: 250 };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseOut = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseOut);

    const nodes = [];
    const numNodes = Math.floor((width * height) / 10000); 

    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
      });
    }

    let animationFrameId;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; // Bright white center
      ctx.lineWidth = 1.5;

      for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        
        node.x += node.vx;
        node.y += node.vy;

        // Bounce
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Core Hover Effect: Repulsion and connecting lines to cursor
        if (mouse.x !== null && mouse.y !== null) {
          let dx = mouse.x - node.x;
          let dy = mouse.y - node.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < mouse.radius) {
            let forceDirectionX = dx / distance;
            let forceDirectionY = dy / distance;
            let force = (mouse.radius - distance) / mouse.radius;
            
            // Push node away softly
            node.x -= forceDirectionX * force * 5;
            node.y -= forceDirectionY * force * 5;
            
            // Draw interactive ray to cursor (bright white)
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${force * 0.8})`;
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Connect with neighbors
        for (let j = i + 1; j < nodes.length; j++) {
          let other = nodes[j];
          let dx = other.x - node.x;
          let dy = other.y - node.y;
          let dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            let opacity = 1 - (dist / 150);
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.5})`;
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1, // Render OVER the Tubes background
        opacity: 1.0,
      }}
    />
  );
}

// ── Interactive Tubes 3D Cursor Background ──
function TubesBackground() {
  const canvasRef = useRef(null);
  const appRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Guard: prevent double-init from React StrictMode
    if (appRef.current) return;

    appRef.current = TubesCursor(canvas, {
      tubes: {
        colors: ["#00d4ff", "#6366F1", "#f967fb"],
        lights: {
          intensity: 200,
          colors: ["#83f36e", "#fe8a2e", "#ff008a", "#60aed5"]
        }
      }
    });

    return () => {
      if (appRef.current && appRef.current.destroy) {
        appRef.current.destroy();
        appRef.current = null;
      }
    };
  }, []);

  return (
    <canvas
      id="canvas"
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        overflow: 'hidden',
        zIndex: 0, // Base layer
      }}
    />
  );
}

export default function LandingHero({ onEnterDashboard }) {
  return (
    <>
      {/* Canvas layers — fixed behind everything */}
      <TubesBackground />
      <NeuralBackground />

      {/* Hero content */}
      <div
        className="landing-hero-content"
        style={{
          position: 'relative',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          zIndex: 2, // Ensure text is safely above the Neural Net
          pointerEvents: 'none',
        }}
      >
        {/* Large Praeventix Background Logo Watermark / Title */}
        <div className="watermark-logo">
          Praeven<span className="cyan-text">tix</span>
        </div>

        {/* Visible prominent logo */}
        <div style={{
          display: 'flex', 
          alignItems: 'center', 
          gap: 12, 
          pointerEvents: 'auto',
          marginBottom: 20
        }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#00d4ff', boxShadow: '0 0 20px #00d4ff' }}></div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 36, color: '#fff' }}>
            Praeven<span style={{ color: '#00d4ff', textShadow: '0 0 28px rgba(0,212,255,0.5)' }}>tix</span>
          </span>
        </div>
        {/* Card wrapper — re-enable pointer events for interactivity */}
        <div style={{ pointerEvents: 'auto', width: '100%', maxWidth: 800 }}>
          <TextRevealCardPreview />
        </div>

        {/* CTA Button */}
        <button
          onClick={onEnterDashboard}
          style={{
            pointerEvents: 'auto',
            marginTop: 30,
            padding: '16px 48px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #00d4ff, #6366F1)',
            border: 'none',
            color: '#0a0a0f',
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 16,
            cursor: 'pointer',
            transition: 'all 300ms cubic-bezier(0.25, 0.8, 0.25, 1)',
            letterSpacing: '0.5px',
            boxShadow: '0 8px 30px rgba(0,212,255,0.2)',
            textShadow: 'none',
            userSelect: 'none',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-4px) scale(1.02)';
            e.target.style.boxShadow = '0 16px 40px rgba(0,212,255,0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = '';
            e.target.style.boxShadow = '0 8px 30px rgba(0,212,255,0.2)';
          }}
        >
          Enter Operations Center ⚡
        </button>
      </div>
    </>
  );
}
