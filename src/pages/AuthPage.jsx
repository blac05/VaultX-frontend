import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Fingerprint, Shield, Zap, Globe } from 'lucide-react';
import useVaultStore from '../store/useVaultStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // login | register
  const [showPass, setShowPass] = useState(false);
  const [biometricStage, setBiometricStage] = useState('idle'); // idle | scanning | success | failed
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '' });
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const { login, register, isLoading } = useVaultStore();
  const navigate = useNavigate();

  // ── Particle background canvas ──────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Init particles
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.5 + 0.1,
        color: Math.random() > 0.6 ? '0,212,255' : Math.random() > 0.5 ? '123,47,255' : '0,255,136'
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach(q => {
          const dist = Math.hypot(p.x - q.x, p.y - q.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0,212,255,${0.04 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        });
      });

      // Draw particles
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();
      });

      animFrameRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handleBiometricSim = async () => {
    setBiometricStage('scanning');
    await new Promise(r => setTimeout(r, 2000));
    setBiometricStage('success');
    await new Promise(r => setTimeout(r, 600));
    setBiometricStage('idle');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let result;
    if (mode === 'login') {
      result = await login(form.email, form.password);
    } else {
      if (!form.firstName || !form.lastName) {
        return toast.error('First and last name required');
      }
      result = await register(form);
    }
    if (result.success) {
      toast.success(mode === 'login' ? 'Welcome back to VaultX' : 'Account created!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
  };

  const update = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--obsidian)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Particle canvas */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      {/* Ambient glows */}
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)', top: '-100px', left: '-100px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,47,255,0.05) 0%, transparent 70%)', bottom: '-80px', right: '-80px', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 460, padding: '24px 16px' }}>
        {/* Logo */}
        <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(123,47,255,0.1))', borderRadius: 20, border: '1px solid rgba(0,212,255,0.2)', marginBottom: 16, boxShadow: '0 0 30px rgba(0,212,255,0.15)' }}>
            <Shield size={28} color="var(--cyber-blue)" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--cyber-blue), var(--plasma-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '0.05em', marginBottom: 6 }}>VAULTX</h1>
          <p style={{ color: 'var(--nebula-gray)', fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Move Money at the Speed of Trust</p>
        </motion.div>

        {/* Auth Card */}
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card-intense" style={{ padding: '32px 28px' }}>

          {/* Mode Toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4, marginBottom: 28 }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 9, background: mode === m ? 'rgba(0,212,255,0.1)' : 'transparent', color: mode === m ? 'var(--cyber-blue)' : 'var(--nebula-gray)', fontFamily: 'var(--font-ui)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s ease', borderColor: mode === m ? 'rgba(0,212,255,0.2)' : 'transparent' }}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div key="reg-fields" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    {['firstName', 'lastName'].map((f, i) => (
                      <div key={f}>
                        <label className="input-label">{i === 0 ? 'First Name' : 'Last Name'}</label>
                        <input className="input-glass" value={form[f]} onChange={update(f)} placeholder={i === 0 ? 'John' : 'Doe'} required />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ marginBottom: 16 }}>
              <label className="input-label">Email Address</label>
              <input className="input-glass" type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" required autoComplete="email" />
            </div>

            <div style={{ marginBottom: 24, position: 'relative' }}>
              <label className="input-label">Password</label>
              <input className="input-glass" type={showPass ? 'text' : 'password'} value={form.password} onChange={update('password')} placeholder="••••••••" required style={{ paddingRight: 48 }} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, bottom: 14, background: 'none', border: 'none', color: 'var(--nebula-gray)', cursor: 'pointer' }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Biometric Button */}
            <motion.button type="button" onClick={handleBiometricSim} whileTap={{ scale: 0.97 }}
              style={{ width: '100%', padding: '14px', marginBottom: 12, background: biometricStage === 'success' ? 'rgba(0,255,136,0.1)' : 'rgba(0,212,255,0.05)', border: `1px solid ${biometricStage === 'success' ? 'rgba(0,255,136,0.3)' : 'rgba(0,212,255,0.15)'}`, borderRadius: 12, color: biometricStage === 'success' ? 'var(--haptic-green)' : 'var(--nebula-gray)', fontFamily: 'var(--font-ui)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.3s ease', letterSpacing: '0.05em' }}>
              <Fingerprint size={20} style={{ animation: biometricStage === 'scanning' ? 'pulse-ring 1s ease-out infinite' : 'none' }} />
              {biometricStage === 'idle' ? 'Use Biometric Login' : biometricStage === 'scanning' ? 'Scanning...' : '✓ Biometric Verified'}
            </motion.button>

            <motion.button type="submit" disabled={isLoading} whileTap={{ scale: 0.98 }}
              className="btn-neon-solid" style={{ width: '100%', padding: '16px', fontSize: '1rem', borderRadius: 12, opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 18, height: 18, border: '2px solid rgba(0,0,0,0.3)', borderTop: '2px solid var(--obsidian)', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite' }} />
                  Processing...
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Zap size={18} />
                  {mode === 'login' ? 'Enter VaultX' : 'Create Account'}
                </div>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Trust indicators */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 24, flexWrap: 'wrap' }}>
          {[
            { icon: Shield, label: 'PCI-DSS L1' },
            { icon: Fingerprint, label: 'ZKP Security' },
            { icon: Globe, label: '200+ Countries' }
          ].map(({ icon: Icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--dim-gray)', fontSize: '0.75rem', letterSpacing: '0.06em' }}>
              <Icon size={12} color="var(--cyber-blue)" />
              {label}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
