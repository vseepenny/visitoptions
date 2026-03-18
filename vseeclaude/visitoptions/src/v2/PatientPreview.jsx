import { useState, useEffect, useRef } from 'react';

/* ── Constants ───────────────────────────────────────────── */

const PT_META = {
  'self-pay':      { label: 'Self-Pay',      color: '#3B82F6', bg: '#EFF6FF', desc: 'Pay out of pocket' },
  'insurance':     { label: 'Insurance',     color: '#10B981', bg: '#ECFDF5', desc: 'Bill my insurance'  },
  'group-covered': { label: 'Group-Covered', color: '#6B7280', bg: '#F9FAFB', desc: 'Covered by employer' },
};

const MODE_ICONS = {
  Video:       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>,
  Phone:       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
  'In-person': <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>,
  Chat:        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
};

/* ── Step: Select Visit ──────────────────────────────────── */

function VisitStep({ visits, onSelect }) {
  if (visits.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 16px' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--grey-300)" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
          <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>No visit options available</p>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>Add and enable visit options in the settings.</p>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Choose a visit type</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Select the type of appointment you need.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visits.map(visit => (
          <button
            key={visit.id}
            onClick={() => onSelect(visit.id)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'white', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 120ms' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--brand-50)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{visit.name}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{visit.duration}</span>
                <span style={{ color: 'var(--grey-300)' }}>·</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                  {MODE_ICONS[visit.mode]} {visit.mode}
                </span>
                {visit.type !== '1:1' && (
                  <>
                    <span style={{ color: 'var(--grey-300)' }}>·</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Up to {visit.slots} patients</span>
                  </>
                )}
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--grey-400)" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Step: Patient Type ──────────────────────────────────── */

function PatientTypeStep({ visitName, patientTypes, onSelect, onBack }) {
  return (
    <div>
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, marginBottom: 20 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        {visitName}
      </button>
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>How will you pay?</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Select your payment method for this visit.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {patientTypes.map(ptId => {
          const meta = PT_META[ptId];
          if (!meta) return null;
          return (
            <button
              key={ptId}
              onClick={() => onSelect(ptId)}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'white', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 120ms' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = meta.color; e.currentTarget.style.background = meta.bg; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'white'; }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.bg, border: `1px solid ${meta.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2">
                  {ptId === 'self-pay'      && <><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></>}
                  {ptId === 'insurance'     && <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>}
                  {ptId === 'group-covered' && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75" /></>}
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{meta.label}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{meta.desc}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--grey-400)" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Step: Intake Form ───────────────────────────────────── */

function IntakeStep({ templateName, fields, onContinue, onBack }) {
  const [values, setValues] = useState({});
  const allRequiredFilled = fields.filter(f => f.required).every(f => values[f.id]?.trim());

  return (
    <div>
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, marginBottom: 20 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        Back
      </button>
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Before your visit</p>
      {templateName && (
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>Using template: <strong>{templateName}</strong></p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        {fields.map(field => (
          <div key={field.id} className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 13 }}>
              {field.label}
              {field.required && <span className="req" style={{ marginLeft: 4 }}>*</span>}
            </label>
            {field.id === 'medical_history' || field.id === 'chief_complaint' ? (
              <textarea
                value={values[field.id] || ''}
                onChange={e => setValues(v => ({ ...v, [field.id]: e.target.value }))}
                placeholder={`Enter ${field.label.toLowerCase()}…`}
                className="input"
                style={{ minHeight: 72, resize: 'none', fontSize: 13 }}
              />
            ) : (
              <input
                type="text"
                value={values[field.id] || ''}
                onChange={e => setValues(v => ({ ...v, [field.id]: e.target.value }))}
                placeholder={`Enter ${field.label.toLowerCase()}…`}
                className="input"
                style={{ fontSize: 13 }}
              />
            )}
          </div>
        ))}
      </div>
      <button
        onClick={onContinue}
        disabled={!allRequiredFilled}
        className="btn btn-primary btn-sm"
        style={{ width: '100%', justifyContent: 'center', opacity: allRequiredFilled ? 1 : 0.5 }}
      >
        Continue
      </button>
    </div>
  );
}

/* ── Payment display helper ──────────────────────────────── */

function PaymentAmount({ method, amount, fallback }) {
  if (!method || method === 'none') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>No payment required at booking</span>
      </div>
    );
  }
  if (method === 'specific' && amount) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Amount due at booking</span>
          <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>${amount}</span>
        </div>
      </div>
    );
  }
  if (method === 'copay') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: fallback ? 6 : 0 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Copay</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Determined at visit</span>
        </div>
        {fallback && (
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Fallback if copay unavailable: ${fallback}</p>
        )}
      </div>
    );
  }
  return <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Not configured</span>;
}

/* ── Step: Self-Pay Payment Info ─────────────────────────── */

function SelfPayInfoStep({ visit, clinic, onContinue, onBack }) {
  const pricing = visit.pricing?.['self-pay'];
  const payConfig = clinic.paymentConfig?.['self-pay'];
  const collectsPayment = payConfig?.acceptPayments && pricing?.method && pricing.method !== 'none';

  return (
    <div>
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, marginBottom: 20 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        Back
      </button>
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Payment</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Here's what you'll pay for this visit.</p>

      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '20px', marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>{visit.name}</p>
        <PaymentAmount method={payConfig?.acceptPayments ? (pricing?.method ?? 'none') : 'none'} amount={pricing?.amount} fallback={pricing?.fallback} />
        {collectsPayment && !payConfig?.stripeConnected && (
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 10, fontStyle: 'italic' }}>Online payment not yet enabled — clinic will collect at visit.</p>
        )}
      </div>

      <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}

/* ── Step: Card Payment ──────────────────────────────────── */

function CardPaymentStep({ amount, onContinue, onBack }) {
  const [subStep, setSubStep] = useState('form'); // 'form' | 'processing' | 'success'
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const formatCardNumber = (val) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  const allFilled = card.number.replace(/\s/g, '').length === 16 &&
    card.expiry.length === 5 && card.cvv.length >= 3 && card.name.trim();

  const handlePay = () => {
    setSubStep('processing');
    timerRef.current = setTimeout(() => setSubStep('success'), 2000);
  };

  const inputStyle = { fontSize: 14, letterSpacing: '0.04em' };

  if (subStep === 'processing') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 260, gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid var(--brand)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Processing payment…</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Please don't close this page</p>
      </div>
    );
  }

  if (subStep === 'success') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 32, gap: 12 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ECFDF5', border: '2px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Payment confirmed</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>${amount} charged to card ending in {card.number.slice(-4)}</p>
        <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }} onClick={onContinue}>
          Continue
        </button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, marginBottom: 20 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        Back
      </button>
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Card Payment</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Enter your card details to pay <strong>${amount}</strong>.</p>

      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '20px', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Card number */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Card Number</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              inputMode="numeric"
              placeholder="1234 5678 9012 3456"
              value={card.number}
              onChange={e => setCard(c => ({ ...c, number: formatCardNumber(e.target.value) }))}
              className="input"
              style={{ ...inputStyle, paddingRight: 40 }}
            />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--grey-400)" strokeWidth="1.5" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
              <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>
        </div>

        {/* Expiry + CVV */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 13 }}>Expiry</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="MM/YY"
              value={card.expiry}
              onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))}
              className="input"
              style={inputStyle}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 13 }}>CVV</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="123"
              value={card.cvv}
              maxLength={4}
              onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '') }))}
              className="input"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Cardholder name */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Cardholder Name</label>
          <input
            type="text"
            placeholder="Name on card"
            value={card.name}
            onChange={e => setCard(c => ({ ...c, name: e.target.value }))}
            className="input"
            style={inputStyle}
          />
        </div>
      </div>

      <button
        className="btn btn-primary btn-sm"
        style={{ width: '100%', justifyContent: 'center', opacity: allFilled ? 1 : 0.5 }}
        disabled={!allFilled}
        onClick={handlePay}
      >
        Pay ${amount}
      </button>
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        Secured by Stripe
      </p>
    </div>
  );
}

/* ── Step: Insurance Check ───────────────────────────────── */

const ELIGIBILITY_STATUSES = [
  { id: 'eligible',     label: 'Eligible',       color: 'var(--success)', bg: '#ECFDF5', icon: '✓' },
  { id: 'not_eligible', label: 'Not Eligible',    color: 'var(--danger)',  bg: '#FEF2F2', icon: '✕' },
  { id: 'pending',      label: 'Pending',         color: '#D97706',        bg: '#FFFBEB', icon: '…' },
  { id: 'error',        label: 'Error / Unknown', color: 'var(--grey-500)', bg: '#F9FAFB', icon: '?' },
];

const INSURANCE_PROVIDERS = [
  'Aetna', 'Blue Cross Blue Shield', 'Cigna', 'Humana', 'Kaiser Permanente',
  'Medicare', 'Medicaid', 'UnitedHealthcare', 'Other',
];

function InsuranceCheckStep({ eligibilityAccess, visitInsurancePricing, onContinue, onBack }) {
  const [subStep, setSubStep] = useState('form'); // 'form' | 'checking' | 'result'
  const [simulatedStatus, setSimulatedStatus] = useState('eligible');
  const [form, setForm] = useState({ provider: '', memberId: '', groupNumber: '', dob: '' });
  const timerRef = useRef(null);

  const allFilled = form.provider && form.memberId && form.dob;

  const handleCheck = () => {
    setSubStep('checking');
    timerRef.current = setTimeout(() => setSubStep('result'), 2200);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const statusMeta = ELIGIBILITY_STATUSES.find(s => s.id === simulatedStatus);
  const access = eligibilityAccess?.[simulatedStatus]?.access ?? 'allow';

  const accessInfo = {
    allow:  { label: 'You may proceed with booking.',           color: 'var(--success)' },
    review: { label: 'Booking requires staff review.',          color: '#D97706'        },
    block:  { label: 'You are not eligible to book right now.', color: 'var(--danger)'  },
  }[access];

  if (subStep === 'checking') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 260, gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid var(--brand)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Checking eligibility…</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Verifying your insurance with {form.provider}</p>
      </div>
    );
  }

  if (subStep === 'result') {
    return (
      <div>
        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Eligibility Result</p>

        {/* Simulate control — prototype only */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '8px 12px', background: '#FFF9C4', border: '1px solid #FDE047', borderRadius: 8 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
          <span style={{ fontSize: 11, color: '#92400E', flex: 1 }}>Prototype: simulate outcome</span>
          <select
            value={simulatedStatus}
            onChange={e => setSimulatedStatus(e.target.value)}
            style={{ fontSize: 11, border: '1px solid #FDE047', borderRadius: 4, padding: '2px 4px', background: 'white', color: '#92400E', cursor: 'pointer' }}
          >
            {ELIGIBILITY_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        {/* Result card */}
        <div style={{ background: statusMeta.bg, border: `1px solid ${statusMeta.color}40`, borderRadius: 12, padding: '16px', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: statusMeta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
              {statusMeta.icon}
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: statusMeta.color }}>{statusMeta.label}</p>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
            {form.provider} · Member ID: {form.memberId}
          </p>
          <p style={{ fontSize: 13, color: accessInfo.color, fontWeight: 500 }}>{accessInfo.label}</p>
        </div>

        {/* Payment info for this eligibility status */}
        {access !== 'block' && visitInsurancePricing?.[simulatedStatus] && (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Payment</p>
            <PaymentAmount
              method={visitInsurancePricing[simulatedStatus].method}
              amount={visitInsurancePricing[simulatedStatus].amount}
              fallback={visitInsurancePricing[simulatedStatus].fallback}
            />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {access !== 'block' && (
            <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onContinue}>
              Continue
            </button>
          )}
          <button
            onClick={() => setSubStep('form')}
            className="btn btn-ghost btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Use different insurance
          </button>
        </div>
      </div>
    );
  }

  // form
  return (
    <div>
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, marginBottom: 20 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        Back
      </button>
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Insurance Information</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>We'll verify your coverage before booking.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Insurance Provider <span className="req">*</span></label>
          <select value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} className="input" style={{ fontSize: 13 }}>
            <option value="">Select provider…</option>
            {INSURANCE_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Member ID <span className="req">*</span></label>
          <input type="text" value={form.memberId} onChange={e => setForm(f => ({ ...f, memberId: e.target.value }))} placeholder="e.g. ABC123456789" className="input" style={{ fontSize: 13 }} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Group Number</label>
          <input type="text" value={form.groupNumber} onChange={e => setForm(f => ({ ...f, groupNumber: e.target.value }))} placeholder="e.g. GRP987654" className="input" style={{ fontSize: 13 }} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Date of Birth <span className="req">*</span></label>
          <input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} className="input" style={{ fontSize: 13 }} />
        </div>
      </div>

      <button
        className="btn btn-primary btn-sm"
        style={{ width: '100%', justifyContent: 'center', opacity: allFilled ? 1 : 0.5 }}
        disabled={!allFilled}
        onClick={handleCheck}
      >
        Check Eligibility
      </button>
    </div>
  );
}

/* ── Step: Confirm ───────────────────────────────────────── */

function ConfirmStep({ visit, ptId, clinic, onBack, onReset }) {
  const ptMeta = PT_META[ptId];
  const selfPayConfig = clinic.paymentConfig?.['self-pay'];
  const pricing = visit?.pricing?.['self-pay'];
  const showPayment = ptId === 'self-pay' && selfPayConfig?.acceptPayments;

  return (
    <div>
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, marginBottom: 20 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        Back
      </button>
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Review & Confirm</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Please review your booking details.</p>

      {/* Summary card */}
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{visit.name}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              {visit.duration}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {MODE_ICONS[visit.mode]} {visit.mode}
            </span>
          </div>
        </div>
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: ptMeta.color, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{ptMeta.label}</span>
        </div>
      </div>

      {/* Payment */}
      {showPayment && (
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>Payment</p>
          {!selfPayConfig.stripeConnected ? (
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Payment not yet configured by clinic.</p>
          ) : pricing?.method === 'specific' && pricing?.amount ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Amount due</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>${pricing.amount}</span>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No payment required at booking.</p>
          )}
        </div>
      )}

      {/* CTA */}
      <button
        className="btn btn-primary btn-sm"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={onReset}
      >
        {showPayment && selfPayConfig?.stripeConnected && pricing?.method === 'specific' && pricing?.amount
          ? `Pay $${pricing.amount} & Confirm`
          : 'Confirm Booking'}
      </button>
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 10 }}>
        This is a preview — no real booking will be made.
      </p>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────── */

export default function PatientPreview({ room, clinic }) {
  const [step, setStep] = useState('visit');
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [selectedPt, setSelectedPt] = useState(null);

  const visibleVisits = room.visitOptions.filter(v => v.visible);
  const selectedVisit = visibleVisits.find(v => v.id === selectedVisitId);

  const availablePts = selectedVisit
    ? room.patientTypes.filter(pt => selectedVisit.patientTypes.includes(pt))
    : room.patientTypes;

  const intakeTemplateId = selectedVisit?.intakeTemplateId ?? clinic.defaultIntakeTemplateId;
  const intakeTemplate = clinic.intakeTemplates.find(t => t.id === intakeTemplateId);
  const enabledFields = intakeTemplate?.fields.filter(f => f.enabled) ?? [];

  // Reset if the selected visit is no longer visible
  useEffect(() => {
    if (selectedVisitId && !visibleVisits.find(v => v.id === selectedVisitId)) {
      reset();
    }
  }, [room.visitOptions]);

  const reset = () => {
    setStep('visit');
    setSelectedVisitId(null);
    setSelectedPt(null);
  };

  const handleSelectVisit = (id) => {
    setSelectedVisitId(id);
    setSelectedPt(null);
    setStep('patientType');
  };

  const handleSelectPt = (pt) => {
    setSelectedPt(pt);
    if (pt === 'insurance') {
      setStep('insuranceCheck');
    } else {
      setStep('selfPayInfo');
    }
  };

  const selfPayPricing = selectedVisit?.pricing?.['self-pay'];
  const selfPayConfig = clinic.paymentConfig?.['self-pay'];
  const needsCardPayment = selectedPt === 'self-pay' &&
    selfPayConfig?.acceptPayments &&
    selfPayPricing?.method === 'specific' &&
    selfPayPricing?.amount;

  const afterSelfPayInfo = needsCardPayment ? 'cardPayment' : (enabledFields.length > 0 ? 'intake' : 'confirm');
  const afterCardPayment = enabledFields.length > 0 ? 'intake' : 'confirm';

  const handleInsuranceContinue = () => setStep(enabledFields.length > 0 ? 'intake' : 'confirm');
  const handleSelfPayInfoContinue = () => setStep(afterSelfPayInfo);

  const handleBackFromPt = () => { setSelectedVisitId(null); setStep('visit'); };
  const handleBackFromInsurance = () => { setSelectedPt(null); setStep('patientType'); };
  const handleBackFromSelfPayInfo = () => { setSelectedPt(null); setStep('patientType'); };
  const handleBackFromCardPayment = () => setStep('selfPayInfo');
  const handleBackFromIntake = () => {
    if (selectedPt === 'insurance') setStep('insuranceCheck');
    else if (needsCardPayment) setStep('cardPayment');
    else setStep('selfPayInfo');
  };
  const handleBackFromConfirm = () => setStep(enabledFields.length > 0 ? 'intake' : afterSelfPayInfo);

  const hasInsurance = selectedPt === 'insurance';
  const allSteps = [
    'visit', 'patientType',
    ...(hasInsurance ? ['insuranceCheck'] : ['selfPayInfo', ...(needsCardPayment ? ['cardPayment'] : [])]),
    ...(enabledFields.length > 0 ? ['intake'] : []),
    'confirm',
  ];

  return (
    <div style={{ position: 'sticky', top: 80 }}>
      {/* Header label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Patient Preview</span>
        </div>
        {step !== 'visit' && (
          <button onClick={reset} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4" /></svg>
            Reset
          </button>
        )}
      </div>

      {/* Device shell */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        {/* App bar */}
        <div style={{ background: 'white', padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{room.roomName}</p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>Powered by VSee</p>
          </div>
          <div style={{ width: 28, height: 28, background: 'var(--brand)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 13 }}>V</div>
        </div>

        {/* Step progress bar */}
        {step !== 'visit' && (
          <div style={{ background: 'white', padding: '8px 16px 10px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 4 }}>
            {allSteps.map(s => (
              <div key={s} style={{ flex: 1, height: 3, borderRadius: 99, background: allSteps.indexOf(step) >= allSteps.indexOf(s) ? 'var(--brand)' : 'var(--grey-200)', transition: 'background 200ms' }} />
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{ padding: 20, minHeight: 360, maxHeight: 560, overflowY: 'auto', background: '#f8f9fb' }}>
          {step === 'visit' && (
            <VisitStep visits={visibleVisits} onSelect={handleSelectVisit} />
          )}
          {step === 'patientType' && selectedVisit && (
            <PatientTypeStep
              visitName={selectedVisit.name}
              patientTypes={availablePts}
              onSelect={handleSelectPt}
              onBack={handleBackFromPt}
            />
          )}
          {step === 'selfPayInfo' && selectedVisit && (
            <SelfPayInfoStep
              visit={selectedVisit}
              clinic={clinic}
              onContinue={handleSelfPayInfoContinue}
              onBack={handleBackFromSelfPayInfo}
            />
          )}
          {step === 'cardPayment' && selectedVisit && (
            <CardPaymentStep
              amount={selfPayPricing?.amount}
              onContinue={() => setStep(afterCardPayment)}
              onBack={handleBackFromCardPayment}
            />
          )}
          {step === 'insuranceCheck' && selectedVisit && (
            <InsuranceCheckStep
              eligibilityAccess={clinic.paymentConfig?.['insurance']?.eligibilityAccess}
              visitInsurancePricing={selectedVisit.pricing?.['insurance']}
              onContinue={handleInsuranceContinue}
              onBack={handleBackFromInsurance}
            />
          )}
          {step === 'intake' && selectedVisit && (
            <IntakeStep
              templateName={intakeTemplate?.name}
              fields={enabledFields}
              onContinue={() => setStep('confirm')}
              onBack={handleBackFromIntake}
            />
          )}
          {step === 'confirm' && selectedVisit && selectedPt && (
            <ConfirmStep
              visit={selectedVisit}
              ptId={selectedPt}
              clinic={clinic}
              onBack={handleBackFromConfirm}
              onReset={reset}
            />
          )}
        </div>
      </div>
    </div>
  );
}
