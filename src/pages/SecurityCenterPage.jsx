import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shield, Smartphone, LogOut, Trash2, Lock, Unlock,
  Clock, AlertTriangle, Check, ChevronRight, Monitor, Globe,
  Eye, Fingerprint, Key, Activity, RefreshCw, X
} from 'lucide-react';
import useVaultStore, { api } from '../store/useVaultStore';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';

function Section({ title, icon: Icon, color = 'var(--cyber-blue)', children, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="glass-card" style={{ padding: '20px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
        <h4 style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nebula-gray)' }}>{title}</h4>
      </div>
      {children}
    </motion.div>
  );
}

function DeviceRow({ device, isCurrent, onRemove }) {
  const ua = device.deviceName || device.userAgent || 'Unknown device';
  const isMobile = /mobile|android|iphone/i.test(ua);
  const Icon = isMobile ? Smartphone : Monitor;
  const age = device.lastSeenAt ? formatDistanceToNow(new Date(device.lastSeenAt), { addSuffix: true }) : 'Unknown';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: isCurrent ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isCurrent ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={17} color={isCurrent ? 'var(--haptic-green)' : 'var(--nebula-gray)'} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: '0.87rem', fontWeight: 600, color: 'var(--stellar-white)' }}>
            {ua.length > 30 ? ua.slice(0, 30) + '…' : ua}
          </span>
          {isCurrent && <span style={{ fontSize: '0.6rem', color: 'var(--haptic-green)', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 100, padding: '1px 7px', fontWeight: 700, letterSpacing: '0.08em' }}>THIS DEVICE</span>}
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--nebula-gray)' }}>Last seen {age}</span>
      </div>
      {!isCurrent && (
        <button onClick={() => onRemove(device.deviceId)}
          style={{ background: 'rgba(255,59,59,0.08)', border: '1px solid rgba(255,59,59,0.15)', borderRadius: 10, padding: '7px 10px', color: 'var(--nova-red)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

function SessionRow({ session, onRevoke }) {
  const age = session.lastActivityAt ? formatDistanceToNow(new Date(session.lastActivityAt), { addSuffix: true }) : 'Unknown';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: session.isCurrent ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${session.isCurrent ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Key size={16} color={session.isCurrent ? 'var(--cyber-blue)' : 'var(--nebula-gray)'} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: '0.87rem', fontWeight: 600, color: 'var(--stellar-white)' }}>
            {session.deviceName || 'Unknown device'}
          </span>
          {session.isCurrent && <span style={{ fontSize: '0.6rem', color: 'var(--cyber-blue)', background: 'rgba(0,212,255,0.1)', borderRadius: 100, padding: '1px 7px', fontWeight: 700 }}>ACTIVE</span>}
        </div>
        <div style={{ display: 'flex', gap: 10, fontSize: '0.7rem', color: 'var(--nebula-gray)' }}>
          {session.ipAddress && <span>{session.ipAddress}</span>}
          <span>·</span>
          <span>{age}</span>
        </div>
      </div>
      {!session.isCurrent && (
        <button onClick={() => onRevoke(session.sessionId)}
          style={{ background: 'rgba(255,59,59,0.08)', border: '1px solid rgba(255,59,59,0.15)', borderRadius: 10, padding: '7px 10px', color: 'var(--nova-red)', cursor: 'pointer' }}>
          <LogOut size={14} />
        </button>
      )}
    </div>
  );
}

function ActivityRow({ event }) {
  const age = event.createdAt ? formatDistanceToNow(new Date(event.createdAt), { addSuffix: true }) : '';
  const typeColor = {
    security_failed_login: 'var(--nova-red)',
    security_new_device: 'var(--gold)',
    security_login: 'var(--haptic-green)',
    security_card_added: 'var(--cyber-blue)'
  };

  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: typeColor[event.type] || 'var(--nebula-gray)', marginTop: 5, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '0.83rem', fontWeight: 600, marginBottom: 1 }}>{event.title}</p>
        <p style={{ fontSize: '0.72rem', color: 'var(--nebula-gray)', lineHeight: 1.4 }}>{event.body}</p>
      </div>
      <span style={{ fontSize: '0.68rem', color: 'var(--dim-gray)', flexShrink: 0, paddingTop: 1 }}>{age}</span>
    </div>
  );
}

export default function SecurityCenterPage() {
  const navigate = useNavigate();
  const { user, logout } = useVaultStore();
  const [overview, setOverview] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [devices, setDevices] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [freezeModal, setFreezeModal] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ovRes, sessRes, devRes, actRes] = await Promise.all([
        api.get('/security/overview'),
        api.get('/security/sessions'),
        api.get('/security/devices'),
        api.get('/security/activity')
      ]);
      setOverview(ovRes.data.overview);
      setSessions(sessRes.data.sessions || []);
      setDevices(devRes.data.devices || []);
      setActivity(actRes.data.activity || []);
    } catch (err) {
      // Fallback demo data
      setOverview({ accountStatus: user?.status || 'active', twoFactorEnabled: false, biometricRegistered: true, activeSessions: 1, trustedDevices: 1, lastLogin: new Date(), kycTier: user?.kyc?.tier || 0 });
    } finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  const revokeSession = async (sessionId) => {
    setActionLoading(sessionId);
    try {
      await api.delete(`/security/sessions/${sessionId}`);
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
      toast.success('Session terminated');
    } catch { toast.error('Failed to revoke session'); }
    finally { setActionLoading(''); }
  };

  const revokeAllSessions = async () => {
    if (!window.confirm('Sign out of all other devices?')) return;
    setActionLoading('all');
    try {
      await api.delete('/security/sessions');
      setSessions(prev => prev.filter(s => s.isCurrent));
      toast.success('All other sessions terminated');
    } catch { toast.error('Failed'); }
    finally { setActionLoading(''); }
  };

  const removeDevice = async (deviceId) => {
    if (!window.confirm('Remove this trusted device?')) return;
    try {
      await api.delete(`/security/devices/${deviceId}`);
      setDevices(prev => prev.filter(d => d.deviceId !== deviceId));
      toast.success('Device removed');
    } catch { toast.error('Failed to remove device'); }
  };

  const handleFreeze = async () => {
    setActionLoading('freeze');
    try {
      await api.post('/security/freeze');
      toast.success('Account frozen. You have been logged out.');
      setFreezeModal(false);
      logout();
      navigate('/auth');
    } catch { toast.error('Failed to freeze account'); }
    finally { setActionLoading(''); }
  };

  const isFrozen = overview?.accountStatus === 'frozen';
  const isSuspended = overview?.accountStatus === 'suspended';
  const securityScore = overview
    ? Math.min(100, (overview.twoFactorEnabled ? 30 : 0) + (overview.biometricRegistered ? 35 : 0) + (overview.kycTier >= 2 ? 25 : overview.kycTier >= 1 ? 15 : 0) + 10)
    : 0;
  const scoreColor = securityScore >= 80 ? 'var(--haptic-green)' : securityScore >= 50 ? 'var(--gold)' : 'var(--nova-red)';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--obsidian)', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,8,16,0.97)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(0,212,255,0.07)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--nebula-gray)', cursor: 'pointer' }}><ArrowLeft size={22} /></button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.08em' }}>SECURITY CENTER</h2>
          <p style={{ color: 'var(--nebula-gray)', fontSize: '0.72rem' }}>Manage sessions, devices & account protection</p>
        </div>
        <button onClick={loadAll} style={{ background: 'none', border: 'none', color: 'var(--nebula-gray)', cursor: 'pointer', padding: 4 }}>
          <RefreshCw size={17} style={{ animation: loading ? 'spin-slow 1s linear infinite' : 'none' }} />
        </button>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>

        {/* Security score */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card-intense" style={{ padding: '24px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--nebula-gray)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Security Score</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{securityScore}</span>
                <span style={{ color: 'var(--nebula-gray)', fontSize: '0.85rem' }}>/100</span>
              </div>
            </div>
            <div style={{ width: 60, height: 60, position: 'relative' }}>
              <svg viewBox="0 0 60 60" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                <motion.circle cx="30" cy="30" r="24" fill="none" stroke={scoreColor} strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 24 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - securityScore / 100) }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                  strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={20} color={scoreColor} />
              </div>
            </div>
          </div>

          {/* Score checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Biometric auth enabled', done: overview?.biometricRegistered, pts: 35 },
              { label: '2FA / TOTP enabled', done: overview?.twoFactorEnabled, pts: 30 },
              { label: 'Identity verified (KYC)', done: (overview?.kycTier || 0) >= 2, pts: 25 },
              { label: 'Account active', done: overview?.accountStatus === 'active', pts: 10 }
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: item.done ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${item.done ? 'rgba(0,255,136,0.35)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.done ? <Check size={11} color="var(--haptic-green)" /> : <X size={10} color="var(--dim-gray)" />}
                </div>
                <span style={{ flex: 1, fontSize: '0.8rem', color: item.done ? 'var(--stellar-white)' : 'var(--nebula-gray)' }}>{item.label}</span>
                <span style={{ fontSize: '0.68rem', color: item.done ? scoreColor : 'var(--dim-gray)', fontWeight: 600 }}>+{item.pts}pts</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Account freeze toggle */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ padding: '18px 20px', background: isFrozen ? 'rgba(0,212,255,0.06)' : 'rgba(255,59,59,0.05)', border: `1px solid ${isFrozen ? 'rgba(0,212,255,0.2)' : 'rgba(255,59,59,0.12)'}`, borderRadius: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: isFrozen ? 'rgba(0,212,255,0.12)' : 'rgba(255,59,59,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {isFrozen ? <Unlock size={20} color="var(--cyber-blue)" /> : <Lock size={20} color="var(--nova-red)" />}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2, color: isFrozen ? 'var(--cyber-blue)' : 'var(--stellar-white)' }}>
              {isFrozen ? 'Account Frozen' : 'Freeze Account'}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--nebula-gray)', lineHeight: 1.4 }}>
              {isFrozen ? 'Your account is frozen. No transfers can be made.' : 'Instantly blocks all transfers and signs out all sessions.'}
            </p>
          </div>
          <button onClick={() => isFrozen ? null : setFreezeModal(true)}
            style={{ padding: '9px 16px', background: isFrozen ? 'rgba(0,212,255,0.12)' : 'rgba(255,59,59,0.12)', border: `1px solid ${isFrozen ? 'rgba(0,212,255,0.25)' : 'rgba(255,59,59,0.25)'}`, borderRadius: 10, color: isFrozen ? 'var(--cyber-blue)' : 'var(--nova-red)', fontSize: '0.78rem', fontWeight: 700, cursor: isFrozen ? 'default' : 'pointer', flexShrink: 0 }}>
            {isFrozen ? 'Frozen' : 'Freeze'}
          </button>
        </motion.div>

        {/* Active sessions */}
        <Section title="Active Sessions" icon={Key} color="var(--cyber-blue)" delay={0.1}>
          {sessions.length === 0 ? (
            <p style={{ color: 'var(--nebula-gray)', fontSize: '0.82rem', padding: '8px 0' }}>No active sessions found.</p>
          ) : (
            <>
              {sessions.map(s => <SessionRow key={s.sessionId} session={s} onRevoke={revokeSession} />)}
              {sessions.filter(s => !s.isCurrent).length > 0 && (
                <button onClick={revokeAllSessions} disabled={actionLoading === 'all'}
                  style={{ width: '100%', marginTop: 14, padding: '11px', background: 'rgba(255,59,59,0.06)', border: '1px solid rgba(255,59,59,0.15)', borderRadius: 12, color: 'var(--nova-red)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <LogOut size={15} /> Sign Out All Other Sessions
                </button>
              )}
            </>
          )}
        </Section>

        {/* Trusted devices */}
        <Section title="Trusted Devices" icon={Smartphone} color="var(--haptic-green)" delay={0.15}>
          {devices.length === 0 ? (
            <p style={{ color: 'var(--nebula-gray)', fontSize: '0.82rem', padding: '8px 0' }}>No trusted devices found.</p>
          ) : (
            devices.map(d => (
              <DeviceRow key={d.deviceId} device={d}
                isCurrent={d.deviceId === useVaultStore.getState().deviceId}
                onRemove={removeDevice} />
            ))
          )}
        </Section>

        {/* Biometrics */}
        <Section title="Biometric Authentication" icon={Fingerprint} color="var(--plasma-purple)" delay={0.2}>
          {[
            { label: 'Face ID', registered: overview?.biometricRegistered, desc: 'Used for transfer confirmations' },
            { label: 'Fingerprint', registered: false, desc: 'Not registered on this device' }
          ].map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i === 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: b.registered ? 'var(--haptic-green)' : 'rgba(255,255,255,0.15)', flexShrink: 0, boxShadow: b.registered ? '0 0 6px rgba(0,255,136,0.6)' : 'none' }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.87rem', fontWeight: 600, marginBottom: 1 }}>{b.label}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--nebula-gray)' }}>{b.desc}</p>
              </div>
              <span style={{ fontSize: '0.72rem', color: b.registered ? 'var(--haptic-green)' : 'var(--dim-gray)', fontWeight: 600 }}>
                {b.registered ? 'Active' : 'Not set'}
              </span>
            </div>
          ))}
        </Section>

        {/* Security activity log */}
        <Section title="Security Activity" icon={Activity} color="var(--gold)" delay={0.25}>
          {activity.length === 0 ? (
            <p style={{ color: 'var(--nebula-gray)', fontSize: '0.82rem', padding: '8px 0' }}>No recent security events.</p>
          ) : (
            activity.slice(0, 8).map((e, i) => <ActivityRow key={i} event={e} />)
          )}
        </Section>
      </div>

      {/* Freeze confirmation modal */}
      <AnimatePresence>
        {freezeModal && (
          <div className="backdrop-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card-intense" style={{ padding: '32px 24px', maxWidth: 340, textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,59,59,0.12)', border: '2px solid rgba(255,59,59,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Lock size={26} color="var(--nova-red)" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 10 }}>Freeze Account?</h3>
              <p style={{ color: 'var(--nebula-gray)', fontSize: '0.85rem', lineHeight: 1.65, marginBottom: 28 }}>
                This will <strong style={{ color: 'var(--nova-red)' }}>immediately block all transfers</strong>, sign out all active sessions, and suspend your cards.<br /><br />
                Contact support at <span style={{ color: 'var(--cyber-blue)' }}>support@vaultx.io</span> to unfreeze.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setFreezeModal(false)} className="btn-ghost" style={{ flex: 1, padding: 14 }}>Cancel</button>
                <button onClick={handleFreeze} disabled={actionLoading === 'freeze'}
                  style={{ flex: 1, padding: 14, background: 'rgba(255,59,59,0.15)', border: '1px solid rgba(255,59,59,0.35)', borderRadius: 12, color: 'var(--nova-red)', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', fontFamily: 'var(--font-ui)' }}>
                  {actionLoading === 'freeze' ? 'Freezing...' : 'Freeze Now'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
