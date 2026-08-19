import { useState, useEffect, useRef, useMemo } from 'react';
import { slotsForDate, providersForVisit } from './scheduling';
import { normalizeSteps } from './workflowUtils';
import { accessConfig, landingMethod, resolvePatientAccess } from './patientAccess';
import { evalRule } from './ruleExpr';

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

function SchedulingStep({ visit, clinic, room, onContinue, onBack }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  // Next 7 days + their real slots, from provider availability and duration
  const { dates, slotsByDate } = useMemo(() => {
    const today = new Date();
    const ds = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i + 1);
      return d;
    });
    return { dates: ds, slotsByDate: ds.map(d => slotsForDate({ clinic, room, visit, date: d })) };
  }, [clinic, room, visit]);

  const slots = selectedDate !== null ? slotsByDate[selectedDate] : [];
  const times = slots.map(s => s.time);
  const slotAt = (t) => slots.find(s => s.time === t);
  const eligibleProviders = providersForVisit(clinic, room, visit);

  const dayName = (d) => d.toLocaleDateString('en-US', { weekday: 'short' });
  const dateNum = (d) => d.getDate();
  const monthDay = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div>
      <BackButton onClick={onBack} />
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Pick a time</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
        {visit.name} · {visit.duration}
      </p>
      <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 16 }}>
        {eligibleProviders.length
          ? `${eligibleProviders.length} provider${eligibleProviders.length !== 1 ? 's' : ''} available: ${eligibleProviders.map(p => p.name).join(', ')}`
          : 'No providers assigned — add availability in Clinic Settings → Providers.'}
      </p>

      {/* Date picker — days with no availability are disabled */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {dates.map((d, i) => {
          const sel = selectedDate === i;
          const count = slotsByDate[i]?.length || 0;
          const off = count === 0;
          return (
            <button
              key={i}
              disabled={off}
              onClick={() => { setSelectedDate(i); setSelectedTime(null); }}
              title={off ? 'No availability' : `${count} times`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '8px 10px', borderRadius: 10, border: `1.5px solid ${sel ? 'var(--brand)' : 'var(--border)'}`,
                background: sel ? 'var(--brand-50)' : off ? 'var(--grey-50)' : 'white',
                cursor: off ? 'not-allowed' : 'pointer', minWidth: 44, opacity: off ? 0.45 : 1,
                transition: 'all 100ms',
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 600, color: sel ? 'var(--brand)' : 'var(--text-tertiary)', textTransform: 'uppercase' }}>{dayName(d)}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: sel ? 'var(--brand)' : 'var(--text-primary)' }}>{dateNum(d)}</span>
              <span style={{ fontSize: 9, color: off ? 'var(--text-tertiary)' : 'var(--brand)', fontWeight: 600 }}>{off ? '—' : count}</span>
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
          {times.length === 0 && (
            <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', fontStyle: 'italic', marginBottom: 20 }}>
              No provider availability on this day.
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 12 }}>
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
          {selectedTime && slotAt(selectedTime) && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              with <strong>{slotAt(selectedTime).providerNames[0]}</strong>
              {slotAt(selectedTime).providerNames.length > 1 && ` (+${slotAt(selectedTime).providerNames.length - 1} more free)`}
            </p>
          )}
        </>
      )}

      <button
        onClick={() => onContinue(selectedTime ? { time: selectedTime, date: dates[selectedDate], provider: slotAt(selectedTime)?.providerNames[0] } : undefined)}
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

/* ── Step: Branch chooser (simulates non-payment conditions) ─ */
// Conditions like visit mode or a form answer would be resolved from real
// patient data. In the preview the admin picks the path so every configured
// branch can be walked in a demo.

const CONDITION_LABELS = {
  visit_mode:     'Visit mode',
  patient_status: 'New vs returning patient',
  visit_for:      'Who the visit is for',
  age_group:      'Age group',
  clinic_hours:   'Clinic hours',
  form_answer:    'Answer to a form question',
  insurance_status: 'Insurance status',
  auth_method:    'How the patient signed in',
  rule:           'a custom rule',
};

function BranchChoiceStep({ step, onSelect, onBack }) {
  const branches = step.branches || [];
  const label = CONDITION_LABELS[step.conditionType] || 'Condition';
  return (
    <div>
      <BackButton onClick={onBack} />
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--warning-light)', color: '#92400E', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, marginBottom: 10 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
        PREVIEW BRANCH
      </div>
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{step.label || 'Conditional Branch'}</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18 }}>
        Branching on <strong>{label}</strong>.{' '}
        {step.conditionType === 'rule'
          ? 'One of these rules tests an answer this walkthrough does not collect, so pick a path to preview it.'
          : 'In a real visit this is resolved automatically — pick a path to preview it.'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {branches.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No branches configured on this step.</p>
        )}
        {branches.map(b => (
          <button
            key={b.id || b.condition}
            onClick={() => onSelect(b.condition ?? b.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: 'white', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 120ms' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.background = 'var(--brand-50)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'white'; }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{b.label}</p>
              {b.kind === 'rule' && b.expr && (
                <p style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{b.expr}</p>
              )}
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                {b.steps?.length ? `${b.steps.length} step${b.steps.length !== 1 ? 's' : ''} on this path` : 'No extra steps — continues the main flow'}
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--grey-400)" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        ))}
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

/* ── Step: Account ───────────────────────────────────────── */
// One screen per way in, all driven by the Account module's options. The
// patient lands on the configured method and can switch to any other one
// that's turned on.

const SSO_PROVIDER_LABELS = {
  saml: 'Continue with clinic SSO',
  google: 'Continue with Google',
  apple: 'Continue with Apple',
  microsoft: 'Continue with Microsoft',
};

const GUEST_FIELD_META = {
  name:  { label: 'Full Name',     type: 'text',  placeholder: 'Jane Doe' },
  email: { label: 'Email',         type: 'email', placeholder: 'jane@example.com' },
  phone: { label: 'Phone',         type: 'tel',   placeholder: '(555) 123-4567' },
  dob:   { label: 'Date of Birth', type: 'date',  placeholder: '' },
};

const ACCOUNT_VIEW_LABELS = {
  signin: 'Sign in',
  signup: 'Create an account',
  sso: 'Use single sign-on',
  guest: 'Continue as Guest',
};

function OrDivider({ label = 'OR' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

/* Links to whichever other methods the clinic left on. */
function MethodSwitch({ cfg, current, onSwitch }) {
  const others = [
    cfg.allowLogin && 'signin',
    cfg.allowSignup && 'signup',
    cfg.allowSSO && 'sso',
    cfg.allowGuest && 'guest',
  ].filter(v => v && v !== current);
  if (others.length === 0) return null;
  return (
    <>
      <OrDivider />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {others.map(v => (
          <button key={v} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onSwitch(v)}>
            {ACCOUNT_VIEW_LABELS[v]}
          </button>
        ))}
      </div>
    </>
  );
}

function CodeEntry({ onContinue, title, blurb, icon }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#EFF6FF', border: '2px solid var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          {icon}
        </div>
        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{blurb}</p>
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
    </>
  );
}

const MAIL_ICON = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>;
const PHONE_ICON = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>;

function AccountStep({ access, onContinue, onBack }) {
  const cfg = accessConfig(access);
  const landing = landingMethod(access);
  // Report the outcome, not just "next" — the flow can branch on it.
  const done = (method) => onContinue(method);
  // ssoAutoRedirect skips the chooser entirely and hands off to the provider.
  const [view, setView] = useState(cfg.allowSSO && cfg.ssoAutoRedirect ? 'sso' : landing || 'none');

  // After registering, walk whichever verification steps are switched on.
  const afterSignup = () => {
    if (cfg.verifyEmail) setView('verify_email');
    else if (cfg.verifyPhone) setView('verify_phone');
    else done('account');
  };
  const afterEmailVerify = () => {
    if (cfg.verifyPhone) setView('verify_phone');
    else done('account');
  };

  const backToLanding = () => setView(landing || 'none');
  const showBack = view !== (landing || 'none');
  const back = showBack
    ? <BackButton onClick={backToLanding} label="Back" />
    : (onBack ? <BackButton onClick={onBack} /> : null);

  /* No method enabled — the editor warns about this, but the preview still has
     to be walkable so the rest of the flow can be demoed. */
  if (view === 'none') {
    return (
      <div>
        {onBack && <BackButton onClick={onBack} />}
        <div style={{ padding: '14px 16px', background: 'var(--warning-light)', border: '1px solid #FDE68A', borderRadius: 12, marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>No sign-in method enabled</p>
          <p style={{ fontSize: 12.5, color: '#92400E', lineHeight: 1.45 }}>Every access method is switched off for this room, so patients would be stuck here. Turn one on under Patient Access.</p>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => done('account')}>Skip for preview</button>
      </div>
    );
  }

  if (view === 'verify_email') {
    return (
      <div>
        <BackButton onClick={() => setView('signup')} label="Back" />
        <CodeEntry
          onContinue={afterEmailVerify}
          title="Verify your email"
          blurb="We sent a 6-digit code to your email. Enter it below."
          icon={MAIL_ICON}
        />
      </div>
    );
  }

  if (view === 'verify_phone') {
    return (
      <div>
        <BackButton onClick={() => setView(cfg.verifyEmail ? 'verify_email' : 'signup')} label="Back" />
        <CodeEntry
          onContinue={() => done('account')}
          title="Verify your phone"
          blurb="We texted a 6-digit code to your phone. Enter it below."
          icon={PHONE_ICON}
        />
      </div>
    );
  }

  if (view === 'magic_link') {
    return (
      <div>
        <BackButton onClick={backToLanding} label="Back" />
        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Sign in without a password</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>We'll email you a one-time link. Open it on this device to continue.</p>
        <div className="form-group" style={{ marginBottom: 24 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Email <span className="req">*</span></label>
          <input type="email" placeholder="you@example.com" className="input" style={{ fontSize: 13 }} />
        </div>
        <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => done('account')}>Email me a link</button>
      </div>
    );
  }

  if (view === 'sso') {
    const providers = cfg.ssoProviders.length ? cfg.ssoProviders : ['saml'];
    return (
      <div>
        {back}
        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Single sign-on</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Continue with the account you already use.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {providers.map(p => (
            <button key={p} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => done('sso')}>
              {SSO_PROVIDER_LABELS[p] || 'Continue with SSO'}
            </button>
          ))}
        </div>
        {!cfg.ssoAutoRedirect && <MethodSwitch cfg={cfg} current="sso" onSwitch={setView} />}
      </div>
    );
  }

  if (view === 'guest') {
    const fields = cfg.guestFields.length ? cfg.guestFields : ['name'];
    return (
      <div>
        {back}
        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Continue as Guest</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>No account needed — just a few details to get started.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
          {fields.map(f => {
            const meta = GUEST_FIELD_META[f];
            if (!meta) return null;
            return (
              <div key={f} className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: 13 }}>{meta.label} <span className="req">*</span></label>
                <input type={meta.type} placeholder={meta.placeholder} className="input" style={{ fontSize: 13 }} />
              </div>
            );
          })}
        </div>
        {cfg.guestUpgrade && (
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 20, cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--brand)', marginTop: 2 }} />
            Save my details as an account after this visit
          </label>
        )}
        <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => done('guest')}>Continue</button>
        <MethodSwitch cfg={cfg} current="guest" onSwitch={setView} />
      </div>
    );
  }

  if (view === 'signup') {
    const gated = cfg.signupAccess !== 'open';
    return (
      <div>
        {back}
        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Create Account</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Register to book and manage your appointments.</p>

        {gated && (
          <div style={{ padding: '10px 12px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, marginBottom: 16, display: 'flex', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span style={{ fontSize: 12, color: '#1E40AF', lineHeight: 1.45 }}>
              {cfg.signupAccess === 'invite'
                ? 'This clinic requires an access code from your care team.'
                : cfg.eligibilitySource === 'employer_domain'
                  ? 'Registration is limited to eligible members — use your work email address.'
                  : cfg.eligibilitySource === 'payer_api'
                    ? 'We’ll check your coverage with your insurer before finishing registration.'
                    : 'We’ll check your details against this clinic’s member list.'}
            </span>
          </div>
        )}

        {cfg.signupAccess === 'invite' && (
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label" style={{ fontSize: 13 }}>Access Code <span className="req">*</span></label>
            <input type="text" placeholder="e.g. CLINIC-2024" className="input" style={{ fontSize: 13 }} />
          </div>
        )}

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
            <label className="form-label" style={{ fontSize: 13 }}>Phone {cfg.verifyPhone && <span className="req">*</span>}</label>
            <input type="tel" placeholder="(555) 123-4567" className="input" style={{ fontSize: 13 }} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 13 }}>Password <span className="req">*</span></label>
            <input type="password" placeholder="Min. 8 characters" className="input" style={{ fontSize: 13 }} />
          </div>
        </div>
        <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={afterSignup}>Create Account</button>
        <MethodSwitch cfg={cfg} current="signup" onSwitch={setView} />
      </div>
    );
  }

  /* Sign in */
  return (
    <div>
      {back}
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Sign In</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Sign in to your account to continue.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Email</label>
          <input type="email" placeholder="you@example.com" className="input" style={{ fontSize: 13 }} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 13 }}>Password</label>
          <input type="password" placeholder="••••••••" className="input" style={{ fontSize: 13 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          {cfg.rememberMe ? (
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--brand)' }} />
              Remember me
            </label>
          ) : <span />}
          <button style={{ background: 'none', border: 'none', padding: 0, fontSize: 12, color: 'var(--brand)', cursor: 'pointer' }}>Forgot password?</button>
        </div>
      </div>
      <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => done('account')}>Sign In</button>
      {cfg.allowMagicLink && (
        <button
          className="btn btn-ghost btn-sm"
          style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
          onClick={() => setView('magic_link')}
        >
          Email me a sign-in link
        </button>
      )}
      <MethodSwitch cfg={cfg} current="signin" onSwitch={setView} />
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

// Stylised neighbourhood map — no external tiles, so the prototype stays
// self-contained. Pins are selectable and stay in sync with the list.
function PharmacyMap({ pharmacies, selected, onSelect }) {
  const ROADS_H = [34, 74, 114];
  const ROADS_V = [58, 126, 194, 246];
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 12, position: 'relative' }}>
      <svg viewBox="0 0 300 148" style={{ display: 'block', width: '100%', background: '#EEF1F4' }}>
        {/* blocks */}
        {[[8,8],[68,8],[136,8],[204,8],[8,48],[68,48],[136,48],[204,48],[8,88],[68,88],[136,88],[204,88]].map(([x,y],i)=>(
          <rect key={i} x={x} y={y} width={46} height={28} rx="2" fill="#E2E7EC" />
        ))}
        {/* roads */}
        {ROADS_H.map(y => <line key={`h${y}`} x1="0" y1={y} x2="300" y2={y} stroke="#FFFFFF" strokeWidth="7" />)}
        {ROADS_V.map(x => <line key={`v${x}`} x1={x} y1="0" x2={x} y2="148" stroke="#FFFFFF" strokeWidth="7" />)}
        {/* patient location */}
        <circle cx="150" cy="112" r="9" fill="#0284C7" opacity="0.18" />
        <circle cx="150" cy="112" r="4" fill="#0284C7" stroke="white" strokeWidth="1.5" />
        <text x="150" y="132" textAnchor="middle" fontSize="8" fill="#475569" fontWeight="600">You</text>
        {/* pharmacy pins */}
        {pharmacies.filter(p => p.pos).map(p => {
          const sel = selected === p.id;
          return (
            <g key={p.id} onClick={() => onSelect(p.id)} style={{ cursor: 'pointer' }}>
              <path
                d={`M${p.pos[0]} ${p.pos[1]} c-6.6 0-12 5.4-12 12 0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z`}
                transform={`translate(0,-32) scale(1)`}
                fill={sel ? 'var(--brand)' : '#94A3B8'}
                stroke="white"
                strokeWidth="1.5"
              />
              <circle cx={p.pos[0]} cy={p.pos[1] - 20} r="4.2" fill="white" />
              {sel && <circle cx={p.pos[0]} cy={p.pos[1] - 20} r="2" fill="var(--brand)" />}
            </g>
          );
        })}
      </svg>
      <span style={{ position: 'absolute', right: 6, bottom: 4, fontSize: 8.5, color: '#94A3B8' }}>Map data — sample</span>
    </div>
  );
}

function PharmacyStep({ step = {}, onContinue, onBack }) {
  const [selected, setSelected] = useState(null);
  const allowSearch = step.allowSearch ?? true;
  const showMap = step.showMap ?? true;
  const allowMailOrder = step.allowMailOrder ?? true;
  const allowSkip = step.allowSkip ?? true;
  const pharmacies = [
    { id: 'p1', name: 'CVS Pharmacy', address: '123 Main St, San Francisco, CA', distance: '0.3 mi', pos: [92, 60] },
    { id: 'p2', name: 'Walgreens', address: '456 Market St, San Francisco, CA', distance: '0.8 mi', pos: [214, 44] },
    { id: 'p3', name: 'Rite Aid', address: '789 Mission St, San Francisco, CA', distance: '1.2 mi', pos: [40, 104] },
    ...(allowMailOrder ? [{ id: 'p4', name: 'VSee Mail Order', address: 'Delivered in 2–3 days', mailOrder: true }] : []),
  ];
  return (
    <div>
      <BackButton onClick={onBack} />
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Preferred Pharmacy</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Select where you'd like prescriptions sent.</p>
      {allowSearch && (
        <div className="form-group" style={{ marginBottom: 16 }}>
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" style={{ position: 'absolute', left: 10, top: 9 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Search pharmacies…" className="input" style={{ fontSize: 13, paddingLeft: 32 }} />
          </div>
        </div>
      )}
      {showMap && (
        <PharmacyMap pharmacies={pharmacies} selected={selected} onSelect={setSelected} />
      )}

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
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</p>
                  {showMap && p.distance && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{p.distance}</span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>{p.address}</p>
              </div>
              {sel && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
            </button>
          );
        })}
      </div>
      <button
        className="btn btn-primary btn-sm"
        style={{ width: '100%', justifyContent: 'center', opacity: selected ? 1 : 0.45 }}
        disabled={!selected}
        onClick={onContinue}
      >Continue</button>
      {allowSkip && (
        <button onClick={onContinue} style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', textAlign: 'center' }}>Skip for now</button>
      )}
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

function flattenWorkflow(steps, selectedPt, selectedVisitId, clinicPts, branchChoices = {}, skipVisitSelection = false, authMethod = null, ruleContext = {}) {
  const flat = [];
  if (!steps) return flat;

  for (const step of steps) {
    if (step.type === 'visit_selection') {
      // The patient app picks the visit on the room landing page, so the
      // in-flow chooser is redundant there.
      if (skipVisitSelection && selectedVisitId) continue;
      flat.push({ key: step.id, type: 'visit_selection', step });
      if (!selectedVisitId) break; // Can't flatten further until they choose
    } else if (step.type === 'conditional') {
      const ctype = step.conditionType || 'patient_type';

      if (ctype === 'patient_type') {
        if (!selectedPt) {
          flat.push({ key: step.id, type: 'choose_patient_type', step, availableTypes: clinicPts });
          break;
        }
        const branch = step.branches?.find(b =>
          b.condition === selectedPt || b.label?.toLowerCase().replace(/[^a-z]/g, '').includes(selectedPt.replace('-', ''))
        );
        if (branch?.steps?.length) {
          flat.push(...flattenWorkflow(branch.steps, selectedPt, selectedVisitId, clinicPts, branchChoices, skipVisitSelection, authMethod, ruleContext));
        }
        continue;
      }

      /* Lo-code rules: evaluate top-down against what this walkthrough knows.
         Only if a rule leans on something the demo can't supply (a real form
         answer, say) do we fall back to asking which path to simulate. */
      if (ctype === 'rule') {
        const ruleBranches = (step.branches || []).filter(b => b.kind === 'rule');
        const otherwise = (step.branches || []).find(b => b.kind === 'otherwise');
        let matched = null;
        let undecidable = false;

        for (const b of ruleBranches) {
          if (!b.rule) continue;                    // no rule yet — never matches
          const { value, unknown } = evalRule(b.rule, ruleContext);
          if (unknown.length > 0) { undecidable = true; break; }
          if (value) { matched = b; break; }
        }

        if (undecidable) {
          const chosenId = branchChoices[step.id];
          if (chosenId === undefined) {
            flat.push({ key: step.id, type: 'choose_branch', step });
            break;
          }
          const picked = step.branches?.find(b => b.id === chosenId || b.condition === chosenId);
          if (picked?.steps?.length) {
            flat.push(...flattenWorkflow(picked.steps, selectedPt, selectedVisitId, clinicPts, branchChoices, skipVisitSelection, authMethod, ruleContext));
          }
          continue;
        }

        const taken = matched || otherwise;
        if (taken?.steps?.length) {
          flat.push(...flattenWorkflow(taken.steps, selectedPt, selectedVisitId, clinicPts, branchChoices, skipVisitSelection, authMethod, ruleContext));
        }
        continue;
      }

      // How the patient signed in is already known — the entry gate settled it,
      // so there is nothing to ask.
      if (ctype === 'auth_method' && authMethod) {
        const branch = step.branches?.find(b => b.condition === authMethod);
        if (branch?.steps?.length) {
          flat.push(...flattenWorkflow(branch.steps, selectedPt, selectedVisitId, clinicPts, branchChoices, skipVisitSelection, authMethod, ruleContext));
        }
        continue;
      }

      // Every other condition type: the preview asks which path to simulate,
      // so all configured branches are walkable in a demo.
      const chosen = branchChoices[step.id];
      if (chosen === undefined) {
        flat.push({ key: step.id, type: 'choose_branch', step });
        break;
      }
      const branch = step.branches?.find(b => b.condition === chosen);
      if (branch?.steps?.length) {
        flat.push(...flattenWorkflow(branch.steps, selectedPt, selectedVisitId, clinicPts, branchChoices, skipVisitSelection, authMethod, ruleContext));
      }
    } else {
      flat.push({ key: step.id, type: step.type, step });
    }
  }

  return flat;
}

/* ── Main Component ──────────────────────────────────────── */

export default function PatientPreview({ room, clinic, initialVisitId = null, embedded = false, onBooked }) {
  const [selectedVisitId, setSelectedVisitId] = useState(initialVisitId);
  const [selectedPt, setSelectedPt] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [booked, setBooked] = useState(false);
  const [branchChoices, setBranchChoices] = useState({}); // stepId → branch condition
  const [authMethod, setAuthMethod] = useState(null);      // account | sso | guest
  const bookedRef = useRef(false);

  const visibleVisits = room.visitOptions.filter(v => v.visible);
  const selectedVisit = visibleVisits.find(v => v.id === selectedVisitId);
  const clinicPts = clinic.patientTypes || [];

  /* Patient Access is a precondition, not a workflow step, so the entry gate is
     prepended to the flow rather than living inside it. Once it's cleared the
     rest of the flow knows how the patient got in. */
  const access = useMemo(() => resolvePatientAccess(clinic, room), [clinic, room]);

  /* Values a lo-code rule can be evaluated against. Deliberately partial: the
     walkthrough doesn't collect real form answers, so `form.*` stays absent and
     any rule touching it falls back to "pick a path to simulate". */
  const ruleContext = useMemo(() => {
    const visit = visibleVisits.find(v => v.id === selectedVisitId) || null;
    const modes = visit ? (Array.isArray(visit.mode) ? visit.mode : [visit.mode]) : [];
    return {
      patient: { type: selectedPt ?? undefined, isReturning: authMethod === 'account' ? true : undefined },
      auth: { method: authMethod ?? undefined },
      visit: visit
        ? { mode: modes[0], name: visit.name, duration: parseInt(visit.duration, 10) || undefined }
        : {},
      clinic: { isOpen: true },
      insurance: { status: selectedPt === 'insurance' ? 'eligible' : undefined },
    };
  }, [visibleVisits, selectedVisitId, selectedPt, authMethod]);

  // Flatten the clinic workflow — visit_selection becomes a chooser step.
  // The gate is always entry 0 so step indexes stay stable once it's cleared.
  const flatSteps = useMemo(() => {
    const gate = [{ key: '_access', type: 'access_gate' }];
    const workflow = clinic.defaultWorkflow;
    if (!workflow?.steps) return gate;
    return [
      ...gate,
      ...flattenWorkflow(normalizeSteps(workflow.steps), selectedPt, selectedVisitId, clinicPts, branchChoices, !!initialVisitId, authMethod, ruleContext),
    ];
  }, [clinic.defaultWorkflow, selectedPt, selectedVisitId, clinicPts, branchChoices, initialVisitId, authMethod, ruleContext]);

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
    bookedRef.current = false;
    setSelectedVisitId(initialVisitId);
    setSelectedPt(null);
    setCurrentIndex(0);
    setBooked(false);
    setBranchChoices({});
    setAuthMethod(null);
  };

  const handleSelectBranch = (stepId, condition) => {
    setBranchChoices(c => ({ ...c, [stepId]: condition }));
    setCurrentIndex(i => i + 1);
  };

  const handleSelectVisit = (id) => {
    setSelectedVisitId(id);
    // Advance past the visit_selection step
    setCurrentIndex(i => i + 1);
  };

  // Single place a booking is finalised, so the patient app always hears about
  // it. The ref guards against double-submit — state updates are async, so a
  // fast second click would otherwise create duplicate bookings.
  const completeBooking = () => {
    if (bookedRef.current) return;
    bookedRef.current = true;
    setBooked(true);
    onBooked?.();
  };

  const handleNext = () => {
    if (currentIndex >= totalSteps) {
      completeBooking();
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      const prevStep = flatSteps[currentIndex - 1];
      if (prevStep?.type === 'choose_patient_type') setSelectedPt(null);
      if (prevStep?.type === 'choose_branch') {
        setBranchChoices(c => {
          const next = { ...c };
          delete next[prevStep.step.id];
          return next;
        });
      }
      if (prevStep?.type === 'visit_selection') {
        setSelectedVisitId(null);
        setSelectedPt(null);
        setBranchChoices({});
      }
      if (prevStep?.type === 'access_gate') setAuthMethod(null);
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
    access_gate: 'Get Started',
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
    choose_branch: 'Branch',
    confirm: 'Confirm',
  };

  const stepCounter = currentIndex < totalSteps && !booked
    ? `Step ${currentIndex + 1} of ${totalSteps}`
    : '';
  const stepLabel = currentStep?.step?.label || STEP_LABELS[currentStep?.type] || '';

  return (
    <div style={embedded ? undefined : { position: 'sticky', top: 80 }}>
      {/* Header — hidden when embedded in the patient app's own frame */}
      {!embedded && (
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
      )}

      {/* Device shell */}
      <div style={embedded
        ? { borderRadius: 0, overflow: 'hidden' }
        : { border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        {/* App bar — the patient app supplies its own */}
        {!embedded && (
          <div style={{ background: 'white', padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{room.roomName}</p>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>Powered by VSee</p>
            </div>
            <div style={{ width: 28, height: 28, background: 'var(--brand)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 13 }}>V</div>
          </div>
        )}

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

          {currentView === 'access_gate' && (
            <AccountStep
              access={access}
              onContinue={method => { setAuthMethod(method); handleNext(); }}
              onBack={currentIndex > 0 ? handleBack : undefined}
            />
          )}

          {currentView === 'dependant_list' && (
            <DependantListStep onContinue={handleNext} onBack={handleBack} />
          )}

          {currentView === 'visit_selection' && (
            <VisitStep visits={visibleVisits} onSelect={handleSelectVisit} onBack={currentIndex > 0 ? handleBack : undefined} />
          )}

          {currentView === 'scheduling' && (
            <SchedulingStep
              visit={selectedVisit || { name: 'Appointment', duration: '30 min' }}
              clinic={clinic}
              room={room}
              onContinue={handleNext}
              onBack={handleBack}
            />
          )}

          {currentView === 'choose_patient_type' && (
            <PatientTypeStep
              patientTypes={currentStep?.availableTypes || clinicPts}
              onSelect={handleSelectPt}
              onBack={handleBack}
            />
          )}

          {currentView === 'choose_branch' && currentStep?.step && (
            <BranchChoiceStep
              step={currentStep.step}
              onSelect={cond => handleSelectBranch(currentStep.step.id, cond)}
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
            <PharmacyStep step={currentStep?.step} onContinue={handleNext} onBack={handleBack} />
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
            <ConfirmationStep visit={selectedVisit} ptId={selectedPt} onContinue={completeBooking} onBack={handleBack} />
          )}

          {currentView === 'walkin_confirmation' && (
            <WalkinConfirmationStep visit={selectedVisit} onContinue={completeBooking} onBack={handleBack} />
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
