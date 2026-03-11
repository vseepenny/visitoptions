import { useState, useEffect } from 'react';
import { DURATIONS, MODES, TYPES } from '../data/initialData';
import { resolveVisitOption } from '../data/initialDataV2';

const PT_TYPE_LABELS = { 'self-pay': 'Self-Pay', 'group-covered': 'Group-Covered', 'insurance': 'Insurance' };
const PT_TYPE_COLORS = { 'self-pay': 'var(--info)', 'group-covered': 'var(--text-secondary)', 'insurance': 'var(--success)' };
const PT_BADGES = {
  'self-pay':      { cls: 'badge badge-info',    label: 'Self-Pay' },
  'group-covered': { cls: 'badge badge-neutral',  label: 'Group'    },
  'insurance':     { cls: 'badge badge-success',  label: 'Insurance'},
};

const ELIGIBILITY_STATUSES = [
  { id: 'eligible',     label: 'Eligible',       dot: 'var(--success)' },
  { id: 'not_eligible', label: 'Not Eligible',    dot: 'var(--danger)'  },
  { id: 'pending',      label: 'Pending',         dot: 'var(--warning)' },
  { id: 'error',        label: 'Error / Unknown', dot: 'var(--grey-400)'},
];
const GROUP_STATUSES = [
  { id: 'verified',     label: 'Verified',       dot: 'var(--success)' },
  { id: 'not_verified', label: 'Not Verified',    dot: 'var(--danger)'  },
  { id: 'pending',      label: 'Pending',         dot: 'var(--warning)' },
  { id: 'error',        label: 'Error / Unknown', dot: 'var(--grey-400)'},
];
const COPAY_STATUS_ID = { 'group-covered': 'verified', 'insurance': 'eligible' };

/* ── Inherit / Override row ───────────────────────────────── */

function InheritRow({ label, inheritedDisplay, isOverridden, onToggle, children }) {
  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isOverridden ? 10 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 110, color: 'var(--text-primary)' }}>{label}</span>
          {!isOverridden && (
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{inheritedDisplay}</span>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          style={{
            fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 'var(--r-sm)',
            border: `1px solid ${isOverridden ? 'var(--danger)' : 'var(--border-strong)'}`,
            background: isOverridden ? 'var(--danger-light)' : 'white',
            color: isOverridden ? 'var(--danger)' : 'var(--text-secondary)',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          {isOverridden ? '✕ Use template' : 'Override'}
        </button>
      </div>
      {isOverridden && children}
    </div>
  );
}

/* ── Component ────────────────────────────────────────────── */

export default function RoomVisitOptionModal({ item, templates, allowedPatientTypes, onSave, onClose }) {
  const tmpl = templates.visitOptionTemplates.find(t => t.id === item.templateId);
  const resolved = resolveVisitOption(item, templates);

  const [overrides, setOverrides] = useState({ ...(item.overrides ?? {}) });
  const [activeTab, setActiveTab] = useState('general');
  const [pricingPtTab, setPricingPtTab] = useState(null);
  const [patientTypes, setPatientTypes] = useState(item.patientTypes ?? allowedPatientTypes);
  const [visible, setVisible] = useState(item.visible);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', handler); };
  }, [onClose]);

  const setOv = (key, value) => setOverrides(ov => ({ ...ov, [key]: value }));
  const clearOv = (key) => setOverrides(ov => { const next = { ...ov }; delete next[key]; return next; });

  const isOv = (key) => key in overrides;

  const handleSave = () => {
    onSave({ ...item, visible, patientTypes, overrides });
  };

  const overrideCount = Object.keys(overrides).length;

  const activePtId = pricingPtTab ?? item.patientTypes?.[0];

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-modal="true">
      <div className="modal-box" style={{ maxWidth: 740 }}>

        {/* Header */}
        <div className="modal-head">
          <div>
            <h2 style={{ marginBottom: 4 }}>{resolved.name}</h2>
            {tmpl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="9" height="9" viewBox="0 0 12 12" fill="var(--brand)"><polygon points="6,0 12,12 0,12" /></svg>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Template: <strong style={{ color: 'var(--brand)' }}>{tmpl.name}</strong></span>
                {overrideCount > 0 && (
                  <span style={{ fontSize: 11, padding: '1px 8px', background: 'var(--warning-light)', color: '#92400E', borderRadius: 'var(--r-full)', fontWeight: 600, border: '1px solid #FDE68A', marginLeft: 4 }}>
                    {overrideCount} override{overrideCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ padding: '0 24px', borderBottom: '1px solid var(--border)' }}>
          {[{ id: 'general', label: 'General' }, { id: 'payment', label: 'Payment' }, { id: 'intake', label: 'Intake Form' }, { id: 'notes', label: 'Visit Notes' }].map(tab => (
            <button key={tab.id} type="button" className={`tab-item${activeTab === tab.id ? ' active' : ''}`} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
          ))}
        </div>

        <div className="modal-content">

          {/* ── General tab ── */}
          {activeTab === 'general' && (
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Fields showing <strong>Override</strong> button will use the template value. Click <strong>Override</strong> to customise for this room.
              </p>

              <InheritRow
                label="Duration"
                inheritedDisplay={resolved.duration}
                isOverridden={isOv('duration')}
                onToggle={() => isOv('duration') ? clearOv('duration') : setOv('duration', resolved.duration)}
              >
                <select value={overrides.duration} onChange={e => setOv('duration', e.target.value)} className="input" style={{ maxWidth: 180 }}>
                  {DURATIONS.map(d => <option key={d}>{d}</option>)}
                </select>
              </InheritRow>

              <InheritRow
                label="Visit Mode"
                inheritedDisplay={resolved.mode}
                isOverridden={isOv('mode')}
                onToggle={() => isOv('mode') ? clearOv('mode') : setOv('mode', resolved.mode)}
              >
                <select value={overrides.mode} onChange={e => setOv('mode', e.target.value)} className="input" style={{ maxWidth: 180 }}>
                  {MODES.map(m => <option key={m}>{m}</option>)}
                </select>
              </InheritRow>

              <InheritRow
                label="Session Type"
                inheritedDisplay={`${resolved.type}${resolved.type === 'Group' ? ` · ${resolved.slots} slots` : ''}`}
                isOverridden={isOv('type')}
                onToggle={() => isOv('type') ? clearOv('type') : setOv('type', resolved.type)}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select value={overrides.type ?? resolved.type} onChange={e => setOv('type', e.target.value)} className="input" style={{ maxWidth: 120 }}>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  {(overrides.type ?? resolved.type) === 'Group' && (
                    <input type="number" min={2} max={99} value={overrides.slots ?? resolved.slots} onChange={e => setOv('slots', parseInt(e.target.value, 10) || 2)} className="input" style={{ width: 80 }} placeholder="Slots" />
                  )}
                </div>
              </InheritRow>

              {/* Visible and Patient Types are always room-specific */}
              <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>Visible to Patients</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Show this option in the patient booking flow for this room</p>
                  </div>
                  <button role="switch" aria-checked={visible} onClick={() => setVisible(v => !v)} className={`toggle${visible ? ' on' : ''}`} aria-label="Toggle visibility">
                    <span className="toggle-track"><span className="toggle-thumb" /></span>
                  </button>
                </div>
              </div>

              <div style={{ padding: '12px 0' }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Patient Types <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-tertiary)' }}>(room-specific)</span></p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {allowedPatientTypes.map(pt => {
                    const checked = patientTypes.includes(pt);
                    return (
                      <label key={pt} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 12px', borderRadius: 'var(--r-md)', border: `1px solid ${checked ? 'var(--brand)' : 'var(--border)'}`, background: checked ? 'var(--brand-50)' : 'white' }}>
                        <input type="checkbox" checked={checked} onChange={() => setPatientTypes(prev => checked ? prev.filter(t => t !== pt) : [...prev, pt])} style={{ display: 'none' }} />
                        <div className={`ds-checkbox${checked ? ' checked' : ''}`} aria-hidden="true">
                          {checked && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: checked ? 600 : 400, color: checked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{PT_TYPE_LABELS[pt]}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Payment tab ── */}
          {activeTab === 'payment' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--grey-100)', borderRadius: 'var(--r-md)', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>Use template pricing</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Inherit default pricing from the visit option template</p>
                </div>
                <button
                  role="switch"
                  aria-checked={!isOv('pricing')}
                  onClick={() => isOv('pricing') ? clearOv('pricing') : setOv('pricing', { ...(resolved.pricing ?? {}) })}
                  className={`toggle${!isOv('pricing') ? ' on' : ''}`}
                  aria-label="Use template pricing"
                >
                  <span className="toggle-track"><span className="toggle-thumb" /></span>
                </button>
              </div>

              {isOv('pricing') && (
                <div className="payment-panel">
                  <div className="tabs" style={{ padding: '0 4px' }}>
                    {patientTypes.map(pt => (
                      <button key={pt} type="button" className={`tab-item${activePtId === pt ? ' active' : ''}`} onClick={() => setPricingPtTab(pt)}>
                        <span style={{ color: PT_TYPE_COLORS[pt] }}>{PT_TYPE_LABELS[pt]}</span>
                      </button>
                    ))}
                  </div>
                  <div className="payment-panel-body">
                    {activePtId === 'self-pay' && (() => {
                      const sp = overrides.pricing?.['self-pay'] ?? resolved.pricing?.['self-pay'] ?? { method: 'none', amount: '' };
                      const setPricing = (patch) => setOv('pricing', { ...(overrides.pricing ?? {}), 'self-pay': { ...sp, ...patch } });
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {[{ value: 'none', label: 'No collection required', desc: 'No payment at booking.' }, { value: 'specific', label: 'Collect specific amount', desc: 'Charge a fixed dollar amount.' }].map(m => {
                            const sel = sp.method === m.value;
                            return (
                              <div key={m.value} className={`pay-method-card${sel ? ' selected' : ''}`} onClick={() => setPricing({ method: m.value })}>
                                <div style={{ paddingTop: 2, flexShrink: 0 }}>
                                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${sel ? 'var(--brand)' : 'var(--border-strong)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {sel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)' }} />}
                                  </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontSize: 14, fontWeight: 600 }}>{m.label}</p>
                                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{m.desc}</p>
                                  {sel && m.value === 'specific' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }} onClick={e => e.stopPropagation()}>
                                      <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Amount: $</label>
                                      <input type="number" min={0} step={0.01} value={sp.amount} onChange={e => setPricing({ amount: e.target.value })} placeholder="0.00" className="input" style={{ width: 110, height: 34 }} autoFocus />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {(activePtId === 'group-covered' || activePtId === 'insurance') && (() => {
                      const statuses = activePtId === 'group-covered' ? GROUP_STATUSES : ELIGIBILITY_STATUSES;
                      const copayId = COPAY_STATUS_ID[activePtId];
                      const ptPricing = overrides.pricing?.[activePtId] ?? resolved.pricing?.[activePtId] ?? {};
                      const setRow = (statusId, patch) => {
                        const current = ptPricing?.[statusId] ?? { method: 'none', amount: '', fallback: '' };
                        setOv('pricing', { ...(overrides.pricing ?? {}), [activePtId]: { ...ptPricing, [statusId]: { ...current, ...patch } } });
                      };
                      return (
                        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                          {statuses.map((status, i) => {
                            const sc = ptPricing?.[status.id] ?? { method: 'none', amount: '', fallback: '' };
                            return (
                              <div key={status.id} style={{ display: 'grid', gridTemplateColumns: '1fr 150px 1fr', padding: '10px 14px', gap: 12, alignItems: 'center', borderBottom: i < statuses.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: status.dot, flexShrink: 0, display: 'inline-block' }} />
                                  <span style={{ fontSize: 13, fontWeight: 500 }}>{status.label}</span>
                                </div>
                                <select value={sc.method} onChange={e => setRow(status.id, { method: e.target.value })} className="input" style={{ height: 34, padding: '0 8px', fontSize: 13 }}>
                                  <option value="none">No collection</option>
                                  {status.id === copayId && <option value="copay">Collect copay</option>}
                                  <option value="specific">Specific amount</option>
                                </select>
                                {sc.method === 'copay' && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>Fallback $</span>
                                    <input type="number" min={0} step={0.01} value={sc.fallback} onChange={e => setRow(status.id, { fallback: e.target.value })} placeholder="0.00" className="input" style={{ height: 34, minWidth: 0 }} />
                                  </div>
                                )}
                                {sc.method === 'specific' && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>$</span>
                                    <input type="number" min={0} step={0.01} value={sc.amount} onChange={e => setRow(status.id, { amount: e.target.value })} placeholder="0.00" className="input" style={{ height: 34, minWidth: 0 }} />
                                  </div>
                                )}
                                {sc.method === 'none' && <span />}
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
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--grey-100)', borderRadius: 'var(--r-md)', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>Use template intake form</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Inheriting from: <strong>{templates.intakeTemplates.find(t => t.id === resolved.intakeTemplateId)?.name ?? '—'}</strong>
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={!isOv('intakeTemplateId')}
                  onClick={() => isOv('intakeTemplateId') ? clearOv('intakeTemplateId') : setOv('intakeTemplateId', resolved.intakeTemplateId)}
                  className={`toggle${!isOv('intakeTemplateId') ? ' on' : ''}`}
                  aria-label="Use template intake form"
                >
                  <span className="toggle-track"><span className="toggle-thumb" /></span>
                </button>
              </div>
              {isOv('intakeTemplateId') && (
                <div className="form-group">
                  <label className="form-label">Intake Form Template</label>
                  <select value={overrides.intakeTemplateId ?? ''} onChange={e => setOv('intakeTemplateId', e.target.value)} className="input" style={{ maxWidth: 280, marginBottom: 12 }}>
                    <option value="">— None —</option>
                    {templates.intakeTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  {overrides.intakeTemplateId && (() => {
                    const preview = templates.intakeTemplates.find(t => t.id === overrides.intakeTemplateId);
                    if (!preview) return null;
                    return (
                      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                        {preview.fields.map((f, i) => (
                          <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: i < preview.fields.length - 1 ? '1px solid var(--border)' : 'none', background: f.enabled ? 'var(--surface)' : 'var(--grey-50)' }}>
                            <span style={{ fontSize: 13, color: f.enabled ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{f.label}</span>
                            {f.enabled && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{f.required ? 'Required' : 'Optional'}</span>}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* ── Visit Notes tab ── */}
          {activeTab === 'notes' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--grey-100)', borderRadius: 'var(--r-md)', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>Use template notes</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Inheriting from: <strong>{templates.notesTemplates.find(t => t.id === resolved.notesTemplateId)?.name ?? '—'}</strong>
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={!isOv('notesTemplateId')}
                  onClick={() => isOv('notesTemplateId') ? clearOv('notesTemplateId') : setOv('notesTemplateId', resolved.notesTemplateId)}
                  className={`toggle${!isOv('notesTemplateId') ? ' on' : ''}`}
                  aria-label="Use template notes"
                >
                  <span className="toggle-track"><span className="toggle-thumb" /></span>
                </button>
              </div>
              {isOv('notesTemplateId') && (
                <div className="form-group">
                  <label className="form-label">Notes Template</label>
                  <select value={overrides.notesTemplateId ?? ''} onChange={e => setOv('notesTemplateId', e.target.value)} className="input" style={{ maxWidth: 280, marginBottom: 12 }}>
                    <option value="">— None —</option>
                    {templates.notesTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  {overrides.notesTemplateId && (() => {
                    const preview = templates.notesTemplates.find(t => t.id === overrides.notesTemplateId);
                    if (!preview) return null;
                    return (
                      <textarea readOnly value={preview.content} className="input" style={{ width: '100%', minHeight: 180, fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6, padding: '10px 12px', background: 'var(--grey-50)', resize: 'none' }} />
                    );
                  })()}
                </div>
              )}
            </div>
          )}

        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
          <button onClick={handleSave} className="btn btn-primary btn-sm">Save Changes</button>
        </div>
      </div>
    </div>
  );
}
