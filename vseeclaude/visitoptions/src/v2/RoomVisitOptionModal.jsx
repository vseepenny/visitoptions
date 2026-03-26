import { useState, useEffect } from 'react';
import { DURATIONS, TYPES, MODES } from '../data/initialData';
import { PATIENT_TYPES } from '../components/PatientTypes';
import WorkflowCustomizer, { WorkflowPreview } from './WorkflowCustomizer';

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

/* ── Empty form state ────────────────────────────────────── */

const EMPTY = {
  name: '',
  duration: '30 min',
  type: '1:1',
  slots: 1,
  mode: 'Video',
  visible: true,
  patientTypes: [],
  specialties: [],
  pricing: { ...DEFAULT_PT_PRICING },
  notesTemplateId: null,    // null = use room visitDefaults
  workflowOverride: null,   // null = use clinic default intake flow
};

/* ── Component ───────────────────────────────────────────── */

export default function RoomVisitOptionModal({ existing, allowedPatientTypes, clinic, initialTab, onSave, onClose }) {
  const [form, setForm] = useState(existing ? {
    ...EMPTY, ...existing,
    notesTemplateId:  existing.notesTemplateId  ?? null,
    workflowOverride: existing.workflowOverride ?? null,
  } : { ...EMPTY, specialties: (clinic.specialties || []).map(s => s.id) });
  const [errors, setErrors]     = useState({});
  const [activeTab, setActiveTab] = useState(initialTab ?? 'general');
  const [pricingTab, setPricingTab] = useState(null);

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

  // Resolved template names for display
  const resolvedNotesId  = form.notesTemplateId  ?? clinic.defaultNotesTemplateId;
  const resolvedNotesName  = clinic.notesTemplates.find(t => t.id === resolvedNotesId)?.name ?? '—';

  const availableTypes = PATIENT_TYPES.filter((pt) => allowedPatientTypes.includes(pt.id));

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={existing ? 'Edit Visit Option' : 'Add Visit Option'}
    >
      <div className="modal-box" style={{ maxWidth: 900 }}>
        {/* Header */}
        <div className="modal-head">
          <h2>{existing ? 'Edit Visit Option' : 'Add Visit Option'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        {/* Tab bar */}
        <div className="tabs" style={{ padding: '0 24px', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
          {[
            { id: 'general',  label: 'General' },
            { id: 'workflow', label: 'Intake Flow' },
            { id: 'notes',    label: 'Visit Notes' },
          ].map((tab) => (
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
                  <label className="form-label">Duration</label>
                  <select value={form.duration} onChange={(e) => set('duration', e.target.value)} className="input">
                    {DURATIONS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Visit Mode</label>
                  <select value={form.mode} onChange={(e) => set('mode', e.target.value)} className="input">
                    {MODES.map((m) => <option key={m}>{m}</option>)}
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

              {/* Specialties */}
              {clinic.specialties?.length > 0 && (() => {
                const allIds = clinic.specialties.map(s => s.id);
                const allChecked = allIds.every(id => (form.specialties || []).includes(id));
                return (
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Specialties</label>
                    <button
                      type="button"
                      onClick={() => set('specialties', allChecked ? [] : [...allIds])}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 12, padding: '2px 8px', height: 'auto' }}
                    >
                      {allChecked ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Which provider specialties can see this visit option?</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {clinic.specialties.map((sp) => {
                      const checked = (form.specialties || []).includes(sp.id);
                      return (
                        <label
                          key={sp.id}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '6px 12px', borderRadius: 'var(--r-md)',
                            border: `1px solid ${checked ? 'var(--brand)' : 'var(--border)'}`,
                            background: checked ? 'var(--brand-light, rgba(13,135,92,0.08))' : 'var(--surface)',
                            cursor: 'pointer', fontSize: 13,
                            fontWeight: checked ? 600 : 400,
                            color: checked ? 'var(--brand)' : 'var(--text-secondary)',
                            transition: 'all 0.15s',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const cur = form.specialties || [];
                              set('specialties', checked ? cur.filter(s => s !== sp.id) : [...cur, sp.id]);
                            }}
                            style={{ display: 'none' }}
                          />
                          {sp.name}
                        </label>
                      );
                    })}
                  </div>
                  {(form.specialties || []).length === 0 && (
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>No specialties selected — visible to all providers.</p>
                  )}
                </div>
                );
              })()}

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

              {/* ── Per-patient-type pricing ── */}
              {form.patientTypes.length > 0 && (
                <div>
                  <label className="form-label" style={{ marginBottom: 8 }}>Payment Collection</label>
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
                        const paymentConfig = clinic.paymentConfig;
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
                                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Blocked in clinic settings</span>
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
                </div>
              )}
            </div>
          )}

          {/* ── Workflow tab ── */}
          {activeTab === 'workflow' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Use clinic default toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--grey-100)', borderRadius: 'var(--r-md)' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>Use clinic default intake flow</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Currently: <strong>{clinic.defaultWorkflow?.name || 'Not configured'}</strong>
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={form.workflowOverride === null}
                  onClick={() => set('workflowOverride', form.workflowOverride === null ? {
                    id: `wf_${Date.now()}`,
                    name: `${form.name || 'Visit'} Intake Flow`,
                    steps: clinic.defaultWorkflow?.steps ? JSON.parse(JSON.stringify(clinic.defaultWorkflow.steps)) : [],
                  } : null)}
                  className={`toggle${form.workflowOverride === null ? ' on' : ''}`}
                  aria-label="Use clinic default intake flow"
                >
                  <span className="toggle-track"><span className="toggle-thumb" /></span>
                </button>
              </div>

              {/* Preview of clinic default */}
              {form.workflowOverride === null && clinic.defaultWorkflow && (
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Clinic default intake flow:</p>
                  <div style={{ padding: 12, background: 'var(--grey-100)', borderRadius: 'var(--r-md)', opacity: 0.75 }}>
                    <WorkflowPreview workflow={clinic.defaultWorkflow} />
                  </div>
                </div>
              )}

              {/* Custom workflow editor */}
              {form.workflowOverride !== null && (
                <WorkflowCustomizer
                  workflow={form.workflowOverride}
                  onChange={wf => set('workflowOverride', wf)}
                  clinic={clinic}
                />
              )}
            </div>
          )}

          {/* ── Visit Notes tab ── */}
          {activeTab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Use clinic default toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--grey-100)', borderRadius: 'var(--r-md)' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>Use clinic default</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Currently: <strong>{clinic.defaultNotesTemplateId
                      ? (clinic.notesTemplates.find(t => t.id === clinic.defaultNotesTemplateId)?.name ?? '—')
                      : 'None set'
                    }</strong>
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={form.notesTemplateId === null}
                  onClick={() => set('notesTemplateId', form.notesTemplateId === null ? (clinic.defaultNotesTemplateId ?? '') : null)}
                  className={`toggle${form.notesTemplateId === null ? ' on' : ''}`}
                  aria-label="Use clinic default notes template"
                >
                  <span className="toggle-track"><span className="toggle-thumb" /></span>
                </button>
              </div>

              {form.notesTemplateId !== null && (
                <div className="form-group">
                  <label className="form-label">Select Notes Template</label>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    Choose a specific clinic template for this visit option.
                  </p>
                  <select
                    value={form.notesTemplateId ?? ''}
                    onChange={e => set('notesTemplateId', e.target.value || null)}
                    className="input"
                    style={{ maxWidth: 320, marginBottom: 12 }}
                  >
                    <option value="">— None —</option>
                    {clinic.notesTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>

                  {form.notesTemplateId && (() => {
                    const preview = clinic.notesTemplates.find(t => t.id === form.notesTemplateId);
                    if (!preview) return null;
                    return (
                      <textarea readOnly value={preview.content} className="input" style={{ width: '100%', minHeight: 160, fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6, padding: '10px 12px', background: 'var(--grey-50)', resize: 'none' }} />
                    );
                  })()}
                </div>
              )}

              {form.notesTemplateId === null && resolvedNotesId && (() => {
                const preview = clinic.notesTemplates.find(t => t.id === resolvedNotesId);
                if (!preview) return null;
                return (
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Preview of <strong>{resolvedNotesName}</strong> (clinic default):</p>
                    <textarea readOnly value={preview.content} className="input" style={{ width: '100%', minHeight: 160, fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6, padding: '10px 12px', background: 'var(--grey-50)', resize: 'none', opacity: 0.75 }} />
                  </div>
                );
              })()}
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
