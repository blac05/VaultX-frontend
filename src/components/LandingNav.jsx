/**
 * VaultX — Landing Page Navigation
 * Place at: src/components/LandingNav.jsx
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingNav() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 24px',
        height: 68,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(8,8,16,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,212,255,0.08)' : '1px solid transparent',
        transition: 'all 0.4s ease',
        maxWidth: '100%',
      }}>

        {/* Logo */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        >
          {/* VaultX Icon */}
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(123,47,255,0.2))',
            border: '1px solid rgba(0,212,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0,212,255,0.15)',
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1L16 5V13L9 17L2 13V5L9 1Z" stroke="#00D4FF" strokeWidth="1.5" fill="none"/>
              <path d="M9 5L12 7V11L9 13L6 11V7L9 5Z" fill="#00D4FF" opacity="0.6"/>
            </svg>
          </div>
          <span style={{
            fontFamily: '"Orbitron", monospace', fontSize: '1.1rem', fontWeight: 800,
            letterSpacing: '0.18em',
            background: 'linear-gradient(135deg, #00D4FF, #7B2FFF)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>VAULTX</span>
        </div>

        {/* Desktop nav links */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 36,
          '@media(max-width:640px)': { display: 'none' }
        }} className="nav-links">
          {[
            ['Features',  'features'],
            ['How It Works', 'how'],
            ['Security',  'security'],
          ].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)} style={{
              background: 'none', border: 'none', color: 'rgba(240,244,255,0.6)',
              fontFamily: '"Rajdhani", sans-serif', fontSize: '0.92rem',
              fontWeight: 600, letterSpacing: '0.06em', cursor: 'pointer',
              transition: 'color 0.2s',
              padding: 0,
            }}
              onMouseEnter={e => e.target.style.color = '#00D4FF'}
              onMouseLeave={e => e.target.style.color = 'rgba(240,244,255,0.6)'}
            >{label}</button>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/auth')}
            style={{
              padding: '9px 20px',
              background: 'transparent',
              border: '1px solid rgba(0,212,255,0.25)',
              borderRadius: 10,
              color: 'rgba(240,244,255,0.75)',
              fontFamily: '"Rajdhani", sans-serif',
              fontSize: '0.88rem', fontWeight: 600,
              letterSpacing: '0.06em', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.target.style.borderColor = 'rgba(0,212,255,0.6)'; e.target.style.color = '#00D4FF'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'rgba(0,212,255,0.25)'; e.target.style.color = 'rgba(240,244,255,0.75)'; }}
          >Sign In</button>

          <button
            onClick={() => navigate('/auth')}
            style={{
              padding: '9px 22px',
              background: 'linear-gradient(135deg, #00D4FF, #0099BB)',
              border: 'none', borderRadius: 10,
              color: '#080810',
              fontFamily: '"Rajdhani", sans-serif',
              fontSize: '0.88rem', fontWeight: 800,
              letterSpacing: '0.08em', cursor: 'pointer',
              boxShadow: '0 0 20px rgba(0,212,255,0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.target.style.boxShadow = '0 0 32px rgba(0,212,255,0.55)'}
            onMouseLeave={e => e.target.style.boxShadow = '0 0 20px rgba(0,212,255,0.3)'}
          >Get Started</button>
        </div>
      </nav>

      {/* Mobile menu styles */}
      <style>{`
        @media (max-width: 640px) {
          .nav-links { display: none !important; }
        }
      `}</style>
    </>
  );
}