import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bell, BellOff, Check, CheckCheck, Trash2,
  ArrowDownLeft, ArrowUpRight, Shield, CreditCard,
  Info, Zap, Clock, AlertTriangle, X
} from 'lucide-react';
import useVaultStore, { api } from '../store/useVaultStore';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const ICON_MAP = {
  receive:  { icon: ArrowDownLeft, bg: 'rgba(0,255,136,0.1)',  color: 'var(--haptic-green)' },
  send:     { icon: ArrowUpRight,  bg: 'rgba(255,59,59,0.1)',  color: 'var(--nova-red)'     },
  shield:   { icon: Shield,        bg: 'rgba(255,183,0,0.1)',  color: 'var(--gold)'          },
  alert:    { icon: AlertTriangle, bg: 'rgba(255,59,59,0.1)',  color: 'var(--nova-red)'     },
  check:    { icon: Check,         bg: 'rgba(0,255,136,0.1)',  color: 'var(--haptic-green)' },
  card:     { icon: CreditCard,    bg: 'rgba(0,212,255,0.1)',  color: 'var(--cyber-blue)'   },
  request:  { icon: Zap,           bg: 'rgba(255,183,0,0.1)',  color: 'var(--gold)'          },
  info:     { icon: Info,          bg: 'rgba(0,212,255,0.1)',  color: 'var(--cyber-blue)'   },
  kyc:      { icon: Shield,        bg: 'rgba(123,47,255,0.1)', color: 'var(--plasma-purple)' }
};

const FILTER_TABS = [
  { id: 'all',      label: 'All'      },
  { id: 'unread',   label: 'Unread'   },
  { id: 'money',    label: 'Money'    },
  { id: 'security', label: 'Security' }
];

function NotifCard({ notif, onRead, onDelete, onNavigate }) {
  const cfg = ICON_MAP[notif.icon] || ICON_MAP.info;
  const Icon = cfg.icon;
  const age = notif.createdAt
    ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })
    : '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      onClick={() => { onRead(notif._id); if (notif.actionUrl) onNavigate(notif.actionUrl); }}
      style={{
        display: 'flex', gap: 14, padding: '16px', marginBottom: 8,
        background: notif.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(0,212,255,0.04)',
        border: `1px solid ${notif.isRead ? 'rgba(255,255,255,0.05)' : 'rgba(0,212,255,0.12)'}`,
        borderRadius: 16, cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
      }}
    >
      {/* Unread dot */}
      {!notif.isRead && (
        <div style={{ position: 'absolute', top: 14, right: 14, width: 7, height: 7, borderRadius: '50%', background: 'var(--cyber-blue)', boxShadow: '0 0 6px rgba(0,212,255,0.7)' }} />
      )}

      {/* Icon */}
      <div style={{ width: 42, height: 42, borderRadius: 14, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={19} color={cfg.color} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.88rem', fontWeight: notif.isRead ? 500 : 700, color: 'var(--stellar-white)', marginBottom: 3, lineHeight: 1.3 }}>
          {notif.title}
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--nebula-gray)', lineHeight: 1.5, marginBottom: 6 }}>
          {notif.body}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={10} color="var(--dim-gray)" />
          <span style={{ fontSize: '0.68rem', color: 'var(--dim-gray)' }}>{age}</span>
          {notif.metadata?.amount && (
            <>
              <span style={{ color: 'var(--dim-gray)' }}>·</span>
              <span style={{ fontSize: '0.68rem', color: cfg.color, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {notif.metadata.currency} {parseFloat(notif.metadata.amount).toFixed(2)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Delete btn */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(notif._id); }}
        style={{ background: 'none', border: 'none', color: 'var(--dim-gray)', cursor: 'pointer', padding: '4px', alignSelf: 'flex-start', flexShrink: 0, marginTop: 2 }}
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export default function NotificationCenterPage() {
  const navigate = useNavigate();
  const { socket } = useVaultStore();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async (unreadOnly = false) => {
    try {
      const res = await api.get('/notifications', { params: { unread: unreadOnly, limit: 50 } });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time: listen for new notifications via Socket.IO
  useEffect(() => {
    if (!socket) return;
    const handler = ({ notification, unreadCount: count }) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(count);
      toast(notification.title, { icon: '🔔' });
    };
    socket.on('notification:new', handler);
    return () => socket.off('notification:new', handler);
  }, [socket]);

  const handleRead = async (id) => {
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
    try { await api.patch(`/notifications/${id}/read`); } catch { /* silent */ }
  };

  const handleDelete = async (id) => {
    const n = notifications.find(n => n._id === id);
    setNotifications(prev => prev.filter(n => n._id !== id));
    if (!n?.isRead) setUnreadCount(c => Math.max(0, c - 1));
    try { await api.delete(`/notifications/${id}`); } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await api.patch('/notifications/mark-all-read');
      toast.success('All marked as read');
    } catch { /* silent */ }
  };

  const handleClearRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    setNotifications(unread);
    try {
      await api.delete('/notifications/clear-all');
      toast.success('Cleared read notifications');
    } catch { /* silent */ }
  };

  const handleNavigate = (url) => {
    if (url) navigate(url);
  };

  const MONEY_TYPES = ['transfer_received', 'transfer_sent', 'transfer_failed', 'request_received', 'request_accepted', 'request_declined'];
  const SECURITY_TYPES = ['security_new_device', 'security_login', 'security_failed_login', 'security_card_added'];

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'money') return MONEY_TYPES.includes(n.type);
    if (filter === 'security') return SECURITY_TYPES.includes(n.type);
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--obsidian)', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,8,16,0.97)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(0,212,255,0.07)', padding: '14px 20px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--nebula-gray)', cursor: 'pointer' }}>
              <ArrowLeft size={22} />
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.08em' }}>NOTIFICATIONS</h2>
                {unreadCount > 0 && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}
                    style={{ background: 'var(--cyber-blue)', color: 'var(--obsidian)', fontSize: '0.65rem', fontWeight: 800, padding: '2px 7px', borderRadius: 100, minWidth: 20, textAlign: 'center' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </motion.div>
                )}
              </div>
              <p style={{ color: 'var(--nebula-gray)', fontSize: '0.72rem' }}>
                {unreadCount === 0 ? 'All caught up' : `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} title="Mark all read"
                  style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 10, padding: '7px', cursor: 'pointer', color: 'var(--cyber-blue)', display: 'flex', alignItems: 'center' }}>
                  <CheckCheck size={16} />
                </button>
              )}
              <button onClick={handleClearRead} title="Clear read"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '7px', cursor: 'pointer', color: 'var(--nebula-gray)', display: 'flex', alignItems: 'center' }}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 6 }}>
            {FILTER_TABS.map(t => (
              <button key={t.id} onClick={() => setFilter(t.id)}
                style={{ padding: '7px 14px', background: filter === t.id ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${filter === t.id ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 10, color: filter === t.id ? 'var(--cyber-blue)' : 'var(--nebula-gray)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.04em' }}>
                {t.label}
                {t.id === 'unread' && unreadCount > 0 && (
                  <span style={{ marginLeft: 6, background: 'var(--cyber-blue)', color: 'var(--obsidian)', borderRadius: 100, fontSize: '0.6rem', fontWeight: 800, padding: '1px 5px' }}>{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ height: 80, background: 'rgba(255,255,255,0.03)', borderRadius: 16, animation: 'shimmer 1.5s infinite', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(0,212,255,0.04) 50%, rgba(255,255,255,0.03) 75%)', backgroundSize: '400px 100%' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '64px 24px' }}>
            <div style={{ width: 72, height: 72, borderRadius: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <BellOff size={30} color="var(--dim-gray)" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 8, color: 'var(--stellar-white)' }}>
              {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
            </h3>
            <p style={{ color: 'var(--nebula-gray)', fontSize: '0.85rem', lineHeight: 1.6 }}>
              {filter === 'unread'
                ? 'You have no unread notifications right now.'
                : 'Transfer money or add a card to get started.'}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map(n => (
              <NotifCard key={n._id} notif={n}
                onRead={handleRead} onDelete={handleDelete} onNavigate={handleNavigate} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
