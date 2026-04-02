import { useState, useEffect } from 'react';
import PaymentSettings from '../components/PaymentSettings';
import PatientTypes from '../components/PatientTypes';
import ConfirmModal from '../components/ConfirmModal';
import { NOTES_PRESETS } from '../data/initialData';
import WorkflowCustomizer from './WorkflowCustomizer';
import { useAnnotationPage } from './Annotations';
import { FormLibraryEditor, NotesTemplateEditor } from './TemplateEditors';

/* ── Dirty tracking hook ─────────────────────────────────── */

function useDirty(initial) {
  const [savedStr, setSavedStr] = useState(JSON.stringify(initial));
  const [state, setState] = useState(initial);
  const isDirty = JSON.stringify(state) !== savedStr;
  const markSaved = () => setSavedStr(JSON.stringify(state));
  return { state, setState, isDirty, markSaved };
}

/* ── Notes & Form editors imported from TemplateEditors.jsx ── */


/* ── Generic Template List ────────────────────────────────── */

function TemplateList({ items, editingId, defaultId, onEdit, onDelete, onSetDefault, renderMeta, renderEditor }) {
  return (
    <div>
      {items.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 24px' }}>
          <p className="empty-state-title">No templates yet</p>
          <p className="empty-state-desc">Create your first template to share across rooms.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(item => {
            const isDefault = item.id === defaultId;
            return (
              <div key={item.id}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', border: `1px solid ${editingId === item.id ? 'var(--brand)' : 'var(--border)'}`, borderRadius: editingId === item.id ? 'var(--r-lg) var(--r-lg) 0 0' : 'var(--r-lg)', background: editingId === item.id ? 'var(--brand-50)' : 'white', transition: 'all 150ms' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</p>
                    {isDefault && (
                      <span className="badge badge-success" style={{ fontSize: 11 }}>Default</span>
                    )}
                    {renderMeta?.(item)}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {!isDefault && onSetDefault && defaultId !== undefined && (
                      <button
                        onClick={() => onSetDefault(item.id)}
                        className="btn btn-ghost btn-sm"
                        title="Set as default"
                      >
                        Set as default
                      </button>
                    )}
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
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────── */

export default function ClinicTemplatesPage({ clinic, onChange, onSave }) {
  const { state, setState, isDirty, markSaved } = useDirty(clinic);
  const [activeTab, setActiveTab] = useState('patientTypes');
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { setPage: setAnnotationPage, setNavigate } = useAnnotationPage();

  useEffect(() => {
    setAnnotationPage(`clinic:${activeTab}`);
  }, [activeTab, setAnnotationPage]);

  // Handle navigation from annotation panel to clinic sub-tabs
  useEffect(() => {
    setNavigate('clinic', (targetPage) => {
      if (targetPage.startsWith('clinic:')) {
        const tab = targetPage.split(':')[1];
        if (tab) setActiveTab(tab);
      }
    });
  }, [setNavigate]);

  const update = (patch) => setState(s => ({ ...s, ...patch }));

  const toggleEdit = (id) => setEditingId(prev => prev === id ? null : id);

  const updateList = (key, updatedItem) =>
    setState(s => ({ ...s, [key]: s[key].map(t => t.id === updatedItem.id ? updatedItem : t) }));

  const deleteItem = (key, id) => setConfirmDelete({ key, id });

  const confirmDeleteAction = () => {
    const { key, id } = confirmDelete;
    setState(s => ({ ...s, [key]: s[key].filter(t => t.id !== id) }));
    if (editingId === id) setEditingId(null);
    setConfirmDelete(null);
  };

  const newItem = (key, defaults) => {
    const id = `${key}_${Date.now()}`;
    const item = { id, ...defaults };
    setState(s => ({ ...s, [key]: [...s[key], item] }));
    setEditingId(id);
  };

  const handleSave = () => {
    onChange(state);
    markSaved();
    onSave?.();
  };

  const TABS = [
    { id: 'patientTypes',  label: 'Patient Types'    },
    { id: 'workflow',      label: 'Intake Flow'       },
    { id: 'forms',         label: 'Form Library'     },
    { id: 'notes',         label: 'Notes Templates'  },
  ];

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 24px 80px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: 4 }}>Clinic Settings</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Configure the patient workflow, payment settings, and notes templates for your clinic. These settings apply across all waiting rooms.
        </p>
      </div>

      <div className="panel">
        <div className="tabs" style={{ padding: '0 24px', borderBottom: '1px solid var(--border)' }}>
          {TABS.map(tab => (
            <button key={tab.id} type="button" className={`tab-item${activeTab === tab.id ? ' active' : ''}`} onClick={() => { setActiveTab(tab.id); setEditingId(null); }}>{tab.label}</button>
          ))}
        </div>

        <div style={{ padding: 24 }}>

          {/* ── Patient Types & Payment tab ── */}
          {activeTab === 'patientTypes' && (
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                Select which types of patients your clinic accepts and configure how payments are collected for each type.
              </p>
              <PatientTypes
                selected={state.patientTypes || []}
                onChange={val => update({ patientTypes: val })}
              />

              {(state.patientTypes || []).length > 0 && (
                <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Payment Settings</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                    Configure how payments are collected for each patient type across all waiting rooms.
                  </p>
                  <PaymentSettings
                    enabledTypes={state.patientTypes || []}
                    config={state.paymentConfig}
                    onChange={newConfig => update({ paymentConfig: newConfig })}
                    noHeader
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Workflow tab ── */}
          {activeTab === 'workflow' && (
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                Define the patient flow for your clinic. Use the <strong>Visit Option Selection</strong> step to control where patients choose their visit type.
                Steps before it are completed first (e.g. intake forms); steps after follow the selected visit.
                Individual visit options can override the post-selection workflow.
              </p>
              <WorkflowCustomizer
                workflow={state.defaultWorkflow}
                onChange={wf => update({ defaultWorkflow: wf })}
                clinic={state}
              />
            </div>
          )}

          {/* ── Form Library tab ── */}
          {activeTab === 'forms' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {(state.formLibrary || []).length} form{(state.formLibrary || []).length !== 1 ? 's' : ''} in library — referenced by workflow form steps.
                </p>
                <button
                  onClick={() => newItem('formLibrary', { name: '', fields: [{ id: `fld_${Date.now()}`, label: '', required: false, enabled: true }] })}
                  className="btn btn-secondary btn-sm"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                  New Form
                </button>
              </div>
              <TemplateList
                items={state.formLibrary || []}
                editingId={editingId}
                onEdit={toggleEdit}
                onDelete={id => deleteItem('formLibrary', id)}
                renderMeta={item => (
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{item.fields?.filter(f => f.enabled).length || 0} fields</span>
                )}
                renderEditor={item => (
                  <FormLibraryEditor
                    form={item}
                    onSave={updated => { updateList('formLibrary', updated); setEditingId(null); }}
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
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{state.notesTemplates.length} template{state.notesTemplates.length !== 1 ? 's' : ''}</p>
                <button
                  onClick={() => newItem('notesTemplates', { name: '', content: '' })}
                  className="btn btn-secondary btn-sm"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                  New Template
                </button>
              </div>
              <TemplateList
                items={state.notesTemplates}
                editingId={editingId}
                defaultId={state.defaultNotesTemplateId}
                onEdit={toggleEdit}
                onSetDefault={id => update({ defaultNotesTemplateId: id })}
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

        {/* Footer with save */}
        <div className="panel-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isDirty ? (
              <span className="unsaved-badge">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>
                Unsaved changes
              </span>
            ) : (
              <span className="saved-badge">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                Saved
              </span>
            )}
          </div>
          <button onClick={handleSave} disabled={!isDirty} className="btn btn-primary btn-sm">Save Settings</button>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Delete Template"
          message="Are you sure you want to delete this template? Rooms referencing it will lose the link."
          confirmLabel="Delete"
          onConfirm={confirmDeleteAction}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
