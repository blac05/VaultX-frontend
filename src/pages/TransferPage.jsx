import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { QrCode, Search, Send, ArrowLeft, RefreshCw, Check, X, Fingerprint, ChevronDown, Globe } from 'lucide-react';
import useVaultStore from '../store/useVaultStore';
import toast from 'react-hot-toast';
import LiveTransferMap from '../components/LiveTransferMap';

const STEPS = ['recipient', 'amount', 'biometric', 'processing', 'complete'];

export default function TransferPage() {
  const navigate = useNavigate();
  const { user, cards, resolveRecipient, getFXRate, initiateTransfer, requestBiometricToken, liveTransaction } = useVaultStore();

  const [step, setStep] = useState('recipient');
  const [handle, setHandle] = useState('');
  const [recipient, setRecipient] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(user?.preferredCurrency || 'USD');
  const [fxData, setFxData] = useState(null);
  const [memo, setMemo] = useState('');
  const [selectedCardToken, setSelectedCardToken] = useState('');
  const [biometricStage, setBiometricStage] = useState('idle');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const fxTimer = useRef(null);

  const verifiedCards = cards.filter(c => c.isVerified && c.status === 'active');
  const defaultCard = verifiedCards.find(c => c.isDefault) || verifiedCards[0];

  useEffect(() => {
    if (defaultCard && !selectedCardToken) setSelectedCardToken(defaultCard.internalToken);
  }, [defaultCard]);

  // FX rate lookup
  useEffect(() => {
    if (!amount || !recipient || isNaN(parseFloat(amount))) return;
    clearTimeout(fxTimer.current);
    fxTimer.current = setTimeout(async () => {
      try {
        const data = await getFXRate(currency, 'USD', parseFloat(amount));
        setFxData(data);
      } catch { /* ignore */ }
    }, 500);
    return () => clearTimeout(fxTimer.current);
  }, [amount, currency, recipient]);

  const handleResolveRecipient = async () => {
    if (!handle.trim()) return;
    setResolving(true);
    try {
      const r = await resolveRecipient(handle.trim());
      setRecipient(r);
      toast.success(`Found ${r.fullName}`);
    } catch (err) {
      toast.error('Recipient not found');
    } finally { setResolving(false); }
  };

  const handleBiometric = async () => {
    setBiometricStage('scanning');
    try {
      // Simulate device biometric prompt
      await new Promise(r => setTimeout(r, 2000));
      await requestBiometricToken('face_id', 0.99);
      setBiometricStage('success');
      await new Promise(r => setTimeout(r, 500));
      handleTransfer();
    } catch (err) {
      setBiometricStage('failed');
      toast.error('Biometric failed. Try again.');
      setTimeout(() => setBiometricStage('idle'), 2000);
    }
  };

  const handleTransfer = async () => {
    setStep('processing');
    try {
      const result = await initiateTransfer({
        senderCardToken: selectedCardToken,
        recipientHandle: recipient.paymentHandle,
        amount: parseFloat(amount),
        currency,
        initiatedVia: 'payment_handle',
        memo
      });

      if (result.success) {
        setStep('complete');
      } else if (result.requiresStepUp) {
        toast.error('Additional verification needed. Contact support.');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Transfer failed');
      setStep('amount');
      setBiometricStage('idle');
    }
  };

  const numpadPress = (val) => {
    if (val === '⌫') {
      setAmount(a => a.slice(0, -1));
    } else if (val === '.' && amount.includes('.')) {
      return;
    } else if (amount.split('.')[1]?.length >= 2) {
      return;
    } else {
      setAmount(a => (a + val).replace(/^0+(\d)/, '$1'));
    }
  };

  const NUMPAD = ['1','2','3','4','5','6','7','8','9','.','0','⌫'];
  const CURRENCIES = ['USD','EUR','GBP','NGN','GHS','CAD','AUD','SGD','AED','INR'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--obsidian)', position: 'relative' }}>
      {/* Header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(8,8,16,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,212,255,0.06)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => step === 'recipient' ? navigate('/dashboard') : setStep(STEPS[STEPS.indexOf(step) - 1])}
          style={{ background: 'none', border: 'none', color: 'var(--nebula-gray)', cursor: 'pointer', display: 'flex' }}>
          <ArrowLeft size={22} />
        </button>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', flex: 1 }}>
          {step === 'recipient' ? 'Send Money' : step === 'amount' ? 'Enter Amount' : step === 'biometric' ? 'Confirm Transfer' : step === 'processing' ? 'Transferring...' : 'Transfer Complete'}
        </h2>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['recipient','amount','biometric'].map(s => (
            <div key={s} style={{ width: 6, height: 6, borderRadius: 3, background: STEPS.indexOf(step) >= STEPS.indexOf(s) ? 'var(--cyber-blue)' : 'rgba(255,255,255,0.15)', transition: 'all 0.3s ease' }} />
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '80px 16px 40px', minHeight: '100vh' }}>
        <AnimatePresence mode="wait">

          {/* ─── STEP: Recipient ─── */}
          {step === 'recipient' && (
            <motion.div key="recipient" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
              <p style={{ color: 'var(--nebula-gray)', marginBottom: 24, fontSize: '0.9rem' }}>
                Enter a VaultX handle or scan a QR code to send money instantly
              </p>

              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input className="input-glass" value={handle} onChange={e => setHandle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleResolveRecipient()}
                    placeholder="@username or +2348012345678" style={{ paddingLeft: 44 }} />
                  <Search size={18} color="var(--nebula-gray)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
                <button className="btn-neon" onClick={handleResolveRecipient} disabled={resolving} style={{ padding: '14px 20px', flexShrink: 0 }}>
                  {resolving ? <RefreshCw size={16} style={{ animation: 'spin-slow 1s linear infinite' }} /> : 'Find'}
                </button>
              </div>

              {/* QR Scanner placeholder */}
              <div className="glass-card" style={{ padding: 24, textAlign: 'center', cursor: 'pointer', borderStyle: 'dashed' }}
                onClick={() => toast('QR scanner — use camera in native app')}>
                <QrCode size={32} color="var(--cyber-blue)" style={{ margin: '0 auto 10px' }} />
                <p style={{ color: 'var(--nebula-gray)', fontSize: '0.85rem' }}>Scan QR Code</p>
                <p style={{ color: 'var(--dim-gray)', fontSize: '0.75rem', marginTop: 4 }}>Point camera at recipient's VaultX code</p>
              </div>

              {/* Recipient card */}
              <AnimatePresence>
                {recipient && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="glass-card-intense" style={{ padding: 20, marginTop: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(123,47,255,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                        {recipient.firstName[0]}{recipient.lastName[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{recipient.fullName}</span>
                          {recipient.isVerified && <span style={{ fontSize: '0.6rem', padding: '2px 8px', background: 'rgba(0,212,255,0.1)', color: 'var(--cyber-blue)', borderRadius: 100, border: '1px solid rgba(0,212,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Verified</span>}
                        </div>
                        <span style={{ color: 'var(--nebula-gray)', fontSize: '0.85rem' }}>{recipient.paymentHandle}</span>
                      </div>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,255,136,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={14} color="var(--haptic-green)" />
                      </div>
                    </div>
                    <button className="btn-neon-solid" onClick={() => setStep('amount')} style={{ width: '100%', padding: 16 }}>
                      <Send size={18} /> Continue to Amount
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ─── STEP: Amount ─── */}
          {step === 'amount' && (
            <motion.div key="amount" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              {/* Recipient header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'rgba(0,212,255,0.04)', borderRadius: 16, border: '1px solid rgba(0,212,255,0.1)', marginBottom: 32 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(123,47,255,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                  {recipient?.firstName[0]}{recipient?.lastName[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{recipient?.fullName}</div>
                  <div style={{ color: 'var(--nebula-gray)', fontSize: '0.8rem' }}>{recipient?.paymentHandle}</div>
                </div>
              </div>

              {/* Amount display */}
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <button onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100, padding: '6px 16px', color: 'var(--nebula-gray)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <Globe size={14} /> {currency} <ChevronDown size={14} />
                </button>

                {showCurrencyPicker && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
                    {CURRENCIES.map(c => (
                      <button key={c} onClick={() => { setCurrency(c); setShowCurrencyPicker(false); }}
                        style={{ padding: '6px 14px', background: c === currency ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${c === currency ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 100, color: c === currency ? 'var(--cyber-blue)' : 'var(--nebula-gray)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', cursor: 'pointer' }}>
                        {c}
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem, 15vw, 5rem)', fontWeight: 800, color: amount ? 'var(--stellar-white)' : 'rgba(255,255,255,0.15)', letterSpacing: '-0.02em', marginBottom: 4, minHeight: '1.2em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'var(--nebula-gray)', fontSize: '0.5em', marginRight: 4 }}>{currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : ''}</span>
                  {amount || '0'}
                </div>

                {fxData && currency !== 'USD' && (
                  <p style={{ color: 'var(--nebula-gray)', fontSize: '0.8rem', marginBottom: 4 }}>
                    ≈ ${fxData.convertedAmount?.toFixed(2)} USD · Rate: {fxData.exchangeRate?.toFixed(4)}
                  </p>
                )}
              </div>

              {/* Memo */}
              <input className="input-glass" value={memo} onChange={e => setMemo(e.target.value)}
                placeholder="Add a note (optional)" style={{ marginBottom: 20, textAlign: 'center' }} maxLength={140} />

              {/* Numpad */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
                {NUMPAD.map(k => (
                  <motion.button key={k} whileTap={{ scale: 0.88 }} onClick={() => numpadPress(k)}
                    style={{ padding: '20px', background: k === '⌫' ? 'rgba(255,59,59,0.06)' : 'rgba(255,255,255,0.04)', border: `1px solid ${k === '⌫' ? 'rgba(255,59,59,0.15)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 16, color: k === '⌫' ? 'var(--nova-red)' : 'var(--stellar-white)', fontFamily: k === '⌫' ? 'inherit' : 'var(--font-display)', fontSize: '1.3rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease' }}>
                    {k}
                  </motion.button>
                ))}
              </div>

              {/* Card selector */}
              {verifiedCards.length > 1 && (
                <div style={{ marginBottom: 16 }}>
                  <label className="input-label">Pay from</label>
                  <select className="input-glass" value={selectedCardToken} onChange={e => setSelectedCardToken(e.target.value)}
                    style={{ fontFamily: 'var(--font-mono)' }}>
                    {verifiedCards.map(c => (
                      <option key={c.internalToken} value={c.internalToken} style={{ background: '#0D1117' }}>
                        {c.cardType?.toUpperCase()} •••• {c.last4} {c.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button className="btn-neon-solid" disabled={!amount || parseFloat(amount) <= 0}
                onClick={() => setStep('biometric')}
                style={{ width: '100%', padding: 18, fontSize: '1.05rem', opacity: !amount || parseFloat(amount) <= 0 ? 0.4 : 1, cursor: !amount || parseFloat(amount) <= 0 ? 'not-allowed' : 'pointer' }}>
                <Send size={18} /> Review Transfer
              </button>
            </motion.div>
          )}

          {/* ─── STEP: Biometric Confirm ─── */}
          {step === 'biometric' && (
            <motion.div key="biometric" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center' }}>
              {/* Transfer summary */}
              <div className="glass-card-intense" style={{ padding: 28, marginBottom: 32 }}>
                <p style={{ color: 'var(--nebula-gray)', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>You're sending</p>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--cyber-blue), var(--plasma-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 4 }}>
                  {currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : ''}{parseFloat(amount).toFixed(2)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyber-blue)' }} />
                  <p style={{ color: 'var(--stellar-white)', fontWeight: 600 }}>to {recipient?.fullName}</p>
                </div>
                {memo && <p style={{ color: 'var(--nebula-gray)', fontSize: '0.85rem', marginTop: 8, fontStyle: 'italic' }}>"{memo}"</p>}
                <div className="divider" style={{ margin: '16px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--nebula-gray)' }}>Settlement</span>
                  <span style={{ color: 'var(--haptic-green)', fontWeight: 600 }}>~10-30 seconds</span>
                </div>
              </div>

              {/* Biometric ring */}
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 32 }}>
                {biometricStage === 'scanning' && (
                  <>
                    {[1,2,3].map(i => (
                      <div key={i} style={{ position: 'absolute', inset: -i * 16, borderRadius: '50%', border: `1px solid rgba(0,212,255,${0.3 - i * 0.08})`, animation: `pulse-ring ${1 + i * 0.3}s ease-out infinite`, animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </>
                )}
                <motion.div animate={biometricStage === 'scanning' ? { boxShadow: ['0 0 0 rgba(0,212,255,0.3)', '0 0 40px rgba(0,212,255,0.6)', '0 0 0 rgba(0,212,255,0.3)'] } : {}} transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ width: 100, height: 100, borderRadius: '50%', background: biometricStage === 'success' ? 'rgba(0,255,136,0.15)' : biometricStage === 'failed' ? 'rgba(255,59,59,0.15)' : 'rgba(0,212,255,0.1)', border: `2px solid ${biometricStage === 'success' ? 'var(--haptic-green)' : biometricStage === 'failed' ? 'var(--nova-red)' : 'var(--cyber-blue)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {biometricStage === 'success' ? <Check size={36} color="var(--haptic-green)" /> : biometricStage === 'failed' ? <X size={36} color="var(--nova-red)" /> : <Fingerprint size={36} color="var(--cyber-blue)" />}
                </motion.div>
              </div>

              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 8 }}>
                {biometricStage === 'idle' ? 'Authenticate to Send' : biometricStage === 'scanning' ? 'Scanning...' : biometricStage === 'success' ? 'Verified!' : 'Try Again'}
              </h3>
              <p style={{ color: 'var(--nebula-gray)', fontSize: '0.85rem', marginBottom: 32 }}>
                {biometricStage === 'idle' ? 'Use Face ID or fingerprint to confirm this transfer' : biometricStage === 'scanning' ? 'Hold still while we verify your identity' : biometricStage === 'success' ? 'Identity confirmed — initiating transfer' : 'Biometric verification failed'}
              </p>

              {(biometricStage === 'idle' || biometricStage === 'failed') && (
                <button className="btn-neon-solid" onClick={handleBiometric} style={{ width: '100%', padding: 18 }}>
                  <Fingerprint size={20} /> {biometricStage === 'failed' ? 'Retry Biometric' : 'Authenticate & Send'}
                </button>
              )}
            </motion.div>
          )}

          {/* ─── STEP: Processing / Pulse View ─── */}
          {(step === 'processing' || step === 'complete') && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <LiveTransferMap transaction={liveTransaction} isComplete={step === 'complete'} amount={amount} currency={currency} recipient={recipient} onComplete={() => {}} />
              {step === 'complete' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <button className="btn-neon-solid" onClick={() => navigate('/dashboard')} style={{ width: '100%', padding: 18, marginTop: 20 }}>
                    Back to Dashboard
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
