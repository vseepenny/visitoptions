import { useState } from 'react';
import PaymentSettings from '../components/PaymentSettings';
import { NOTES_PRESETS } from '../data/initialData';

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

/* ── Generic Template List ────────────────────────────────── */

function TemplateList({ items, editingId, onEdit, onDelete, renderMeta, renderEditor }) {
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

export default function ClinicTemplatesPage({ clinic, onChange }) {
  const [activeTab, setActiveTab] = useState('payment');
  const [editingId, setEditingId] = useState(null);

  const toggleEdit = (id) => setEditingId(prev => prev === id ? null : id);

  const updateList = (key, updatedItem) =>
    onChange({ ...clinic, [key]: clinic[key].map(t => t.id === updatedItem.id ? updatedItem : t) });

  const deleteItem = (key, id) => {
    if (window.confirm('Delete this template? Rooms referencing it will lose the link.')) {
      onChange({ ...clinic, [key]: clinic[key].filter(t => t.id !== id) });
      if (editingId === id) setEditingId(null);
    }
  };

  const newItem = (key, defaults) => {
    const id = `${key}_${Date.now()}`;
    const item = { id, ...defaults };
    onChange({ ...clinic, [key]: [...clinic[key], item] });
    setEditingId(id);
  };

  const TABS = [
    { id: 'payment', label: 'Payment'         },
    { id: 'intake',  label: 'Intake Flows'    },
    { id: 'notes',   label: 'Notes Templates' },
  ];

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 24px 80px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: 4 }}>Clinic Settings</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Configure payment, intake flows, and notes templates for your clinic. Waiting rooms reference these templates by ID — update once to affect all rooms.
        </p>
      </div>

      <div className="panel">
        <div className="tabs" style={{ padding: '0 24px', borderBottom: '1px solid var(--border)' }}>
          {TABS.map(tab => (
            <button key={tab.id} type="button" className={`tab-item${activeTab === tab.id ? ' active' : ''}`} onClick={() => { setActiveTab(tab.id); setEditingId(null); }}>{tab.label}</button>
          ))}
        </div>

        <div style={{ padding: 24 }}>

          {/* ── Payment tab ── */}
          {activeTab === 'payment' && (
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                Configure how payments are collected across all rooms in this clinic. These settings apply to all waiting rooms unless overridden per visit option.
              </p>
              <PaymentSettings
                enabledTypes={['self-pay', 'group-covered', 'insurance']}
                config={clinic.paymentConfig}
                onChange={newConfig => onChange({ ...clinic, paymentConfig: newConfig })}
                noHeader
              />
            </div>
          )}

          {/* ── Intake Forms tab ── */}
          {activeTab === 'intake' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{clinic.intakeTemplates.length} flow{clinic.intakeTemplates.length !== 1 ? 's' : ''}</p>
                <button
                  onClick={() => newItem('intakeTemplates', { name: '', fields: [
                    { id: 'chief_complaint',   label: 'Chief Complaint',       required: true,  enabled: true  },
                    { id: 'medical_history',   label: 'Medical History',       required: false, enabled: true  },
                    { id: 'medications',       label: 'Current Medications',   required: false, enabled: false },
                    { id: 'allergies',         label: 'Allergies',             required: false, enabled: false },
                    { id: 'insurance_info',    label: 'Insurance Information', required: false, enabled: false },
                    { id: 'emergency_contact', label: 'Emergency Contact',     required: false, enabled: false },
                  ]})}
                  className="btn btn-secondary btn-sm"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                  New Template
                </button>
              </div>
              <TemplateList
                items={clinic.intakeTemplates}
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
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{clinic.notesTemplates.length} template{clinic.notesTemplates.length !== 1 ? 's' : ''}</p>
                <button
                  onClick={() => newItem('notesTemplates', { name: '', content: '' })}
                  className="btn btn-secondary btn-sm"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                  New Template
                </button>
              </div>
              <TemplateList
                items={clinic.notesTemplates}
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
