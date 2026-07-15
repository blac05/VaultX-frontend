import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

const COLORS = {
  cyber_blue:    { from: '#001a2e', to: '#003d5c', accent: '#00D4FF' },
  haptic_green:  { from: '#001a0f', to: '#003d1f', accent: '#00FF88' },
  plasma_purple: { from: '#130a2e', to: '#2d1a5c', accent: '#7B2FFF' },
  nova_red:      { from: '#2e0a0a', to: '#5c1a1a', accent: '#FF3B3B' },
  stellar_white: { from: '#1a1a2e', to: '#2d2d4f', accent: '#F0F4FF' }
};

export default function HolographicCard({ card, isActive, onClick }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 50, y: 50 });
  const color = COLORS[card?.cardColor] || COLORS.cyber_blue;

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rotateX = ((e.clientY - cy) / rect.height) * -12;
    const rotateY = ((e.clientX - cx) / rect.width) * 12;
    const shineX = ((e.clientX - rect.left) / rect.width) * 100;
    const shineY = ((e.clientY - rect.top) / rect.height) * 100;
    setTilt({ x: rotateX, y: rotateY });
    setShine({ x: shineX, y: shineY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setShine({ x: 50, y: 50 });
  };

  return (
    <motion.div ref={cardRef} onClick={onClick}
      onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
      animate={{ rotateX: tilt.x, rotateY: tilt.y, scale: isActive ? 1 : 0.93, opacity: isActive ? 1 : 0.65 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      style={{ width: 280, minWidth: 280, height: 175, borderRadius: 18, position: 'relative', cursor: 'pointer', transformStyle: 'preserve-3d', perspective: 800, flexShrink: 0, background: `linear-gradient(135deg, ${color.from}, ${color.to})`, border: `1px solid ${color.accent}30`, boxShadow: isActive ? `0 20px 60px rgba(0,0,0,0.5), 0 0 30px ${color.accent}20` : '0 8px 24px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

      {/* Dynamic shine */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, ${color.accent}18 0%, transparent 60%)`, pointerEvents: 'none', transition: 'background 0.1s ease' }} />

      {/* Holographic stripe */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(105deg, transparent 25%, ${color.accent}10 45%, ${color.accent}18 50%, ${color.accent}10 55%, transparent 75%)`, pointerEvents: 'none' }} />

      {/* SVG circuit decoration */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.07 }} viewBox="0 0 280 175">
        <path d="M0 88 Q70 50 140 88 Q210 125 280 88" fill="none" stroke={color.accent} strokeWidth="1"/>
        <circle cx="140" cy="88" r="35" fill="none" stroke={color.accent} strokeWidth="0.5"/>
        <circle cx="140" cy="88" r="20" fill="none" stroke={color.accent} strokeWidth="0.5"/>
        <line x1="105" y1="88" x2="0" y2="88" stroke={color.accent} strokeWidth="0.5"/>
        <line x1="175" y1="88" x2="280" y2="88" stroke={color.accent} strokeWidth="0.5"/>
      </svg>

      {/* Network badge */}
      <div style={{ position: 'absolute', top: 16, right: 18, fontFamily: 'var(--font-display)', fontSize: '0.65rem', fontWeight: 800, color: color.accent, letterSpacing: '0.18em', opacity: 0.85, textShadow: `0 0 8px ${color.accent}80` }}>
        {card?.cardType?.toUpperCase()}
      </div>

      {/* Status dot */}
      <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: card?.isVerified ? 'var(--haptic-green)' : 'var(--gold)', boxShadow: `0 0 6px ${card?.isVerified ? 'rgba(0,255,136,0.6)' : 'rgba(255,183,0,0.6)'}` }} />
        {card?.isDefault && <span style={{ fontSize: '0.55rem', color: color.accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Default</span>}
      </div>

      {/* Chip */}
      <div style={{ position: 'absolute', left: 18, top: '38%' }}>
        <div style={{ width: 34, height: 26, borderRadius: 4, background: `linear-gradient(135deg, ${color.accent}30, ${color.accent}15)`, border: `1px solid ${color.accent}40`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, padding: 4 }}>
          {[...Array(4)].map((_, i) => <div key={i} style={{ background: `${color.accent}55`, borderRadius: 1 }} />)}
        </div>
      </div>

      {/* Card number */}
      <div style={{ position: 'absolute', bottom: 44, left: 18, fontFamily: 'var(--font-mono)', fontSize: '1rem', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.82)', fontWeight: 500, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
        •••• •••• •••• {card?.last4}
      </div>

      {/* Name + Expiry */}
      <div style={{ position: 'absolute', bottom: 14, left: 18, right: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', marginBottom: 2 }}>CARDHOLDER</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.68)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{card?.cardholderName?.slice(0, 20)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', marginBottom: 2 }}>EXPIRES</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.68)' }}>
            {String(card?.expiryMonth || '').padStart(2,'0')}/{String(card?.expiryYear || '').slice(-2)}
          </div>
        </div>
      </div>

      {/* Active glow border */}
      {isActive && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: 18, border: `1px solid ${color.accent}50`, pointerEvents: 'none', boxShadow: `inset 0 0 20px ${color.accent}08` }} />
      )}
    </motion.div>
  );
}
