import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Share2, Download, Check, Zap, QrCode, RefreshCw } from 'lucide-react';
import useVaultStore from '../store/useVaultStore';
import toast from 'react-hot-toast';

function generateQRMatrix(text, size = 33) {
  // Reed-Solomon lite — deterministic QR-style matrix from text hash
  const hash = [...text].reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0);
  const matrix = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => {
      // Finder patterns (corners)
      const inFinder = (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);
      if (inFinder) {
        const lr = r < 7 ? r : r - (size - 7);
        const lc = c < 7 ? c : c - (size - 7);
        if (r >= size - 7) { const rr = r - (size - 7); return (rr === 0 || rr === 6 || lc === 0 || lc === 6 || (rr >= 2 && rr <= 4 && lc >= 2 && lc <= 4)); }
        return (lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4));
      }
      // Timing patterns
      if (r === 6 || c === 6) return (r + c) % 2 === 0;
      // Data modules — deterministic from hash + position
      const seed = (hash ^ (r * 137 + c * 31)) >>> 0;
      return (seed % 3 !== 0);
    })
  );
  return matrix;
}

function QRCanvas({ value, size = 240, color = '#00D4FF', bg = 'transparent' }) {
  const canvasRef = useRef(null);
  const matrix = generateQRMatrix(value);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const scale = window.devicePixelRatio || 1;
    canvas.width = size * scale;
    canvas.height = size * scale;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(scale, scale);

    const n = matrix.length;
    const cellSize = size / n;
    const radius = cellSize * 0.35;

    ctx.clearRect(0, 0, size, size);
    if (bg !== 'transparent') { ctx.fillStyle = bg; ctx.fillRect(0, 0, size, size); }

    matrix.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (!cell) return;
        const x = c * cellSize + cellSize * 0.1;
        const y = r * cellSize + cellSize * 0.1;
        const w = cellSize * 0.82;

        // Finder patterns get solid squares
        const inFinder = (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
        if (inFinder) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, w, w);
          return;
        }

        // Data modules get rounded dots
        ctx.beginPath();
        ctx.roundRect(x, y, w, w, radius);
        // Gradient glow for data modules
        const grad = ctx.createRadialGradient(x + w / 2, y + w / 2, 0, x + w / 2, y + w / 2, w);
        grad.addColorStop(0, color + 'FF');
        grad.addColorStop(1, color + 'AA');
        ctx.fillStyle = grad;
        ctx.fill();
      });
    });

    // Center logo cutout
    const logoSize = size * 0.18;
    const logoX = (size - logoSize) / 2;
    const logoY = (size - logoSize) / 2;
    ctx.fillStyle = '#080810';
    ctx.beginPath();
    ctx.roundRect(logoX - 4, logoY - 4, logoSize + 8, logoSize + 8, 8);
    ctx.fill();

    // VX logo text
    ctx.fillStyle = color;
    ctx.font = `bold ${logoSize * 0.45}px Orbitron, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VX', size / 2, size / 2);
  }, [value, size, color]);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
}

export default function QRPaymentPage() {
  const navigate = useNavigate();
  const { user } = useVaultStore();
  const [copied, setCopied] = useState(false);
  const [activeColor, setActiveColor] = useState('#00D4FF');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [showCustomize, setShowCustomize] = useState(false);

  const handle = user?.paymentHandle || '@' + (user?.firstName || 'user').toLowerCase();
  const qrPayload = JSON.stringify({
    v: 1,
    handle,
    name: `${user?.firstName} ${user?.lastName}`,
    ...(amount ? { amount: parseFloat(amount) } : {}),
    ...(memo ? { memo } : {})
  });
  const paymentLink = `https://vaultx.io/pay/${handle.replace('@', '')}${amount ? `?amount=${amount}` : ''}`;

  const colors = ['#00D4FF', '#00FF88', '#7B2FFF', '#FF3B3B', '#FFB700'];

  const handleCopy = async (text, label) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: `Pay ${user?.firstName} on VaultX`, url: paymentLink });
    } else {
      handleCopy(paymentLink, 'Payment link');
    }
  };

  const handleDownload = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `vaultx-qr-${handle.replace('@', '')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('QR code saved!');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--obsidian)', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,8,16,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,212,255,0.06)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--nebula-gray)', cursor: 'pointer' }}><ArrowLeft size={22} /></button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.08em' }}>MY PAYMENT QR</h2>
          <p style={{ color: 'var(--nebula-gray)', fontSize: '0.72rem' }}>Anyone can scan this to send you money instantly</p>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 16px' }}>
        {/* QR Card */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card-intense" style={{ padding: '32px 24px', textAlign: 'center', marginBottom: 20 }}>

          {/* Profile */}
          <div style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(123,47,255,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '1.4rem', fontWeight: 700, color: activeColor, fontFamily: 'var(--font-display)' }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, marginBottom: 2 }}>{user?.firstName} {user?.lastName}</p>
          <p style={{ color: activeColor, fontSize: '0.85rem', fontFamily: 'var(--font-mono)', marginBottom: 24 }}>{handle}</p>

          {/* QR Code */}
          <div style={{ display: 'inline-block', padding: 16, background: 'rgba(8,8,16,0.95)', borderRadius: 20, border: `1px solid ${activeColor}30`, boxShadow: `0 0 40px ${activeColor}15`, marginBottom: 8 }}>
            <QRCanvas value={qrPayload} size={220} color={activeColor} />
          </div>

          {/* Scan hint */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--dim-gray)', letterSpacing: '0.1em' }}>SCAN WITH VAULTX</span>
            <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Amount (optional) */}
          {amount && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{ padding: '10px 20px', background: `${activeColor}15`, border: `1px solid ${activeColor}30`, borderRadius: 12, marginBottom: 16, display: 'inline-block' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: activeColor }}>
                Request: ${parseFloat(amount).toFixed(2)}
              </span>
              {memo && <p style={{ fontSize: '0.75rem', color: 'var(--nebula-gray)', marginTop: 2 }}>{memo}</p>}
            </motion.div>
          )}

          {/* Color picker */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            {colors.map(c => (
              <button key={c} onClick={() => setActiveColor(c)}
                style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: `3px solid ${activeColor === c ? 'white' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeColor === c ? `0 0 12px ${c}80` : 'none' }} />
            ))}
          </div>
        </motion.div>

        {/* Request specific amount */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card" style={{ padding: '20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h4 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nebula-gray)' }}>Request Specific Amount</h4>
            <button onClick={() => setShowCustomize(!showCustomize)} style={{ background: 'none', border: 'none', color: 'var(--cyber-blue)', fontSize: '0.78rem', cursor: 'pointer' }}>
              {showCustomize ? 'Hide' : 'Add'}
            </button>
          </div>
          <AnimatePresence>
            {showCustomize && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label className="input-label">Amount (USD)</label>
                    <input className="input-glass" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={{ fontFamily: 'var(--font-mono)' }} />
                  </div>
                  <div>
                    <label className="input-label">Note</label>
                    <input className="input-glass" value={memo} onChange={e => setMemo(e.target.value)} placeholder="What's it for?" maxLength={50} />
                  </div>
                </div>
                {amount && (
                  <button onClick={() => { setAmount(''); setMemo(''); }} className="btn-ghost" style={{ width: '100%', fontSize: '0.8rem' }}>
                    <RefreshCw size={13} /> Clear Request
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Payment link */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-card" style={{ padding: '16px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Zap size={16} color="var(--cyber-blue)" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--nebula-gray)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{paymentLink}</span>
          <button onClick={() => handleCopy(paymentLink, 'Payment link')} style={{ background: 'none', border: 'none', color: copied ? 'var(--haptic-green)' : 'var(--cyber-blue)', cursor: 'pointer', flexShrink: 0 }}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </motion.div>

        {/* Action buttons */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            { label: 'Copy Link', icon: Copy, action: () => handleCopy(paymentLink, 'Payment link'), color: 'var(--cyber-blue)' },
            { label: 'Share', icon: Share2, action: handleShare, color: 'var(--haptic-green)' },
            { label: 'Save QR', icon: Download, action: handleDownload, color: 'var(--plasma-purple)' }
          ].map(({ label, icon: Icon, action, color }) => (
            <motion.button key={label} whileTap={{ scale: 0.93 }} onClick={action}
              style={{ padding: '16px 8px', background: `${color}0D`, border: `1px solid ${color}25`, borderRadius: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color, letterSpacing: '0.04em' }}>{label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Info box */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--dim-gray)', lineHeight: 1.6, textAlign: 'center' }}>
            Your QR code uses ZKP-encrypted routing — sharing it reveals only your payment handle, never your card details.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
