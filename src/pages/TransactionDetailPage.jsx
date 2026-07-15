import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Copy, ExternalLink, Clock, Shield, Zap } from 'lucide-react';
import useVaultStore, { api } from '../store/useVaultStore';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  settled:    { color: 'var(--haptic-green)', bg: 'rgba(0,255,136,0.08)', label: 'Settled', icon: '✓' },
  processing: { color: 'var(--cyber-blue)',   bg: 'rgba(0,212,255,0.08)', label: 'Processing', icon: '◌' },
  failed:     { color: 'var(--nova-red)',      bg: 'rgba(255,59,59,0.08)', label: 'Failed', icon: '✕' },
  initiated:  { color: 'var(--gold)',          bg: 'rgba(255,183,0,0.08)', label: 'Initiated', icon: '→' },
  reversed:   { color: 'var(--nebula-gray)',   bg: 'rgba(255,255,255,0.04)', label: 'Reversed', icon: '↩' },
  cancelled:  { color: 'var(--nebula-gray)',   bg: 'rgba(255,255,255,0.04)', label: 'Cancelled', icon: '⊘' },
  on_hold:    { color: 'var(--gold)',          bg: 'rgba(255,183,0,0.08)', label: 'On Hold', icon: '⏸' }
};

const RAIL_LABELS = {
  visa_direct: 'Visa Direct', mastercard_send: 'Mastercard Send',
  swift_gpi: 'SWIFT gpi', rtp: 'Real-Time Payments', sepa_instant: 'SEPA Instant', ach: 'ACH'
};

function HopTimeline({ hops }) {
  if (!hops?.length) return null;
  return (
    <div style={{ padding: '4px 0' }}>
      {hops.map((hop, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
          style={{ display: 'flex', gap: 16, marginBottom: i < hops.length - 1 ? 0 : 0 }}>
          {/* Timeline line */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20 }}>
            <div style={{
              width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
              background: hop.status === 'completed' ? 'var(--haptic-green)' : hop.status === 'processing' ? 'var(--cyber-blue)' : 'rgba(255,255,255,0.15)',
              border: `2px solid ${hop.status === 'completed' ? 'rgba(0,255,136,0.4)' : hop.status === 'processing' ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
              boxShadow: hop.status === 'completed' ? '0 0 8px rgba(0,255,136,0.4)' : hop.status === 'processing' ? '0 0 8px rgba(0,212,255,0.5)' : 'none',
              marginTop: 4
            }} />
            {i < hops.length - 1 && (
              <div style={{ width: 1, flex: 1, minHeight: 32, background: hop.status === 'completed' ? 'linear-gradient(to bottom, rgba(0,255,136,0.3), rgba(0,212,255,0.1))' : 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
            )}
          </div>
          {/* Hop info */}
          <div style={{ flex: 1, paddingBottom: i < hops.length - 1 ? 20 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--stellar-white)', marginBottom: 2 }}>{hop.node}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--nebula-gray)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{hop.nodeType?.replace('_', ' ')}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                {hop.latencyMs && <p style={{ fontSize: '0.72rem', color: 'var(--cyber-blue)', fontFamily: 'var(--font-mono)' }}>{hop.latencyMs}ms</p>}
                {hop.timestamp && <p style={{ fontSize: '0.68rem', color: 'var(--dim-gray)' }}>{format(new Date(hop.timestamp), 'HH:mm:ss')}</p>}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function DataRow({ label, value, mono, copy, accent }) {
  const copyVal = () => { navigator.clipboard.writeText(value); toast.success('Copied!'); };
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--nebula-gray)', letterSpacing: '0.05em' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: accent || 'var(--stellar-white)', fontFamily: mono ? 'var(--font-mono)' : 'var(--font-ui)', letterSpacing: mono ? '0.05em' : 'normal' }}>{value}</span>
        {copy && <button onClick={copyVal} style={{ background: 'none', border: 'none', color: 'var(--nebula-gray)', cursor: 'pointer', padding: 2 }}><Copy size={13} /></button>}
      </div>
    </div>
  );
}

export default function TransactionDetailPage() {
  const { txId } = useParams();
  const navigate = useNavigate();
  const { user } = useVaultStore();
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/transfers/${txId}`);
        setTx(res.data.transaction);
      } catch (err) {
        toast.error('Transaction not found');
        navigate('/dashboard');
      } finally { setLoading(false); }
    };
    load();
  }, [txId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--obsidian)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '2px solid rgba(0,212,255,0.2)', borderTop: '2px solid var(--cyber-blue)', borderRadius: '50%', animation: 'spin-slow 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--nebula-gray)', fontSize: '0.85rem' }}>Loading transaction...</p>
        </div>
      </div>
    );
  }

  if (!tx) return null;

  const isSent = tx.senderId?._id === user?._id || tx.senderId === user?._id;
  const other = isSent ? tx.recipientId : tx.senderId;
  const statusCfg = STATUS_CONFIG[tx.status] || STATUS_CONFIG.initiated;
  const durationSec = tx.settledAt && tx.initiatedAt ? ((new Date(tx.settledAt) - new Date(tx.initiatedAt)) / 1000).toFixed(1) : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--obsidian)', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,8,16,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,212,255,0.06)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--nebula-gray)', cursor: 'pointer' }}>
          <ArrowLeft size={22} />
        </button>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.08em', flex: 1 }}>TRANSACTION DETAIL</h2>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--nebula-gray)' }}>{tx.txId?.slice(0, 12)}…</span>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>

        {/* Hero amount card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card-intense" style={{ padding: '32px 24px', textAlign: 'center', marginBottom: 20 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 18, background: isSent ? 'rgba(255,59,59,0.1)' : 'rgba(0,255,136,0.1)', marginBottom: 16 }}>
            {isSent ? <ArrowUpRight size={24} color="var(--nova-red)" /> : <ArrowDownLeft size={24} color="var(--haptic-green)" />}
          </div>
          <p style={{ color: 'var(--nebula-gray)', fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
            {isSent ? 'You Sent' : 'You Received'}
          </p>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 10vw, 3.2rem)', fontWeight: 800, color: isSent ? 'var(--nova-red)' : 'var(--haptic-green)', marginBottom: 8, letterSpacing: '-0.02em' }}>
            {isSent ? '-' : '+'}{tx.currency} {parseFloat(tx.amount).toFixed(2)}
          </div>
          {other && (
            <p style={{ color: 'var(--nebula-gray)', fontSize: '0.9rem' }}>
              {isSent ? 'to' : 'from'} <span style={{ color: 'var(--stellar-white)', fontWeight: 600 }}>{other.firstName} {other.lastName}</span>
              {other.paymentHandle && <span style={{ color: 'var(--nebula-gray)' }}> · {other.paymentHandle}</span>}
            </p>
          )}
          {tx.memo && <p style={{ color: 'var(--nebula-gray)', fontSize: '0.82rem', fontStyle: 'italic', marginTop: 8 }}>"{tx.memo}"</p>}

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16, padding: '8px 18px', background: statusCfg.bg, borderRadius: 100 }}>
            <span style={{ fontSize: '0.8rem', color: statusCfg.color, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {statusCfg.icon} {statusCfg.label}
            </span>
          </div>
        </motion.div>

        {/* Settlement speed highlight */}
        {durationSec && tx.status === 'settled' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.12)', borderRadius: 14, marginBottom: 20 }}>
            <Zap size={18} color="var(--haptic-green)" />
            <div>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--haptic-green)' }}>Settled in {durationSec}s</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--nebula-gray)' }}>via {RAIL_LABELS[tx.rail] || tx.rail}</p>
            </div>
          </motion.div>
        )}

        {/* Network journey */}
        {tx.networkHops?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-card" style={{ padding: '20px', marginBottom: 20 }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nebula-gray)', marginBottom: 16 }}>Network Journey</h4>
            <HopTimeline hops={tx.networkHops} />
          </motion.div>
        )}

        {/* Transaction details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass-card" style={{ padding: '20px', marginBottom: 20 }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nebula-gray)', marginBottom: 8 }}>Details</h4>
          <DataRow label="Transaction ID" value={tx.txId} mono copy />
          {tx.networkReference && <DataRow label="Network Ref" value={tx.networkReference} mono copy />}
          <DataRow label="Rail" value={RAIL_LABELS[tx.rail] || tx.rail} />
          <DataRow label="Initiated" value={tx.initiatedAt ? format(new Date(tx.initiatedAt), 'MMM d, yyyy HH:mm:ss') : '—'} />
          {tx.settledAt && <DataRow label="Settled" value={format(new Date(tx.settledAt), 'MMM d, yyyy HH:mm:ss')} accent="var(--haptic-green)" />}
          <DataRow label="Initiated via" value={tx.initiatedVia?.replace('_', ' ')} />
          {tx.biometricType && <DataRow label="Auth Method" value={tx.biometricType.replace('_', ' ')} />}
        </motion.div>

        {/* Fee breakdown */}
        {tx.fees && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-card" style={{ padding: '20px', marginBottom: 20 }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nebula-gray)', marginBottom: 8 }}>Fee Breakdown</h4>
            <DataRow label="Amount Sent" value={`${tx.currency} ${parseFloat(tx.amount).toFixed(2)}`} />
            <DataRow label="Platform Fee" value={`${tx.currency} ${parseFloat(tx.fees.platformFee || 0).toFixed(2)}`} />
            <DataRow label="Network Fee" value={`${tx.currency} ${parseFloat(tx.fees.networkFee || 0).toFixed(2)}`} />
            {tx.fees.fxFee > 0 && <DataRow label="FX Fee" value={`${tx.currency} ${parseFloat(tx.fees.fxFee).toFixed(2)}`} />}
            <DataRow label="Total Fees" value={`${tx.currency} ${parseFloat(tx.fees.totalFee || 0).toFixed(2)}`} accent="var(--gold)" />
            <DataRow label="Recipient Gets" value={`${tx.fx?.toCurrency || tx.currency} ${parseFloat(tx.netAmount || tx.amount).toFixed(2)}`} accent="var(--haptic-green)" />
          </motion.div>
        )}

        {/* FX details */}
        {tx.fx && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="glass-card" style={{ padding: '20px', marginBottom: 20 }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nebula-gray)', marginBottom: 8 }}>Currency Conversion</h4>
            <DataRow label="Exchange Rate" value={`1 ${tx.fx.fromCurrency} = ${parseFloat(tx.fx.exchangeRate).toFixed(4)} ${tx.fx.toCurrency}`} mono />
            <DataRow label="Rate Provider" value={tx.fx.rateProvider?.toUpperCase() || 'OXR'} />
            <DataRow label="Rate Locked At" value={tx.fx.rateLockedAt ? format(new Date(tx.fx.rateLockedAt), 'HH:mm:ss') : '—'} />
          </motion.div>
        )}

        {/* Security info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.08)', borderRadius: 14 }}>
          <Shield size={16} color="var(--cyber-blue)" />
          <p style={{ fontSize: '0.75rem', color: 'var(--nebula-gray)', lineHeight: 1.5 }}>
            This transaction was protected by ZKP card tokenization, AI fraud analysis, and biometric authentication. No raw card data was transmitted.
          </p>
        </motion.div>

        {tx.status === 'failed' && tx.errorMessage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ marginTop: 16, padding: '14px 18px', background: 'rgba(255,59,59,0.06)', border: '1px solid rgba(255,59,59,0.15)', borderRadius: 14 }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--nova-red)', fontWeight: 600, marginBottom: 4 }}>Failure Reason</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--nebula-gray)' }}>{tx.errorMessage}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
