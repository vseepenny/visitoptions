import { useState } from 'react';
import PaymentSettings from '../components/PaymentSettings';
import { DURATIONS, MODES, TYPES, NOTES_PRESETS } from '../data/initialData';

const PT_TYPE_LABELS = { 'self-pay': 'Self-Pay', 'group-covered': 'Group-Covered', 'insurance': 'Insurance' };
const PT_TYPE_COLORS = { 'self-pay': 'var(--info)', 'group-covered': 'var(--text-secondary)', 'insurance': 'var(--success)' };

const DEFAULT_PRICING = {
  'self-pay':      { method: 'specific', amount: '', fallback: '' },
  'group-covered': {
    verified:     { method: 'copay',    amount: '', fallback: '' },
    not_verified: { method: 'none',     amount: '', fallback: '' },
    pending:      { method: 'none',     amount: '', fallback: '' },
    error:        { method: 'none',     amount: '', fallback: '' },
  },
  'insurance': {
    eligible:     { method: 'copay',    amount: '', fallback: '' },
    not_eligible: { method: 'none',     amount: '', fallback: '' },
    pending:      { method: 'none',     amount: '', fallback: '' },
    error:        { method: 'none',     amount: '', fallback: '' },
  },
};

/* ── Visit Option Template Editor ─────────────────────────── */

const PRICING_STATUSES = {
  'group-covered': [
    { id: 'verified',     label: 'Verified',       dot: 'var(--success)' },
    { id: 'not_verified', label: 'Not Verified',    dot: 'var(--danger)'  },
    { id: 'pending',      label: 'Pending',         dot: 'var(--warning)' },
    { id: 'error',        label: 'Error / Unknown', dot: 'var(--grey-400)' },
  ],
  'insurance': [
    { id: 'eligible',     label: 'Eligible',       dot: 'var(--success)' },
    { id: 'not_eligible', label: 'Not Eligible',    dot: 'var(--danger)'  },
    { id: 'pending',      label: 'Pending',         dot: 'var(--warning)' },
    { id: 'error',        label: 'Error / Unknown', dot: 'var(--grey-400)' },
  ],
};
const COPAY_STATUS = { 'group-covered': 'verified', 'insurance': 'eligible' };

function VisitOptionTemplateEditor({ tmpl, intakeTemplates, notesTemplates, onSave, onCancel }) {
  const [form, setForm] = useState({ ...tmpl });
  const [pricingPtTab, setPricingPtTab] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const patientTypes = Object.keys(form.defaultPricing ?? {});
  const activePtId = pricingPtTab ?? patientTypes[0];

  const setPricingRow = (ptId, statusId, patch) => {
    const current = form.defaultPricing?.[ptId]?.[statusId] ?? { method: 'none', amount: '', fallback: '' };
    set('defaultPricing', {
      ...form.defaultPricing,
      [ptId]: { ...(form.defaultPricing?.[ptId] ?? {}), [statusId]: { ...current, ...patch } },
    });
  };

  return (
    <div style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-light)', borderRadius: 'var(--r-lg)', padding: 20, marginTop: 8 }}>
      {/* Tab bar */}
      <div className="tabs" style={{ marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {[{ id: 'general', label: 'General' }, { id: 'pricing', label: 'Default Pricing' }, { id: 'intake', label: 'Intake Form' }, { id: 'notes', label: 'Notes Template' }].map(tab => (
          <button key={tab.id} type="button" className={`tab-item${activeTab === tab.id ? ' active' : ''}`} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
        ))}
      </div>

      {/* General */}
      {activeTab === 'general' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Template Name <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className="input" placeholder="e.g. New Patient Consult" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Duration</label>
              <select value={form.duration} onChange={e => set('duration', e.target.value)} className="input">
                {DURATIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Session Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} className="input">
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Visit Mode</label>
              <select value={form.mode} onChange={e => set('mode', e.target.value)} className="input">
                {MODES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Max Slots</label>
              <input type="number" min={1} max={99} value={form.slots} onChange={e => set('slots', parseInt(e.target.value, 10) || 1)} className="input" disabled={form.type === '1:1'} />
            </div>
          </div>
        </div>
      )}

      {/* Pricing */}
      {activeTab === 'pricing' && (
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Set default pricing per patient type. Rooms can override these values for their specific context.
          </p>
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
                const sp = form.defaultPricing?.['self-pay'] ?? { method: 'none', amount: '' };
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { value: 'none',     label: 'No collection required',  desc: 'No payment collected at booking.' },
                      { value: 'specific', label: 'Collect specific amount', desc: 'Charge a fixed dollar amount.' },
                    ].map(m => {
                      const sel = sp.method === m.value;
                      return (
                        <div key={m.value} className={`pay-method-card${sel ? ' selected' : ''}`} onClick={() => set('defaultPricing', { ...form.defaultPricing, 'self-pay': { ...sp, method: m.value } })}>
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
                                <input type="number" min={0} step={0.01} value={sp.amount} onChange={e => set('defaultPricing', { ...form.defaultPricing, 'self-pay': { ...sp, amount: e.target.value } })} placeholder="0.00" className="input" style={{ width: 110, height: 34 }} />
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
                const statuses = PRICING_STATUSES[activePtId];
                const ptPricing = form.defaultPricing?.[activePtId] ?? {};
                const copayId = COPAY_STATUS[activePtId];
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
                          <select value={sc.method} onChange={e => setPricingRow(activePtId, status.id, { method: e.target.value })} className="input" style={{ height: 34, padding: '0 8px', fontSize: 13 }}>
                            <option value="none">No collection</option>
                            {status.id === copayId && <option value="copay">Collect copay</option>}
                            <option value="specific">Specific amount</option>
                          </select>
                          {sc.method === 'copay' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>Fallback $</span>
                              <input type="number" min={0} step={0.01} value={sc.fallback} onChange={e => setPricingRow(activePtId, status.id, { fallback: e.target.value })} placeholder="0.00" className="input" style={{ height: 34, minWidth: 0 }} />
                            </div>
                          )}
                          {sc.method === 'specific' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>$</span>
                              <input type="number" min={0} step={0.01} value={sc.amount} onChange={e => setPricingRow(activePtId, status.id, { amount: e.target.value })} placeholder="0.00" className="input" style={{ height: 34, minWidth: 0 }} />
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
        </div>
      )}

      {/* Intake Form */}
      {activeTab === 'intake' && (
        <div className="form-group">
          <label className="form-label">Default Intake Form Template</label>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Which intake template patients see by default for this visit type. Rooms can override this.</p>
          <select value={form.defaultIntakeTemplateId ?? ''} onChange={e => set('defaultIntakeTemplateId', e.target.value)} className="input" style={{ maxWidth: 320 }}>
            <option value="">— None —</option>
            {intakeTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          {form.defaultIntakeTemplateId && (() => {
            const preview = intakeTemplates.find(t => t.id === form.defaultIntakeTemplateId);
            if (!preview) return null;
            return (
              <div style={{ marginTop: 12, border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden', opacity: 0.8 }}>
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

      {/* Notes Template */}
      {activeTab === 'notes' && (
        <div className="form-group">
          <label className="form-label">Default Notes Template</label>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Which notes template to pre-populate for this visit type. Rooms can override this.</p>
          <select value={form.defaultNotesTemplateId ?? ''} onChange={e => set('defaultNotesTemplateId', e.target.value)} className="input" style={{ maxWidth: 320, marginBottom: 12 }}>
            <option value="">— None —</option>
            {notesTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          {form.defaultNotesTemplateId && (() => {
            const preview = notesTemplates.find(t => t.id === form.defaultNotesTemplateId);
            if (!preview) return null;
            return (
              <textarea readOnly value={preview.content} className="input" style={{ width: '100%', minHeight: 160, fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6, padding: '10px 12px', background: 'var(--grey-50)', resize: 'none' }} />
            );
          })()}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button onClick={onCancel} className="btn btn-ghost btn-sm">Cancel</button>
        <button onClick={() => onSave(form)} className="btn btn-primary btn-sm" disabled={!form.name?.trim()}>Save Template</button>
      </div>
    </div>
  );
}

/* ── Intake Template Editor ───────────────────────────────── */

function IntakeTemplateEditor({ tmpl, onSave, onCancel }) {
  const [form, setForm] = useState({ ...tmpl, fields: tmpl.fields.map(f => ({ ...f })) });

  const setField = (id, patch) =>
    setForm(f => ({ ...f, fields: f.fields.map(field => field.id === id ? { ...field, ...patch } : field) }));

  return (
    <div style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-light)', borderRadius: 'var(--r-lg)', padding: 20, marginTop: 8 }}>
      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label">Template Name</label>
        <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" style={{ maxWidth: 320 }} />
      </div>
      <p className="form-label" style={{ marginBottom: 8 }}>Fields</p>
      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden', marginBottom: 16 }}>
        {form.fields.map((field, i, arr) => (
          <div key={field.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', background: field.enabled ? 'var(--surface)' : 'var(--grey-50)', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button role="switch" aria-checked={field.enabled} onClick={() => setField(field.id, { enabled: !field.enabled })} className={`toggle${field.enabled ? ' on' : ''}`} aria-label={`Toggle ${field.label}`}>
                <span className="toggle-track"><span className="toggle-thumb" /></span>
              </button>
              <span style={{ fontSize: 13, fontWeight: 500, color: field.enabled ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{field.label}</span>
            </div>
            {field.enabled && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={field.required} onChange={() => setField(field.id, { required: !field.required })} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Required</span>
              </label>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onCancel} className="btn btn-ghost btn-sm">Cancel</button>
        <button onClick={() => onSave(form)} className="btn btn-primary btn-sm" disabled={!form.name?.trim()}>Save Template</button>
      </div>
    </div>
  );
}

/* ── Notes Template Editor ────────────────────────────────── */

function NotesTemplateEditor({ tmpl, onSave, onCancel }) {
  const [form, setForm] = useState({ ...tmpl });
  return (
    <div style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-light)', borderRadius: 'var(--r-lg)', padding: 20, marginTop: 8 }}>
      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label">Template Name</label>
        <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" style={{ maxWidth: 320 }} />
      </div>
      <div className="form-group">
        <label className="form-label">Content</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {[{ key: 'soap', label: 'SOAP' }, { key: 'progress', label: 'Progress Note' }, { key: 'blank', label: 'Blank' }].map(p => (
            <button key={p.key} type="button" className="btn btn-ghost btn-sm" onClick={() => setForm(f => ({ ...f, content: NOTES_PRESETS[p.key] }))}>{p.label}</button>
          ))}
        </div>
        <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="input" style={{ width: '100%', minHeight: 200, fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6, padding: '10px 12px', resize: 'vertical' }} placeholder="Enter template content…" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button onClick={onCancel} className="btn btn-ghost btn-sm">Cancel</button>
        <button onClick={() => onSave(form)} className="btn btn-primary btn-sm" disabled={!form.name?.trim()}>Save Template</button>
      </div>
    </div>
  );
}

/* ── Payment Profile Editor ───────────────────────────────── */

function PaymentProfileEditor({ profile, onSave, onCancel }) {
  const [form, setForm] = useState({ ...profile });
  return (
    <div style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-light)', borderRadius: 'var(--r-lg)', padding: 20, marginTop: 8 }}>
      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label">Profile Name</label>
        <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" style={{ maxWidth: 320 }} />
      </div>
      <PaymentSettings
        enabledTypes={[form.type]}
        config={{ [form.type]: form.config }}
        onChange={newConfig => setForm(f => ({ ...f, config: newConfig[f.type] }))}
        noHeader
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button onClick={onCancel} className="btn btn-ghost btn-sm">Cancel</button>
        <button onClick={() => onSave(form)} className="btn btn-primary btn-sm" disabled={!form.name?.trim()}>Save Profile</button>
      </div>
    </div>
  );
}

/* ── Generic Template List ────────────────────────────────── */

function TemplateList({ items, entityKey, editingId, onEdit, onDelete, renderMeta, renderEditor }) {
  return (
    <div>
      {items.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 24px' }}>
          <p className="empty-state-title">No templates yet</p>
          <p className="empty-state-desc">Create your first template to share across rooms.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(item => (
            <div key={item.id}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', border: `1px solid ${editingId === item.id ? 'var(--brand)' : 'var(--border)'}`, borderRadius: editingId === item.id ? 'var(--r-lg) var(--r-lg) 0 0' : 'var(--r-lg)', background: editingId === item.id ? 'var(--brand-50)' : 'white', transition: 'all 150ms' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</p>
                  {renderMeta?.(item)}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => onEdit(item.id)} className="btn btn-ghost btn-sm">
                    {editingId === item.id ? 'Close' : 'Edit'}
                  </button>
                  <button onClick={() => onDelete(item.id)} className="btn-icon danger" title="Delete" aria-label={`Delete ${item.name}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              </div>
              {editingId === item.id && renderEditor(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────── */

export default function ClinicTemplatesPage({ templates, onChange }) {
  const [activeTab, setActiveTab] = useState('visitOptions');
  const [editingId, setEditingId] = useState(null);

  const toggleEdit = (id) => setEditingId(prev => prev === id ? null : id);

  const updateList = (key, updatedItem) =>
    onChange({ ...templates, [key]: templates[key].map(t => t.id === updatedItem.id ? updatedItem : t) });

  const deleteItem = (key, id) => {
    if (window.confirm('Delete this template? Rooms referencing it will lose the link.')) {
      onChange({ ...templates, [key]: templates[key].filter(t => t.id !== id) });
      if (editingId === id) setEditingId(null);
    }
  };

  const newItem = (key, defaults) => {
    const id = `${key}_${Date.now()}`;
    const item = { id, ...defaults };
    onChange({ ...templates, [key]: [...templates[key], item] });
    setEditingId(id);
  };

  const TABS = [
    { id: 'visitOptions',   label: 'Visit Options'    },
    { id: 'payment',        label: 'Payment Profiles' },
    { id: 'intake',         label: 'Intake Forms'     },
    { id: 'notes',          label: 'Notes Templates'  },
  ];

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 24px 80px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: 4 }}>Clinic Templates</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Define reusable templates for your clinic. Waiting rooms reference these by ID — update a template once to affect all rooms using it.</p>
      </div>

      <div className="panel">
        <div className="tabs" style={{ padding: '0 24px', borderBottom: '1px solid var(--border)' }}>
          {TABS.map(tab => (
            <button key={tab.id} type="button" className={`tab-item${activeTab === tab.id ? ' active' : ''}`} onClick={() => { setActiveTab(tab.id); setEditingId(null); }}>{tab.label}</button>
          ))}
        </div>

        <div style={{ padding: 24 }}>

          {/* ── Visit Options tab ── */}
          {activeTab === 'visitOptions' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {templates.visitOptionTemplates.length} template{templates.visitOptionTemplates.length !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={() => newItem('visitOptionTemplates', { name: '', duration: '30 min', type: '1:1', slots: 1, mode: 'Video', defaultIntakeTemplateId: templates.intakeTemplates[0]?.id ?? '', defaultNotesTemplateId: templates.notesTemplates[0]?.id ?? '', defaultPricing: { ...DEFAULT_PRICING } })}
                  className="btn btn-secondary btn-sm"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                  New Template
                </button>
              </div>
              <TemplateList
                items={templates.visitOptionTemplates}
                entityKey="visitOptionTemplates"
                editingId={editingId}
                onEdit={toggleEdit}
                onDelete={id => deleteItem('visitOptionTemplates', id)}
                renderMeta={item => (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{item.duration}</span>
                    <span style={{ color: 'var(--grey-400)' }}>·</span>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{item.mode}</span>
                    <span style={{ color: 'var(--grey-400)' }}>·</span>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{item.type}</span>
                  </div>
                )}
                renderEditor={item => (
                  <VisitOptionTemplateEditor
                    tmpl={item}
                    intakeTemplates={templates.intakeTemplates}
                    notesTemplates={templates.notesTemplates}
                    onSave={updated => { updateList('visitOptionTemplates', updated); setEditingId(null); }}
                    onCancel={() => setEditingId(null)}
                  />
                )}
              />
            </>
          )}

          {/* ── Payment Profiles tab ── */}
          {activeTab === 'payment' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Payment profiles are typed per patient category. Create separate profiles for Self-Pay, Group-Covered, and Insurance configurations.
                </p>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {['self-pay', 'group-covered', 'insurance'].map(type => (
                    <button
                      key={type}
                      onClick={() => newItem('paymentProfiles', { name: '', type, config: type === 'self-pay' ? { acceptPayments: true, processor: 'stripe', stripeConnected: false, timing: 'before', defaultPrice: '', noShowFee: { enabled: false, amount: '' } } : type === 'group-covered' ? { requireGroupId: false, requireReferral: false, verificationAccess: { verified: { access: 'allow' }, not_verified: { access: 'block' }, pending: { access: 'review' }, error: { access: 'review' } } } : { eligibilityAccess: { eligible: { access: 'allow' }, not_eligible: { access: 'block' }, pending: { access: 'review' }, error: { access: 'review' } } } })}
                      className="btn btn-ghost btn-sm"
                    >
                      + {PT_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>
              <TemplateList
                items={templates.paymentProfiles}
                entityKey="paymentProfiles"
                editingId={editingId}
                onEdit={toggleEdit}
                onDelete={id => deleteItem('paymentProfiles', id)}
                renderMeta={item => (
                  <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 'var(--r-full)', background: item.type === 'self-pay' ? 'var(--info-light)' : item.type === 'group-covered' ? 'var(--grey-200)' : 'var(--success-light)', color: item.type === 'self-pay' ? '#075985' : item.type === 'group-covered' ? 'var(--grey-700)' : '#065F46', fontWeight: 600 }}>
                    {PT_TYPE_LABELS[item.type]}
                  </span>
                )}
                renderEditor={item => (
                  <PaymentProfileEditor
                    profile={item}
                    onSave={updated => { updateList('paymentProfiles', updated); setEditingId(null); }}
                    onCancel={() => setEditingId(null)}
                  />
                )}
              />
            </>
          )}

          {/* ── Intake Forms tab ── */}
          {activeTab === 'intake' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{templates.intakeTemplates.length} template{templates.intakeTemplates.length !== 1 ? 's' : ''}</p>
                <button
                  onClick={() => newItem('intakeTemplates', { name: '', fields: [{ id: 'chief_complaint', label: 'Chief Complaint', required: true, enabled: true }, { id: 'medical_history', label: 'Medical History', required: false, enabled: true }, { id: 'medications', label: 'Current Medications', required: false, enabled: false }, { id: 'allergies', label: 'Allergies', required: false, enabled: false }, { id: 'insurance_info', label: 'Insurance Information', required: false, enabled: false }, { id: 'emergency_contact', label: 'Emergency Contact', required: false, enabled: false }] })}
                  className="btn btn-secondary btn-sm"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                  New Template
                </button>
              </div>
              <TemplateList
                items={templates.intakeTemplates}
                entityKey="intakeTemplates"
                editingId={editingId}
                onEdit={toggleEdit}
                onDelete={id => deleteItem('intakeTemplates', id)}
                renderMeta={item => (
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{item.fields.filter(f => f.enabled).length} fields enabled</span>
                )}
                renderEditor={item => (
                  <IntakeTemplateEditor
                    tmpl={item}
                    onSave={updated => { updateList('intakeTemplates', updated); setEditingId(null); }}
                    onCancel={() => setEditingId(null)}
                  />
                )}
              />
            </>
          )}

          {/* ── Notes Templates tab ── */}
          {activeTab === 'notes' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{templates.notesTemplates.length} template{templates.notesTemplates.length !== 1 ? 's' : ''}</p>
                <button
                  onClick={() => newItem('notesTemplates', { name: '', content: '' })}
                  className="btn btn-secondary btn-sm"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                  New Template
                </button>
              </div>
              <TemplateList
                items={templates.notesTemplates}
                entityKey="notesTemplates"
                editingId={editingId}
                onEdit={toggleEdit}
                onDelete={id => deleteItem('notesTemplates', id)}
                renderMeta={item => (
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{item.content ? item.content.split('\n')[0].slice(0, 40) : 'Blank'}</span>
                )}
                renderEditor={item => (
                  <NotesTemplateEditor
                    tmpl={item}
                    onSave={updated => { updateList('notesTemplates', updated); setEditingId(null); }}
                    onCancel={() => setEditingId(null)}
                  />
                )}
              />
            </>
          )}

        </div>
      </div>
    </div>
  );
}
