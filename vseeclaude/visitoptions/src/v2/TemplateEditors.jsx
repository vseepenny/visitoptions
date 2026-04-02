import { useState } from 'react';
import { NOTES_PRESETS } from '../data/initialData';

/* ── Notes Section Types ─────────────────────────────────── */

export const NOTES_SECTION_TYPES = [
  { id: 'heading',   label: 'Section Heading', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 4v16M18 4v16M6 12h12"/></svg>, default: 'Section:' },
  { id: 'text',      label: 'Text Area',       icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10M7 11h10M7 15h6"/></svg>, default: '' },
  { id: 'checkbox',  label: 'Checkbox',        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg>, default: 'Checkbox item' },
  { id: 'divider',   label: 'Divider',         icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/></svg>, default: '' },
];

/* ── Form Field Types ────────────────────────────────────── */

export const FIELD_TYPES = [
  { id: 'text',     label: 'Text Input',    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 10H3"/><path d="M21 6H3"/><path d="M21 14H3"/><path d="M17 18H3"/></svg>, desc: 'Single-line text' },
  { id: 'textarea', label: 'Text Area',     icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10M7 11h10M7 15h6"/></svg>, desc: 'Multi-line text' },
  { id: 'checkbox', label: 'Checkbox',      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg>, desc: 'Yes / No toggle' },
  { id: 'scale',    label: 'Scale (0–3)',   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>, desc: 'Rating buttons' },
  { id: 'select',   label: 'Dropdown',      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="8 10 12 14 16 10"/></svg>, desc: 'Select from list' },
  { id: 'date',     label: 'Date Picker',   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, desc: 'Date selection' },
  { id: 'file',     label: 'File Upload',   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>, desc: 'Photo or document' },
  { id: 'heading',  label: 'Section Header', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 4v16M18 4v16M6 12h12"/></svg>, desc: 'Section divider' },
];

/* ── Notes Template Editor ───────────────────────────────── */

export function NotesTemplateEditor({ tmpl, onSave, onCancel }) {
  const initSections = () => {
    if (tmpl.sections) return tmpl.sections.map(s => ({ ...s }));
    if (tmpl.content) {
      return tmpl.content.split('\n').filter(l => l.trim() !== '').map((line, i) => ({
        id: `ns_${Date.now()}_${i}`,
        type: line.endsWith(':') ? 'heading' : 'text',
        value: line,
      }));
    }
    return [];
  };

  const [form, setForm] = useState({ name: tmpl.name, sections: initSections() });
  const [dragFromPalette, setDragFromPalette] = useState(null);
  const [dragFromIdx, setDragFromIdx] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  const updateSection = (idx, patch) => setForm(f => ({ ...f, sections: f.sections.map((s, i) => i === idx ? { ...s, ...patch } : s) }));
  const removeSection = (idx) => setForm(f => ({ ...f, sections: f.sections.filter((_, i) => i !== idx) }));
  const insertSection = (idx, type) => {
    const st = NOTES_SECTION_TYPES.find(t => t.id === type);
    const section = { id: `ns_${Date.now()}_${Math.random().toString(36).slice(2,5)}`, type, value: st?.default || '' };
    setForm(f => {
      const sections = [...f.sections];
      sections.splice(idx, 0, section);
      return { ...f, sections };
    });
  };
  const moveSection = (from, to) => {
    if (from === to) return;
    setForm(f => {
      const sections = [...f.sections];
      const [moved] = sections.splice(from, 1);
      sections.splice(to > from ? to - 1 : to, 0, moved);
      return { ...f, sections };
    });
  };

  const handleDrop = (targetIdx) => {
    if (dragFromPalette) insertSection(targetIdx, dragFromPalette);
    else if (dragFromIdx !== null) moveSection(dragFromIdx, targetIdx);
    setDragFromPalette(null);
    setDragFromIdx(null);
    setDropTarget(null);
  };

  const isDragging = dragFromPalette !== null || dragFromIdx !== null;

  const handleSave = () => {
    const content = form.sections.map(s => {
      if (s.type === 'divider') return '---';
      if (s.type === 'heading') return `${s.value}`;
      if (s.type === 'checkbox') return `☐ ${s.value}`;
      return s.value;
    }).join('\n\n');
    onSave({ ...tmpl, name: form.name, content, sections: form.sections });
  };

  const loadPreset = (key) => {
    const text = NOTES_PRESETS[key];
    if (!text) { setForm(f => ({ ...f, sections: [] })); return; }
    const sections = text.split('\n').filter(l => l.trim() !== '').map((line, i) => ({
      id: `ns_${Date.now()}_${i}`,
      type: line.endsWith(':') ? 'heading' : 'text',
      value: line,
    }));
    setForm(f => ({ ...f, sections }));
  };

  const DropZone = ({ idx }) => (
    <div
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropTarget(idx); }}
      onDragLeave={() => setDropTarget(null)}
      onDrop={(e) => { e.preventDefault(); handleDrop(idx); }}
      style={{
        height: dropTarget === idx ? 32 : isDragging ? 10 : 0,
        transition: 'height 150ms',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 'var(--r-md)',
        background: dropTarget === idx ? 'rgba(13,135,92,0.06)' : 'transparent',
        border: dropTarget === idx ? '2px dashed var(--brand)' : isDragging ? '2px dashed transparent' : 'none',
        margin: isDragging ? '2px 0' : 0,
      }}
    >
      {dropTarget === idx && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)' }}>Drop here</span>}
    </div>
  );

  return (
    <div style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-light)', borderRadius: 'var(--r-lg)', padding: 20, marginTop: 8 }}>
      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label">Template Name</label>
        <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" style={{ maxWidth: 320 }} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: '28px' }}>Presets:</span>
        {[{ key: 'soap', label: 'SOAP' }, { key: 'progress', label: 'Progress Note' }, { key: 'blank', label: 'Blank' }].map(p => (
          <button key={p.key} type="button" className="btn btn-ghost btn-sm" onClick={() => loadPreset(p.key)}>{p.label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Section palette */}
        <div style={{ width: 160, flexShrink: 0 }}>
          <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Drag to add</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NOTES_SECTION_TYPES.map(st => (
              <div
                key={st.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', st.id);
                  e.dataTransfer.effectAllowed = 'copy';
                  requestAnimationFrame(() => setDragFromPalette(st.id));
                }}
                onDragEnd={() => { setDragFromPalette(null); setDropTarget(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                  background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                  cursor: 'grab', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)',
                  opacity: dragFromPalette === st.id ? 0.4 : 1, transition: 'opacity 150ms',
                }}
              >
                <span style={{ color: 'var(--brand)', display: 'flex', flexShrink: 0 }}>{st.icon}</span>
                <span>{st.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sections list */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>
            Sections
            <span style={{ fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: 6 }}>{form.sections.length}</span>
          </label>

          {form.sections.length === 0 && !isDragging && (
            <div style={{ padding: '24px 16px', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: 'var(--r-lg)', color: 'var(--text-tertiary)', fontSize: 13 }}>
              Drag a section type from the left, or use a preset above
            </div>
          )}

          {form.sections.length === 0 && isDragging && <DropZone idx={0} />}

          {form.sections.map((section, idx) => {
            const st = NOTES_SECTION_TYPES.find(t => t.id === section.type);
            return (
              <div key={section.id}>
                <DropZone idx={idx} />
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', section.id);
                    e.dataTransfer.effectAllowed = 'move';
                    requestAnimationFrame(() => setDragFromIdx(idx));
                  }}
                  onDragEnd={() => { setDragFromIdx(null); setDropTarget(null); }}
                  style={{
                    display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px',
                    background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                    opacity: dragFromIdx === idx ? 0.3 : 1, transition: 'opacity 150ms',
                  }}
                >
                  <span style={{ color: 'var(--text-tertiary)', cursor: 'grab', display: 'flex', flexShrink: 0, padding: '4px 2px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
                  </span>
                  <span style={{ color: 'var(--brand)', display: 'flex', flexShrink: 0, paddingTop: 4 }}>{st?.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {section.type === 'divider' ? (
                      <div style={{ borderTop: '1px solid var(--border-strong)', margin: '10px 0' }} />
                    ) : section.type === 'heading' ? (
                      <input
                        type="text" value={section.value}
                        onChange={e => updateSection(idx, { value: e.target.value })}
                        placeholder="Section heading…"
                        className="input"
                        style={{ height: 30, fontSize: 13, fontWeight: 700 }}
                      />
                    ) : section.type === 'checkbox' ? (
                      <input
                        type="text" value={section.value}
                        onChange={e => updateSection(idx, { value: e.target.value })}
                        placeholder="Checkbox label…"
                        className="input"
                        style={{ height: 30, fontSize: 12 }}
                      />
                    ) : (
                      <textarea
                        value={section.value}
                        onChange={e => updateSection(idx, { value: e.target.value })}
                        placeholder="Enter text…"
                        className="input"
                        style={{ width: '100%', minHeight: 48, fontSize: 12, lineHeight: 1.5, padding: '6px 8px', resize: 'vertical' }}
                      />
                    )}
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', paddingTop: 6 }}>{st?.label}</span>
                  <button className="btn-icon danger" style={{ width: 24, height: 24, flexShrink: 0, marginTop: 2 }} onClick={() => removeSection(idx)} title="Remove section">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
          {form.sections.length > 0 && <DropZone idx={form.sections.length} />}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button onClick={onCancel} className="btn btn-ghost btn-sm">Cancel</button>
        <button onClick={handleSave} className="btn btn-primary btn-sm" disabled={!form.name?.trim()}>Save Template</button>
      </div>
    </div>
  );
}

/* ── Form Library Editor ─────────────────────────────────── */

export function FormLibraryEditor({ form, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...form, fields: form.fields?.map(f => ({ ...f })) || [] });
  const [dragFromPalette, setDragFromPalette] = useState(null);
  const [dragFromIdx, setDragFromIdx] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  const updateField = (idx, patch) => {
    setDraft(d => ({ ...d, fields: d.fields.map((f, i) => i === idx ? { ...f, ...patch } : f) }));
  };
  const removeField = (idx) => setDraft(d => ({ ...d, fields: d.fields.filter((_, i) => i !== idx) }));
  const insertField = (idx, type) => {
    const ft = FIELD_TYPES.find(t => t.id === type);
    const field = { id: `fld_${Date.now()}_${Math.random().toString(36).slice(2,5)}`, label: ft?.label || '', required: false, enabled: true, type };
    setDraft(d => {
      const fields = [...d.fields];
      fields.splice(idx, 0, field);
      return { ...d, fields };
    });
  };
  const moveField = (from, to) => {
    if (from === to) return;
    setDraft(d => {
      const fields = [...d.fields];
      const [moved] = fields.splice(from, 1);
      fields.splice(to > from ? to - 1 : to, 0, moved);
      return { ...d, fields };
    });
  };

  const handleDrop = (targetIdx) => {
    if (dragFromPalette) {
      insertField(targetIdx, dragFromPalette);
    } else if (dragFromIdx !== null) {
      moveField(dragFromIdx, targetIdx);
    }
    setDragFromPalette(null);
    setDragFromIdx(null);
    setDropTarget(null);
  };

  const isDragging = dragFromPalette !== null || dragFromIdx !== null;

  const DropZone = ({ idx }) => (
    <div
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropTarget(idx); }}
      onDragLeave={() => setDropTarget(null)}
      onDrop={(e) => { e.preventDefault(); handleDrop(idx); }}
      style={{
        height: dropTarget === idx ? 36 : isDragging ? 12 : 0,
        transition: 'height 150ms',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 'var(--r-md)',
        background: dropTarget === idx ? 'rgba(13,135,92,0.06)' : 'transparent',
        border: dropTarget === idx ? '2px dashed var(--brand)' : isDragging ? '2px dashed transparent' : 'none',
        margin: isDragging ? '2px 0' : 0,
      }}
    >
      {dropTarget === idx && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)' }}>Drop here</span>}
    </div>
  );

  return (
    <div style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-light)', borderRadius: 'var(--r-lg)', padding: 20, marginTop: 8 }}>
      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label">Form Name</label>
        <input type="text" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} className="input" style={{ maxWidth: 320 }} placeholder="e.g. Standard Intake" />
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Field palette */}
        <div style={{ width: 170, flexShrink: 0 }}>
          <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Drag to add</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {FIELD_TYPES.map(ft => (
              <div
                key={ft.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', ft.id);
                  e.dataTransfer.effectAllowed = 'copy';
                  requestAnimationFrame(() => setDragFromPalette(ft.id));
                }}
                onDragEnd={() => { setDragFromPalette(null); setDropTarget(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                  background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                  cursor: 'grab', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)',
                  opacity: dragFromPalette === ft.id ? 0.4 : 1, transition: 'opacity 150ms',
                }}
              >
                <span style={{ color: 'var(--brand)', display: 'flex', flexShrink: 0 }}>{ft.icon}</span>
                <span>{ft.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fields list */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>
            Fields
            <span style={{ fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: 6 }}>{draft.fields.length}</span>
          </label>

          {draft.fields.length === 0 && !isDragging && (
            <div
              style={{ padding: '24px 16px', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: 'var(--r-lg)', color: 'var(--text-tertiary)', fontSize: 13 }}
            >
              Drag a field type from the left to start building your form
            </div>
          )}

          {(draft.fields.length === 0 && isDragging) && <DropZone idx={0} />}

          {draft.fields.map((field, idx) => {
            const ft = FIELD_TYPES.find(t => t.id === (field.type || 'text'));
            return (
              <div key={field.id}>
                <DropZone idx={idx} />
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', field.id);
                    e.dataTransfer.effectAllowed = 'move';
                    requestAnimationFrame(() => setDragFromIdx(idx));
                  }}
                  onDragEnd={() => { setDragFromIdx(null); setDropTarget(null); }}
                  style={{
                    display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px',
                    background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                    opacity: dragFromIdx === idx ? 0.3 : 1, transition: 'opacity 150ms',
                  }}
                >
                  <span style={{ color: 'var(--text-tertiary)', cursor: 'grab', display: 'flex', flexShrink: 0, padding: 2 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
                  </span>
                  <span style={{ color: 'var(--brand)', display: 'flex', flexShrink: 0 }}>{ft?.icon}</span>
                  <input
                    type="text"
                    value={field.label}
                    onChange={e => updateField(idx, { label: e.target.value })}
                    placeholder="Field label…"
                    className="input"
                    style={{ flex: 1, height: 30, fontSize: 12 }}
                  />
                  <select
                    value={field.type || 'text'}
                    onChange={e => updateField(idx, { type: e.target.value })}
                    className="input"
                    style={{ height: 30, fontSize: 11, padding: '0 24px 0 6px', width: 110 }}
                  >
                    {FIELD_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                    <input type="checkbox" checked={field.required} onChange={e => updateField(idx, { required: e.target.checked })} style={{ accentColor: 'var(--brand)' }} />
                    Req
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                    <input type="checkbox" checked={field.enabled !== false} onChange={e => updateField(idx, { enabled: e.target.checked })} style={{ accentColor: 'var(--brand)' }} />
                    On
                  </label>
                  <button className="btn-icon danger" style={{ width: 24, height: 24, flexShrink: 0 }} onClick={() => removeField(idx)} title="Remove field">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
          {draft.fields.length > 0 && <DropZone idx={draft.fields.length} />}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button onClick={onCancel} className="btn btn-ghost btn-sm">Cancel</button>
        <button onClick={() => onSave(draft)} className="btn btn-primary btn-sm" disabled={!draft.name?.trim()}>Save Form</button>
      </div>
    </div>
  );
}
