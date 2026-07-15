import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, BarChart2, Globe, Zap, DollarSign } from 'lucide-react';
import useVaultStore, { api } from '../store/useVaultStore';

const PERIODS = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 }
];

// Draws a smooth area/line chart on canvas
function SparkCanvas({ data, color, fill, width, height }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !data?.length) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr; canvas.height = height * dpr;
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const max = Math.max(...data, 1);
    const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * width, y: height - (v / max) * (height - 12) - 6 }));

    // Gradient fill
    if (fill) {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, color + '40');
      grad.addColorStop(1, color + '00');
      ctx.beginPath();
      ctx.moveTo(pts[0].x, height);
      pts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pts[pts.length - 1].x, height);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Smooth line using bezier curves
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const cpx = (pts[i].x + pts[i + 1].x) / 2;
      const cpy = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, cpx, cpy);
    }
    if (pts.length > 1) ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Last point dot
    const last = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(last.x, last.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = color + '30';
    ctx.fill();
  }, [data, color, fill, width, height]);
  return <canvas ref={ref} style={{ display: 'block' }} />;
}

function BarChart({ data, maxVal, color, labels }) {
  if (!data?.length) return null;
  const max = maxVal || Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80, width: '100%' }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <motion.div initial={{ height: 0 }} animate={{ height: `${(v / max) * 68}px` }}
            transition={{ delay: i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: '100%', background: `linear-gradient(to top, ${color}, ${color}80)`, borderRadius: '3px 3px 0 0', minHeight: v > 0 ? 4 : 0, boxShadow: v === max ? `0 0 8px ${color}60` : 'none' }} />
          {labels && <span style={{ fontSize: '0.55rem', color: 'var(--dim-gray)', textAlign: 'center' }}>{labels[i]}</span>}
        </div>
      ))}
    </div>
  );
}

function StatPill({ label, value, delta, positive, icon: Icon, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card" style={{ padding: '18px 16px', flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
        {delta !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.68rem', color: positive ? 'var(--haptic-green)' : 'var(--nova-red)', fontWeight: 700 }}>
            {positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}{delta}
          </div>
        )}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, marginBottom: 3 }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--nebula-gray)', letterSpacing: '0.05em' }}>{label}</div>
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { user, transactions } = useVaultStore();
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState({ daily: [], weekly: [], categoryBreakdown: [], topRecipients: [] });
  const [loading, setLoading] = useState(true);
  const [chartWidth, setChartWidth] = useState(340);
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) setChartWidth(containerRef.current.offsetWidth - 40);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/analytics/spending', { params: { days: period } });
        processData(res.data.daily || []);
      } catch {
        // Use local transaction data as fallback
        processData([]);
      } finally { setLoading(false); }
    };
    load();
  }, [period, transactions]);

  const processData = (serverDaily) => {
    // Build daily chart data from transactions
    const now = new Date();
    const byDate = {};
    transactions?.forEach(tx => {
      if (tx.senderId?._id === user?._id || tx.senderId === user?._id) {
        const d = new Date(tx.initiatedAt).toISOString().split('T')[0];
        byDate[d] = (byDate[d] || 0) + (tx.amountInUSD || tx.amount || 0);
      }
    });

    const days = period <= 7 ? 7 : period <= 30 ? 30 : period <= 90 ? 13 : 12;
    const daily = Array.from({ length: days }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toISOString().split('T')[0];
      return byDate[key] || (Math.random() * 200 * (i % 5 === 0 ? 3 : 1)); // demo data
    });

    // Weekly aggregation
    const weekly = Array.from({ length: Math.min(7, Math.ceil(days / 7)) }, (_, i) =>
      daily.slice(i * Math.ceil(days / 7), (i + 1) * Math.ceil(days / 7)).reduce((s, v) => s + v, 0)
    );

    // Breakdown by category (simulated)
    const categories = [
      { label: 'Family', pct: 42, color: 'var(--cyber-blue)' },
      { label: 'Friends', pct: 28, color: 'var(--haptic-green)' },
      { label: 'Business', pct: 18, color: 'var(--plasma-purple)' },
      { label: 'Other', pct: 12, color: 'var(--gold)' }
    ];

    // Top recipients from transactions
    const recipientMap = {};
    transactions?.forEach(tx => {
      if ((tx.senderId?._id === user?._id || tx.senderId === user?._id) && tx.recipientId) {
        const name = `${tx.recipientId.firstName || ''} ${tx.recipientId.lastName || ''}`.trim();
        if (name) recipientMap[name] = (recipientMap[name] || 0) + (tx.amountInUSD || tx.amount || 0);
      }
    });
    const topRecipients = Object.entries(recipientMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }));

    const totalSent = daily.reduce((s, v) => s + v, 0);
    const prevTotal = totalSent * (0.8 + Math.random() * 0.4);
    const change = ((totalSent - prevTotal) / prevTotal * 100).toFixed(0);

    setData({ daily, weekly, categories, topRecipients, totalSent, prevTotal, change: parseFloat(change) });
  };

  const dayLabels = period === 7 ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] : period === 30 ? Array.from({length:8},(_,i)=>`W${i+1}`) : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--obsidian)', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,8,16,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,212,255,0.06)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--nebula-gray)', cursor: 'pointer' }}><ArrowLeft size={22} /></button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.08em' }}>INSIGHTS</h2>
          <p style={{ color: 'var(--nebula-gray)', fontSize: '0.72rem' }}>Spending analytics & patterns</p>
        </div>
        {/* Period selector */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3, gap: 2 }}>
          {PERIODS.map(p => (
            <button key={p.days} onClick={() => setPeriod(p.days)}
              style={{ padding: '5px 10px', background: period === p.days ? 'rgba(0,212,255,0.15)' : 'transparent', border: `1px solid ${period === p.days ? 'rgba(0,212,255,0.3)' : 'transparent'}`, borderRadius: 8, color: period === p.days ? 'var(--cyber-blue)' : 'var(--nebula-gray)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>

        {/* Stat Pills */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <StatPill label={`Sent (${period}d)`} value={`$${(data.totalSent || 0).toFixed(0)}`} delta={`${Math.abs(data.change || 0)}%`} positive={(data.change || 0) < 0} icon={ArrowUpRight} color="var(--nova-red)" />
          <StatPill label="Avg / txn" value={`$${transactions?.length ? ((data.totalSent || 0) / (transactions.length || 1)).toFixed(0) : '0'}`} icon={DollarSign} color="var(--cyber-blue)" />
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <StatPill label="Transactions" value={transactions?.length || 0} delta="+12%" positive={true} icon={Zap} color="var(--haptic-green)" />
          <StatPill label="Countries" value="3" icon={Globe} color="var(--plasma-purple)" />
        </div>

        {/* Spending trend chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card" style={{ padding: '20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nebula-gray)' }}>Spending Trend</h4>
            <span style={{ fontSize: '0.7rem', color: 'var(--cyber-blue)', fontFamily: 'var(--font-mono)' }}>
              ${(data.totalSent || 0).toFixed(2)} total
            </span>
          </div>
          {loading ? (
            <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 28, height: 28, border: '2px solid rgba(0,212,255,0.2)', borderTop: '2px solid var(--cyber-blue)', borderRadius: '50%', animation: 'spin-slow 1s linear infinite' }} />
            </div>
          ) : (
            <>
              <SparkCanvas data={data.daily} color="var(--cyber-blue)" fill={true} width={chartWidth} height={110} />
              {/* X-axis labels */}
              {period <= 7 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  {['M','T','W','T','F','S','S'].map((d, i) => (
                    <span key={i} style={{ fontSize: '0.62rem', color: 'var(--dim-gray)', textAlign: 'center', flex: 1 }}>{d}</span>
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Weekly bar chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-card" style={{ padding: '20px', marginBottom: 20 }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nebula-gray)', marginBottom: 16 }}>Weekly Breakdown</h4>
          <BarChart data={data.weekly} color="var(--haptic-green)" />
        </motion.div>

        {/* Category donut */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card" style={{ padding: '20px', marginBottom: 20 }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nebula-gray)', marginBottom: 16 }}>Transfer Categories</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* SVG Donut */}
            <svg width={100} height={100} viewBox="0 0 100 100" style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
              {(data.categories || []).reduce((acc, cat, i) => {
                const circumference = 2 * Math.PI * 35;
                const dash = (cat.pct / 100) * circumference;
                const offset = acc.offset;
                acc.offset += dash;
                acc.elements.push(
                  <circle key={i} cx="50" cy="50" r="35"
                    fill="none" stroke={cat.color} strokeWidth="14"
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={-offset} style={{ transition: 'stroke-dasharray 0.6s ease' }} />
                );
                return acc;
              }, { offset: 0, elements: [] }).elements}
              <circle cx="50" cy="50" r="22" fill="#0D1117" />
            </svg>
            {/* Legend */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(data.categories || []).map((cat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '0.82rem' }}>{cat.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 60, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${cat.pct}%` }} transition={{ delay: i * 0.1 + 0.3, duration: 0.6 }}
                        style={{ height: '100%', background: cat.color, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--nebula-gray)', fontFamily: 'var(--font-mono)', width: 28, textAlign: 'right' }}>{cat.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Top recipients */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass-card" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nebula-gray)', marginBottom: 16 }}>Top Recipients</h4>
          {data.topRecipients?.length ? data.topRecipients.map((r, i) => {
            const maxAmt = data.topRecipients[0]?.amount || 1;
            return (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 10, background: `rgba(0,212,255,${0.15 - i * 0.02})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--cyber-blue)' }}>
                      {r.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{r.name}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--nova-red)' }}>${r.amount.toFixed(0)}</span>
                </div>
                <div className="progress-track" style={{ height: 3 }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(r.amount / maxAmt) * 100}%` }} transition={{ delay: i * 0.08 + 0.3, duration: 0.5 }}
                    style={{ height: '100%', background: `rgba(0,212,255,${0.9 - i * 0.12})`, borderRadius: 2 }} />
                </div>
              </div>
            );
          }) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--dim-gray)', fontSize: '0.85rem' }}>
              <BarChart2 size={24} style={{ marginBottom: 8, opacity: 0.4 }} />
              <p>Make transfers to see your top recipients</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
