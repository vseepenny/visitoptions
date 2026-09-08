import { useState } from 'react';
import { FIELD_TYPES } from './TemplateEditors';
import {
  findForm, formFields, isBuiltinForm, isCustomizedBuiltin,
  putForm, newFormId, blankField, countFormUsage,
} from './forms';

/* Form content, inside the step settings panel.
 *
 * A form step used to be a name and a dropdown: you could point it at a
 * template but never see what the patient would be asked, let alone change it
 * without leaving the flow for Clinic Settings. This shows the form's content
 * in place, and edits it in place.
 *
 * Two ways to save, because a template is shared: saving writes back to the
 * template — every step and room using it changes — and Save as new form forks
 * it into the clinic library and repoints just this step. Built-ins are code,
 * not clinic data, so saving over one materializes a clinic-owned copy that
 * overrides it by id (see allForms).
 *
 * Everything is sized for the ~268px panel: fields reorder with arrows rather
 * than drag handles, which stay accurate at this width and work by keyboard.
 */

const PANEL_LABEL = {
  display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 4,
};

const STUB = {
  border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
  background: 'var(--surface-subtle, #F9FAFB)', fontSize: 11,
  color: 'var(--text-tertiary)', padding: '4px 6px', minHeight: 24,
  display: 'flex', alignItems: 'center',
};

/* The field's type may predate the palette (tel, email…) — keep it selectable
   so the dropdown can't render blank on an existing form. */
function typeOptions(current) {
  const known = FIELD_TYPES.some(t => t.id === current);
  return known || !current ? FIELD_TYPES : [...FIELD_TYPES, { id: current, label: current }];
}

/* ── Read-only preview ───────────────────────────────────── */

function FieldPreview({ field }) {
  if (field.type === 'heading') {
    return (
      <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
          {field.label || 'Section'}
        </span>
      </div>
    );
  }

  const stub = () => {
    switch (field.type) {
      case 'textarea': return <div style={{ ...STUB, minHeight: 38 }}>Long answer</div>;
      case 'select': return <div style={{ ...STUB, justifyContent: 'space-between' }}>
        <span>{field.options?.[0] || 'Choose one'}</span><span>▾</span>
      </div>;
      case 'checkbox': return <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-tertiary)' }}>
        <input type="checkbox" disabled style={{ margin: 0 }} /> Yes / No
      </div>;
      case 'date': return <div style={{ ...STUB, justifyContent: 'space-between' }}><span>mm / dd / yyyy</span><span>▾</span></div>;
      case 'file': return <div style={{ ...STUB, border: '1px dashed var(--border-strong, #D1D5DB)', justifyContent: 'center' }}>Upload a photo or document</div>;
      case 'scale': return <div style={{ display: 'flex', gap: 3 }}>
        {[0, 1, 2, 3].map(n => (
          <span key={n} style={{ ...STUB, minHeight: 22, padding: '2px 0', width: 24, justifyContent: 'center' }}>{n}</span>
        ))}
      </div>;
      default: return <div style={STUB}>Short answer</div>;
    }
  };

  return (
    <div style={{ marginBottom: 8 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
        {field.label || <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>Untitled field</span>}
        {field.required && <span style={{ color: 'var(--danger, #DC2626)', marginLeft: 3 }}>*</span>}
      </label>
      {stub()}
    </div>
  );
}

/* ── Editable field row ──────────────────────────────────── */

function FieldRow({ field, idx, count, onPatch, onMove, onRemove }) {
  const off = field.enabled === false;

  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
      padding: 7, marginBottom: 6, background: off ? 'var(--surface-subtle, #F9FAFB)' : 'white',
      opacity: off ? 0.72 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
        <input
          value={field.label || ''}
          onChange={e => onPatch({ label: e.target.value })}
          placeholder="Question the patient sees"
          className="input"
          style={{ height: 26, fontSize: 11.5, fontWeight: 600, flex: 1, minWidth: 0 }}
        />
        <button className="btn btn-ghost btn-xs" style={miniBtn} disabled={idx === 0}
          onClick={() => onMove(idx - 1)} title="Move up">↑</button>
        <button className="btn btn-ghost btn-xs" style={miniBtn} disabled={idx === count - 1}
          onClick={() => onMove(idx + 1)} title="Move down">↓</button>
        <button className="btn btn-ghost btn-xs" style={{ ...miniBtn, color: 'var(--danger, #DC2626)' }}
          onClick={onRemove} title="Remove this field">✕</button>
      </div>

      <select
        value={field.type || 'text'}
        onChange={e => {
          const type = e.target.value;
          const patch = { type };
          if (type === 'select' && !field.options?.length) patch.options = ['Option 1', 'Option 2'];
          onPatch(patch);
        }}
        className="input"
        style={{ height: 25, fontSize: 11, padding: '0 22px 0 6px', marginBottom: 5 }}
      >
        {typeOptions(field.type).map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
      </select>

      {field.type === 'select' && (
        <input
          value={(field.options || []).join(', ')}
          onChange={e => onPatch({ options: e.target.value.split(',').map(o => o.trim()).filter(Boolean) })}
          placeholder="Choices, comma separated"
          className="input"
          style={{ height: 25, fontSize: 11, marginBottom: 5 }}
        />
      )}

      {field.type !== 'heading' && (
        <div style={{ display: 'flex', gap: 10 }}>
          <label style={checkLabel}>
            <input type="checkbox" checked={!!field.required} style={{ margin: 0, accentColor: 'var(--brand)' }}
              onChange={e => onPatch({ required: e.target.checked })} />
            Required
          </label>
          <label style={checkLabel}>
            <input type="checkbox" checked={field.enabled !== false} style={{ margin: 0, accentColor: 'var(--brand)' }}
              onChange={e => onPatch({ enabled: e.target.checked })} />
            Shown
          </label>
        </div>
      )}
    </div>
  );
}

const miniBtn = {
  width: 22, height: 22, padding: 0, flexShrink: 0, fontSize: 11, lineHeight: 1,
};
const checkLabel = {
  display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5,
  color: 'var(--text-secondary)', cursor: 'pointer',
};

/* ── Section ─────────────────────────────────────────────── */

export function FormStepEditor({ step, steps, clinic, onClinicChange, onStepChange }) {
  const [draft, setDraft] = useState(null);       // null = preview mode
  const [saveAsName, setSaveAsName] = useState(null);

  const form = findForm(clinic, step.formId);
  const editable = typeof onClinicChange === 'function';

  if (!step.formId || !form) {
    return (
      <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', lineHeight: 1.5, marginBottom: 12 }}>
        Pick a form above to see what the patient will be asked.
      </p>
    );
  }

  /* ── Preview ── */
  if (!draft) {
    const shown = formFields(form);
    const hidden = (form.fields || []).length - shown.length;

    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={PANEL_LABEL}>Form content</span>
          {editable && (
            <button className="btn btn-ghost btn-xs" style={{ height: 20, fontSize: 10.5 }}
              onClick={() => { setDraft({ ...form, fields: (form.fields || []).map(f => ({ ...f })) }); setSaveAsName(null); }}>
              Edit
            </button>
          )}
        </div>

        {isCustomizedBuiltin(clinic, form.id) && (
          <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 6 }}>
            Customized for this clinic.
          </p>
        )}

        {shown.length === 0
          ? <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>This form has no visible fields.</p>
          : shown.map(f => <FieldPreview key={f.id} field={f} />)}

        {hidden > 0 && (
          <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {hidden} field{hidden === 1 ? '' : 's'} hidden from the patient.
          </p>
        )}
      </div>
    );
  }

  /* ── Edit ── */
  const patchField = (idx, patch) =>
    setDraft(d => ({ ...d, fields: d.fields.map((f, i) => (i === idx ? { ...f, ...patch } : f)) }));

  const moveField = (from, to) => setDraft(d => {
    const fields = [...d.fields];
    const [moved] = fields.splice(from, 1);
    fields.splice(to, 0, moved);
    return { ...d, fields };
  });

  const removeField = (idx) => setDraft(d => ({ ...d, fields: d.fields.filter((_, i) => i !== idx) }));
  const addField = () => setDraft(d => ({ ...d, fields: [...d.fields, blankField()] }));

  const dirty = JSON.stringify(draft) !== JSON.stringify({ ...form, fields: (form.fields || []).map(f => ({ ...f })) });
  const usage = countFormUsage(steps, form.id);
  const close = () => { setDraft(null); setSaveAsName(null); };

  const saveToTemplate = () => {
    onClinicChange(putForm(clinic, draft));
    // The step's name follows the form's, unless someone repointed it since.
    if (step.label === form.name && draft.name !== form.name) onStepChange({ label: draft.name });
    close();
  };

  const saveAsNew = () => {
    const name = (saveAsName || '').trim() || `${draft.name} (copy)`;
    const fresh = { ...draft, id: newFormId(), name };
    onClinicChange(putForm(clinic, fresh));
    onStepChange({ formId: fresh.id, label: name });
    close();
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={PANEL_LABEL}>Form content</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Editing
        </span>
      </div>

      <div className="form-group" style={{ marginBottom: 8 }}>
        <label style={PANEL_LABEL}>Form name</label>
        <input
          value={draft.name || ''}
          onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
          className="input"
          style={{ height: 28, fontSize: 12, fontWeight: 600 }}
        />
      </div>

      {draft.fields.map((f, i) => (
        <FieldRow
          key={f.id}
          field={f}
          idx={i}
          count={draft.fields.length}
          onPatch={patch => patchField(i, patch)}
          onMove={to => moveField(i, to)}
          onRemove={() => removeField(i)}
        />
      ))}

      <button className="btn btn-dashed btn-xs" style={{ width: '100%', marginBottom: 10 }} onClick={addField}>
        + Add field
      </button>

      {/* What saving over the template costs, before the button is pressed. */}
      <p style={{ fontSize: 10.5, color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: 8 }}>
        {usage > 1
          ? `Saving changes this template for all ${usage} steps using it in this flow, and anywhere else the clinic uses it.`
          : 'Saving changes this template everywhere the clinic uses it.'}
        {isBuiltinForm(form.id) && !isCustomizedBuiltin(clinic, form.id) && ' A clinic copy of this built-in form will be created.'}
      </p>

      {saveAsName === null ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          <button className="btn btn-primary btn-xs" onClick={saveToTemplate} disabled={!dirty}>Save to template</button>
          <button className="btn btn-secondary btn-xs" onClick={() => setSaveAsName(`${draft.name} (copy)`)}>Save as new…</button>
          <button className="btn btn-ghost btn-xs" onClick={close}>Cancel</button>
        </div>
      ) : (
        <div>
          <label style={PANEL_LABEL}>New form name</label>
          <input
            autoFocus
            value={saveAsName}
            onChange={e => setSaveAsName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && saveAsName.trim()) saveAsNew(); }}
            className="input"
            style={{ height: 28, fontSize: 12, marginBottom: 6 }}
          />
          <p style={{ fontSize: 10.5, color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: 6 }}>
            Adds a new form to the clinic library and points this step at it. “{form.name}” is left alone.
          </p>
          <div style={{ display: 'flex', gap: 5 }}>
            <button className="btn btn-primary btn-xs" onClick={saveAsNew} disabled={!saveAsName.trim()}>Create form</button>
            <button className="btn btn-ghost btn-xs" onClick={() => setSaveAsName(null)}>Back</button>
          </div>
        </div>
      )}
    </div>
  );
}
