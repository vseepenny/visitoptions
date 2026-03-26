import { useState, useEffect, useRef, useMemo } from 'react';

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

/* ── Back button helper ──────────────────────────────────── */

function BackButton({ label, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, marginBottom: 20 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
      {label || 'Back'}
    </button>
  );
}

/* ── Step: Select Visit ──────────────────────────────────── */

function VisitStep({ visits, onSelect, onBack }) {
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
      {onBack && <BackButton onClick={onBack} />}
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

/* ── Step: Scheduling (mock calendar) ────────────────────── */

function SchedulingStep({ visit, onContinue, onBack }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i + 1);
    return d;
  });

  const times = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '1:00 PM', '1:30 PM', '2:00 PM', '3:00 PM', '3:30 PM'];

  const dayName = (d) => d.toLocaleDateString('en-US', { weekday: 'short' });
  const dateNum = (d) => d.getDate();
  const monthDay = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div>
      <BackButton onClick={onBack} />
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Pick a time</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
        {visit.name} · {visit.duration}
      </p>

      {/* Date picker */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {dates.map((d, i) => {
          const sel = selectedDate === i;
          return (
            <button
              key={i}
              onClick={() => { setSelectedDate(i); setSelectedTime(null); }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '8px 10px', borderRadius: 10, border: `1.5px solid ${sel ? 'var(--brand)' : 'var(--border)'}`,
                background: sel ? 'var(--brand-50)' : 'white', cursor: 'pointer', minWidth: 44,
                transition: 'all 100ms',
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 600, color: sel ? 'var(--brand)' : 'var(--text-tertiary)', textTransform: 'uppercase' }}>{dayName(d)}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: sel ? 'var(--brand)' : 'var(--text-primary)' }}>{dateNum(d)}</span>
            </button>
          );
        })}
      </div>

      {/* Time slots */}
      {selectedDate !== null && (
        <>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Available times for {monthDay(dates[selectedDate])}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 20 }}>
            {times.map(t => {
              const sel = selectedTime === t;
              return (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  style={{
                    padding: '8px 12px', borderRadius: 8,
                    border: `1.5px solid ${sel ? 'var(--brand)' : 'var(--border)'}`,
                    background: sel ? 'var(--brand)' : 'white',
                    color: sel ? 'white' : 'var(--text-primary)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 100ms',
                  }}
                >{t}</button>
              );
            })}
          </div>
        </>
      )}

      <button
        onClick={onContinue}
        disabled={selectedTime === null}
        className="btn btn-primary btn-sm"
        style={{ width: '100%', justifyContent: 'center', opacity: selectedTime ? 1 : 0.4 }}
      >
        Continue
      </button>
    </div>
  );
}

/* ── Step: Patient Type (for conditional branching) ──────── */

function PatientTypeStep({ patientTypes, onSelect, onBack }) {
  return (
    <div>
      <BackButton onClick={onBack} />
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

/* ── Step: Form (driven by form library) ─────────────────── */

function FormStep({ step, clinic, onContinue, onBack }) {
  const [values, setValues] = useState({});

  // Resolve form from the library
  const form = step.formId ? clinic?.formLibrary?.find(f => f.id === step.formId) : null;
  const fields = form?.fields?.filter(f => f.enabled) || [];

  // Fallback: no form linked — show generic fields
  const displayFields = fields.length > 0 ? fields : [
    { id: 'name', label: 'Full Name', required: true },
    { id: 'reason', label: 'Reason for Visit', required: true },
  ];

  // Validation: all required fields must be filled/checked
  const isComplete = displayFields.filter(f => f.required).every(f => {
    if (f.type === 'checkbox') return values[f.id] === true;
    if (f.type === 'scale') return values[f.id] != null;
    return (values[f.id] || '').toString().trim();
  });

  const canContinue = isComplete;

  return (
    <div>
      <BackButton onClick={onBack} />
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{step.label || form?.name || 'Form'}</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Please complete the following.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        {displayFields.map(field => (
          <div key={field.id} className="form-group" style={{ marginBottom: 0 }}>
            {field.type === 'checkbox' ? (
              <label style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
                background: values[field.id] ? 'var(--brand-50)' : 'var(--grey-100)',
                border: `1px solid ${values[field.id] ? 'var(--brand)' : 'var(--border)'}`,
                borderRadius: 10, cursor: 'pointer', transition: 'all 120ms',
              }}>
                <input
                  type="checkbox"
                  checked={!!values[field.id]}
                  onChange={() => setValues(v => ({ ...v, [field.id]: !v[field.id] }))}
                  style={{ marginTop: 2, accentColor: 'var(--brand)' }}
                />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                  {field.label}
                  {field.required && <span className="req" style={{ marginLeft: 4 }}>*</span>}
                </span>
              </label>
            ) : field.type === 'scale' ? (
              <>
                <label className="form-label" style={{ fontSize: 13 }}>
                  {field.label}
                  {field.required && <span className="req" style={{ marginLeft: 4 }}>*</span>}
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[0,1,2,3].map(n => (
                    <button
                      key={n}
                      onClick={() => setValues(v => ({ ...v, [field.id]: n }))}
                      style={{
                        flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        border: `1.5px solid ${values[field.id] === n ? 'var(--brand)' : 'var(--border)'}`,
                        background: values[field.id] === n ? 'var(--brand)' : 'white',
                        color: values[field.id] === n ? 'white' : 'var(--text-primary)',
                        cursor: 'pointer', transition: 'all 100ms',
                      }}
                    >{['Not at all', 'Several days', 'More than half', 'Nearly every'][n]}</button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <label className="form-label" style={{ fontSize: 13 }}>
                  {field.label}
                  {field.required && <span className="req" style={{ marginLeft: 4 }}>*</span>}
                </label>
                {field.type === 'textarea' ? (
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
              </>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onContinue}
        disabled={!canContinue}
        className="btn btn-primary btn-sm"
        style={{ width: '100%', justifyContent: 'center', opacity: canContinue ? 1 : 0.4 }}
      >
        Continue
      </button>
    </div>
  );
}

/* ── Step: Payment ───────────────────────────────────────── */

function PaymentStep({ visit, clinic, selectedPt, onContinue, onBack }) {
  const [subStep, setSubStep] = useState('info'); // info | card | processing | success
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const timerRef = useRef(null);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const formatCardNumber = (val) => val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (val) => { const d = val.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

  // Determine amount
  let method = 'none', amount = '', fallback = '';
  if (selectedPt === 'self-pay') {
    const p = visit?.pricing?.['self-pay'];
    const cfg = clinic.paymentConfig?.['self-pay'];
    if (cfg?.acceptPayments && p) {
      method = p.method || 'none';
      amount = p.amount || '';
      fallback = p.fallback || '';
    }
  } else if (selectedPt === 'insurance') {
    // Use eligible as default preview
    const p = visit?.pricing?.['insurance']?.eligible;
    if (p) { method = p.method || 'none'; amount = p.amount || ''; fallback = p.fallback || ''; }
  } else if (selectedPt === 'group-covered') {
    const p = visit?.pricing?.['group-covered']?.verified;
    if (p) { method = p.method || 'none'; amount = p.amount || ''; fallback = p.fallback || ''; }
  }

  const needsCard = method === 'specific' && amount && clinic.paymentConfig?.['self-pay']?.stripeConnected;
  const displayAmount = method === 'specific' ? amount : method === 'copay' ? (fallback || 'TBD') : null;

  if (subStep === 'processing') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 260, gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid var(--brand)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Processing payment…</p>
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
        <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }} onClick={onContinue}>Continue</button>
      </div>
    );
  }

  if (subStep === 'card' && needsCard) {
    const allFilled = card.number.replace(/\s/g, '').length === 16 && card.expiry.length === 5 && card.cvv.length >= 3 && card.name.trim();
    const handlePay = () => {
      setSubStep('processing');
      timerRef.current = setTimeout(() => setSubStep('success'), 2000);
    };

    return (
      <div>
        <BackButton label="Back" onClick={() => setSubStep('info')} />
        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Card Payment</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Enter your card details to pay <strong>${amount}</strong>.</p>
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 13 }}>Card Number</label>
            <input type="text" inputMode="numeric" placeholder="1234 5678 9012 3456" value={card.number} onChange={e => setCard(c => ({ ...c, number: formatCardNumber(e.target.value) }))} className="input" style={{ fontSize: 14, letterSpacing: '0.04em' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 13 }}>Expiry</label>
              <input type="text" inputMode="numeric" placeholder="MM/YY" value={card.expiry} onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))} className="input" style={{ fontSize: 14 }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 13 }}>CVV</label>
              <input type="text" inputMode="numeric" placeholder="123" value={card.cvv} maxLength={4} onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '') }))} className="input" style={{ fontSize: 14 }} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 13 }}>Cardholder Name</label>
            <input type="text" placeholder="Name on card" value={card.name} onChange={e => setCard(c => ({ ...c, name: e.target.value }))} className="input" style={{ fontSize: 14 }} />
          </div>
        </div>
        <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', opacity: allFilled ? 1 : 0.4 }} disabled={!allFilled} onClick={handlePay}>Pay ${amount}</button>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          Secured by Stripe
        </p>
      </div>
    );
  }

  // Info view
  return (
    <div>
      <BackButton onClick={onBack} />
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Payment</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Here's what you'll pay for this visit.</p>

      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>{visit?.name}</p>
        {method === 'none' || !method ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>No payment required at booking</span>
          </div>
        ) : method === 'specific' && amount ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Amount due at booking</span>
            <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>${amount}</span>
          </div>
        ) : method === 'copay' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Copay</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Determined at visit</span>
            </div>
            {fallback && <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>Estimated: ${fallback}</p>}
          </div>
        ) : (
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Not configured</span>
        )}
      </div>

      <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => needsCard ? setSubStep('card') : onContinue()}>
        {needsCard ? `Pay $${amount}` : 'Continue'}
      </button>
    </div>
  );
}

/* ── Step: Confirm & Booked ──────────────────────────────── */

function ConfirmStep({ visit, ptId, onConfirm, onBack }) {
  const ptMeta = PT_META[ptId];
  return (
    <div>
      <BackButton onClick={onBack} />
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Review & Confirm</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Please review your booking details.</p>

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
        {ptMeta && (
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ptMeta.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{ptMeta.label}</span>
          </div>
        )}
      </div>

      <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onConfirm}>Confirm Booking</button>
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 10 }}>This is a preview — no real booking will be made.</p>
    </div>
  );
}

function BookedStep({ visit, ptId, onReset }) {
  const ptMeta = PT_META[ptId];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 32, gap: 12 }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ECFDF5', border: '2px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
      </div>
      <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>You're booked!</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Your appointment has been confirmed.</p>

      <div style={{ width: '100%', background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginTop: 4, textAlign: 'left' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>{visit.name}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{visit.duration}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {MODE_ICONS[visit.mode]}
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{visit.mode}</span>
          </div>
          {ptMeta && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: ptMeta.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ptMeta.label}</span>
            </div>
          )}
        </div>
      </div>

      <button onClick={onReset} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>Book another visit</button>
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>This is a preview — no real booking was made.</p>
    </div>
  );
}

/* ── Workflow flattener ───────────────────────────────────── */
// Takes a workflow's steps and a selectedPt (patient type), and
// returns a flat array of { key, type, step } entries the preview walks through.

function flattenWorkflow(steps, selectedPt, selectedVisitId, clinicPts) {
  const flat = [];
  if (!steps) return flat;

  for (const step of steps) {
    if (step.type === 'visit_selection') {
      // Pause here if no visit selected yet
      flat.push({ key: step.id, type: 'visit_selection', step });
      if (!selectedVisitId) break; // Can't flatten further until they choose
    } else if (step.type === 'conditional') {
      if (step.conditionType === 'patient_type' && !selectedPt) {
        flat.push({ key: step.id, type: 'choose_patient_type', step, availableTypes: clinicPts });
        break;
      }
      if (step.conditionType === 'patient_type' && selectedPt) {
        const branch = step.branches?.find(b =>
          b.condition === selectedPt || b.label?.toLowerCase().replace(/[^a-z]/g, '').includes(selectedPt.replace('-', ''))
        );
        if (branch?.steps?.length) {
          flat.push(...flattenWorkflow(branch.steps, selectedPt, selectedVisitId, clinicPts));
        }
      } else {
        const branch = step.branches?.[0];
        if (branch?.steps?.length) {
          flat.push(...flattenWorkflow(branch.steps, selectedPt, selectedVisitId, clinicPts));
        }
      }
    } else {
      flat.push({ key: step.id, type: step.type, step });
    }
  }

  return flat;
}

/* ── Main Component ──────────────────────────────────────── */

export default function PatientPreview({ room, clinic }) {
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [selectedPt, setSelectedPt] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [booked, setBooked] = useState(false);

  const visibleVisits = room.visitOptions.filter(v => v.visible);
  const selectedVisit = visibleVisits.find(v => v.id === selectedVisitId);
  const clinicPts = clinic.patientTypes || [];

  // Flatten the clinic workflow — visit_selection becomes a chooser step
  const flatSteps = useMemo(() => {
    const workflow = clinic.defaultWorkflow;
    if (!workflow?.steps) return [];
    return flattenWorkflow(workflow.steps, selectedPt, selectedVisitId, clinicPts);
  }, [clinic.defaultWorkflow, selectedPt, selectedVisitId, clinicPts]);

  const totalSteps = flatSteps.length;
  const currentStep = flatSteps[currentIndex] || null;
  const currentView = booked ? 'booked'
    : currentIndex >= totalSteps ? 'confirm'
    : currentStep?.type || 'confirm';

  // Reset if visit becomes invisible
  useEffect(() => {
    if (selectedVisitId && !visibleVisits.find(v => v.id === selectedVisitId)) {
      reset();
    }
  }, [room.visitOptions]);

  const reset = () => {
    setSelectedVisitId(null);
    setSelectedPt(null);
    setCurrentIndex(0);
    setBooked(false);
  };

  const handleSelectVisit = (id) => {
    setSelectedVisitId(id);
    // Advance past the visit_selection step
    setCurrentIndex(i => i + 1);
  };

  const handleNext = () => {
    if (currentIndex >= totalSteps) {
      // At confirm → book
      setBooked(true);
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      const prevStep = flatSteps[currentIndex - 1];
      if (prevStep?.type === 'choose_patient_type') setSelectedPt(null);
      if (prevStep?.type === 'visit_selection') {
        setSelectedVisitId(null);
        setSelectedPt(null);
      }
      setCurrentIndex(i => i - 1);
    }
  };

  const handleSelectPt = (pt) => {
    setSelectedPt(pt);
    setCurrentIndex(i => i + 1);
  };

  // Progress bar
  const progressSteps = [...flatSteps.map(f => f.key), 'confirm'];
  const progressIndex = booked ? progressSteps.length
    : currentIndex >= totalSteps ? progressSteps.length - 1
    : currentIndex;

  const STEP_LABELS = {
    scheduling: 'Scheduling',
    form: 'Form',
    payment: 'Payment',
    visit_selection: 'Visit Selection',
    choose_patient_type: 'Patient Type',
    confirm: 'Confirm',
  };

  const stepCounter = currentIndex < totalSteps && !booked
    ? `Step ${currentIndex + 1} of ${totalSteps}`
    : '';
  const stepLabel = currentStep?.step?.label || STEP_LABELS[currentStep?.type] || '';

  return (
    <div style={{ position: 'sticky', top: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Patient Preview</span>
        </div>
        {(currentIndex > 0 || booked) && (
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

        {/* Progress bar */}
        {!booked && (
          <div style={{ background: 'white', padding: '8px 16px 10px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 4 }}>
            {progressSteps.map((s, i) => (
              <div key={s} style={{ flex: 1, height: 3, borderRadius: 99, background: progressIndex >= i ? 'var(--brand)' : 'var(--grey-200)', transition: 'background 200ms' }} />
            ))}
          </div>
        )}

        {/* Step label */}
        {stepCounter && !booked && currentView !== 'confirm' && (
          <div style={{ background: 'white', padding: '6px 16px', borderBottom: '1px solid var(--grey-200)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {stepCounter}
            </span>
            <span style={{ fontSize: 10, color: 'var(--grey-300)' }}>·</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {stepLabel}
            </span>
          </div>
        )}

        {/* Content */}
        <div style={{ padding: 20, minHeight: 360, maxHeight: 560, overflowY: 'auto', background: '#f8f9fb' }}>

          {currentView === 'visit_selection' && (
            <VisitStep visits={visibleVisits} onSelect={handleSelectVisit} onBack={currentIndex > 0 ? handleBack : undefined} />
          )}

          {currentView === 'scheduling' && (
            <SchedulingStep visit={selectedVisit || { name: 'Appointment', duration: '' }} onContinue={handleNext} onBack={handleBack} />
          )}

          {currentView === 'choose_patient_type' && (
            <PatientTypeStep
              patientTypes={currentStep?.availableTypes || clinicPts}
              onSelect={handleSelectPt}
              onBack={handleBack}
            />
          )}

          {currentView === 'form' && (
            <FormStep
              step={currentStep?.step}
              clinic={clinic}
              onContinue={handleNext}
              onBack={handleBack}
            />
          )}

          {currentView === 'payment' && (
            <PaymentStep
              visit={selectedVisit || {}}
              clinic={clinic}
              selectedPt={selectedPt}
              onContinue={handleNext}
              onBack={handleBack}
            />
          )}

          {currentView === 'confirm' && selectedVisit && (
            <ConfirmStep
              visit={selectedVisit}
              ptId={selectedPt}
              onConfirm={handleNext}
              onBack={handleBack}
            />
          )}

          {currentView === 'booked' && selectedVisit && (
            <BookedStep visit={selectedVisit} ptId={selectedPt} onReset={reset} />
          )}
        </div>
      </div>
    </div>
  );
}
