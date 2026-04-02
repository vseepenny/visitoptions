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
  'E-Consult': <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>,
};

const formatModes = (mode) => {
  const modes = Array.isArray(mode) ? mode : [mode];
  return modes.map((m, i) => (
    <span key={m} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {i > 0 && <span style={{ color: 'var(--grey-300)', margin: '0 2px' }}>/</span>}
      {MODE_ICONS[m]}{m}
    </span>
  ));
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
                  {formatModes(visit.mode)}
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

/* ── Step: Login ─────────────────────────────────────────── */

function LoginStep({ onContinue, onBack }) {
  const [mode, setMode] = useState('login'); // login | guest
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (mode === 'guest') {
    return (
      <div>
        <BackButton onClick={() => setMode('login')} label="Back to sign in" />
        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Continue as Guest</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>No account needed — enter your name and email to get started.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 13 }}>Full Name <span className="req">*</span></label>
            <input type="text" placeholder="Jane Doe" className="input" style={{ fontSize: 13 }} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 13 }}>Email <span className="req">*</span></label>
            <input type="email" placeholder="jane@example.com" className="input" style={{ fontSize: 13 }} />
          </div>
        </div>
        <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onContinue}>Continue</button>
      </div>
    );
  }

  return (
    <div>
      {onBack && <BackButton onClick={onBack} />}
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Sign In</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Sign in to your account to continue.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="input" style={{ fontSize: 13 }} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input" style={{ fontSize: 13 }} />
        </div>
        <button style={{ background: 'none', border: 'none', padding: 0, fontSize: 12, color: 'var(--brand)', cursor: 'pointer', textAlign: 'left' }}>Forgot password?</button>
      </div>
      <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onContinue}>Sign In</button>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Don't have an account? </span>
        <button style={{ background: 'none', border: 'none', padding: 0, fontSize: 12, color: 'var(--brand)', cursor: 'pointer', fontWeight: 600 }} onClick={onContinue}>Sign Up</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>OR</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>
      <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMode('guest')}>Continue as Guest</button>
    </div>
  );
}

/* ── Step: Signup ─────────────────────────────────────────── */

function SignupStep({ onContinue, onBack }) {
  return (
    <div>
      <BackButton onClick={onBack} />
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Create Account</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Register to book and manage your appointments.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 13 }}>First Name <span className="req">*</span></label>
            <input type="text" placeholder="Jane" className="input" style={{ fontSize: 13 }} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 13 }}>Last Name <span className="req">*</span></label>
            <input type="text" placeholder="Doe" className="input" style={{ fontSize: 13 }} />
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Date of Birth <span className="req">*</span></label>
          <input type="date" className="input" style={{ fontSize: 13 }} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Gender</label>
          <select className="input" style={{ fontSize: 13 }}><option>Select…</option><option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option></select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Email <span className="req">*</span></label>
          <input type="email" placeholder="jane@example.com" className="input" style={{ fontSize: 13 }} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Phone</label>
          <input type="tel" placeholder="(555) 123-4567" className="input" style={{ fontSize: 13 }} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Password <span className="req">*</span></label>
          <input type="password" placeholder="Min. 8 characters" className="input" style={{ fontSize: 13 }} />
        </div>
      </div>
      <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onContinue}>Create Account</button>
    </div>
  );
}

/* ── Step: Signup Verification ────────────────────────────── */

function SignupVerificationStep({ onContinue, onBack }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  return (
    <div>
      <BackButton onClick={onBack} />
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#EFF6FF', border: '2px solid var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>
        </div>
        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Verify your email</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>We sent a 6-digit code to your email. Enter it below.</p>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
        {code.map((d, i) => (
          <input key={i} type="text" inputMode="numeric" maxLength={1} value={d}
            onChange={e => { const n = [...code]; n[i] = e.target.value.replace(/\D/g, ''); setCode(n); if (n[i] && e.target.nextElementSibling) e.target.nextElementSibling.focus(); }}
            className="input" style={{ width: 40, height: 44, textAlign: 'center', fontSize: 18, fontWeight: 700 }}
          />
        ))}
      </div>
      <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onContinue}>Verify</button>
      <button style={{ width: '100%', marginTop: 12, background: 'none', border: 'none', fontSize: 12, color: 'var(--brand)', cursor: 'pointer', textAlign: 'center' }}>Resend code</button>
    </div>
  );
}

/* ── Step: Dependant List ─────────────────────────────────── */

function DependantListStep({ onContinue, onBack }) {
  const [selected, setSelected] = useState('self');
  const dependants = [
    { id: 'self', name: 'Myself', relation: '' },
    { id: 'dep_1', name: 'Emily Doe', relation: 'Child' },
    { id: 'dep_2', name: 'Robert Doe', relation: 'Spouse' },
  ];
  return (
    <div>
      <BackButton onClick={onBack} />
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Who is this visit for?</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Select yourself or a family member.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {dependants.map(d => {
          const sel = selected === d.id;
          return (
            <button key={d.id} onClick={() => setSelected(d.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              background: sel ? 'var(--brand-50)' : 'white', border: `1.5px solid ${sel ? 'var(--brand)' : 'var(--border)'}`,
              borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 120ms',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: sel ? 'var(--brand)' : 'var(--grey-200)', color: sel ? 'white' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                {d.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{d.name}</p>
                {d.relation && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>{d.relation}</p>}
              </div>
              {sel && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
            </button>
          );
        })}
      </div>
      <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add family member
      </button>
      <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onContinue}>Continue</button>
    </div>
  );
}

/* ── Step: Intake Form (built-in demographics) ───────────── */

function IntakeFormStep({ onContinue, onBack }) {
  return (
    <div>
      <BackButton onClick={onBack} />
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Patient Intake</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Tell us about yourself and why you're visiting.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 13 }}>First Name <span className="req">*</span></label>
            <input type="text" placeholder="Jane" className="input" style={{ fontSize: 13 }} defaultValue="Jane" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 13 }}>Last Name <span className="req">*</span></label>
            <input type="text" placeholder="Doe" className="input" style={{ fontSize: 13 }} defaultValue="Doe" />
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Date of Birth <span className="req">*</span></label>
          <input type="date" className="input" style={{ fontSize: 13 }} defaultValue="1990-05-15" />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Phone</label>
          <input type="tel" placeholder="(555) 123-4567" className="input" style={{ fontSize: 13 }} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Address</label>
          <input type="text" placeholder="123 Main St, City, State, ZIP" className="input" style={{ fontSize: 13 }} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Reason for Visit <span className="req">*</span></label>
          <textarea placeholder="Describe your symptoms or reason for visit…" className="input" style={{ minHeight: 72, resize: 'none', fontSize: 13 }} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Attachments</label>
          <div style={{ border: '1.5px dashed var(--border-strong)', borderRadius: 10, padding: '16px 12px', textAlign: 'center', cursor: 'pointer', background: 'var(--grey-100)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" style={{ margin: '0 auto 6px', display: 'block' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Tap to upload files</p>
          </div>
        </div>
      </div>
      <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onContinue}>Continue</button>
    </div>
  );
}

/* ── Step: Guest Intake ──────────────────────────────────── */

function GuestIntakeStep({ onContinue, onBack }) {
  return (
    <div>
      <BackButton onClick={onBack} />
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Quick Intake</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Tell us what brings you in today.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>What's your health concern? <span className="req">*</span></label>
          <textarea placeholder="Describe your symptoms…" className="input" style={{ minHeight: 100, resize: 'none', fontSize: 13 }} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Attachments</label>
          <div style={{ border: '1.5px dashed var(--border-strong)', borderRadius: 10, padding: '16px 12px', textAlign: 'center', cursor: 'pointer', background: 'var(--grey-100)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" style={{ margin: '0 auto 6px', display: 'block' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Tap to upload photos or documents</p>
          </div>
        </div>
      </div>
      <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onContinue}>Continue</button>
    </div>
  );
}

/* ── Step: Insurance Form ────────────────────────────────── */

function InsuranceFormStep({ onContinue, onBack }) {
  return (
    <div>
      <BackButton onClick={onBack} />
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Insurance Information</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Enter your insurance details so we can verify coverage.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Insurance Carrier <span className="req">*</span></label>
          <select className="input" style={{ fontSize: 13 }}><option>Select carrier…</option><option>Aetna</option><option>Blue Cross Blue Shield</option><option>Cigna</option><option>Humana</option><option>Kaiser Permanente</option><option>UnitedHealthcare</option><option>Other</option></select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 13 }}>Subscriber ID <span className="req">*</span></label>
            <input type="text" placeholder="e.g. XYZ123456" className="input" style={{ fontSize: 13 }} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 13 }}>Group Number</label>
            <input type="text" placeholder="e.g. GRP001" className="input" style={{ fontSize: 13 }} />
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Guarantor Name</label>
          <input type="text" placeholder="If different from patient" className="input" style={{ fontSize: 13 }} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Insurance Card Photos</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {['Front of card', 'Back of card'].map(label => (
              <div key={label} style={{ border: '1.5px dashed var(--border-strong)', borderRadius: 10, padding: '20px 8px', textAlign: 'center', cursor: 'pointer', background: 'var(--grey-100)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" style={{ margin: '0 auto 4px', display: 'block' }}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onContinue}>Continue</button>
    </div>
  );
}

/* ── Step: Guarantor ─────────────────────────────────────── */

function GuarantorStep({ onContinue, onBack }) {
  const [isSelf, setIsSelf] = useState(true);
  return (
    <div>
      <BackButton onClick={onBack} />
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Guarantor Information</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Who is the responsible party for billing?</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['Self', 'Someone else'].map((opt, i) => {
          const sel = isSelf ? i === 0 : i === 1;
          return (
            <button key={opt} onClick={() => setIsSelf(i === 0)} style={{
              flex: 1, padding: '10px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: `1.5px solid ${sel ? 'var(--brand)' : 'var(--border)'}`,
              background: sel ? 'var(--brand-50)' : 'white', color: sel ? 'var(--brand)' : 'var(--text-primary)',
              cursor: 'pointer', transition: 'all 100ms',
            }}>{opt}</button>
          );
        })}
      </div>
      {!isSelf && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 13 }}>First Name <span className="req">*</span></label>
              <input type="text" className="input" style={{ fontSize: 13 }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 13 }}>Last Name <span className="req">*</span></label>
              <input type="text" className="input" style={{ fontSize: 13 }} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 13 }}>Relationship <span className="req">*</span></label>
            <select className="input" style={{ fontSize: 13 }}><option>Select…</option><option>Parent</option><option>Spouse</option><option>Legal Guardian</option><option>Other</option></select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 13 }}>Phone</label>
            <input type="tel" placeholder="(555) 123-4567" className="input" style={{ fontSize: 13 }} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 13 }}>Address</label>
            <input type="text" placeholder="123 Main St, City, State, ZIP" className="input" style={{ fontSize: 13 }} />
          </div>
        </div>
      )}
      <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onContinue}>Continue</button>
    </div>
  );
}

/* ── Step: Pharmacy ──────────────────────────────────────── */

function PharmacyStep({ onContinue, onBack }) {
  const [selected, setSelected] = useState(null);
  const pharmacies = [
    { id: 'p1', name: 'CVS Pharmacy', address: '123 Main St, San Francisco, CA' },
    { id: 'p2', name: 'Walgreens', address: '456 Market St, San Francisco, CA' },
    { id: 'p3', name: 'Rite Aid', address: '789 Mission St, San Francisco, CA' },
  ];
  return (
    <div>
      <BackButton onClick={onBack} />
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Preferred Pharmacy</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Select where you'd like prescriptions sent.</p>
      <div className="form-group" style={{ marginBottom: 16 }}>
        <div style={{ position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" style={{ position: 'absolute', left: 10, top: 9 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search pharmacies…" className="input" style={{ fontSize: 13, paddingLeft: 32 }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {pharmacies.map(p => {
          const sel = selected === p.id;
          return (
            <button key={p.id} onClick={() => setSelected(p.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              background: sel ? 'var(--brand-50)' : 'white', border: `1.5px solid ${sel ? 'var(--brand)' : 'var(--border)'}`,
              borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 120ms',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ECFDF5', border: '1px solid #0D875C30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0D875C" strokeWidth="2"><path d="M3 3h18v4H3z"/><path d="M3 7v13a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>{p.address}</p>
              </div>
              {sel && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
            </button>
          );
        })}
      </div>
      <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onContinue}>Continue</button>
      <button style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', textAlign: 'center' }}>Skip for now</button>
    </div>
  );
}

/* ── Step: Emergency Contact ─────────────────────────────── */

function EmergencyContactStep({ onContinue, onBack }) {
  return (
    <div>
      <BackButton onClick={onBack} />
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Emergency Contact</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Provide a person we can reach in case of emergency.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Contact Name <span className="req">*</span></label>
          <input type="text" placeholder="Full name" className="input" style={{ fontSize: 13 }} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Relationship <span className="req">*</span></label>
          <select className="input" style={{ fontSize: 13 }}><option>Select…</option><option>Spouse/Partner</option><option>Parent</option><option>Sibling</option><option>Child</option><option>Friend</option><option>Other</option></select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Phone <span className="req">*</span></label>
          <input type="tel" placeholder="(555) 123-4567" className="input" style={{ fontSize: 13 }} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Address</label>
          <input type="text" placeholder="Optional" className="input" style={{ fontSize: 13 }} />
        </div>
      </div>
      <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onContinue}>Continue</button>
      <button style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', textAlign: 'center' }}>Skip for now</button>
    </div>
  );
}

/* ── Step: Create Dependant ──────────────────────────────── */

function CreateDependantStep({ onContinue, onBack }) {
  return (
    <div>
      <BackButton onClick={onBack} />
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Add Family Member</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Register a dependant under your account.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 13 }}>First Name <span className="req">*</span></label>
            <input type="text" className="input" style={{ fontSize: 13 }} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 13 }}>Last Name <span className="req">*</span></label>
            <input type="text" className="input" style={{ fontSize: 13 }} />
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Date of Birth <span className="req">*</span></label>
          <input type="date" className="input" style={{ fontSize: 13 }} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Gender</label>
          <select className="input" style={{ fontSize: 13 }}><option>Select…</option><option>Male</option><option>Female</option><option>Other</option></select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Relationship <span className="req">*</span></label>
          <select className="input" style={{ fontSize: 13 }}><option>Select…</option><option>Child</option><option>Spouse</option><option>Parent</option><option>Sibling</option><option>Other</option></select>
        </div>
      </div>
      <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onContinue}>Add & Continue</button>
    </div>
  );
}

/* ── Step: Test Device ───────────────────────────────────── */

function TestDeviceStep({ onContinue, onBack }) {
  const [camOk, setCamOk] = useState(false);
  const [micOk, setMicOk] = useState(false);

  return (
    <div>
      <BackButton onClick={onBack} />
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Device Check</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Make sure your camera and microphone work before the visit.</p>

      {/* Camera preview mock */}
      <div style={{ background: '#1a1a2e', borderRadius: 12, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
        </div>
        {camOk && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: '#10B981', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>Camera OK</div>
        )}
      </div>

      {/* Audio level mock */}
      <div style={{ background: 'var(--grey-100)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Microphone</span>
          {micOk && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)' }}>Working</span>}
        </div>
        <div style={{ display: 'flex', gap: 2, height: 20, alignItems: 'end' }}>
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} style={{
              flex: 1, borderRadius: 2,
              height: micOk ? `${Math.random() * 80 + 20}%` : '15%',
              background: micOk ? 'var(--brand)' : 'var(--grey-300)',
              transition: 'height 150ms',
            }} />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={`btn btn-sm ${camOk ? 'btn-ghost' : 'btn-secondary'}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setCamOk(true)}>
          {camOk ? 'Camera OK' : 'Test Camera'}
        </button>
        <button className={`btn btn-sm ${micOk ? 'btn-ghost' : 'btn-secondary'}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMicOk(true)}>
          {micOk ? 'Mic OK' : 'Test Mic'}
        </button>
      </div>

      <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onContinue}>Continue</button>
    </div>
  );
}

/* ── Step: EMR ───────────────────────────────────────────── */

function EmrStep({ onContinue, onBack }) {
  const [status, setStatus] = useState('loading'); // loading | found | notfound
  useEffect(() => {
    const t = setTimeout(() => setStatus('found'), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div>
      <BackButton onClick={onBack} />
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Medical Records</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Verifying your information with the EMR system.</p>

      {status === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--brand)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Looking up your records…</p>
        </div>
      )}

      {status === 'found' && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ background: '#ECFDF5', border: '1px solid #0D875C30', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>Patient record found</span>
          </div>
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {[
              ['Name', 'Jane Doe'],
              ['DOB', '05/15/1990'],
              ['MRN', 'MRN-2024-0847'],
              ['Primary Care', 'Dr. Smith'],
              ['Allergies', 'Penicillin'],
            ].map(([label, val], i) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {status !== 'loading' && (
        <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onContinue}>
          {status === 'found' ? 'Confirm & Continue' : 'Continue'}
        </button>
      )}
    </div>
  );
}

/* ── Step: Setup Session ─────────────────────────────────── */

function SetupSessionStep({ onContinue, onBack }) {
  const [status, setStatus] = useState('setting_up'); // setting_up | ready
  useEffect(() => {
    const t = setTimeout(() => setStatus('ready'), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div>
      {onBack && <BackButton onClick={onBack} />}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 24, gap: 14 }}>
        {status === 'setting_up' ? (
          <>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid var(--brand)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Setting up your session…</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Preparing the waiting room. This takes just a moment.</p>
          </>
        ) : (
          <>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ECFDF5', border: '2px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Session ready</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Your visit session has been created. You'll be connected shortly.</p>
            <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={onContinue}>Continue</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Step: Confirmation ──────────────────────────────────── */

function ConfirmationStep({ visit, ptId, onContinue, onBack }) {
  const ptMeta = PT_META[ptId];
  return (
    <div>
      <BackButton onClick={onBack} />
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ECFDF5', border: '2px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Appointment Confirmed</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Here's a summary of your upcoming visit.</p>
      </div>

      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
        {visit && (
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{visit.name}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {visit.duration}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {formatModes(visit.mode)}
              </span>
            </div>
          </div>
        )}
        <div style={{ padding: '12px 16px' }}>
          {[
            ['Provider', 'Dr. Provider'],
            ['Date', 'Tomorrow'],
            ['Time', '10:00 AM PT'],
            ...(ptMeta ? [['Payment', ptMeta.label]] : []),
          ].map(([label, val], i, arr) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--grey-200)' : 'none' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onContinue}>Done</button>
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 10 }}>This is a preview — no real appointment was made.</p>
    </div>
  );
}

/* ── Step: Walk-in Confirmation ──────────────────────────── */

function WalkinConfirmationStep({ visit, onContinue, onBack }) {
  return (
    <div>
      {onBack && <BackButton onClick={onBack} />}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 16, gap: 12 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ECFDF5', border: '2px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>You're in the waiting room</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>A provider will be with you shortly.</p>

        {visit && (
          <div style={{ width: '100%', background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginTop: 8, textAlign: 'left' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{visit.name}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{visit.duration}</span>
            </div>
          </div>
        )}

        <div style={{ width: '100%', background: 'var(--grey-100)', borderRadius: 10, padding: '14px 16px', marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Waiting for provider…</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>Estimated wait: 2–5 minutes</p>
        </div>

        <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={onContinue}>Done</button>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>This is a preview — no real session was created.</p>
      </div>
    </div>
  );
}

/* ── Step: Cancel Intake Survey ──────────────────────────── */

function CancelSurveyStep({ onContinue, onBack }) {
  const [reason, setReason] = useState('');
  const reasons = ['Changed my mind', 'Found another provider', 'Cost too high', 'Technical issues', 'Feeling better', 'Other'];
  return (
    <div>
      <BackButton onClick={onBack} />
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Before you go…</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>We'd love to know why you're leaving. This helps us improve.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {reasons.map(r => {
          const sel = reason === r;
          return (
            <button key={r} onClick={() => setReason(r)} style={{
              padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: sel ? 600 : 400,
              border: `1.5px solid ${sel ? 'var(--brand)' : 'var(--border)'}`,
              background: sel ? 'var(--brand-50)' : 'white', color: sel ? 'var(--brand)' : 'var(--text-primary)',
              cursor: 'pointer', textAlign: 'left', transition: 'all 100ms',
            }}>{r}</button>
          );
        })}
      </div>
      {reason === 'Other' && (
        <div className="form-group" style={{ marginBottom: 16 }}>
          <textarea placeholder="Tell us more…" className="input" style={{ minHeight: 72, resize: 'none', fontSize: 13 }} />
        </div>
      )}
      <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onContinue}>Submit & Exit</button>
      <button style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', fontSize: 12, color: 'var(--brand)', cursor: 'pointer', textAlign: 'center', fontWeight: 600 }}>Never mind, continue booking</button>
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
              {formatModes(visit.mode)}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
            {formatModes(visit.mode)}
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
    login: 'Sign In',
    signup: 'Sign Up',
    signup_verification: 'Verify Email',
    dependant_list: 'Who Is This For?',
    visit_selection: 'Visit Selection',
    scheduling: 'Scheduling',
    intake_form: 'Patient Intake',
    guest_intake: 'Quick Intake',
    form: 'Form',
    insurance_form: 'Insurance Info',
    guarantor: 'Guarantor',
    pharmacy: 'Pharmacy',
    emergency_contact: 'Emergency Contact',
    create_dependant: 'Add Family Member',
    payment: 'Payment',
    test_device: 'Device Check',
    emr: 'Medical Records',
    setup_session: 'Setting Up',
    confirmation: 'Confirmed',
    walkin_confirmation: 'Waiting Room',
    cancel_survey: 'Cancel Survey',
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

          {currentView === 'login' && (
            <LoginStep onContinue={handleNext} onBack={currentIndex > 0 ? handleBack : undefined} />
          )}

          {currentView === 'signup' && (
            <SignupStep onContinue={handleNext} onBack={handleBack} />
          )}

          {currentView === 'signup_verification' && (
            <SignupVerificationStep onContinue={handleNext} onBack={handleBack} />
          )}

          {currentView === 'dependant_list' && (
            <DependantListStep onContinue={handleNext} onBack={handleBack} />
          )}

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

          {currentView === 'intake_form' && (
            <IntakeFormStep onContinue={handleNext} onBack={handleBack} />
          )}

          {currentView === 'guest_intake' && (
            <GuestIntakeStep onContinue={handleNext} onBack={handleBack} />
          )}

          {currentView === 'form' && (
            <FormStep
              step={currentStep?.step}
              clinic={clinic}
              onContinue={handleNext}
              onBack={handleBack}
            />
          )}

          {currentView === 'insurance_form' && (
            <InsuranceFormStep onContinue={handleNext} onBack={handleBack} />
          )}

          {currentView === 'guarantor' && (
            <GuarantorStep onContinue={handleNext} onBack={handleBack} />
          )}

          {currentView === 'pharmacy' && (
            <PharmacyStep onContinue={handleNext} onBack={handleBack} />
          )}

          {currentView === 'emergency_contact' && (
            <EmergencyContactStep onContinue={handleNext} onBack={handleBack} />
          )}

          {currentView === 'create_dependant' && (
            <CreateDependantStep onContinue={handleNext} onBack={handleBack} />
          )}

          {currentView === 'cancel_survey' && (
            <CancelSurveyStep onContinue={handleNext} onBack={handleBack} />
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

          {currentView === 'test_device' && (
            <TestDeviceStep onContinue={handleNext} onBack={handleBack} />
          )}

          {currentView === 'emr' && (
            <EmrStep onContinue={handleNext} onBack={handleBack} />
          )}

          {currentView === 'setup_session' && (
            <SetupSessionStep onContinue={handleNext} onBack={handleBack} />
          )}

          {currentView === 'confirmation' && (
            <ConfirmationStep visit={selectedVisit} ptId={selectedPt} onContinue={() => setBooked(true)} onBack={handleBack} />
          )}

          {currentView === 'walkin_confirmation' && (
            <WalkinConfirmationStep visit={selectedVisit} onContinue={() => setBooked(true)} onBack={handleBack} />
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
