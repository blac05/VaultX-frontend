import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Camera, FileText, User, Check, ChevronRight, Fingerprint, Zap } from 'lucide-react';
import useVaultStore, { api } from '../store/useVaultStore';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 'welcome',   label: 'Welcome',   icon: Zap },
  { id: 'identity',  label: 'Identity',  icon: User },
  { id: 'document',  label: 'Document',  icon: FileText },
  { id: 'selfie',    label: 'Selfie',    icon: Camera },
  { id: 'complete',  label: 'Complete',  icon: Check }
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useVaultStore();
  const [step, setStep] = useState('welcome');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ dateOfBirth: '', nationality: '', address: { line1: '', city: '', country: '' } });
  const [docType, setDocType] = useState('passport');
  const [selfieCapturing, setSelfieCapturing] = useState(false);

  const stepIndex = STEPS.findIndex(s => s.id === step);
  const progress = (stepIndex / (STEPS.length - 1)) * 100;

  const update = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const updateAddr = (k) => (e) => setForm(f => ({ ...f, address: { ...f.address, [k]: e.target.value } }));

  const startKYC = async () => {
    setLoading(true);
    try {
      await api.post('/kyc/start');
      setStep('identity');
    } catch (err) {
      toast.error('Failed to start verification');
    } finally { setLoading(false); }
  };

  const submitIdentity = async () => {
    if (!form.dateOfBirth || !form.nationality) return toast.error('Fill all fields');
    setLoading(true);
    try {
      await api.patch('/users/profile', { dateOfBirth: form.dateOfBirth, nationality: form.nationality, address: form.address });
      setStep('document');
    } catch { toast.error('Failed to save'); }
    finally { setLoading(false); }
  };

  const simulateDocScan = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false);
    toast.success('Document scanned successfully');
    setStep('selfie');
  };

  const simulateSelfie = async () => {
    setSelfieCapturing(true);
    await new Promise(r => setTimeout(r, 2500));
    setSelfieCapturing(false);
    toast.success('Liveness check passed!');
    setLoading(true);
    // In production: submit to Onfido workflow
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    setStep('complete');
    await refreshUser();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--obsidian)' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,8,16,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,212,255,0.06)', padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, maxWidth: 480, margin: '0 auto' }}>
          <button onClick={() => step === 'welcome' ? navigate('/dashboard') : setStep(STEPS[stepIndex - 1]?.id || 'welcome')}
            style={{ background: 'none', border: 'none', color: 'var(--nebula-gray)', cursor: 'pointer' }}>
            <ArrowLeft size={22} />
          </button>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--nebula-gray)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Identity Verification — Step {stepIndex + 1} of {STEPS.length}</p>
            <div className="progress-track">
              <motion.div className="progress-fill" animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 16px' }}>

        {/* Step indicators */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
          {STEPS.map((s, i) => {
            const isActive = s.id === step;
            const isDone = i < stepIndex;
            return (
              <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: isDone ? 'rgba(0,255,136,0.15)' : isActive ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)', border: `2px solid ${isDone ? 'var(--haptic-green)' : isActive ? 'var(--cyber-blue)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', boxShadow: isActive ? '0 0 15px rgba(0,212,255,0.3)' : 'none' }}>
                  {isDone ? <Check size={16} color="var(--haptic-green)" /> : <s.icon size={15} color={isActive ? 'var(--cyber-blue)' : 'var(--dim-gray)'} />}
                </div>
                <span style={{ fontSize: '0.6rem', color: isActive ? 'var(--cyber-blue)' : isDone ? 'var(--haptic-green)' : 'var(--dim-gray)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</span>
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">

          {/* Welcome */}
          {step === 'welcome' && (
            <motion.div key="welcome" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} style={{ textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: 26, background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(123,47,255,0.1))', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 40px rgba(0,212,255,0.12)' }}>
                <Shield size={36} color="var(--cyber-blue)" />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>Verify Your Identity</h2>
              <p style={{ color: 'var(--nebula-gray)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 32 }}>
                To send money globally and access full transfer limits, we need to verify your identity. This takes under <span style={{ color: 'var(--cyber-blue)' }}>60 seconds</span> and is powered by bank-grade AI.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {[
                  { label: 'Government ID', sub: 'Passport, driver\'s license, or national ID', icon: FileText },
                  { label: 'Liveness Check', sub: 'Quick selfie — no app download required', icon: Camera },
                  { label: 'Instant Decision', sub: 'AI-powered verification in under 60 seconds', icon: Zap }
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(0,212,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <item.icon size={18} color="var(--cyber-blue)" />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 2 }}>{item.label}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--nebula-gray)' }}>{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p style={{ color: 'var(--dim-gray)', fontSize: '0.75rem', marginBottom: 20, lineHeight: 1.6 }}>
                Your data is encrypted end-to-end and processed in compliance with GDPR and CCPA. We never sell your personal information.
              </p>

              <button className="btn-neon-solid" onClick={startKYC} disabled={loading}
                style={{ width: '100%', padding: 18, fontSize: '1rem' }}>
                {loading ? 'Starting...' : <><Shield size={18} /> Start Verification</>}
              </button>
            </motion.div>
          )}

          {/* Identity */}
          {step === 'identity' && (
            <motion.div key="identity" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 6 }}>Personal Information</h3>
              <p style={{ color: 'var(--nebula-gray)', fontSize: '0.85rem', marginBottom: 28 }}>Provide your details exactly as they appear on your government ID.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="input-label">Date of Birth</label>
                  <input className="input-glass" type="date" value={form.dateOfBirth} onChange={update('dateOfBirth')} max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="input-label">Nationality</label>
                  <select className="input-glass" value={form.nationality} onChange={update('nationality')} style={{ cursor: 'pointer' }}>
                    <option value="">Select nationality</option>
                    {['US','GB','NG','GH','KE','CA','AU','SG','AE','IN','DE','FR','BR','ZA','EG'].map(c => (
                      <option key={c} value={c} style={{ background: '#0D1117' }}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label">Street Address</label>
                  <input className="input-glass" value={form.address.line1} onChange={updateAddr('line1')} placeholder="123 Main Street" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="input-label">City</label>
                    <input className="input-glass" value={form.address.city} onChange={updateAddr('city')} placeholder="New York" />
                  </div>
                  <div>
                    <label className="input-label">Country</label>
                    <input className="input-glass" value={form.address.country} onChange={updateAddr('country')} placeholder="US" maxLength={2} style={{ textTransform: 'uppercase' }} />
                  </div>
                </div>
              </div>

              <button className="btn-neon-solid" onClick={submitIdentity} disabled={loading}
                style={{ width: '100%', padding: 18, marginTop: 28 }}>
                {loading ? 'Saving...' : <>Continue <ChevronRight size={18} /></>}
              </button>
            </motion.div>
          )}

          {/* Document */}
          {step === 'document' && (
            <motion.div key="document" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 6 }}>Upload ID Document</h3>
              <p style={{ color: 'var(--nebula-gray)', fontSize: '0.85rem', marginBottom: 28 }}>Choose your document type and scan both sides clearly.</p>

              <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                {[['passport','Passport'], ['drivers_license','Driver\'s License'], ['national_id','National ID']].map(([id, label]) => (
                  <button key={id} onClick={() => setDocType(id)}
                    style={{ flex: 1, padding: '12px 8px', background: docType === id ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${docType === id ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, color: docType === id ? 'var(--cyber-blue)' : 'var(--nebula-gray)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                    {label}
                  </button>
                ))}
              </div>

              <motion.div animate={loading ? { opacity: [1, 0.5, 1] } : {}} transition={{ repeat: Infinity, duration: 1.5 }}
                onClick={simulateDocScan}
                style={{ border: '2px dashed rgba(0,212,255,0.2)', borderRadius: 20, padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: 'rgba(0,212,255,0.02)', marginBottom: 24, transition: 'all 0.2s' }}>
                {loading ? (
                  <>
                    <div style={{ width: 48, height: 48, border: '2px solid rgba(0,212,255,0.2)', borderTop: '2px solid var(--cyber-blue)', borderRadius: '50%', animation: 'spin-slow 1s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--cyber-blue)', fontWeight: 600 }}>Scanning document...</p>
                    <p style={{ color: 'var(--nebula-gray)', fontSize: '0.8rem', marginTop: 4 }}>OCR processing with AI</p>
                  </>
                ) : (
                  <>
                    <Camera size={40} color="var(--cyber-blue)" style={{ margin: '0 auto 14px' }} />
                    <p style={{ fontWeight: 600, marginBottom: 6 }}>Tap to scan your {docType.replace('_', ' ')}</p>
                    <p style={{ color: 'var(--nebula-gray)', fontSize: '0.8rem' }}>AI-powered OCR will extract details automatically</p>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* Selfie */}
          {step === 'selfie' && (
            <motion.div key="selfie" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} style={{ textAlign: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 6 }}>Liveness Check</h3>
              <p style={{ color: 'var(--nebula-gray)', fontSize: '0.85rem', marginBottom: 28, lineHeight: 1.6 }}>
                Take a quick selfie to prove you're a real person. Our AI analyzes facial depth to prevent spoofing.
              </p>

              {/* Camera viewfinder */}
              <div style={{ position: 'relative', width: 220, height: 220, margin: '0 auto 32px', borderRadius: '50%', overflow: 'hidden', border: `3px solid ${selfieCapturing ? 'var(--cyber-blue)' : 'rgba(0,212,255,0.2)'}`, boxShadow: selfieCapturing ? '0 0 40px rgba(0,212,255,0.4)' : '0 0 20px rgba(0,212,255,0.1)' }}>
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--nebula-dark), var(--void-navy))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selfieCapturing ? (
                    <>
                      {/* Scan animation */}
                      <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--cyber-blue), transparent)', animation: 'scan-line 2s linear infinite', boxShadow: '0 0 8px var(--cyber-blue)' }} />
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ width: 50, height: 50, border: '2px solid rgba(0,212,255,0.4)', borderTop: '2px solid var(--cyber-blue)', borderRadius: '50%', animation: 'spin-slow 1s linear infinite', margin: '0 auto 10px' }} />
                        <p style={{ color: 'var(--cyber-blue)', fontSize: '0.75rem', fontWeight: 600 }}>Analyzing...</p>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <User size={52} color="rgba(0,212,255,0.3)" style={{ marginBottom: 8 }} />
                      <p style={{ color: 'var(--dim-gray)', fontSize: '0.75rem' }}>Position face here</p>
                    </div>
                  )}
                </div>
                {/* Corner brackets */}
                {['top-left','top-right','bottom-left','bottom-right'].map(pos => (
                  <div key={pos} style={{ position: 'absolute', width: 20, height: 20, top: pos.includes('top') ? 8 : 'auto', bottom: pos.includes('bottom') ? 8 : 'auto', left: pos.includes('left') ? 8 : 'auto', right: pos.includes('right') ? 8 : 'auto', borderTop: pos.includes('top') ? `2px solid var(--cyber-blue)` : 'none', borderBottom: pos.includes('bottom') ? `2px solid var(--cyber-blue)` : 'none', borderLeft: pos.includes('left') ? `2px solid var(--cyber-blue)` : 'none', borderRight: pos.includes('right') ? `2px solid var(--cyber-blue)` : 'none' }} />
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 28, fontSize: '0.75rem', color: 'var(--nebula-gray)' }}>
                {['Good lighting', 'Face forward', 'No glasses'].map(tip => (
                  <div key={tip} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Check size={12} color="var(--haptic-green)" /> {tip}
                  </div>
                ))}
              </div>

              <button className="btn-neon-solid" onClick={simulateSelfie} disabled={selfieCapturing}
                style={{ width: '100%', padding: 18 }}>
                {selfieCapturing ? 'Capturing...' : <><Camera size={18} /> Take Selfie</>}
              </button>
            </motion.div>
          )}

          {/* Complete */}
          {step === 'complete' && (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
              {/* Success burst */}
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
                {[...Array(3)].map((_, i) => (
                  <motion.div key={i} initial={{ scale: 0, opacity: 1 }} animate={{ scale: 3 + i, opacity: 0 }} transition={{ delay: i * 0.15, duration: 1, ease: 'easeOut' }}
                    style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(0,255,136,0.4)' }} />
                ))}
                <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(0,255,136,0.12)', border: '2px solid var(--haptic-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(0,255,136,0.3)' }}>
                  <Check size={40} color="var(--haptic-green)" />
                </div>
              </div>

              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--haptic-green)', marginBottom: 8 }}>Verified!</h2>
              <p style={{ color: 'var(--nebula-gray)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 32 }}>
                Your identity has been verified. Your daily limit is now <span style={{ color: 'var(--cyber-blue)', fontWeight: 600 }}>$5,000</span> and monthly limit <span style={{ color: 'var(--cyber-blue)', fontWeight: 600 }}>$20,000</span>.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                {['KYC Tier 2 Verified', 'Full transfer limits unlocked', 'Global card-to-card enabled', 'AI fraud protection active'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.1)', borderRadius: 12 }}>
                    <Check size={16} color="var(--haptic-green)" />
                    <span style={{ fontSize: '0.88rem', color: 'var(--stellar-white)' }}>{item}</span>
                  </div>
                ))}
              </div>

              <button className="btn-neon-solid" onClick={() => navigate('/dashboard')} style={{ width: '100%', padding: 18 }}>
                <Zap size={18} /> Go to Dashboard
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
