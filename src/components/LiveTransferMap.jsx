import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Globe, Clock } from 'lucide-react';

const NODES = {
  vaultx:       { x: 0.22, y: 0.42, label: 'VaultX Hub', city: 'San Francisco' },
  visa_network: { x: 0.38, y: 0.38, label: 'Visa VisaNet', city: 'Foster City, CA' },
  mc_network:   { x: 0.42, y: 0.35, label: 'MC Network', city: 'Purchase, NY' },
  us_issuer:    { x: 0.28, y: 0.36, label: 'Sender Bank', city: 'New York' },
  uk_issuer:    { x: 0.48, y: 0.28, label: 'Barclays UK', city: 'London' },
  ng_issuer:    { x: 0.52, y: 0.55, label: 'Access Bank', city: 'Lagos' },
  gh_issuer:    { x: 0.50, y: 0.57, label: 'GCB Bank', city: 'Accra' },
  sg_issuer:    { x: 0.78, y: 0.52, label: 'DBS Bank', city: 'Singapore' },
  ae_issuer:    { x: 0.63, y: 0.44, label: 'Emirates NBD', city: 'Dubai' }
};

function useAnimatedNumber(target, duration = 2000) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const from = 0;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(from + (target - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return val;
}

export default function LiveTransferMap({ transaction, isComplete, amount, currency, recipient }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [activeHops, setActiveHops] = useState([]);
  const [particleT, setParticleT] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(Date.now());

  const displayAmount = useAnimatedNumber(parseFloat(amount) || 0, 1500);

  // Canvas world map drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const W = canvas.width = canvas.offsetWidth;
      const H = canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      // Background grid
      ctx.strokeStyle = 'rgba(0,212,255,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Draw simplified continent outlines
      const continents = [
        // North America rough outline
        [[0.08,0.18],[0.32,0.18],[0.32,0.55],[0.20,0.62],[0.08,0.52]],
        // South America
        [[0.24,0.56],[0.36,0.56],[0.32,0.82],[0.22,0.82]],
        // Europe/Africa
        [[0.44,0.16],[0.60,0.16],[0.60,0.36],[0.56,0.38],[0.55,0.70],[0.44,0.75],[0.44,0.45],[0.43,0.36]],
        // Asia
        [[0.58,0.16],[0.90,0.16],[0.90,0.58],[0.76,0.62],[0.58,0.55],[0.58,0.36]],
        // Australia
        [[0.76,0.65],[0.90,0.65],[0.90,0.82],[0.76,0.82]]
      ];

      continents.forEach(pts => {
        ctx.beginPath();
        pts.forEach(([px, py], i) => {
          const x = px * W, y = py * H;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(0,212,255,0.04)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,212,255,0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw connection arcs
      const hops = transaction?.networkHops || [];
      for (let i = 0; i < hops.length - 1; i++) {
        const a = hops[i], b = hops[i + 1];
        const ax = (a.coordinates?.lng || -122) / 360 * W + W / 2;
        const ay = (-(a.coordinates?.lat || 37)) / 180 * H + H / 2;
        const bx = (b.coordinates?.lng || -74) / 360 * W + W / 2;
        const by = (-(b.coordinates?.lat || 40)) / 180 * H + H / 2;
        const cpx = (ax + bx) / 2;
        const cpy = Math.min(ay, by) - 30;

        const isDone = b.status === 'completed';
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo(cpx, cpy, bx, by);
        ctx.strokeStyle = isDone ? 'rgba(0,255,136,0.4)' : 'rgba(0,212,255,0.2)';
        ctx.lineWidth = isDone ? 2 : 1;
        ctx.setLineDash(isDone ? [] : [4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated particle on active arc
        if (!isDone && i === hops.length - 2) {
          const t = (particleT % 1);
          const px = ax + (cpx - ax) * 2 * t * (1 - t) + (bx - ax) * t * t;
          const py2 = ay + (cpy - ay) * 2 * t * (1 - t) + (by - ay) * t * t;
          ctx.beginPath();
          ctx.arc(px, py2, 4, 0, Math.PI * 2);
          ctx.fillStyle = 'var(--cyber-blue)';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(px, py2, 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0,212,255,0.2)';
          ctx.fill();
        }
      }

      // Draw nodes
      hops.forEach((hop, i) => {
        const lng = hop.coordinates?.lng || 0;
        const lat = hop.coordinates?.lat || 0;
        const nx = lng / 360 * W + W / 2;
        const ny = -lat / 180 * H + H / 2;
        const isDone = hop.status === 'completed';
        const isProcessing = hop.status === 'processing';

        // Pulse ring
        if (isProcessing) {
          ctx.beginPath();
          ctx.arc(nx, ny, 14 + Math.sin(Date.now() / 300) * 4, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(0,212,255,0.3)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(nx, ny, 7, 0, Math.PI * 2);
        ctx.fillStyle = isDone ? 'rgba(0,255,136,0.9)' : isProcessing ? 'rgba(0,212,255,0.9)' : 'rgba(255,255,255,0.2)';
        ctx.fill();
        ctx.strokeStyle = isDone ? 'rgba(0,255,136,0.4)' : isProcessing ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.font = '9px Rajdhani, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(hop.node, nx, ny + 18);
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [transaction, particleT]);

  // Particle animation ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setParticleT(t => (t + 0.012) % 1);
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const hops = transaction?.networkHops || [];
  const completedHops = hops.filter(h => h.status === 'completed').length;
  const currentHop = hops.find(h => h.status === 'processing');

  return (
    <div>
      {/* Amount hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card-intense" style={{ padding: '28px 24px', textAlign: 'center', marginBottom: 20 }}>
        <p style={{ color: 'var(--nebula-gray)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
          {isComplete ? 'Successfully Sent' : 'Sending'}
        </p>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.4rem,10vw,3.4rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6, background: isComplete ? 'linear-gradient(135deg, var(--haptic-green), #00cc66)' : 'linear-gradient(135deg, var(--cyber-blue), var(--plasma-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : ''}{displayAmount.toFixed(2)}
        </div>
        {recipient && <p style={{ color: 'var(--nebula-gray)', fontSize: '0.9rem' }}>to <span style={{ color: 'var(--stellar-white)', fontWeight: 600 }}>{recipient.fullName}</span></p>}

        {/* Status badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--nebula-gray)' }}>
            <Clock size={12} color="var(--cyber-blue)" />
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyber-blue)' }}>{elapsed}s</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--nebula-gray)' }}>
            <Globe size={12} color="var(--plasma-purple)" />
            <span>Push-to-Card Rail</span>
          </div>
          {isComplete && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--haptic-green)', fontWeight: 700 }}>
              <Check size={12} /> Settled
            </div>
          )}
        </div>
      </motion.div>

      {/* Live map canvas */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="glass-card" style={{ marginBottom: 20, overflow: 'hidden', position: 'relative', borderRadius: 20 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,212,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nebula-gray)' }}>PULSE VIEW — Live Network Map</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--haptic-green)', boxShadow: '0 0 6px rgba(0,255,136,0.8)', animation: 'pulse-ring 1.5s ease-out infinite' }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--haptic-green)', fontWeight: 700 }}>LIVE</span>
          </div>
        </div>
        <canvas ref={canvasRef} style={{ width: '100%', height: 200, display: 'block' }} />
      </motion.div>

      {/* Hop status list */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="glass-card" style={{ padding: '20px' }}>
        <h4 style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nebula-gray)', marginBottom: 16 }}>Network Journey · {completedHops}/{hops.length} nodes</h4>

        {hops.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 32, height: 32, border: '2px solid rgba(0,212,255,0.2)', borderTop: '2px solid var(--cyber-blue)', borderRadius: '50%', animation: 'spin-slow 1s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--nebula-gray)', fontSize: '0.82rem' }}>Connecting to payment network...</p>
          </div>
        ) : (
          hops.map((hop, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < hops.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              {/* Status icon */}
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: hop.status === 'completed' ? 'rgba(0,255,136,0.12)' : hop.status === 'processing' ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${hop.status === 'completed' ? 'rgba(0,255,136,0.3)' : hop.status === 'processing' ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {hop.status === 'completed' ? <Check size={13} color="var(--haptic-green)" /> : hop.status === 'processing' ? <div style={{ width: 10, height: 10, border: '2px solid rgba(0,212,255,0.3)', borderTop: '2px solid var(--cyber-blue)', borderRadius: '50%', animation: 'spin-slow 1s linear infinite' }} /> : <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--stellar-white)', marginBottom: 1 }}>{hop.node}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--nebula-gray)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{hop.nodeType?.replace('_', ' ')}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                {hop.latencyMs && <p style={{ fontSize: '0.7rem', color: 'var(--cyber-blue)', fontFamily: 'var(--font-mono)' }}>{hop.latencyMs}ms</p>}
                <p style={{ fontSize: '0.65rem', color: hop.status === 'completed' ? 'var(--haptic-green)' : hop.status === 'processing' ? 'var(--cyber-blue)' : 'var(--dim-gray)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{hop.status}</p>
              </div>
            </motion.div>
          ))
        )}

        {/* Complete celebration */}
        <AnimatePresence>
          {isComplete && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ marginTop: 16, padding: '16px', background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: 14, textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>🎉</div>
              <p style={{ fontWeight: 700, color: 'var(--haptic-green)', marginBottom: 4, fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>Transfer Complete!</p>
              <p style={{ color: 'var(--nebula-gray)', fontSize: '0.8rem' }}>{recipient?.fullName} has received the funds · Settled in {elapsed}s</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
