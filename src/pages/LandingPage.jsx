/**
 * VaultX — Landing Page
 * Place at: src/pages/LandingPage.jsx
 *
 * Sections:
 *  1. Hero         — particle canvas + floating cards + headline + CTA
 *  2. Live Ticker  — scrolling simulated transfer feed
 *  3. Features     — 6-card feature grid
 *  4. How It Works — animated 3-step flow
 *  5. Stats        — animated counters
 *  6. Security     — compliance badges
 *  7. CTA Footer   — conversion block
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingNav from '../components/LandingNav';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & DATA
// ─────────────────────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  { from: 'Lagos 🇳🇬',    to: 'London 🇬🇧',    amount: '$2,400', time: '8s'  },
  { from: 'Dubai 🇦🇪',    to: 'Accra 🇬🇭',     amount: '€850',   time: '12s' },
  { from: 'New York 🇺🇸', to: 'Nairobi 🇰🇪',   amount: '$5,000', time: '9s'  },
  { from: 'Toronto 🇨🇦',  to: 'Mumbai 🇮🇳',    amount: 'C$720',  time: '14s' },
  { from: 'Singapore 🇸🇬',to: 'Sydney 🇦🇺',    amount: 'S$1,100','time':'7s' },
  { from: 'Paris 🇫🇷',    to: 'Johannesburg 🇿🇦', amount: '€3,200','time':'11s'},
  { from: 'Berlin 🇩🇪',   to: 'Karachi 🇵🇰',   amount: '€600',   time: '16s' },
  { from: 'Miami 🇺🇸',    to: 'São Paulo 🇧🇷',  amount: '$1,850', time: '10s' },
];

const FEATURES = [
  {
    icon: '⚡',
    title: 'Under 30 Seconds',
    body: 'Push-to-Card via Visa Direct and Mastercard Send. Money moves faster than a text message.',
    color: '#00D4FF',
  },
  {
    icon: '🌍',
    title: '200+ Countries',
    body: 'Send to any Visa or Mastercard globally. Real-time FX with a 2-minute rate lock.',
    color: '#00FF88',
  },
  {
    icon: '🔐',
    title: 'Zero-Knowledge Security',
    body: 'We never see your card number. ZKP cryptography verifies ownership without exposure.',
    color: '#7B2FFF',
  },
  {
    icon: '🤖',
    title: 'AI Fraud Shield',
    body: '247 ML features analysed per transaction. Fraud blocked before it happens — not after.',
    color: '#FFB700',
  },
  {
    icon: '👁️',
    title: 'Biometric Only',
    body: 'Face ID or fingerprint confirms every transfer. No passwords. No OTP. No friction.',
    color: '#FF3B3B',
  },
  {
    icon: '📊',
    title: 'Live Pulse View',
    body: 'Watch your money move across the global banking network in real time on an animated map.',
    color: '#00D4FF',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Scan Your Card',
    body: 'Point your camera at your card. OCR reads every field instantly. We tokenise — never store — the number.',
    color: '#00D4FF',
  },
  {
    num: '02',
    title: 'Pick a Recipient',
    body: 'Search by @handle, phone number, or scan their QR code. Confirm it\'s the right person before a single cent moves.',
    color: '#7B2FFF',
  },
  {
    num: '03',
    title: 'Face ID & Done',
    body: 'Glance at your phone. One biometric gesture confirms and fires the transfer. Settled in under 30 seconds.',
    color: '#00FF88',
  },
];

const STATS = [
  { value: 200,  suffix: '+',  label: 'Countries Supported' },
  { value: 30,   suffix: 's',  label: 'Avg Settlement Time' },
  { value: 99.9, suffix: '%',  label: 'Platform Uptime'     },
  { value: 0,    suffix: ' PAN',label: 'Card Numbers Stored' },
];

const TRUST_BADGES = [
  { label: 'PCI-DSS Level 1',    icon: '🏦', sub: 'Highest card data standard' },
  { label: 'ISO 27001',           icon: '🛡️', sub: 'Information security'       },
  { label: 'GDPR Compliant',      icon: '🇪🇺', sub: 'EU data protection'         },
  { label: 'FIDO2 / WebAuthn',    icon: '🔑', sub: 'Passwordless auth standard'  },
  { label: 'ZKP Verified',        icon: '✳️', sub: 'Zero-knowledge proofs'       },
  { label: 'SOC 2 Type II',       icon: '📋', sub: 'Independent audit'          },
];

// ─────────────────────────────────────────────────────────────────────────────
// PARTICLE CANVAS
// ─────────────────────────────────────────────────────────────────────────────
function ParticleCanvas() {
  const ref = useRef(null);
  const mouse = useRef({ x: -999, y: -999 });
  const animId = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const onMouse = (e) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', onMouse, { passive: true });

    // Build particles
    const N = Math.min(100, Math.floor(window.innerWidth / 14));
    const particles = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r:  Math.random() * 1.6 + 0.4,
      color: Math.random() > 0.55 ? '0,212,255' : Math.random() > 0.4 ? '123,47,255' : '0,255,136',
      alpha: Math.random() * 0.45 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouse.current.x;
      const my = mouse.current.y;

      particles.forEach((p, i) => {
        // Mouse repulsion
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (120 - dist) / 120;
          p.vx += (dx / dist) * force * 0.18;
          p.vy += (dy / dist) * force * 0.18;
        }

        // Speed cap
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 2.2) { p.vx *= 2.2 / speed; p.vy *= 2.2 / speed; }

        // Damp & move
        p.vx *= 0.98; p.vy *= 0.98;
        p.x += p.vx;  p.y  += p.vy;

        // Wrap
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Connections
        for (let j = i + 1; j < particles.length; j++) {
          const q   = particles[j];
          const ddx = p.x - q.x;
          const ddy = p.y - q.y;
          const d   = Math.sqrt(ddx * ddx + ddy * ddy);
          if (d < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0,212,255,${0.06 * (1 - d / 110)})`;
            ctx.lineWidth   = 0.6;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        // Dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();
      });

      animId.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <canvas ref={ref} style={{
      position: 'absolute', inset: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 0,
    }} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOATING HOLOGRAPHIC CARDS (Hero visual)
// ─────────────────────────────────────────────────────────────────────────────
function FloatingCards() {
  const [t, setT] = useState(0);

  useEffect(() => {
    let id;
    const tick = () => { setT(p => p + 0.008); id = requestAnimationFrame(tick); };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const senderY  = Math.sin(t)         * 10;
  const senderR  = Math.sin(t * 0.7)   * 4;
  const receiverY= Math.sin(t + 1.8)   * 10;
  const receiverR= Math.sin(t * 0.7 + 1) * -4;

  // Particle along bezier arc
  const progress = (t * 0.6) % 1;
  const p1 = { x: 100,  y: 100 };
  const p2 = { x: 220,  y: -20 };
  const p3 = { x: 340,  y: 100 };
  const px = (1-progress)**2 * p1.x + 2*(1-progress)*progress*p2.x + progress**2*p3.x;
  const py = (1-progress)**2 * p1.y + 2*(1-progress)*progress*p2.y + progress**2*p3.y;

  const cardStyle = (bg1, bg2, accent, translateY, rotate) => ({
    width: 220, height: 138,
    borderRadius: 16,
    background: `linear-gradient(135deg, ${bg1}, ${bg2})`,
    border: `1px solid ${accent}40`,
    boxShadow: `0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px ${accent}20, inset 0 1px 0 rgba(255,255,255,0.06)`,
    position: 'absolute',
    transform: `translateY(${translateY}px) rotate(${rotate}deg)`,
    transition: 'transform 0.05s linear',
    overflow: 'hidden',
    userSelect: 'none',
  });

  const monoText = (children, style = {}) => (
    <span style={{ fontFamily: '"JetBrains Mono", monospace', ...style }}>{children}</span>
  );

  return (
    <div style={{ position: 'relative', width: 440, height: 280, flexShrink: 0 }}>

      {/* SVG arc + particle */}
      <svg width="440" height="280" style={{ position: 'absolute', inset: 0, overflow: 'visible', zIndex: 10 }}>
        <defs>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity="0"/>
            <stop offset="50%" stopColor="#00D4FF" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#7B2FFF" stopOpacity="0"/>
          </linearGradient>
        </defs>

        {/* Dashed arc */}
        <path d={`M 100 170 Q 220 60 340 170`}
          fill="none" stroke="rgba(0,212,255,0.15)" strokeWidth="1.5"
          strokeDasharray="5 6" />

        {/* Animated particle */}
        <circle cx={px} cy={py + 70} r="5" fill="#00D4FF"
          style={{ filter: 'drop-shadow(0 0 8px #00D4FF)' }} />
        <circle cx={px} cy={py + 70} r="10" fill="rgba(0,212,255,0.2)" />

        {/* Arrow tips */}
        <polygon points="340,162 334,172 346,172" fill="#7B2FFF" opacity="0.7"/>
      </svg>

      {/* Sender card */}
      <div style={{ ...cardStyle('#001422', '#002a44', '#00D4FF', senderY, senderR), left: 0, top: 50 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, transparent 30%, rgba(0,212,255,0.07) 50%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 14, right: 16, fontSize: '0.58rem', color: '#00D4FF', fontFamily: '"Orbitron", monospace', fontWeight: 700, letterSpacing: '0.15em', opacity: 0.8 }}>VISA</div>
        <div style={{ position: 'absolute', top: 14, left: 14, width: 8, height: 8, borderRadius: '50%', background: '#00D4FF', boxShadow: '0 0 8px rgba(0,212,255,0.8)' }} />
        {/* Chip */}
        <div style={{ position: 'absolute', top: '36%', left: 14, width: 32, height: 24, borderRadius: 4, background: 'linear-gradient(135deg, rgba(0,212,255,0.3), rgba(0,212,255,0.1))', border: '1px solid rgba(0,212,255,0.4)' }} />
        <div style={{ position: 'absolute', bottom: 38, left: 14, fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', letterSpacing: '0.15em' }}>
          {monoText('•••• •••• •••• 4291')}
        </div>
        <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.44rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginBottom: 2 }}>CARDHOLDER</div>
            <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.06em' }}>{monoText('GIBSON O.')}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.44rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginBottom: 2 }}>EXPIRES</div>
            <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.65)' }}>{monoText('09/28')}</div>
          </div>
        </div>
      </div>

      {/* Receiver card */}
      <div style={{ ...cardStyle('#130a2e', '#2d1a5c', '#7B2FFF', receiverY, receiverR), right: 0, top: 90 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, transparent 30%, rgba(123,47,255,0.08) 50%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 14, right: 16, fontSize: '0.58rem', color: '#7B2FFF', fontFamily: '"Orbitron", monospace', fontWeight: 700, letterSpacing: '0.15em', opacity: 0.9 }}>MASTERCARD</div>
        <div style={{ position: 'absolute', top: 14, left: 14, width: 8, height: 8, borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 8px rgba(0,255,136,0.7)' }} />
        <div style={{ position: 'absolute', top: '36%', left: 14, width: 32, height: 24, borderRadius: 4, background: 'linear-gradient(135deg, rgba(123,47,255,0.35), rgba(123,47,255,0.1))', border: '1px solid rgba(123,47,255,0.4)' }} />
        <div style={{ position: 'absolute', bottom: 38, left: 14, fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', letterSpacing: '0.15em' }}>
          {monoText('•••• •••• •••• 7753')}
        </div>
        <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.44rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginBottom: 2 }}>CARDHOLDER</div>
            <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.06em' }}>{monoText('AMARA K.')}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.44rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginBottom: 2 }}>EXPIRES</div>
            <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.65)' }}>{monoText('12/27')}</div>
          </div>
        </div>
      </div>

      {/* "Settled" toast */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)',
        borderRadius: 12, padding: '8px 18px',
        display: 'flex', alignItems: 'center', gap: 8,
        animation: 'float 3s ease-in-out infinite',
        backdropFilter: 'blur(12px)',
        whiteSpace: 'nowrap', zIndex: 20,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 8px rgba(0,255,136,0.8)' }} />
        <span style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: '0.8rem', fontWeight: 700, color: '#00FF88', letterSpacing: '0.06em' }}>
          SETTLED IN 8.3 SECONDS
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPEWRITER HEADLINE
// ─────────────────────────────────────────────────────────────────────────────
const HEADLINES = [
  'at the speed of light.',
  'without the friction.',
  'globally. Instantly.',
  'the way it should be.',
];

function TypewriterHeadline() {
  const [lineIdx, setLineIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) { const t = setTimeout(() => { setPaused(false); setDeleting(true); }, 2200); return () => clearTimeout(t); }
    const target = HEADLINES[lineIdx];
    if (!deleting) {
      if (displayed.length < target.length) {
        const t = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 55);
        return () => clearTimeout(t);
      } else { setPaused(true); }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 30);
        return () => clearTimeout(t);
      } else { setDeleting(false); setLineIdx(i => (i + 1) % HEADLINES.length); }
    }
  }, [displayed, deleting, paused, lineIdx]);

  return (
    <span style={{ color: '#00D4FF', display: 'inline-block', minWidth: 10 }}>
      {displayed}
      <span style={{ animation: 'blink 1s step-end infinite', color: '#00D4FF' }}>|</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────────────────────────────────────────
function AnimCounter({ value, suffix, label }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const dur = 1800;
        const start = performance.now();
        const step = (now) => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setCount(parseFloat((eased * value).toFixed(value % 1 !== 0 ? 1 : 0)));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.4 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: '"Orbitron", monospace', fontSize: 'clamp(2rem, 5vw, 3rem)',
        fontWeight: 800, color: '#00D4FF', lineHeight: 1,
        textShadow: '0 0 30px rgba(0,212,255,0.4)',
        letterSpacing: '-0.02em',
      }}>
        {count}{suffix}
      </div>
      <div style={{ fontSize: '0.82rem', color: 'rgba(240,244,255,0.5)', marginTop: 8, fontWeight: 500, letterSpacing: '0.04em' }}>
        {label}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCROLL REVEAL WRAPPER
// ─────────────────────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, direction = 'up' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const transforms = { up: 'translateY(36px)', down: 'translateY(-36px)', left: 'translateX(36px)', right: 'translateX(-36px)' };

  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translate(0)' : transforms[direction],
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE TRANSFER TICKER
// ─────────────────────────────────────────────────────────────────────────────
function LiveTicker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div style={{ overflow: 'hidden', padding: '20px 0', position: 'relative' }}>
      {/* Edge fades */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(to right, #080810, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(to left, #080810, transparent)', zIndex: 2, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', gap: 16, animation: 'ticker 32s linear infinite', willChange: 'transform' }}>
        {doubled.map((item, i) => (
          <div key={i} style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 20px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(0,212,255,0.1)',
            borderRadius: 100,
            whiteSpace: 'nowrap',
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 6px rgba(0,255,136,0.8)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: 'rgba(240,244,255,0.6)', fontFamily: '"Rajdhani", sans-serif', fontWeight: 500 }}>
              {item.from}
            </span>
            <span style={{ color: 'rgba(0,212,255,0.4)', fontSize: '0.7rem' }}>→</span>
            <span style={{ fontSize: '0.8rem', color: 'rgba(240,244,255,0.6)', fontFamily: '"Rajdhani", sans-serif' }}>
              {item.to}
            </span>
            <span style={{ fontFamily: '"Orbitron", monospace', fontSize: '0.78rem', fontWeight: 700, color: '#00FF88' }}>
              {item.amount}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'rgba(240,244,255,0.3)' }}>in {item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();

  const sectionStyle = (bg = 'transparent') => ({
    position: 'relative', padding: '100px 24px',
    background: bg, overflow: 'hidden',
  });

  const innerStyle = {
    maxWidth: 1100, margin: '0 auto',
  };

  return (
    <div style={{ background: '#080810', color: '#F0F4FF', fontFamily: '"Rajdhani", sans-serif', overflowX: 'hidden' }}>

      {/* ── GLOBAL STYLES ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes float {
          0%,100% { transform: translateX(-50%) translateY(0);  }
          50%      { transform: translateX(-50%) translateY(-8px); }
        }
        @keyframes blink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0; }
        }
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes spin-ring {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%,100% { box-shadow: 0 0 20px rgba(0,212,255,0.2); }
          50%      { box-shadow: 0 0 50px rgba(0,212,255,0.5); }
        }
        @keyframes shimmer {
          0%   { opacity: 0.4; }
          50%  { opacity: 1;   }
          100% { opacity: 0.4; }
        }

        .feature-card:hover {
          border-color: rgba(0,212,255,0.25) !important;
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.45) !important;
        }
        .step-card:hover .step-num {
          text-shadow: 0 0 30px currentColor;
        }
        .cta-btn-primary:hover {
          box-shadow: 0 0 48px rgba(0,212,255,0.6) !important;
          transform: translateY(-2px);
        }
        .cta-btn-secondary:hover {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(0,212,255,0.4) !important;
        }
      `}</style>

      {/* ─── NAV ─────────────────────────────────────────── */}
      <LandingNav />

      {/* ─── HERO ────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden', padding: '100px 24px 60px' }}>
        <ParticleCanvas />

        {/* Radial glows */}
        <div style={{ position: 'absolute', top: '15%', left: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,47,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ ...innerStyle, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 48, flexWrap: 'wrap', width: '100%' }}>

          {/* Hero copy */}
          <div style={{ flex: '1 1 440px', maxWidth: 580 }}>
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 100, marginBottom: 28 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 8px rgba(0,255,136,0.8)', animation: 'shimmer 2s ease-in-out infinite' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#00D4FF', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Push-to-Card · Visa Direct · Mastercard Send</span>
            </div>

            {/* Headline */}
            <h1 style={{ fontFamily: '"Orbitron", monospace', fontSize: 'clamp(2rem, 5vw, 3.4rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: 24, color: '#F0F4FF' }}>
              Send money<br />
              <TypewriterHeadline />
            </h1>

            <p style={{ fontSize: '1.05rem', color: 'rgba(240,244,255,0.6)', lineHeight: 1.75, marginBottom: 36, maxWidth: 460, fontWeight: 400 }}>
              VaultX transfers funds directly between cards — debit or credit — anywhere in the world, in under 30 seconds. No bank accounts. No wire transfers. No waiting.
            </p>

            {/* CTA row */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className="cta-btn-primary"
                onClick={() => navigate('/auth')}
                style={{
                  padding: '15px 36px',
                  background: 'linear-gradient(135deg, #00D4FF, #0099BB)',
                  border: 'none', borderRadius: 14,
                  color: '#080810', fontFamily: '"Orbitron", monospace',
                  fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.1em',
                  cursor: 'pointer', boxShadow: '0 0 30px rgba(0,212,255,0.4)',
                  transition: 'all 0.25s ease', animation: 'pulse-glow 3s ease-in-out infinite',
                }}>
                START SENDING FREE
              </button>
              <button
                className="cta-btn-secondary"
                onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  padding: '15px 28px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 14,
                  color: 'rgba(240,244,255,0.7)',
                  fontFamily: '"Rajdhani", sans-serif',
                  fontSize: '0.92rem', fontWeight: 600, letterSpacing: '0.08em',
                  cursor: 'pointer', transition: 'all 0.25s ease',
                }}>
                See How It Works →
              </button>
            </div>

            {/* Trust row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 28 }}>
              {[['🔒', 'PCI-DSS Level 1'], ['🛡️', 'ZKP Security'], ['⚡', 'Instant Settlement'], ['🌍', '200+ Countries']].map(([icon, txt]) => (
                <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'rgba(240,244,255,0.4)' }}>
                  <span>{icon}</span>{txt}
                </div>
              ))}
            </div>
          </div>

          {/* Floating cards visual */}
          <div style={{ flex: '1 1 360px', display: 'flex', justifyContent: 'center' }}>
            <FloatingCards />
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: 0.35 }}>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, transparent, #00D4FF)', animation: 'shimmer 2s ease-in-out infinite' }} />
          <span style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#00D4FF' }}>Scroll</span>
        </div>
      </section>

      {/* ─── LIVE TICKER ─────────────────────────────────── */}
      <div style={{ background: 'rgba(0,212,255,0.025)', borderTop: '1px solid rgba(0,212,255,0.07)', borderBottom: '1px solid rgba(0,212,255,0.07)', padding: '4px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 24px 0 0' }}>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRight: '1px solid rgba(0,212,255,0.1)', whiteSpace: 'nowrap' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 8px rgba(0,255,136,0.8)', animation: 'shimmer 1.5s infinite' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', color: '#00D4FF', fontFamily: '"Orbitron", monospace' }}>LIVE</span>
          </div>
          <LiveTicker />
        </div>
      </div>

      {/* ─── FEATURES ────────────────────────────────────── */}
      <section id="features" style={sectionStyle()}>
        <div style={innerStyle}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <div style={{ display: 'inline-block', padding: '6px 18px', background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 100, marginBottom: 20 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#00D4FF', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Built Different</span>
              </div>
              <h2 style={{ fontFamily: '"Orbitron", monospace', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>
                Everything your bank<br />should have built years ago.
              </h2>
              <p style={{ fontSize: '1rem', color: 'rgba(240,244,255,0.5)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
                We built the infrastructure your bank refused to. Every feature engineered for the 2026–2030 global payments landscape.
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 80} direction={i % 2 === 0 ? 'left' : 'right'}>
                <div className="feature-card" style={{
                  padding: '28px 24px',
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 20,
                  transition: 'all 0.3s ease',
                  cursor: 'default',
                  height: '100%',
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: 16 }}>{f.icon}</div>
                  <h3 style={{ fontFamily: '"Orbitron", monospace', fontSize: '0.95rem', fontWeight: 700, color: f.color, marginBottom: 10, letterSpacing: '0.04em' }}>{f.title}</h3>
                  <p style={{ fontSize: '0.88rem', color: 'rgba(240,244,255,0.55)', lineHeight: 1.7 }}>{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────── */}
      <section id="how" style={sectionStyle('rgba(0,212,255,0.015)')}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(0,212,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
        <div style={{ ...innerStyle, position: 'relative' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 72 }}>
              <div style={{ display: 'inline-block', padding: '6px 18px', background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: 100, marginBottom: 20 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#00FF88', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Three Steps</span>
              </div>
              <h2 style={{ fontFamily: '"Orbitron", monospace', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, lineHeight: 1.2 }}>
                From scan to settled<br />in under 30 seconds.
              </h2>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 0, position: 'relative' }}>
            {/* Connector line (desktop only) */}
            <div style={{ position: 'absolute', top: 48, left: '16.5%', right: '16.5%', height: 1, background: 'linear-gradient(to right, #00D4FF44, #7B2FFF44, #00FF8844)', pointerEvents: 'none' }} />

            {STEPS.map((step, i) => (
              <Reveal key={step.num} delay={i * 130}>
                <div className="step-card" style={{ padding: '0 32px 0', textAlign: 'center' }}>
                  {/* Number circle */}
                  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${step.color}12`, border: `2px solid ${step.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                      <div style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: `1px solid ${step.color}18`, animation: 'spin-ring 8s linear infinite' }} />
                      <span className="step-num" style={{ fontFamily: '"Orbitron", monospace', fontSize: '1.4rem', fontWeight: 900, color: step.color, transition: 'text-shadow 0.3s' }}>{step.num}</span>
                    </div>
                  </div>
                  <h3 style={{ fontFamily: '"Orbitron", monospace', fontSize: '0.92rem', fontWeight: 700, color: '#F0F4FF', marginBottom: 12, letterSpacing: '0.04em' }}>{step.title}</h3>
                  <p style={{ fontSize: '0.88rem', color: 'rgba(240,244,255,0.5)', lineHeight: 1.75 }}>{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ───────────────────────────────────────── */}
      <section style={{ ...sectionStyle(), borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={innerStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48 }}>
            {STATS.map(s => <AnimCounter key={s.label} {...s} />)}
          </div>
        </div>
      </section>

      {/* ─── SECURITY ────────────────────────────────────── */}
      <section id="security" style={sectionStyle()}>
        <div style={innerStyle}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <div style={{ display: 'inline-block', padding: '6px 18px', background: 'rgba(123,47,255,0.07)', border: '1px solid rgba(123,47,255,0.2)', borderRadius: 100, marginBottom: 20 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7B2FFF', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Enterprise Grade</span>
              </div>
              <h2 style={{ fontFamily: '"Orbitron", monospace', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>
                Security that doesn't<br />ask you to compromise.
              </h2>
              <p style={{ fontSize: '1rem', color: 'rgba(240,244,255,0.5)', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
                Zero-Knowledge Proofs mean we prove you own your card without ever seeing your card number. Not even our engineers can access it.
              </p>
            </div>
          </Reveal>

          {/* ZKP explainer visual */}
          <Reveal delay={100}>
            <div style={{ display: 'flex', gap: 1, alignItems: 'stretch', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
              {[
                { label: 'Your Device', sub: 'Generates ZK proof', color: '#00D4FF', icon: '📱' },
                { label: '→', sub: '', color: 'rgba(255,255,255,0.2)', icon: '' },
                { label: 'VaultX Server', sub: 'Verifies proof only', color: '#7B2FFF', icon: '🔐' },
                { label: '→', sub: '', color: 'rgba(255,255,255,0.2)', icon: '' },
                { label: 'Payment Network', sub: 'Tokenised card used', color: '#00FF88', icon: '🌐' },
              ].map((item, i) => item.label === '→' ? (
                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '0 12px', color: item.color, fontSize: '1.4rem', alignSelf: 'center' }}>→</div>
              ) : (
                <div key={i} style={{ flex: '1 1 160px', maxWidth: 220, padding: '24px 20px', background: `${item.color}08`, border: `1px solid ${item.color}20`, borderRadius: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>{item.icon}</div>
                  <div style={{ fontFamily: '"Orbitron", monospace', fontSize: '0.75rem', fontWeight: 700, color: item.color, marginBottom: 6, letterSpacing: '0.06em' }}>{item.label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(240,244,255,0.45)' }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Trust badges */}
          <Reveal delay={150}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
              {TRUST_BADGES.map((b, i) => (
                <div key={i} style={{ padding: '18px 16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: 8 }}>{b.icon}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F0F4FF', marginBottom: 4, letterSpacing: '0.03em' }}>{b.label}</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(240,244,255,0.4)' }}>{b.sub}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────── */}
      <section style={{ padding: '120px 24px', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ ...innerStyle, position: 'relative', textAlign: 'center' }}>
          <Reveal>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 22px', background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.18)', borderRadius: 100, marginBottom: 32 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 8px rgba(0,255,136,0.8)', animation: 'shimmer 1.8s ease-in-out infinite' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#00D4FF', letterSpacing: '0.12em' }}>FREE TRANSFERS DURING BETA</span>
            </div>

            <h2 style={{ fontFamily: '"Orbitron", monospace', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.01em' }}>
              Ready to move money<br />
              <span style={{ background: 'linear-gradient(135deg, #00D4FF, #7B2FFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                at light speed?
              </span>
            </h2>

            <p style={{ fontSize: '1rem', color: 'rgba(240,244,255,0.55)', maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.75 }}>
              Join thousands sending money across 200+ countries. Add your first card in 60 seconds. No bank account required.
            </p>

            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="cta-btn-primary"
                onClick={() => navigate('/auth')}
                style={{
                  padding: '17px 44px',
                  background: 'linear-gradient(135deg, #00D4FF, #0099BB)',
                  border: 'none', borderRadius: 14,
                  color: '#080810', fontFamily: '"Orbitron", monospace',
                  fontSize: '0.88rem', fontWeight: 800, letterSpacing: '0.12em',
                  cursor: 'pointer', boxShadow: '0 0 32px rgba(0,212,255,0.4)',
                  transition: 'all 0.25s ease',
                }}>
                CREATE FREE ACCOUNT
              </button>
              <button
                className="cta-btn-secondary"
                onClick={() => navigate('/auth')}
                style={{
                  padding: '17px 36px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 14,
                  color: 'rgba(240,244,255,0.7)',
                  fontFamily: '"Rajdhani", sans-serif',
                  fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.06em',
                  cursor: 'pointer', transition: 'all 0.25s ease',
                }}>
                Sign In Instead
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '40px 24px' }}>
        <div style={{ ...innerStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(123,47,255,0.15))', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                <path d="M9 1L16 5V13L9 17L2 13V5L9 1Z" stroke="#00D4FF" strokeWidth="1.5" fill="none"/>
              </svg>
            </div>
            <span style={{ fontFamily: '"Orbitron", monospace', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.18em', background: 'linear-gradient(135deg, #00D4FF, #7B2FFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>VAULTX</span>
          </div>

          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            {['Privacy Policy', 'Terms of Service', 'Security', 'Contact'].map(link => (
              <span key={link} style={{ fontSize: '0.8rem', color: 'rgba(240,244,255,0.35)', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#00D4FF'}
                onMouseLeave={e => e.target.style.color = 'rgba(240,244,255,0.35)'}>
                {link}
              </span>
            ))}
          </div>

          <p style={{ fontSize: '0.76rem', color: 'rgba(240,244,255,0.2)' }}>
            © 2026 VaultX Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}