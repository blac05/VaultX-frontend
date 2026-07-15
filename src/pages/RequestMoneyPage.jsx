import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Send, Check, X, Clock, Link,
  Copy, Share2, ChevronRight, Zap, AlertCircle, RefreshCw
} from 'lucide-react';
import useVaultStore, { api } from '../store/useVaultStore';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_CFG = {
  pending:   { color: 'var(--gold)',         bg: 'rgba(255,183,0,0.08)',    label: 'Pending',   icon: Clock    },
  paid:      { color: 'var(--haptic-green)', bg: 'rgba(0,255,136,0.08)',   label: 'Paid',      icon: Check    },
  declined:  { color: 'var(--nova-red)',     bg: 'rgba(255,59,59,0.08)',   label: 'Declined',  icon: X        },
  cancelled: { color: 'var(--nebula-gray)', bg: 'rgba(255,255,255,0.04)', label: 'Cancelled', icon: X        },
  expired:   { color: 'var(--dim-gray)',    bg: 'rgba(255,255,255,0.03)', label: 'Expired',   icon: AlertCircle }
};

function RequestCard({ req, isSent, onPay, onDecline, onCancel, onCopyLink }) {
  const navigate = useNavigate();
  const cfg = STATUS_CFG[req.status] || STATUS_CFG.pending;
  const StatusIcon = cfg.icon;
  const other = isSent ? req.payeeId : req.requesterId;
  const otherName = other ? `${other.firstName} ${other.lastName}` : req.payeeHandle || 'Unknown';
  const timeLeft = req.timeRemaining;

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      className="glass-card" style={{ padding: '18px', marginBottom: 12, overflow: 'hidden' }}>

      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 14, background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(123,47,255,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 700, color: 'var(--cyber-blue)', fontFamily: 'var(--font-display)', flexShrink: 0 }}>
            {otherName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 1 }}>{otherName}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--nebula-gray)' }}>
              {isSent ? 'You requested from' : 'Requested by'} · {req.createdAt ? formatDistanceToNow(new Date(req.createdAt), { addSuffix: true }) : ''}
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--stellar-white)' }}>
            {req.currency} {parseFloat(req.amount).toFixed(2)}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', background: cfg.bg, borderRadius: 100, marginTop: 4 }}>
            <StatusIcon size={10} color={cfg.color} />
            <span style={{ fontSize: '0.65rem', color: cfg.color, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{cfg.label}</span>
          </div>
        </div>
      </div>

      {/* Memo */}
      {req.memo && (
        <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, marginBottom: 12, borderLeft: '2px solid rgba(0,212,255,0.2)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--nebula-gray)', fontStyle: 'italic' }}>"{req.memo}"</p>
        </div>
      )}

      {/* Time remaining */}
      {req.status === 'pending' && timeLeft && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: '0.72rem', color: 'var(--gold)' }}>
          <Clock size={11} color="var(--gold)" />
          <span>{timeLeft}</span>
        </div>
      )}

      {/* Actions */}
      <AnimatePresence>
        {req.status === 'pending' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ display: 'flex', gap: 8, overflow: 'hidden' }}>
            {!isSent ? (
              // Payee actions: Pay or Decline
              <>
                <button onClick={() => onPay(req)}
                  style={{ flex: 1, padding: '11px', background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.25)', borderRadius: 12, color: 'var(--haptic-green)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }}>
                  <Zap size={14} /> Pay Now
                </button>
                <button onClick={() => onDecline(req.requestId)}
                  style={{ flex: 1, padding: '11px', background: 'rgba(255,59,59,0.08)', border: '1px solid rgba(255,59,59,0.2)', borderRadius: 12, color: 'var(--nova-red)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <X size={14} /> Decline
                </button>
              </>
            ) : (
              // Requester actions: Copy link or Cancel
              <>
                <button onClick={() => onCopyLink(req.shareLink || `https://vaultx.io/pay/request/${req.requestId}`)}
                  style={{ flex: 1, padding: '11px', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 12, color: 'var(--cyber-blue)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Copy size={14} /> Copy Link
                </button>
                <button onClick={() => onCancel(req.requestId)}
                  style={{ padding: '11px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: 'var(--nebula-gray)', fontSize: '0.82rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paid success state */}
      {req.status === 'paid' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(0,255,136,0.06)', borderRadius: 10 }}>
          <Check size={14} color="var(--haptic-green)" />
          <span style={{ fontSize: '0.78rem', color: 'var(--haptic-green)' }}>
            Paid {req.paidAt ? format(new Date(req.paidAt), 'MMM d, h:mm a') : ''}
          </span>
        </div>
      )}
    </motion.div>
  );
}

function CreateRequestModal({ onClose, onCreated }) {
  const { user } = useVaultStore();
  const [form, setForm] = useState({ payeeHandle: '', amount: '', currency: 'USD', memo: '' });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'success'
  const [created, setCreated] = useState(null);

  const update = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const NUMPAD = ['1','2','3','4','5','6','7','8','9','.','0','⌫'];

  const numpadPress = (val) => {
    if (val === '⌫') setForm(f => ({ ...f, amount: f.amount.slice(0, -1) }));
    else if (val === '.' && form.amount.includes('.')) return;
    else if (form.amount.split('.')[1]?.length >= 2) return;
    else setForm(f => ({ ...f, amount: (f.amount + val).replace(/^0+(\d)/, '$1') }));
  };

  const handleCreate = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) return toast.error('Enter an amount');
    setLoading(true);
    try {
      const res = await api.post('/requests', {
        amount: parseFloat(form.amount),
        currency: form.currency,
        memo: form.memo,
        payeeHandle: form.payeeHandle || undefined
      });
      setCreated(res.data.request);
      setStep('success');
      onCreated?.();
      toast.success('Request created!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create request');
    } finally { setLoading(false); }
  };

  const copyLink = () => {
    const link = `https://vaultx.io/pay/request/${created?.requestId}`;
    navigator.clipboard.writeText(link);
    toast.success('Payment link copied!');
  };

  return (
    <div className="backdrop-overlay" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{ width: '100%', maxWidth: 480, background: 'var(--void-navy)', borderRadius: '24px 24px 0 0', border: '1px solid rgba(0,212,255,0.1)', borderBottom: 'none', padding: '28px 20px 44px', maxHeight: '92vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.06em' }}>
            {step === 'form' ? 'Request Money' : 'Request Sent!'}
          </h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', width: 32, height: 32, borderRadius: '50%', color: 'var(--nebula-gray)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Amount display */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <p style={{ color: 'var(--nebula-gray)', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Request Amount</p>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.8rem,12vw,4rem)', fontWeight: 800, color: form.amount ? 'var(--stellar-white)' : 'rgba(255,255,255,0.12)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  ${form.amount || '0'}
                </div>
              </div>

              {/* Numpad */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
                {NUMPAD.map(k => (
                  <motion.button key={k} whileTap={{ scale: 0.88 }} onClick={() => numpadPress(k)}
                    style={{ padding: '16px', background: k === '⌫' ? 'rgba(255,59,59,0.06)' : 'rgba(255,255,255,0.04)', border: `1px solid ${k === '⌫' ? 'rgba(255,59,59,0.12)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 14, color: k === '⌫' ? 'var(--nova-red)' : 'var(--stellar-white)', fontFamily: k === '⌫' ? 'inherit' : 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, cursor: 'pointer' }}>
                    {k}
                  </motion.button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <div>
                  <label className="input-label">Request from (optional)</label>
                  <input className="input-glass" value={form.payeeHandle} onChange={update('payeeHandle')}
                    placeholder="@username — leave blank for open link" />
                </div>
                <div>
                  <label className="input-label">Note (optional)</label>
                  <input className="input-glass" value={form.memo} onChange={update('memo')}
                    placeholder="What's it for? e.g. rent, dinner..." maxLength={140} />
                </div>
              </div>

              <button className="btn-neon-solid" onClick={handleCreate} disabled={loading || !form.amount}
                style={{ width: '100%', padding: 16, opacity: loading || !form.amount ? 0.5 : 1, cursor: !form.amount ? 'not-allowed' : 'pointer' }}>
                {loading ? <RefreshCw size={16} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <><Send size={16} /> Create Request</>}
              </button>
            </motion.div>
          ) : (
            <motion.div key="success" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(0,255,136,0.12)', border: '2px solid var(--haptic-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 30px rgba(0,255,136,0.25)' }}>
                <Check size={32} color="var(--haptic-green)" />
              </div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 6 }}>Request Created!</h4>
              <p style={{ color: 'var(--nebula-gray)', fontSize: '0.85rem', marginBottom: 8 }}>
                Your request for <span style={{ color: 'var(--cyber-blue)', fontWeight: 700 }}>${parseFloat(created?.amount || 0).toFixed(2)}</span> is live for 7 days.
              </p>
              <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Link size={14} color="var(--cyber-blue)" style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--nebula-gray)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  vaultx.io/pay/request/{created?.requestId}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={copyLink} className="btn-neon" style={{ flex: 1, padding: 14 }}>
                  <Copy size={16} /> Copy Link
                </button>
                <button onClick={() => navigator.share?.({ url: `https://vaultx.io/pay/request/${created?.requestId}`, title: 'Pay me on VaultX' }).catch(() => copyLink())}
                  className="btn-neon-green" style={{ flex: 1, padding: 14 }}>
                  <Share2 size={16} /> Share
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default function RequestMoneyPage() {
  const navigate = useNavigate();
  const { user } = useVaultStore();
  const [tab, setTab] = useState('received');
  const [requests, setRequests] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [payTarget, setPayTarget] = useState(null);

  const load = async (t = tab) => {
    setLoading(true);
    try {
      const res = await api.get('/requests', { params: { tab: t } });
      setRequests(res.data.requests || []);
      if (t === 'received') setPendingCount(res.data.pendingCount || 0);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(tab); }, [tab]);

  const handleDecline = async (requestId) => {
    if (!window.confirm('Decline this payment request?')) return;
    try {
      await api.post(`/requests/${requestId}/decline`);
      setRequests(prev => prev.map(r => r.requestId === requestId ? { ...r, status: 'declined' } : r));
      toast.success('Request declined');
    } catch { toast.error('Failed to decline'); }
  };

  const handleCancel = async (requestId) => {
    if (!window.confirm('Cancel this request?')) return;
    try {
      await api.post(`/requests/${requestId}/cancel`);
      setRequests(prev => prev.map(r => r.requestId === requestId ? { ...r, status: 'cancelled' } : r));
      toast.success('Request cancelled');
    } catch { toast.error('Failed to cancel'); }
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copied!');
  };

  const handlePay = (req) => {
    // Navigate to transfer page pre-filled with request data
    setPayTarget(req);
    navigate(`/transfer?requestId=${req.requestId}&amount=${req.amount}&currency=${req.currency}&handle=${req.requesterHandle}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--obsidian)', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,8,16,0.97)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(0,212,255,0.07)', padding: '14px 20px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--nebula-gray)', cursor: 'pointer' }}><ArrowLeft size={22} /></button>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.08em' }}>PAYMENT REQUESTS</h2>
              <p style={{ color: 'var(--nebula-gray)', fontSize: '0.72rem' }}>
                {pendingCount > 0 ? `${pendingCount} pending request${pendingCount > 1 ? 's' : ''} awaiting payment` : 'Request & track payments'}
              </p>
            </div>
            <motion.button whileTap={{ scale: 0.93 }} onClick={() => setShowCreate(true)}
              className="btn-neon" style={{ padding: '10px 16px', fontSize: '0.8rem' }}>
              <Plus size={15} /> New
            </motion.button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4 }}>
            {[['received','Received'], ['sent','Sent']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 9, background: tab === id ? 'rgba(0,212,255,0.1)' : 'transparent', color: tab === id ? 'var(--cyber-blue)' : 'var(--nebula-gray)', fontFamily: 'var(--font-ui)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}>
                {label}
                {id === 'received' && pendingCount > 0 && (
                  <span style={{ marginLeft: 6, background: 'var(--gold)', color: 'var(--obsidian)', borderRadius: 100, fontSize: '0.6rem', fontWeight: 800, padding: '1px 5px' }}>{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--nebula-gray)' }}>
            <div style={{ width: 32, height: 32, border: '2px solid rgba(0,212,255,0.2)', borderTop: '2px solid var(--cyber-blue)', borderRadius: '50%', animation: 'spin-slow 1s linear infinite', margin: '0 auto 12px' }} />
            Loading requests...
          </div>
        ) : requests.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '64px 24px' }}>
            <div style={{ width: 72, height: 72, borderRadius: 24, background: 'rgba(255,183,0,0.06)', border: '1px solid rgba(255,183,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Zap size={30} color="var(--gold)" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 8 }}>
              No {tab} requests
            </h3>
            <p style={{ color: 'var(--nebula-gray)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 24 }}>
              {tab === 'received'
                ? "You have no incoming payment requests right now."
                : "You haven't requested money from anyone yet."}
            </p>
            <button className="btn-neon" onClick={() => setShowCreate(true)} style={{ padding: '12px 28px' }}>
              <Plus size={16} /> Create a Request
            </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {requests.map(req => (
              <RequestCard key={req.requestId || req._id}
                req={req}
                isSent={tab === 'sent'}
                onPay={handlePay}
                onDecline={handleDecline}
                onCancel={handleCancel}
                onCopyLink={handleCopyLink}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateRequestModal onClose={() => setShowCreate(false)} onCreated={() => load(tab)} />
        )}
      </AnimatePresence>
    </div>
  );
}
