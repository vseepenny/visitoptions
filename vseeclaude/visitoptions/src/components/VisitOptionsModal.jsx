import { useState, useEffect } from 'react';
import { DURATIONS, TYPES, SYNC_MODES, ASYNC_MODES, NOTES_PRESETS, ROOM_DEFAULT_INTAKE_FIELDS } from '../data/initialData';
import { PATIENT_TYPES } from './PatientTypes';

/* ── Pricing constants ───────────────────────────────────── */

const DEFAULT_STATUS_PRICING = { method: 'none', amount: '', fallback: '' };

const DEFAULT_PT_PRICING = {
  'self-pay':      { method: 'specific', amount: '', fallback: '' },
  'group-covered': {
    verified:     { method: 'copay', amount: '', fallback: '' },
    not_verified: { method: 'none',  amount: '', fallback: '' },
    pending:      { method: 'none',  amount: '', fallback: '' },
    error:        { method: 'none',  amount: '', fallback: '' },
  },
  'insurance': {
    eligible:     { method: 'copay', amount: '', fallback: '' },
    not_eligible: { method: 'none',  amount: '', fallback: '' },
    pending:      { method: 'none',  amount: '', fallback: '' },
    error:        { method: 'none',  amount: '', fallback: '' },
  },
};

const SELF_PAY_METHODS = [
  { value: 'none',     label: 'No collection required',  desc: 'No payment collected at booking time.' },
  { value: 'specific', label: 'Collect specific amount', desc: 'Charge a fixed dollar amount at booking.' },
];

const ELIGIBILITY_STATUSES = [
  { id: 'eligible',     label: 'Eligible',       dot: 'var(--success)' },
  { id: 'not_eligible', label: 'Not Eligible',    dot: 'var(--danger)' },
  { id: 'pending',      label: 'Pending',         dot: 'var(--warning)' },
  { id: 'error',        label: 'Error / Unknown', dot: 'var(--grey-400)' },
];

const GROUP_STATUSES = [
  { id: 'verified',     label: 'Verified',       dot: 'var(--success)' },
  { id: 'not_verified', label: 'Not Verified',    dot: 'var(--danger)' },
  { id: 'pending',      label: 'Pending',         dot: 'var(--warning)' },
  { id: 'error',        label: 'Error / Unknown', dot: 'var(--grey-400)' },
];

const COPAY_STATUS_ID = { 'group-covered': 'verified', 'insurance': 'eligible' };
const SELECT_STYLE = { height: 34, padding: '0 8px', fontSize: 13 };
const TAB_COLOR = { 'self-pay': 'var(--info)', 'group-covered': 'var(--text-secondary)', 'insurance': 'var(--success)' };

/* ── Modal tabs ──────────────────────────────────────────── */

const MODAL_TABS = [
  { id: 'general',  label: 'General' },
  { id: 'payment',  label: 'Payment' },
  { id: 'intake',   label: 'Intake Flow' },
  { id: 'notes',    label: 'Visit Notes' },
];

/* ── Intake form presets (sourced from initialData) ─────── */

const PRESET_INTAKE_FIELDS = ROOM_DEFAULT_INTAKE_FIELDS;

/* ── Empty form state ────────────────────────────────────── */

const EMPTY = {
  name: '',
  duration: '30 min',
  type: '1:1',
  slots: 1,
  mode: ['Video'],
  visible: true,
  patientTypes: [],
  pricing: { ...DEFAULT_PT_PRICING },
  intakeInherited: true,
  notesInherited: true,
  intakeFields: PRESET_INTAKE_FIELDS.map((f) => ({ ...f })),
  notesTemplate: NOTES_PRESETS.soap,
};

/* ── Component ───────────────────────────────────────────── */

export default function VisitOptionsModal({ existing, allowedPatientTypes, paymentConfig, roomIntakeFields, roomNotesTemplate, onSave, onClose }) {
  const [form, setForm] = useState(existing ? {
    ...EMPTY, ...existing,
    intakeInherited: existing.intakeInherited ?? false,
    notesInherited: existing.notesInherited ?? false,
    intakeFields: existing.intakeFields ?? EMPTY.intakeFields,
    notesTemplate: existing.notesTemplate ?? EMPTY.notesTemplate,
  } : { ...EMPTY });
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('general');
  const [pricingTab, setPricingTab] = useState(null);
  const [newQuestion, setNewQuestion] = useState('');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', handler);
    };
  }, [onClose]);

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const togglePatientType = (id) => {
    set('patientTypes', form.patientTypes.includes(id)
      ? form.patientTypes.filter((p) => p !== id)
      : [...form.patientTypes, id]);
  };

  const setIntakeField = (id, patch) =>
    set('intakeFields', form.intakeFields.map((f) => f.id === id ? { ...f, ...patch } : f));

  const addCustomQuestion = () => {
    const text = newQuestion.trim();
    if (!text) return;
    set('intakeFields', [...form.intakeFields, { id: `custom_${Date.now()}`, label: text, required: false, enabled: true, custom: true }]);
    setNewQuestion('');
  };

  const removeField = (id) =>
    set('intakeFields', form.intakeFields.filter((f) => f.id !== id));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Visit name is required';
    if (form.slots < 1 || form.slots > 99) e.slots = 'Must be 1–99';
    if (form.patientTypes.length === 0) e.patientTypes = 'Select at least one patient type';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (validate()) onSave(form);
    else setActiveTab('general');
  };

  const availableTypes = PATIENT_TYPES.filter((pt) => allowedPatientTypes.includes(pt.id));

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={existing ? 'Edit Visit Option' : 'Add Visit Option'}
    >
      <div className="modal-box" style={{ maxWidth: 800 }}>
        {/* Header */}
        <div className="modal-head">
          <h2>{existing ? 'Edit Visit Option' : 'Add Visit Option'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        {/* Tab bar */}
        <div className="tabs" style={{ padding: '0 24px', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
          {MODAL_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tab-item${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.id === 'general' && (errors.name || errors.slots || errors.patientTypes) && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)', display: 'inline-block', marginLeft: 6 }} />
              )}
            </button>
          ))}
        </div>

        <div className="modal-content">

          {/* ── General tab ── */}
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="form-group">
                <label className="form-label">Visit Name <span className="req">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. New Patient Consult"
                  className={`input${errors.name ? ' error' : ''}`}
                />
                {errors.name && <p className="form-error">{errors.name}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Visit Mode</label>
                  <select value={form.mode?.[0] || 'Video'} onChange={(e) => set('mode', [e.target.value])} className="input">
                    {[...SYNC_MODES, ...ASYNC_MODES].map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <select value={form.duration} onChange={(e) => set('duration', e.target.value)} className="input">
                    {DURATIONS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Session Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((f) => ({ ...f, type: val, slots: val === '1:1' ? 1 : f.slots }));
                    }}
                    className="input"
                  >
                    {TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: form.type === '1:1' ? 'var(--text-tertiary)' : undefined }}>
                    Slots <span style={{ fontWeight: 400, color: 'var(--text-tertiary)', fontSize: 12 }}>(max)</span>
                  </label>
                  <input
                    type="number" min={1} max={form.type === '1:1' ? 1 : 99}
                    value={form.slots}
                    disabled={form.type === '1:1'}
                    onChange={(e) => set('slots', parseInt(e.target.value, 10) || 1)}
                    className={`input${errors.slots ? ' error' : ''}`}
                    style={form.type === '1:1' ? { background: 'var(--surface-muted)', color: 'var(--text-tertiary)', cursor: 'not-allowed' } : undefined}
                  />
                  {form.type === '1:1'
                    ? <p className="form-hint">Fixed at 1 for 1:1 sessions.</p>
                    : errors.slots && <p className="form-error">{errors.slots}</p>
                  }
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--grey-100)', borderRadius: 'var(--r-md)' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>Visible to Patients</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Show this option in the patient booking flow</p>
                </div>
                <button role="switch" aria-checked={form.visible} onClick={() => set('visible', !form.visible)} className={`toggle${form.visible ? ' on' : ''}`} aria-label="Toggle visibility">
                  <span className="toggle-track"><span className="toggle-thumb" /></span>
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Accepted Patient Types <span className="req">*</span></label>
                {availableTypes.length === 0 ? (
                  <div className="alert alert-warning">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span style={{ fontSize: 13 }}>No patient types enabled for this room. Add them in the Patient Types section.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {availableTypes.map((pt) => {
                      const checked = form.patientTypes.includes(pt.id);
                      return (
                        <label key={pt.id} className={`pt-card${checked ? ' selected' : ''}`} style={{ padding: '10px 14px' }}>
                          <input type="checkbox" checked={checked} onChange={() => togglePatientType(pt.id)} style={{ display: 'none' }} />
                          <div className={`ds-checkbox${checked ? ' checked' : ''}`} aria-hidden="true">
                            {checked && (
                              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 14, fontWeight: checked ? 600 : 400, color: checked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{pt.label}</span>
                            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{pt.description}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
                {errors.patientTypes && <p className="form-error">{errors.patientTypes}</p>}
              </div>
            </div>
          )}

          {/* ── Payment tab ── */}
          {activeTab === 'payment' && (
            <div>
              {form.patientTypes.length === 0 ? (
                <div className="alert alert-warning">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span style={{ fontSize: 13 }}>Select at least one patient type in the General tab first.</span>
                </div>
              ) : (
                <div className="payment-panel">
                  <div className="tabs" style={{ padding: '0 4px' }}>
                    {PATIENT_TYPES.filter((pt) => form.patientTypes.includes(pt.id)).map((pt) => {
                      const activePtId = pricingTab ?? form.patientTypes[0];
                      return (
                        <button key={pt.id} type="button" className={`tab-item${activePtId === pt.id ? ' active' : ''}`} onClick={() => setPricingTab(pt.id)}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: TAB_COLOR[pt.id] }}>{pt.icon}</span>
                            {pt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="payment-panel-body">
                    {(() => {
                      const activePtId = pricingTab ?? form.patientTypes[0];
                      if (!activePtId || !form.patientTypes.includes(activePtId)) return null;

                      if (activePtId === 'self-pay') {
                        const ptPricing = form.pricing?.['self-pay'] ?? { method: 'none', amount: '', fallback: '' };
                        const setMethod = (method) => set('pricing', { ...form.pricing, 'self-pay': { ...ptPricing, method } });
                        const setAmount = (amount) => set('pricing', { ...form.pricing, 'self-pay': { ...ptPricing, amount } });
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {SELF_PAY_METHODS.map((m) => {
                              const selected = ptPricing.method === m.value;
                              return (
                                <div key={m.value} className={`pay-method-card${selected ? ' selected' : ''}`} onClick={() => setMethod(m.value)}>
                                  <div style={{ paddingTop: 2, flexShrink: 0 }}>
                                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${selected ? 'var(--brand)' : 'var(--border-strong)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      {selected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)' }} />}
                                    </div>
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <p className="pay-method-card-title">{m.label}</p>
                                    <p className="pay-method-card-desc">{m.desc}</p>
                                    {selected && m.value === 'specific' && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
                                        <label style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Amount: $</label>
                                        <input type="number" min={0} step={0.01} value={ptPricing.amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="input" style={{ width: 110, height: 34 }} autoFocus />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }

                      const statuses = activePtId === 'group-covered' ? GROUP_STATUSES : ELIGIBILITY_STATUSES;
                      const copayStatusId = COPAY_STATUS_ID[activePtId];
                      const ptPricing = form.pricing?.[activePtId] ?? DEFAULT_PT_PRICING[activePtId];
                      const accessConfig = activePtId === 'group-covered'
                        ? paymentConfig?.['group-covered']?.verificationAccess
                        : paymentConfig?.['insurance']?.eligibilityAccess;

                      const setStatusPricing = (statusId, patch) => {
                        const current = ptPricing?.[statusId] ?? DEFAULT_STATUS_PRICING;
                        set('pricing', { ...form.pricing, [activePtId]: { ...ptPricing, [statusId]: { ...current, ...patch } } });
                      };

                      return (
                        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                          {statuses.map((status, i) => {
                            const sc = ptPricing?.[status.id] ?? DEFAULT_STATUS_PRICING;
                            const blocked = (accessConfig?.[status.id]?.access ?? 'allow') === 'block';
                            return (
                              <div key={status.id} style={{ display: 'grid', gridTemplateColumns: '1fr 150px 1fr', padding: '10px 14px', gap: 12, alignItems: 'center', borderBottom: i < statuses.length - 1 ? '1px solid var(--border)' : 'none', background: blocked ? 'var(--grey-50)' : 'var(--surface)', opacity: blocked ? 0.6 : 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: status.dot, flexShrink: 0, display: 'inline-block' }} />
                                  <span style={{ fontSize: 13, fontWeight: 500, color: blocked ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{status.label}</span>
                                </div>
                                {blocked ? (
                                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Blocked in room settings</span>
                                ) : (
                                  <select value={sc.method} onChange={(e) => setStatusPricing(status.id, { method: e.target.value })} className="input" style={SELECT_STYLE}>
                                    <option value="none">No collection</option>
                                    {status.id === copayStatusId && <option value="copay">Collect copay</option>}
                                    <option value="specific">Specific amount</option>
                                  </select>
                                )}
                                {!blocked && sc.method === 'copay' && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>Fallback $</span>
                                    <input type="number" min={0} step={0.01} value={sc.fallback} onChange={(e) => setStatusPricing(status.id, { fallback: e.target.value })} placeholder="0.00" className="input" style={{ height: 34, minWidth: 0 }} />
                                  </div>
                                )}
                                {!blocked && sc.method === 'specific' && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>$</span>
                                    <input type="number" min={0} step={0.01} value={sc.amount} onChange={(e) => setStatusPricing(status.id, { amount: e.target.value })} placeholder="0.00" className="input" style={{ height: 34, minWidth: 0 }} />
                                  </div>
                                )}
                                {(blocked || sc.method === 'none') && <span />}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Intake Form tab ── */}
          {activeTab === 'intake' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Inherit toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--grey-100)', borderRadius: 'var(--r-md)' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>Use waiting room defaults</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Inherit the intake flow configuration from this waiting room</p>
                </div>
                <button
                  role="switch"
                  aria-checked={form.intakeInherited}
                  onClick={() => set('intakeInherited', !form.intakeInherited)}
                  className={`toggle${form.intakeInherited ? ' on' : ''}`}
                  aria-label="Use waiting room defaults for intake flow"
                >
                  <span className="toggle-track"><span className="toggle-thumb" /></span>
                </button>
              </div>

              {!form.intakeInherited && (
                <>
                  <div>
                    <p className="form-label" style={{ marginBottom: 4 }}>Standard Fields</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                      Choose which fields are included in the intake flow before this visit. Required fields must be completed before booking.
                    </p>
                    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                      {form.intakeFields.filter((f) => !f.custom).map((field, i, arr) => (
                        <div key={field.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', background: field.enabled ? 'var(--surface)' : 'var(--grey-50)', gap: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button
                              role="switch"
                              aria-checked={field.enabled}
                              onClick={() => setIntakeField(field.id, { enabled: !field.enabled })}
                              className={`toggle${field.enabled ? ' on' : ''}`}
                              aria-label={`Toggle ${field.label}`}
                            >
                              <span className="toggle-track"><span className="toggle-thumb" /></span>
                            </button>
                            <span style={{ fontSize: 13, fontWeight: 500, color: field.enabled ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{field.label}</span>
                          </div>
                          {field.enabled && (
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={() => setIntakeField(field.id, { required: !field.required })}
                              />
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Required</span>
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="form-label" style={{ marginBottom: 4 }}>Custom Questions</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                      Add additional questions specific to this visit type.
                    </p>
                    {form.intakeFields.filter((f) => f.custom).length > 0 && (
                      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden', marginBottom: 10 }}>
                        {form.intakeFields.filter((f) => f.custom).map((field, i, arr) => (
                          <div key={field.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', gap: 12 }}>
                            <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>{field.label}</span>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                              <input type="checkbox" checked={field.required} onChange={() => setIntakeField(field.id, { required: !field.required })} />
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Required</span>
                            </label>
                            <button onClick={() => removeField(field.id)} className="btn-icon danger" title="Remove" aria-label={`Remove ${field.label}`}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomQuestion(); } }}
                        placeholder="e.g. Do you have any previous surgeries?"
                        className="input"
                        style={{ flex: 1 }}
                      />
                      <button className="btn btn-secondary btn-sm" onClick={addCustomQuestion} disabled={!newQuestion.trim()}>
                        Add
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Visit Notes tab ── */}
          {activeTab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Inherit toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--grey-100)', borderRadius: 'var(--r-md)' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>Use waiting room defaults</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Inherit the notes template from this waiting room</p>
                </div>
                <button
                  role="switch"
                  aria-checked={form.notesInherited}
                  onClick={() => set('notesInherited', !form.notesInherited)}
                  className={`toggle${form.notesInherited ? ' on' : ''}`}
                  aria-label="Use waiting room defaults for visit notes"
                >
                  <span className="toggle-track"><span className="toggle-thumb" /></span>
                </button>
              </div>

              {!form.notesInherited && (
                <div>
                  <p className="form-label" style={{ marginBottom: 4 }}>Notes Template</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    Pre-populate the visit notes editor with this template when a visit of this type begins.
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    {[
                      { key: 'soap',     label: 'SOAP' },
                      { key: 'progress', label: 'Progress Note' },
                      { key: 'blank',    label: 'Blank' },
                    ].map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => set('notesTemplate', NOTES_PRESETS[preset.key])}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={form.notesTemplate}
                    onChange={(e) => set('notesTemplate', e.target.value)}
                    placeholder="Enter your visit notes template…"
                    className="input"
                    style={{ width: '100%', minHeight: 280, resize: 'vertical', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6, padding: '10px 12px' }}
                  />
                </div>
              )}
            </div>
          )}

        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
          <button onClick={handleSave} className="btn btn-primary btn-sm">
            {existing ? 'Save Changes' : 'Add Visit Option'}
          </button>
        </div>
      </div>
    </div>
  );
}
