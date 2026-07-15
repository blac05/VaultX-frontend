import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Send, Plus, CreditCard, Bell, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, ChevronRight, Zap, Shield, Activity } from 'lucide-react';
import useVaultStore from '../store/useVaultStore';
import Navbar from '../components/Navbar';
import HolographicCard from '../components/HolographicCard';
import { format } from 'date-fns';

const cardColors = {
  cyber_blue:    { from: '#001a2e', to: '#003d5c', accent: '#00D4FF' },
  haptic_green:  { from: '#001a0f', to: '#003d1f', accent: '#00FF88' },
  plasma_purple: { from: '#130a2e', to: '#2d1a5c', accent: '#7B2FFF' },
  nova_red:      { from: '#2e0a0a', to: '#5c1a1a', accent: '#FF3B3B' },
  stellar_white: { from: '#1a1a2e', to: '#2d2d4f', accent: '#F0F4FF' }
};

function StatCard({ label, value, change, up, icon: Icon, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card" style={{ padding: '20px', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ color: 'var(--nebula-gray)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--stellar-white)', marginBottom: 6 }}>{value}</div>
      {change !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: up ? 'var(--haptic-green)' : 'var(--nova-red)' }}>
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {change}
        </div>
      )}
    </motion.div>
  );
}

function TxRow({ tx, userId }) {
  const navigate = useNavigate();
  const isSent = tx.senderId?._id === userId || tx.senderId === userId;
  const other = isSent ? tx.recipientId : tx.senderId;
  const name = other ? `${other.firstName} ${other.lastName}` : 'External';
  const handle = other?.paymentHandle || '';
  const statusColors = { settled: 'var(--haptic-green)', processing: 'var(--cyber-blue)', failed: 'var(--nova-red)', pending_auth: 'var(--gold)' };

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      onClick={() => navigate(`/tx/${tx.txId}`)}
      style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.2s' }}
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)', paddingLeft: 8, borderRadius: 8 }}>
      <div style={{ width: 42, height: 42, borderRadius: 14, background: isSent ? 'rgba(255,59,59,0.1)' : 'rgba(0,255,136,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {isSent ? <ArrowUpRight size={18} color="var(--nova-red)" /> : <ArrowDownLeft size={18} color="var(--haptic-green)" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--stellar-white)', marginBottom: 2 }}>{name}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--nebula-gray)' }}>{handle} · {tx.initiatedAt ? format(new Date(tx.initiatedAt), 'MMM d, h:mm a') : ''}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: isSent ? 'var(--nova-red)' : 'var(--haptic-green)' }}>
          {isSent ? '-' : '+'}{tx.currency} {parseFloat(tx.amount).toFixed(2)}
        </div>
        <div style={{ fontSize: '0.7rem', color: statusColors[tx.status] || 'var(--nebula-gray)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{tx.status}</div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, cards, transactions, summary, fetchCards, fetchTransactions, fetchSummary, logout } = useVaultStore();
  const [activeCard, setActiveCard] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchCards();
    fetchTransactions({ limit: 8 });
    fetchSummary();
  }, []);

  const refresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchCards(), fetchTransactions({ limit: 8 }), fetchSummary()]);
    setIsRefreshing(false);
  };

  const defaultCard = cards.find(c => c.isDefault) || cards[0];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--obsidian)', paddingBottom: 100 }}>
      <Navbar />

      {/* Ambient glow */}
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse, rgba(0,212,255,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '80px 16px 0', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <p style={{ color: 'var(--nebula-gray)', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Welcome back</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700 }}>{user?.firstName} {user?.lastName}</h2>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: 100 }}>
              <div className="pulse-dot" style={{ width: 6, height: 6 }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--haptic-green)', fontWeight: 600, letterSpacing: '0.08em' }}>LIVE</span>
            </div>
            <button onClick={logout} className="btn-ghost" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Logout</button>
          </div>
        </motion.div>

        {/* Cards Carousel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ marginBottom: 24 }}>
          {cards.length === 0 ? (
            <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}
              onClick={() => navigate('/vault')}>
              <CreditCard size={32} color="var(--nebula-gray)" style={{ marginBottom: 12 }} />
              <p style={{ color: 'var(--nebula-gray)', marginBottom: 16 }}>No cards in your vault yet</p>
              <button className="btn-neon" style={{ fontSize: '0.85rem' }}>
                <Plus size={16} /> Add Your First Card
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
                {cards.map((card, i) => (
                  <HolographicCard key={card.id || i} card={card} isActive={i === activeCard} onClick={() => setActiveCard(i)} />
                ))}
              </div>
              {/* Card indicators */}
              {cards.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8 }}>
                  {cards.map((_, i) => (
                    <div key={i} onClick={() => setActiveCard(i)} style={{ width: i === activeCard ? 20 : 6, height: 6, borderRadius: 3, background: i === activeCard ? 'var(--cyber-blue)' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s ease', cursor: 'pointer' }} />
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Send',     icon: Send,     action: () => navigate('/transfer'),  color: 'var(--cyber-blue)',    primary: true },
            { label: 'Request',  icon: Activity, action: () => navigate('/requests'),  color: 'var(--gold)'          },
            { label: 'My QR',    icon: Plus,     action: () => navigate('/qr'),        color: 'var(--haptic-green)'  },
            { label: 'Insights', icon: Activity, action: () => navigate('/analytics'), color: 'var(--plasma-purple)' }
          ].map(({ label, icon: Icon, action, color, primary }) => (
            <motion.button key={label} whileTap={{ scale: 0.94 }} onClick={action}
              style={{ padding: '18px 12px', background: primary ? 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.05))' : 'rgba(255,255,255,0.03)', border: `1px solid ${primary ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transition: 'all 0.2s', boxShadow: primary ? '0 0 20px rgba(0,212,255,0.1)' : 'none' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={color} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: primary ? 'var(--cyber-blue)' : 'var(--nebula-gray)', letterSpacing: '0.05em' }}>{label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Stats Row */}
        {summary && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <StatCard label="Sent (30d)" value={`$${(summary.sent.total || 0).toFixed(0)}`} change={`${summary.sent.count} txns`} up={false} icon={ArrowUpRight} color="var(--nova-red)" />
            <StatCard label="Received (30d)" value={`$${(summary.received.total || 0).toFixed(0)}`} change={`${summary.received.count} txns`} up={true} icon={ArrowDownLeft} color="var(--haptic-green)" />
          </motion.div>
        )}

        {/* Daily Limit Bar */}
        {summary?.limits && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
            className="glass-card" style={{ padding: '16px 20px', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--nebula-gray)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Daily Limit</span>
              <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--stellar-white)' }}>
                ${summary.limits.dailyUsed?.toFixed(0)} / ${summary.limits.daily?.toFixed(0)}
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${Math.min(100, (summary.limits.dailyUsed / summary.limits.daily) * 100)}%` }} />
            </div>
          </motion.div>
        )}

        {/* Recent Transactions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nebula-gray)' }}>Recent Activity</h3>
            <button onClick={refresh} style={{ background: 'none', border: 'none', color: 'var(--cyber-blue)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--font-ui)', display: 'flex', alignItems: 'center', gap: 4, opacity: isRefreshing ? 0.5 : 1 }}>
              {isRefreshing ? 'Loading...' : <>Refresh <ChevronRight size={14} /></>}
            </button>
          </div>

          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--dim-gray)' }}>
              <Zap size={24} style={{ marginBottom: 8, opacity: 0.4 }} />
              <p style={{ fontSize: '0.9rem' }}>No transactions yet. Send your first transfer!</p>
            </div>
          ) : (
            transactions.map((tx, i) => (
              <TxRow key={tx._id || i} tx={tx} userId={user?._id} />
            ))
          )}
        </motion.div>

        {/* Quick Settings Row */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Security Center', sub: 'Sessions & devices', icon: Shield, path: '/security', color: 'var(--gold)' },
            { label: 'Notifications', sub: 'Alerts & updates', icon: Bell, path: '/notifications', color: 'var(--cyber-blue)' }
          ].map(({ label, sub, icon: Icon, path, color }) => (
            <motion.div key={path} whileTap={{ scale: 0.97 }} onClick={() => navigate(path)}
              className="glass-card" style={{ padding: '14px 16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color={color} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 1, color: 'var(--stellar-white)' }}>{label}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--nebula-gray)' }}>{sub}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* KYC Banner */}
        {user?.kyc?.status !== 'approved' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            onClick={() => navigate('/onboarding')}
            style={{ marginTop: 16, padding: '16px 20px', background: 'rgba(255,183,0,0.06)', border: '1px solid rgba(255,183,0,0.15)', borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
            <Shield size={20} color="var(--gold)" />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gold)', marginBottom: 2 }}>Verify your identity</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--nebula-gray)' }}>Complete KYC to unlock full transfer limits</p>
            </div>
            <ChevronRight size={16} color="var(--gold)" />
          </motion.div>
        )}
      </div>
    </div>
  );
}
