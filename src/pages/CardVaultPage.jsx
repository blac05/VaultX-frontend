import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Camera, Nfc, Keyboard, Trash2, Star, Edit3, Check, X, Shield, Eye, EyeOff } from 'lucide-react';
import useVaultStore, { api } from '../store/useVaultStore';
import toast from 'react-hot-toast';

const CARD_COLORS = [
  { id: 'cyber_blue', label: 'Cyber Blue', from: '#001a2e', to: '#003d5c', accent: '#00D4FF' },
  { id: 'haptic_green', label: 'Haptic Green', from: '#001a0f', to: '#003d1f', accent: '#00FF88' },
  { id: 'plasma_purple', label: 'Plasma Purple', from: '#130a2e', to: '#2d1a5c', accent: '#7B2FFF' },
  { id: 'nova_red', label: 'Nova Red', from: '#2e0a0a', to: '#5c1a1a', accent: '#FF3B3B' },
  { id: 'stellar_white', label: 'Stellar White', from: '#1a1a2e', to: '#2d2d4f', accent: '#F0F4FF' }
];

function CardPreview({ card, onSetDefault, onDelete, onEdit }) {
  const [showActions, setShowActions] = useState(false);
  const color = CARD_COLORS.find(c => c.id === card.cardColor) || CARD_COLORS[0];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{ marginBottom: 16 }}>
      {/* The card */}
      <div style={{ position: 'relative', borderRadius: 20, padding: '24px 24px 20px', background: `linear-gradient(135deg, ${color.from}, ${color.to})`, border: `1px solid ${color.accent}30`, boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${color.accent}18, inset 0 1px 0 rgba(255,255,255,0.06)`, cursor: 'pointer', userSelect: 'none', overflow: 'hidden', aspectRatio: '1.586' }}
        onClick={() => setShowActions(!showActions)}>
        {/* Holographic shimmer */}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(105deg, transparent 30%, ${color.accent}12 50%, transparent 70%)`, pointerEvents: 'none' }} />
        {/* Circuit lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06 }} viewBox="0 0 400 250">
          <line x1="0" y1="125" x2="400" y2="125" stroke={color.accent} strokeWidth="0.5" />
          <circle cx="200" cy="125" r="60" fill="none" stroke={color.accent} strokeWidth="0.5" />
          <circle cx="200" cy="125" r="40" fill="none" stroke={color.accent} strokeWidth="0.5" />
          <circle cx="200" cy="125" r="20" fill="none" stroke={color.accent} strokeWidth="0.5" />
        </svg>

        {/* Network logo */}
        <div style={{ position: 'absolute', top: 20, right: 24, fontSize: '0.7rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: color.accent, letterSpacing: '0.15em', opacity: 0.8 }}>
          {card.cardType?.toUpperCase()}
        </div>

        {/* Default badge */}
        {card.isDefault && (
          <div style={{ position: 'absolute', top: 16, left: 16, background: `${color.accent}22`, border: `1px solid ${color.accent}40`, borderRadius: 100, padding: '3px 10px', fontSize: '0.6rem', color: color.accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Default
          </div>
        )}

        {/* Chip */}
        <div style={{ position: 'absolute', top: '50%', left: 24, transform: 'translateY(-50%)' }}>
          <div style={{ width: 36, height: 28, borderRadius: 5, background: `linear-gradient(135deg, ${color.accent}40, ${color.accent}20)`, border: `1px solid ${color.accent}50`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, padding: 4 }}>
            {[...Array(4)].map((_, i) => <div key={i} style={{ background: `${color.accent}60`, borderRadius: 2 }} />)}
          </div>
        </div>

        {/* Card number */}
        <div style={{ position: 'absolute', bottom: 48, left: 24, fontFamily: 'var(--font-mono)', fontSize: '1.1rem', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
          •••• •••• •••• {card.last4}
        </div>

        {/* Cardholder + expiry */}
        <div style={{ position: 'absolute', bottom: 18, left: 24, right: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginBottom: 2 }}>CARDHOLDER</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{card.cardholderName}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginBottom: 2 }}>EXPIRES</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
              {String(card.expiryMonth).padStart(2,'0')}/{String(card.expiryYear).slice(-2)}
            </div>
          </div>
        </div>

        {/* Verification status */}
        <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 5, background: card.isVerified ? 'rgba(0,255,136,0.12)' : 'rgba(255,183,0,0.12)', border: `1px solid ${card.isVerified ? 'rgba(0,255,136,0.25)' : 'rgba(255,183,0,0.25)'}`, borderRadius: 100, padding: '3px 10px' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: card.isVerified ? 'var(--haptic-green)' : 'var(--gold)' }} />
          <span style={{ fontSize: '0.58rem', color: card.isVerified ? 'var(--haptic-green)' : 'var(--gold)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {card.isVerified ? 'Verified' : 'Pending'}
          </span>
        </div>
      </div>

      {/* Actions panel */}
      <AnimatePresence>
        {showActions && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 10, padding: '12px 4px' }}>
              {!card.isDefault && (
                <button onClick={() => { onSetDefault(card.id); setShowActions(false); }}
                  style={{ flex: 1, padding: '10px', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 12, color: 'var(--cyber-blue)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Star size={14} /> Set Default
                </button>
              )}
              <button onClick={() => { onEdit(card); setShowActions(false); }}
                style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: 'var(--nebula-gray)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Edit3 size={14} /> Edit
              </button>
              <button onClick={() => { onDelete(card.id); setShowActions(false); }}
                style={{ padding: '10px 16px', background: 'rgba(255,59,59,0.08)', border: '1px solid rgba(255,59,59,0.2)', borderRadius: 12, color: 'var(--nova-red)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Trash2 size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AddCardModal({ onClose, onAdded }) {
  const [ingestionMode, setIngestionMode] = useState(null); // 'manual' | 'ocr' | 'nfc'
  const [step, setStep] = useState('method'); // 'method' | 'form' | 'verify'
  const { addCard } = useVaultStore();
  const [showCVV, setShowCVV] = useState(false);
  const [verifyCardId, setVerifyCardId] = useState(null);
  const [microAmount, setMicroAmount] = useState('');
  const [form, setForm] = useState({ pan: '', expiryMonth: '', expiryYear: '', cvv: '', cardholderName: '', cardColor: 'cyber_blue' });
  const [loading, setLoading] = useState(false);

  const update = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const formatPAN = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const handleAddCard = async () => {
    setLoading(true);
    const result = await addCard({
      pan: form.pan.replace(/\s/g, ''),
      expiryMonth: parseInt(form.expiryMonth),
      expiryYear: parseInt(form.expiryYear),
      cvv: form.cvv,
      cardholderName: form.cardholderName,
      cardColor: form.cardColor,
      ingestionMethod: ingestionMode || 'manual_entry'
    });
    setLoading(false);
    if (result.success) {
      toast.success('Card tokenized! Now verify ownership.');
      setVerifyCardId(result.card.id);
      await api.post(`/cards/${result.card.id}/verify/initiate`);
      setStep('verify');
    } else {
      toast.error(result.error);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      await api.post(`/cards/${verifyCardId}/verify/confirm`, { amount: parseFloat(microAmount) });
      toast.success('Card verified and added to vault!');
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="backdrop-overlay" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{ width: '100%', maxWidth: 480, background: 'var(--void-navy)', borderRadius: '24px 24px 0 0', border: '1px solid rgba(0,212,255,0.1)', borderBottom: 'none', padding: '28px 24px 40px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.05em' }}>
            {step === 'method' ? 'Add Card to Vault' : step === 'form' ? 'Card Details' : 'Verify Ownership'}
          </h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', width: 32, height: 32, borderRadius: '50%', color: 'var(--nebula-gray)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        {step === 'method' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ color: 'var(--nebula-gray)', fontSize: '0.85rem', marginBottom: 8 }}>Your card details are immediately tokenized — we never store your full card number.</p>
            {[
              { id: 'ocr', icon: Camera, label: 'Scan with Camera', sub: 'OCR reads your card automatically', color: 'var(--cyber-blue)' },
              { id: 'nfc', icon: Nfc, label: 'NFC Tap', sub: 'Hold card to back of phone', color: 'var(--haptic-green)' },
              { id: 'manual', icon: Keyboard, label: 'Enter Manually', sub: 'Type in your card details', color: 'var(--plasma-purple)' }
            ].map(m => (
              <button key={m.id} onClick={() => { setIngestionMode(m.id); setStep('form'); }}
                style={{ padding: '18px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s', textAlign: 'left' }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: `${m.color}18`, border: `1px solid ${m.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <m.icon size={20} color={m.color} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 2 }}>{m.label}</div>
                  <div style={{ color: 'var(--nebula-gray)', fontSize: '0.78rem' }}>{m.sub}</div>
                </div>
              </button>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '12px 16px', background: 'rgba(0,212,255,0.04)', borderRadius: 12 }}>
              <Shield size={14} color="var(--cyber-blue)" />
              <span style={{ fontSize: '0.75rem', color: 'var(--nebula-gray)' }}>Protected by ZKP · PCI-DSS Level 1 Compliant</span>
            </div>
          </div>
        )}

        {step === 'form' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="input-label">Card Number</label>
              <input className="input-glass" value={form.pan} onChange={e => setForm(f => ({ ...f, pan: formatPAN(e.target.value) }))}
                placeholder="0000 0000 0000 0000" maxLength={19} style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label className="input-label">Month</label>
                <input className="input-glass" value={form.expiryMonth} onChange={update('expiryMonth')} placeholder="MM" maxLength={2} style={{ fontFamily: 'var(--font-mono)' }} />
              </div>
              <div>
                <label className="input-label">Year</label>
                <input className="input-glass" value={form.expiryYear} onChange={update('expiryYear')} placeholder="YYYY" maxLength={4} style={{ fontFamily: 'var(--font-mono)' }} />
              </div>
              <div style={{ position: 'relative' }}>
                <label className="input-label">CVV</label>
                <input className="input-glass" type={showCVV ? 'text' : 'password'} value={form.cvv} onChange={update('cvv')} placeholder="•••" maxLength={4} style={{ fontFamily: 'var(--font-mono)', paddingRight: 40 }} />
                <button type="button" onClick={() => setShowCVV(!showCVV)} style={{ position: 'absolute', right: 12, bottom: 14, background: 'none', border: 'none', color: 'var(--nebula-gray)', cursor: 'pointer' }}>
                  {showCVV ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="input-label">Cardholder Name</label>
              <input className="input-glass" value={form.cardholderName} onChange={update('cardholderName')} placeholder="JOHN DOE" style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }} />
            </div>
            <div>
              <label className="input-label">Card Color</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {CARD_COLORS.map(c => (
                  <button key={c.id} onClick={() => setForm(f => ({ ...f, cardColor: c.id }))}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${c.from}, ${c.to})`, border: `2px solid ${form.cardColor === c.id ? c.accent : 'transparent'}`, cursor: 'pointer', boxShadow: form.cardColor === c.id ? `0 0 10px ${c.accent}60` : 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {form.cardColor === c.id && <Check size={14} color={c.accent} />}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn-neon-solid" onClick={handleAddCard} disabled={loading || !form.pan || !form.cardholderName}
              style={{ width: '100%', padding: 16, opacity: loading ? 0.6 : 1, marginTop: 8 }}>
              {loading ? 'Tokenizing...' : <><Shield size={18} /> Tokenize & Add Card</>}
            </button>
          </div>
        )}

        {step === 'verify' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,183,0,0.1)', border: '1px solid rgba(255,183,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Shield size={28} color="var(--gold)" />
            </div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 8 }}>Verify Card Ownership</h4>
            <p style={{ color: 'var(--nebula-gray)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 24 }}>
              We sent a micro-charge between <span style={{ color: 'var(--cyber-blue)' }}>$0.50–$0.99</span> to your card. Check your bank statement or app and enter the exact amount below.
            </p>
            <div style={{ marginBottom: 20 }}>
              <label className="input-label" style={{ textAlign: 'left' }}>Charge Amount</label>
              <input className="input-glass" value={microAmount} onChange={e => setMicroAmount(e.target.value)} placeholder="e.g. 0.73" type="number" step="0.01" min="0.01" max="1" style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', textAlign: 'center' }} />
            </div>
            <button className="btn-neon-solid" onClick={handleVerify} disabled={loading || !microAmount} style={{ width: '100%', padding: 16 }}>
              {loading ? 'Verifying...' : <><Check size={18} /> Confirm Ownership</>}
            </button>
            <p style={{ color: 'var(--dim-gray)', fontSize: '0.72rem', marginTop: 12 }}>The charge will be reversed within 24 hours</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function CardVaultPage() {
  const navigate = useNavigate();
  const { cards, fetchCards, removeCard, updateCard, api: storeApi } = useVaultStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCard, setEditCard] = useState(null);

  useEffect(() => { fetchCards(); }, []);

  const handleSetDefault = async (cardId) => {
    try {
      await api.patch(`/cards/${cardId}`, { isDefault: true });
      await fetchCards();
      toast.success('Default card updated');
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (cardId) => {
    if (!window.confirm('Remove this card from your vault?')) return;
    const result = await removeCard(cardId);
    if (result.success) toast.success('Card removed');
    else toast.error(result.error);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--obsidian)', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,8,16,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,212,255,0.06)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--nebula-gray)', cursor: 'pointer' }}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.08em' }}>CARD VAULT</h2>
          <p style={{ color: 'var(--nebula-gray)', fontSize: '0.72rem' }}>{cards.length} card{cards.length !== 1 ? 's' : ''} · ZKP Protected</p>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddModal(true)}
          className="btn-neon" style={{ padding: '10px 16px', fontSize: '0.82rem' }}>
          <Plus size={16} /> Add Card
        </motion.button>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
        {/* Security badge */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)', borderRadius: 14, marginBottom: 24 }}>
          <Shield size={18} color="var(--cyber-blue)" />
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--cyber-blue)', marginBottom: 1 }}>Military-Grade Security</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--nebula-gray)' }}>Cards tokenized via Visa/MC TSP · No raw PAN stored · AES-256-GCM encrypted</p>
          </div>
        </motion.div>

        {cards.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Plus size={32} color="var(--cyber-blue)" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 10 }}>Your vault is empty</h3>
            <p style={{ color: 'var(--nebula-gray)', fontSize: '0.88rem', marginBottom: 28, lineHeight: 1.6 }}>Add a debit or credit card to start sending money globally in under 30 seconds.</p>
            <button className="btn-neon-solid" onClick={() => setShowAddModal(true)} style={{ padding: '14px 32px' }}>
              <Plus size={18} /> Add Your First Card
            </button>
          </motion.div>
        ) : (
          <div>
            <p style={{ color: 'var(--nebula-gray)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Tap a card to manage</p>
            {cards.map((card, i) => (
              <CardPreview key={card.id || i} card={card}
                onSetDefault={handleSetDefault}
                onDelete={handleDelete}
                onEdit={(c) => setEditCard(c)} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <AddCardModal onClose={() => setShowAddModal(false)} onAdded={fetchCards} />
        )}
      </AnimatePresence>
    </div>
  );
}
