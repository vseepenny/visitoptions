import { useState } from 'react';
import { normalizeSteps } from './workflowUtils';
import { accessConfig, accessSummary, guestBlockReason } from './patientAccess';
import { BUILTIN_FORMS, allForms, formFields } from './forms';
import { scopeForStep, conditionIssue } from './flowScope';
import { RuleEditor } from './RuleEditor';

import { STEP_TYPES, CONDITION_TYPES, createStep, uid, changeConditionType } from './stepTypes';

/* ── Workflow Templates (preset library) ─────────────────── */

function stampIds(steps) {
  return steps.map(s => {
    const ns = { ...s, id: uid() };
    if (ns.branches) ns.branches = ns.branches.map(b => ({
      ...b, id: uid(), steps: stampIds(b.steps),
    }));
    return ns;
  });
}

const WORKFLOW_TEMPLATES = [
  {
    id: 'tpl_standard',
    name: 'Standard Telehealth',
    desc: 'Full intake with dependants, scheduling, intake form, payment branching, device test, and confirmation.',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
    steps: [
      { type: 'dependant_list', label: 'Dependant List' },
      { type: 'visit_selection', label: 'Consultation' },
      { type: 'scheduling', label: 'Calendar Picker' },
      { type: 'form', label: 'Intake Form', formId: '_intake_form' },
      { type: 'conditional', label: 'By Patient Type', conditionType: 'patient_type', branches: [
        { label: 'Self-Pay', condition: 'self-pay', steps: [
          { type: 'payment', label: 'Payment Options' },
        ]},
        { label: 'Insurance', condition: 'insurance', steps: [
          { type: 'form', label: 'Insurance Form', formId: '_insurance_form' },
          { type: 'payment', label: 'Payment Options' },
        ]},
        { label: 'Group-Covered', condition: 'group-covered', steps: [] },
      ]},
      { type: 'pharmacy', label: 'Pharmacy Picker' },
      { type: 'form', label: 'Emergency Contact', formId: '_emergency_contact' },
      { type: 'test_device', label: 'Test Device' },
      { type: 'setup_session', label: 'Setup Session' },
      { type: 'confirmation', label: 'Confirmation' },
    ],
  },
  {
    id: 'tpl_quick_walkin',
    name: 'Quick Walk-in',
    desc: 'Minimal steps for walk-in urgent care — quick intake, device test, straight to waiting room.',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    steps: [
      { type: 'form', label: 'Guest Intake', formId: '_guest_intake' },
      { type: 'test_device', label: 'Test Device' },
      { type: 'setup_session', label: 'Setup Session' },
      { type: 'walkin_confirmation', label: 'Walk-in Confirmation' },
    ],
  },
  {
    id: 'tpl_scheduled',
    name: 'Scheduled Visit',
    desc: 'Pick a visit, schedule, intake form, payment, and confirmation. No walk-in path.',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    steps: [
      { type: 'visit_selection', label: 'Consultation' },
      { type: 'scheduling', label: 'Calendar Picker' },
      { type: 'form', label: 'Intake Form', formId: '_intake_form' },
      { type: 'payment', label: 'Payment Options' },
      { type: 'test_device', label: 'Test Device' },
      { type: 'setup_session', label: 'Setup Session' },
      { type: 'confirmation', label: 'Confirmation' },
    ],
  },
  {
    id: 'tpl_insurance_heavy',
    name: 'Insurance-First',
    desc: 'Insurance verification upfront before scheduling. Includes eligibility branching and guarantor form.',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    steps: [
      { type: 'form', label: 'Insurance Form', formId: '_insurance_form' },
      { type: 'form', label: 'Guarantor', formId: '_guarantor' },
      { type: 'conditional', label: 'By Insurance Status', conditionType: 'insurance_status', branches: [
        { label: 'Eligible', condition: 'eligible', steps: [
          { type: 'visit_selection', label: 'Consultation' },
          { type: 'scheduling', label: 'Calendar Picker' },
        ]},
        { label: 'Not Eligible', condition: 'not_eligible', steps: [
          { type: 'payment', label: 'Payment Options' },
          { type: 'visit_selection', label: 'Consultation' },
          { type: 'scheduling', label: 'Calendar Picker' },
        ]},
        { label: 'Pending', condition: 'pending', steps: [
          { type: 'visit_selection', label: 'Consultation' },
          { type: 'scheduling', label: 'Calendar Picker' },
        ]},
        { label: 'Error', condition: 'error', steps: [
          { type: 'payment', label: 'Payment Options' },
          { type: 'visit_selection', label: 'Consultation' },
        ]},
      ]},
      { type: 'form', label: 'Intake Form', formId: '_intake_form' },
      { type: 'test_device', label: 'Test Device' },
      { type: 'setup_session', label: 'Setup Session' },
      { type: 'confirmation', label: 'Confirmation' },
    ],
  },
  {
    id: 'tpl_self_pay_only',
    name: 'Self-Pay Only',
    desc: 'Streamlined flow for cash-pay clinics — no insurance forms, just intake, payment, and go.',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    steps: [
      { type: 'visit_selection', label: 'Consultation' },
      { type: 'scheduling', label: 'Calendar Picker' },
      { type: 'form', label: 'Intake Form', formId: '_intake_form' },
      { type: 'payment', label: 'Payment Options' },
      { type: 'setup_session', label: 'Setup Session' },
      { type: 'confirmation', label: 'Confirmation' },
    ],
  },
  {
    id: 'tpl_blank',
    name: 'Blank',
    desc: 'Start from scratch — empty workflow canvas.',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
    steps: [],
  },
];

/* ── Connector line between steps (also a drop zone) ─────── */

function Connector({ onAdd, dropTarget }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e) => {
    if (!dropTarget) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    dropTarget?.onDrop();
  };

  const isDraggable = !!dropTarget;

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative',
        width: '100%',
        height: dragOver ? 60 : isDraggable ? 48 : 44,
        transition: 'height 150ms',
        // Expand the hit area for drops — pad generously when a drag is active
        padding: isDraggable ? '8px 0' : 0,
        margin: isDraggable ? '-8px 0' : 0,
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Visual feedback overlay when drag is active */}
      {isDraggable && (
        <div style={{
          position: 'absolute', inset: '0 -20px',
          zIndex: 1, borderRadius: 8,
          background: dragOver ? 'rgba(13,135,92,0.06)' : 'transparent',
          border: dragOver ? '2px dashed var(--brand)' : '2px dashed transparent',
          transition: 'all 150ms',
          pointerEvents: 'none',
        }} />
      )}
      {/* Top half of line */}
      <div style={{
        width: dragOver ? 4 : 2, flex: 1,
        background: dragOver ? 'var(--brand)' : 'var(--border-strong)',
        borderRadius: dragOver ? 2 : 0, transition: 'all 150ms',
      }} />
      {/* Center: + button or drop indicator */}
      {dragOver ? (
        <div style={{
          padding: '4px 14px', borderRadius: 'var(--r-full)',
          background: 'var(--brand)', color: 'white', fontSize: 11, fontWeight: 700,
          whiteSpace: 'nowrap', pointerEvents: 'none', flexShrink: 0,
        }}>Drop here</div>
      ) : (
        <button
          onClick={onAdd}
          title="Add step"
          style={{
            width: '100%', height: 28, borderRadius: 'var(--r-md)', flexShrink: 0,
            background: 'transparent', border: '1.5px dashed transparent',
            color: 'var(--text-tertiary)', fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            cursor: 'pointer', transition: 'all 150ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; e.currentTarget.style.background = 'var(--brand-50)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add step
        </button>
      )}
      {/* Bottom half of line */}
      <div style={{
        width: dragOver ? 4 : 2, flex: 1,
        background: dragOver ? 'var(--brand)' : 'var(--border-strong)',
        borderRadius: dragOver ? 2 : 0, transition: 'all 150ms',
      }} />
    </div>
  );
}

/* ── Add Step Picker (inline dropdown with categories) ────── */

const CATEGORY_ORDER = ['Steps', 'Forms', 'Account', 'Logic'];

function AddStepPicker({ onSelect, onCancel, existingSteps = [] }) {
  // A singleton is used up wherever it sits — including inside a branch — so
  // the check walks the whole tree, not just this level.
  const usedTypes = new Set();
  const walk = (steps) => {
    for (const s of steps || []) {
      usedTypes.add(s.type);
      if (s.branches) s.branches.forEach(b => walk(b.steps));
    }
  };
  walk(existingSteps);
  const available = STEP_TYPES.filter(st => !st.legacy && (!st.singleton || !usedTypes.has(st.id)));

  // Group by category
  const grouped = {};
  for (const st of available) {
    const cat = st.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(st);
  }

  return (
    <div style={{
      background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--shadow-md)', padding: 8, display: 'flex', flexDirection: 'column', gap: 2,
      minWidth: 280, maxHeight: 420, overflowY: 'auto', animation: 'slideUp 150ms ease both',
    }}>
      {CATEGORY_ORDER.filter(cat => grouped[cat]?.length).map((cat, ci) => (
        <div key={cat}>
          {ci > 0 && <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />}
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-tertiary)', padding: '6px 8px 2px' }}>{cat}</p>
          {grouped[cat].map(st => (
            <button
              key={st.id}
              onClick={() => onSelect(st.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px',
                background: 'none', border: 'none', borderRadius: 'var(--r-md)',
                cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
                transition: 'background 100ms', width: '100%', textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--grey-100)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span style={{ color: st.color, display: 'flex', flexShrink: 0 }}>{st.icon}</span>
              <span style={{ flex: 1 }}>{st.label}</span>
            </button>
          ))}
        </div>
      ))}
      <div style={{ borderTop: '1px solid var(--border)', marginTop: 4, paddingTop: 4 }}>
        <button
          onClick={onCancel}
          style={{
            width: '100%', padding: '6px 10px', background: 'none', border: 'none',
            borderRadius: 'var(--r-md)', cursor: 'pointer', fontSize: 12,
            color: 'var(--text-tertiary)', textAlign: 'center',
          }}
        >Cancel</button>
      </div>
    </div>
  );
}

/* ── Step Card ────────────────────────────────────────────── */

function StepCard({ step, index, total, onUpdate, onDelete, onMoveUp, onMoveDown, clinic, depth = 0, dragHandlers, allSteps = [], guestAllowed = false, access }) {
  const collapsible = step.type === 'conditional';
  const [expanded, setExpanded] = useState(step.type === 'conditional');
  const typeDef = STEP_TYPES.find(t => t.id === step.type);
  // Guests have no account, so some steps simply can't complete for them.
  const guestBlock = guestAllowed ? guestBlockReason(step) : null;

  return (
    <div style={{
      border: `1px solid ${step.type === 'conditional' ? 'var(--warning)' : 'var(--border)'}`,
      // A nested conditional gets a heavier left edge so depth reads in the canvas
      borderLeftWidth: step.type === 'conditional' && depth > 0 ? 3 : 1,
      borderRadius: 'var(--r-lg)',
      background: 'white',
      overflow: 'hidden',
      transition: 'box-shadow 150ms, opacity 150ms',
      opacity: dragHandlers?.isDragging ? 0.4 : 1,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        background: typeDef?.bgColor ?? 'var(--grey-100)',
        borderBottom: expanded && collapsible ? '1px solid var(--border)' : 'none',
      }}>
        {/* Drag handle */}
        <span
          draggable="true"
          onDragStart={dragHandlers?.onDragStart ? (e) => {
            e.dataTransfer.setData('text/plain', step.id);
            e.dataTransfer.effectAllowed = 'move';
            dragHandlers.onDragStart(e);
          } : undefined}
          onDragEnd={dragHandlers?.onDragEnd}
          style={{ color: 'var(--text-tertiary)', cursor: 'grab', display: 'flex', flexShrink: 0, touchAction: 'none', padding: 2 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
        </span>

        {/* Up/Down pill */}
        <div style={{ display: 'inline-flex', borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0 }}>
            {index > 0 ? (
              <button onClick={onMoveUp} title="Move up" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 24, height: 24, border: 'none', borderRight: '1px solid var(--border)',
                background: 'white', cursor: 'pointer', color: 'var(--text-secondary)',
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
              </button>
            ) : (
              <span style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 24, height: 24, borderRight: '1px solid var(--border)',
                background: 'var(--grey-50)', color: 'var(--grey-300)',
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
              </span>
            )}
            {index < total - 1 ? (
              <button onClick={onMoveDown} title="Move down" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 24, height: 24, border: 'none',
                background: 'white', cursor: 'pointer', color: 'var(--text-secondary)',
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
            ) : (
              <span style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 24, height: 24,
                background: 'var(--grey-50)', color: 'var(--grey-300)',
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </span>
            )}
          </div>

        {/* Icon */}
        <span style={{ color: typeDef?.color, display: 'flex', flexShrink: 0 }}>{typeDef?.icon}</span>

        {/* Label */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {step.label || typeDef?.label}
            </span>
            {step.type === 'form' && step.formId && (
              <span className="badge badge-info" style={{ fontSize: 10 }}>
                {allForms(clinic).find(f => f.id === step.formId)?.name || step.formId}
              </span>
            )}
            {step.type === 'conditional' && (
              <span className="badge badge-warning" style={{ fontSize: 10 }}>
                {CONDITION_TYPES.find(ct => ct.id === step.conditionType)?.label || step.conditionType} · {(() => {
                  const isRule = step.conditionType === 'rule';
                  const n = (isRule ? (step.branches || []).filter(b => b.kind === 'rule').length : step.branches?.length) || 0;
                  const noun = isRule ? 'rule' : 'branch';
                  return `${n} ${n === 1 ? noun : isRule ? 'rules' : 'branches'}`;
                })()}
              </span>
            )}
            {step.type === 'conditional' && depth > 0 && (
              <span
                title={`Nested ${depth} level${depth !== 1 ? 's' : ''} deep`}
                style={{ fontSize: 10, fontWeight: 700, color: 'var(--warning)', background: 'var(--warning-light)', border: '1px solid #FDE68A', padding: '0 6px', borderRadius: 'var(--r-full)' }}
              >L{depth + 1}</span>
            )}
            {typeDef?.category && typeDef.category !== 'Logic' && (
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 500 }}>{typeDef.category}</span>
            )}
          </div>
        </div>

        {/* Actions: expand + delete on right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {collapsible && (
            <button className="btn-icon" style={{ width: 26, height: 26 }} onClick={() => setExpanded(!expanded)} title={expanded ? 'Collapse' : 'Expand'}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                {expanded ? <line x1="5" y1="12" x2="19" y2="12"/> : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}
              </svg>
            </button>
          )}
          <button className="btn-icon danger" style={{ width: 26, height: 26 }} onClick={onDelete} title="Remove step">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      {/* Step config body */}
      {step.type === 'form' && (
        <div style={{ padding: '10px 14px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Form</label>
            <select
              value={step.formId || ''}
              onChange={e => {
                const formId = e.target.value || null;
                const form = allForms(clinic).find(f => f.id === formId);
                onUpdate({ ...step, formId, label: form?.name || step.label });
              }}
              className="input"
              style={{ height: 32, fontSize: 12, padding: '0 28px 0 8px', width: 240 }}
            >
              <option value="">— Select a form —</option>
              <optgroup label="Built-in">
                {BUILTIN_FORMS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </optgroup>
              {(clinic?.formLibrary || []).length > 0 && (
                <optgroup label="Custom">
                  {clinic.formLibrary.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </optgroup>
              )}
            </select>
          </div>
        </div>
      )}

      {/* Pharmacy picker — its own module settings, no form library involved */}
      {step.type === 'pharmacy' && (
        <div style={{ padding: '10px 14px' }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>{typeDef?.desc}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px' }}>
            {[
              { key: 'allowSearch',  label: 'Directory search', def: true,  hint: 'Let patients search all pharmacies' },
              { key: 'showMap',      label: 'Show map',         def: true,  hint: 'Show nearby pharmacies on a map with distances' },
              { key: 'allowMailOrder', label: 'Mail-order option', def: true, hint: 'Offer mail-order delivery' },
              { key: 'allowSkip',    label: 'Allow skip',       def: true,  hint: 'Patient can decide later' },
            ].map(opt => {
              const on = step[opt.key] ?? opt.def;
              return (
                <label key={opt.key} title={opt.hint} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={e => onUpdate({ ...step, [opt.key]: e.target.checked })}
                    style={{ accentColor: 'var(--brand)' }}
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {step.type !== 'form' && step.type !== 'conditional' && step.type !== 'pharmacy' && typeDef?.desc && (
        <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
          {typeDef.desc}
        </div>
      )}

      {/* This step can't complete for a guest — warn rather than silently skip */}
      {guestBlock && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8, margin: '0 14px 12px',
          padding: '8px 12px', background: 'var(--warning-light)',
          border: '1px solid #FDE68A', borderRadius: 'var(--r-md)',
          fontSize: 11.5, color: '#92400E', lineHeight: 1.45,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span>
            <strong>Guests can't complete this step.</strong> {guestBlock} Branch on <em>How the Patient Signed In</em> to give guests a different path, or turn off guest access for this room.
          </span>
        </div>
      )}

      {/* Conditional branches */}
      {step.type === 'conditional' && expanded && (
        <ConditionalBranches
          step={step}
          onUpdate={onUpdate}
          clinic={clinic}
          depth={depth}
          allSteps={allSteps}
          guestAllowed={guestAllowed}
          access={access}
        />
      )}
    </div>
  );
}

/* ── Empty branch drop target ────────────────────────────── */

function EmptyBranchDrop({ onAdd, canDrop, onDrop }) {
  const [over, setOver] = useState(false);
  return (
    <div
      style={{
        padding: '12px 8px', textAlign: 'center', fontSize: 11,
        color: over ? 'var(--brand)' : 'var(--text-tertiary)',
        border: `1.5px dashed ${over ? 'var(--brand)' : 'var(--border)'}`,
        borderRadius: 'var(--r-md)',
        background: over ? 'var(--brand-50)' : 'white',
        cursor: 'pointer', transition: 'all 150ms',
      }}
      onClick={onAdd}
      onDragOver={canDrop ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOver(true); } : undefined}
      onDragLeave={() => setOver(false)}
      onDrop={canDrop ? (e) => { e.preventDefault(); setOver(false); onDrop(); } : undefined}
    >
      {over ? 'Drop here' : '+ Add step'}
    </div>
  );
}

/* ── Small connector inside branches (with drop zone) ────── */

function BranchConnector({ canDrop, onDrop, showAdd, onAdd }) {
  const [over, setOver] = useState(false);

  return (
    <div
      style={{
        display: 'flex', justifyContent: 'center', position: 'relative',
        padding: over ? '8px 0' : canDrop ? '6px 0' : '2px 0',
        margin: canDrop ? '-4px 0' : 0,
        transition: 'padding 100ms',
      }}
      onDragOver={canDrop ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOver(true); } : undefined}
      onDragLeave={() => setOver(false)}
      onDrop={canDrop ? (e) => { e.preventDefault(); setOver(false); onDrop(); } : undefined}
    >
      {/* Visual feedback overlay during drag */}
      {canDrop && (
        <div style={{
          position: 'absolute', inset: '0 -4px', zIndex: 1, borderRadius: 6,
          background: over ? 'rgba(13,135,92,0.08)' : 'transparent',
          border: over ? '1.5px dashed var(--brand)' : '1.5px dashed transparent',
          transition: 'all 100ms',
          pointerEvents: 'none',
        }} />
      )}
      {over ? (
        <div style={{ padding: '3px 10px', borderRadius: 'var(--r-full)', background: 'var(--brand)', color: 'white', fontSize: 10, fontWeight: 700, position: 'relative', zIndex: 2 }}>Drop</div>
      ) : showAdd ? (
        <button
          onClick={onAdd}
          style={{
            width: 18, height: 18, borderRadius: '50%', background: 'white',
            border: '1px dashed var(--border-strong)', color: 'var(--text-tertiary)',
            fontSize: 12, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            position: 'relative', zIndex: 2,
          }}
          title="Add step"
        >+</button>
      ) : (
        <div style={{ width: 1.5, height: 16, background: 'var(--border-strong)' }} />
      )}
    </div>
  );
}


/* ── Conditional Branches Editor ──────────────────────────── */

function ConditionalBranches({ step, onUpdate, clinic, depth, allSteps = [], guestAllowed = false, access }) {
  const [activeTab, setActiveTab] = useState(0);
  /* What the patient has actually produced by the time they reach this
     conditional. Drives the form list, the prerequisite warnings and the
     variables a lo-code rule may reference. */
  const scope = scopeForStep(allSteps, step.id, clinic, access);
  const issue = conditionIssue(step, scope, clinic);
  const [addingAt, setAddingAt] = useState(null); // { branchIndex, insertIndex }
  const [branchDrag, setBranchDrag] = useState(null); // { branchIndex, stepIndex }

  const dropAtBranchSlot = (branchIdx, slotIndex) => {
    if (!branchDrag) return;
    const { branchIndex: fromBranch, stepIndex: fromIdx } = branchDrag;
    if (fromBranch === branchIdx) {
      // Reorder within same branch
      let to = slotIndex;
      if (fromIdx < slotIndex) to -= 1;
      if (fromIdx !== to) moveBranchStep(branchIdx, fromIdx, to);
    } else {
      // Move across branches
      const srcBranch = step.branches[fromBranch];
      const movedStep = srcBranch.steps[fromIdx];
      const newSrcSteps = srcBranch.steps.filter((_, i) => i !== fromIdx);
      const dstBranch = step.branches[branchIdx];
      const newDstSteps = [...dstBranch.steps];
      newDstSteps.splice(slotIndex, 0, movedStep);
      const branches = step.branches.map((b, i) => {
        if (i === fromBranch) return { ...b, steps: newSrcSteps };
        if (i === branchIdx) return { ...b, steps: newDstSteps };
        return b;
      });
      onUpdate({ ...step, branches });
    }
    setBranchDrag(null);
  };

  const updateBranch = (branchIdx, patch) => {
    const branches = step.branches.map((b, i) => i === branchIdx ? { ...b, ...patch } : b);
    onUpdate({ ...step, branches });
  };

  const isRuleType = (step.conditionType || 'patient_type') === 'rule';

  /* Rule branches are ordered, so they can be added, removed and resequenced.
     Otherwise is pinned last and can never be removed — it's what catches
     patients who match no rule. */
  const addRuleBranch = () => {
    const branches = [...(step.branches || [])];
    const otherwiseAt = branches.findIndex(b => b.kind === 'otherwise');
    const at = otherwiseAt === -1 ? branches.length : otherwiseAt;
    const n = branches.filter(b => b.kind === 'rule').length + 1;
    branches.splice(at, 0, { id: uid(), kind: 'rule', label: `Rule ${n}`, expr: '', rule: null, steps: [] });
    onUpdate({ ...step, branches });
    setActiveTab(at);
  };

  const deleteRuleBranch = (branchIdx) => {
    const branches = step.branches.filter((_, i) => i !== branchIdx);
    onUpdate({ ...step, branches });
    setActiveTab(t => Math.max(0, Math.min(t, branches.length - 1)));
  };

  const moveRuleBranch = (from, dir) => {
    const branches = [...step.branches];
    const to = from + dir;
    if (to < 0 || to >= branches.length) return;
    if (branches[to].kind === 'otherwise' || branches[from].kind === 'otherwise') return;
    [branches[from], branches[to]] = [branches[to], branches[from]];
    onUpdate({ ...step, branches });
    setActiveTab(to);
  };

  // When condition type changes, rebuild branches from known values,
  // preserving steps from any old branches that match by condition key
  const handleConditionTypeChange = (newType) => onUpdate(changeConditionType(step, newType, clinic));

  const addStepToBranch = (branchIdx, insertIdx, stepType) => {
    const newStep = createStep(stepType, clinic);
    const branch = step.branches[branchIdx];
    const newSteps = [...branch.steps];
    newSteps.splice(insertIdx, 0, newStep);
    updateBranch(branchIdx, { steps: newSteps });
    setAddingAt(null);
  };

  const updateBranchStep = (branchIdx, stepIdx, updatedStep) => {
    const branch = step.branches[branchIdx];
    const newSteps = branch.steps.map((s, i) => i === stepIdx ? updatedStep : s);
    updateBranch(branchIdx, { steps: newSteps });
  };

  const deleteBranchStep = (branchIdx, stepIdx) => {
    const branch = step.branches[branchIdx];
    updateBranch(branchIdx, { steps: branch.steps.filter((_, i) => i !== stepIdx) });
  };

  const moveBranchStep = (branchIdx, fromIdx, toIdx) => {
    const branch = step.branches[branchIdx];
    const newSteps = [...branch.steps];
    const [moved] = newSteps.splice(fromIdx, 1);
    newSteps.splice(toIdx, 0, moved);
    updateBranch(branchIdx, { steps: newSteps });
  };

  const branches = step.branches || [];
  const safeBi = Math.min(activeTab, branches.length - 1);

  const BRANCH_COLORS = ['#0D875C', '#2563EB', '#7C3AED', '#D97706', '#DC2626', '#0891B2', '#4F46E5', '#BE185D'];

  const renderBranchContent = (branch, bi) => (
    <>
      {/* Rule branches carry their own condition; Otherwise is the catch-all */}
      {isRuleType && branch.kind === 'rule' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>
              Checked {bi === 0 ? 'first' : `${bi + 1}${bi === 1 ? 'nd' : bi === 2 ? 'rd' : 'th'}`}
            </span>
            <span style={{ flex: 1 }} />
            <button className="btn-icon" style={{ width: 24, height: 24 }} title="Check this rule earlier" disabled={bi === 0} onClick={() => moveRuleBranch(bi, -1)}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <button className="btn-icon" style={{ width: 24, height: 24 }} title="Check this rule later" disabled={branches[bi + 1]?.kind !== 'rule'} onClick={() => moveRuleBranch(bi, 1)}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <button className="btn-icon danger" style={{ width: 24, height: 24 }} title="Remove this rule" disabled={branches.filter(b => b.kind === 'rule').length <= 1} onClick={() => deleteRuleBranch(bi)}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <RuleEditor
            branch={branch}
            variables={scope.variables}
            onChange={b => updateBranch(bi, b)}
          />
        </>
      )}
      {isRuleType && branch.kind === 'otherwise' && (
        <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 10 }}>
          Runs for patients who matched none of the rules above. Leave it empty to send them straight on.
        </p>
      )}

      {branch.steps.length === 0 && !(addingAt?.branchIndex === bi) && (
        <EmptyBranchDrop
          onAdd={() => setAddingAt({ branchIndex: bi, insertIndex: 0 })}
          canDrop={branchDrag !== null}
          onDrop={() => dropAtBranchSlot(bi, 0)}
        />
      )}

      {branch.steps.map((bs, si) => {
        const isBranchDragSrc = branchDrag?.branchIndex === bi && branchDrag?.stepIndex === si;
        const canDropBefore = branchDrag !== null && !(branchDrag.branchIndex === bi && (branchDrag.stepIndex === si || branchDrag.stepIndex === si - 1));
        return (
        <div key={bs.id}>
          {si > 0 && (
            <BranchConnector
              canDrop={canDropBefore}
              onDrop={() => dropAtBranchSlot(bi, si)}
            />
          )}
          <StepCard
            step={bs}
            index={si}
            total={branch.steps.length}
            onUpdate={updated => updateBranchStep(bi, si, updated)}
            onDelete={() => deleteBranchStep(bi, si)}
            onMoveUp={() => moveBranchStep(bi, si, si - 1)}
            onMoveDown={() => moveBranchStep(bi, si, si + 1)}
            clinic={clinic}
            depth={depth + 1}
            allSteps={allSteps}
            guestAllowed={guestAllowed}
            access={access}
            dragHandlers={{
              isDragging: isBranchDragSrc,
              onDragStart: (e) => {
                setAddingAt(null);
                e.dataTransfer.effectAllowed = 'move';
                requestAnimationFrame(() => setBranchDrag({ branchIndex: bi, stepIndex: si }));
              },
              onDragEnd: () => setBranchDrag(null),
            }}
          />
          {addingAt?.branchIndex === bi && addingAt?.insertIndex === si + 1 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
              <AddStepPicker
                onSelect={type => addStepToBranch(bi, si + 1, type)}
                onCancel={() => setAddingAt(null)}
                existingSteps={allSteps}
              />
            </div>
          ) : (
            <BranchConnector
              canDrop={branchDrag !== null && !(branchDrag.branchIndex === bi && (branchDrag.stepIndex === si || branchDrag.stepIndex === si + 1))}
              onDrop={() => dropAtBranchSlot(bi, si + 1)}
              showAdd
              onAdd={() => setAddingAt({ branchIndex: bi, insertIndex: si + 1 })}
            />
          )}
        </div>
        );
      })}

      {branch.steps.length === 0 && addingAt?.branchIndex === bi && addingAt?.insertIndex === 0 && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <AddStepPicker
            onSelect={type => addStepToBranch(bi, 0, type)}
            onCancel={() => setAddingAt(null)}
            existingSteps={allSteps}
          />
        </div>
      )}
    </>
  );

  return (
    <div style={{ padding: '14px' }}>
      {/* Condition selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Branch on:</label>
        <select
          value={step.conditionType || 'patient_type'}
          onChange={e => handleConditionTypeChange(e.target.value)}
          className="input"
          style={{ height: 32, fontSize: 12, padding: '0 28px 0 8px', maxWidth: 220 }}
        >
          {CONDITION_TYPES.map(ct => <option key={ct.id} value={ct.id}>{ct.label}</option>)}
        </select>

        {/* Form-answer can only test a form the patient has already filled in,
            so the list is the forms in scope at this position — not every form
            in the library. */}
        {step.conditionType === 'form_answer' && (() => {
          const forms = scope.forms;
          const selForm = forms.find(f => f.id === step.conditionFormId);
          const fields = formFields(selForm);
          return (
            <>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>from</span>
              <select
                value={step.conditionFormId || ''}
                onChange={e => onUpdate({ ...step, conditionFormId: e.target.value || null, conditionFieldId: null })}
                className="input"
                style={{ height: 32, fontSize: 12, padding: '0 28px 0 8px', maxWidth: 190 }}
              >
                <option value="">{forms.length ? '— Select a form —' : '— No forms run before this —'}</option>
                {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              {selForm && (
                <select
                  value={step.conditionFieldId || ''}
                  onChange={e => onUpdate({ ...step, conditionFieldId: e.target.value || null })}
                  className="input"
                  style={{ height: 32, fontSize: 12, padding: '0 28px 0 8px', maxWidth: 200 }}
                >
                  <option value="">— Select a question —</option>
                  {fields.length === 0 && <option disabled>No fields on this form</option>}
                  {fields.map(f => <option key={f.id} value={f.id}>{f.label || f.id}</option>)}
                </select>
              )}
            </>
          );
        })()}
      </div>

      {/* This condition tests something no earlier step has produced */}
      {issue && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px', marginBottom: 12,
          background: 'var(--warning-light)', border: '1px solid #FDE68A', borderRadius: 'var(--r-md)',
          fontSize: 11.5, color: '#92400E', lineHeight: 1.45,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span>
            {issue.kind === 'missing_step' && <><strong>Nothing to branch on yet.</strong> Add a <strong>{issue.step}</strong> step above this branch. </>}
            {issue.kind === 'stale_form' && <><strong>Form is no longer in scope.</strong> </>}
            {issue.kind === 'no_forms' && <><strong>No form to test.</strong> </>}
            {issue.kind === 'no_dob' && <><strong>No date of birth collected.</strong> </>}
            {issue.why}
          </span>
        </div>
      )}

      {step.conditionType === 'form_answer' && !issue && !step.conditionFieldId && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 12,
          background: 'var(--warning-light)', border: '1px solid #FDE68A', borderRadius: 'var(--r-md)',
          fontSize: 11.5, color: '#92400E',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Pick the form question this branch tests — until then every patient follows the “Not Answered” path.
        </div>
      )}

      {/* Branch tabs */}
      <div style={{
        display: 'flex', gap: 0, borderBottom: '2px solid var(--border)',
        marginBottom: 0, overflowX: 'auto',
      }}>
        {branches.map((branch, bi) => {
          const isOtherwise = branch.kind === 'otherwise';
          const color = isOtherwise ? 'var(--grey-600)' : BRANCH_COLORS[bi % BRANCH_COLORS.length];
          const isActive = safeBi === bi;
          const stepCount = branch.steps.length;
          // A rule tab shows its expression so the order reads at a glance.
          const ruleHint = branch.kind === 'rule' ? (branch.expr || '').trim() : '';
          return (
            <button
              key={branch.id}
              title={ruleHint || undefined}
              onClick={() => setActiveTab(bi)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px',
                background: 'none', border: 'none',
                borderBottom: `2px solid ${isActive ? color : 'transparent'}`,
                marginBottom: -2,
                cursor: 'pointer',
                transition: 'all 120ms',
                opacity: isActive ? 1 : 0.6,
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: color, flexShrink: 0,
              }} />
              <span style={{
                fontSize: 12, fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                whiteSpace: 'nowrap',
              }}>
                {branch.label || branch.condition || `Branch ${bi + 1}`}
              </span>
              {ruleHint && (
                <span style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: 10, color: 'var(--text-tertiary)', maxWidth: 130,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{ruleHint}</span>
              )}
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: isActive ? color : 'var(--text-tertiary)',
                background: isActive ? `${color}14` : 'var(--grey-100)',
                padding: '1px 6px', borderRadius: 'var(--r-full)',
              }}>
                {stepCount}
              </span>
            </button>
          );
        })}
        {isRuleType && (
          <button
            onClick={addRuleBranch}
            title="Add another rule"
            style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px',
              background: 'none', border: 'none', borderBottom: '2px solid transparent',
              marginBottom: -2, cursor: 'pointer', color: 'var(--brand)',
              fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add rule
          </button>
        )}
      </div>

      {/* Active branch content */}
      {branches[safeBi] && (
        <div style={{
          border: '1.5px dashed var(--border-strong)',
          borderTop: 'none',
          borderRadius: '0 0 var(--r-lg) var(--r-lg)',
          background: 'var(--grey-50)',
          padding: 12,
          minHeight: 60,
        }}>
          {renderBranchContent(branches[safeBi], safeBi)}
        </div>
      )}

      {/* Hint */}
      <p style={{ marginTop: 8, fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center' }}>
        {isRuleType
          ? 'Rules are checked in order, top to bottom. The first one that matches runs; anyone left over takes Otherwise.'
          : `Branches are auto-populated from ${CONDITION_TYPES.find(ct => ct.id === (step.conditionType || 'patient_type'))?.hint || 'known values'}.`}
      </p>
    </div>
  );
}


/* ── Start / End nodes ────────────────────────────────────── */

function FlowTerminal({ label, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '8px 20px', borderRadius: 'var(--r-full)',
      background: color === 'start' ? 'var(--brand)' : 'var(--grey-700)',
      color: 'white', fontSize: 12, fontWeight: 700,
      letterSpacing: '0.5px', textTransform: 'uppercase',
      width: 'fit-content', alignSelf: 'center',
    }}>{label}</div>
  );
}

/* ── Entry gate ───────────────────────────────────────────── */
// The flow's start terminal, showing how patients get in. Auth is configured in
// Patient Access, not here, so this node is fixed — it can't be moved, removed
// or edited inline. It exists so the flow still reads as "patient signs in,
// then this happens".

function FlowGate({ access, onConfigure, scopeLabel }) {
  const chips = accessSummary(access);
  const cfg = accessConfig(access);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%', padding: '0 20px' }}>
      <FlowTerminal label="Patient Enters" color="start" />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center',
        maxWidth: 560, width: '100%',
        padding: '8px 14px', background: 'white',
        border: '1px dashed var(--border-strong)', borderRadius: 'var(--r-md)',
      }}>
        <span style={{ color: 'var(--brand)', display: 'flex', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {chips.length > 0 ? 'Patients identify themselves first:' : 'No way in is configured:'}
        </span>
        {chips.length > 0 ? (
          <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
            {chips.map(c => <span key={c} className="badge badge-success" style={{ fontSize: 10 }}>{c}</span>)}
          </span>
        ) : (
          <span className="badge badge-warning" style={{ fontSize: 10 }}>No way in</span>
        )}
        {cfg.allowGuest && (
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>· guests have no chart</span>
        )}
        <span style={{ flex: 1 }} />
        {onConfigure && (
          <button
            onClick={onConfigure}
            style={{ background: 'none', border: 'none', padding: 0, fontSize: 11.5, fontWeight: 600, color: 'var(--brand)', cursor: 'pointer', flexShrink: 0 }}
          >
            {scopeLabel || 'Patient Access'}
          </button>
        )}
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>
        The flow below starts once the patient is identified.
      </p>
    </div>
  );
}

/* ── Template preview mini-flow ───────────────────────────── */

function MiniStepRow({ step }) {
  const meta = STEP_TYPES.find(t => t.id === step.type) || {};
  const caption = step.type === 'form' && step.formId
    ? (BUILTIN_FORMS.find(f => f.id === step.formId)?.name || 'Custom form')
    : null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '7px 12px', background: 'white',
      border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
      width: '100%',
    }}>
      <span style={{
        width: 26, height: 26, borderRadius: 6, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: meta.color || 'var(--text-secondary)', background: meta.bgColor || 'var(--grey-100)',
      }}>{meta.icon || null}</span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{step.label || meta.label}</span>
      {caption && caption !== step.label && (
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 'auto', flexShrink: 0 }}>{caption}</span>
      )}
    </div>
  );
}

function MiniConnector() {
  return <div style={{ width: 2, height: 14, background: 'var(--border-strong)', flexShrink: 0 }} />;
}

function TemplateMiniFlow({ steps }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <FlowTerminal label="Patient Enters" color="start" />
      {steps.map((step, i) => (
        <div key={i} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <MiniConnector />
          {step.type === 'conditional' ? (
            <div style={{
              width: '100%', border: '1.5px dashed var(--border-strong)', borderRadius: 'var(--r-lg)',
              padding: 10, background: 'var(--grey-50)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ color: '#D97706', display: 'flex' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{step.label || 'Conditional Branch'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(step.branches || []).map((b, bi) => (
                  <div key={bi}>
                    <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-tertiary)', margin: '0 0 4px' }}>{b.label}</p>
                    {b.steps.length === 0 ? (
                      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic', margin: '0 0 0 8px' }}>No steps — continues directly</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 8 }}>
                        {b.steps.map((s, si) => <MiniStepRow key={si} step={s} />)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <MiniStepRow step={step} />
          )}
        </div>
      ))}
      <MiniConnector />
      <FlowTerminal label="Session Starts" color="end" />
    </div>
  );
}

/* ── Workflow Template Modal ─────────────────────────────── */

function WorkflowTemplateModal({ builtinTemplates, customTemplates, currentTplId, initialMode, currentSteps, currentName, onSelect, onSave, onUpdate, onDelete, onClose }) {
  const [mode, setMode] = useState(initialMode); // 'browse' | 'save'
  const [saveName, setSaveName] = useState(currentName);
  const [search, setSearch] = useState('');

  const allTemplates = [...builtinTemplates, ...customTemplates];
  const filtered = search.trim()
    ? allTemplates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.desc?.toLowerCase().includes(search.toLowerCase()))
    : allTemplates;

  const builtinFiltered = filtered.filter(t => !t.custom);
  const customFiltered = filtered.filter(t => t.custom);

  // Preview selection (browse mode) — templates are previewed before applying
  const [previewId, setPreviewId] = useState(
    allTemplates.some(t => t.id === currentTplId) ? currentTplId : (builtinTemplates[0]?.id || null)
  );
  const previewTpl = allTemplates.find(t => t.id === previewId) || null;
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState('');

  // Save mode — offer updating the source custom template instead of creating a new one
  const currentCustomTpl = customTemplates.find(t => t.id === currentTplId) || null;
  const [saveTarget, setSaveTarget] = useState(currentCustomTpl && onUpdate ? 'update' : 'new');

  const stripIds = (steps) => steps.map(s => {
    const { id, ...rest } = s;
    if (rest.branches) rest.branches = rest.branches.map(b => {
      const { id: bid, ...brest } = b;
      return { ...brest, steps: stripIds(b.steps) };
    });
    return rest;
  });

  const handleSave = () => {
    if (!saveName.trim()) return;
    const payload = {
      name: saveName.trim(),
      desc: `Custom template — ${currentSteps.length} steps`,
      custom: true,
      steps: stripIds(currentSteps),
    };
    if (saveTarget === 'update' && currentCustomTpl && onUpdate) {
      onUpdate({ ...currentCustomTpl, ...payload });
      onClose();
    } else if (onSave) {
      onSave({ id: `custom_${Date.now()}`, ...payload });
    }
  };

  const handleRename = () => {
    if (!renameVal.trim() || !previewTpl || !onUpdate) return;
    onUpdate({ ...previewTpl, name: renameVal.trim() });
    setRenaming(false);
  };

  const handleDelete = (id) => {
    onDelete(id);
    if (previewId === id) setPreviewId(builtinTemplates[0]?.id || null);
    setRenaming(false);
  };

  // Count steps including branch sub-steps
  const countSteps = (steps) => steps.reduce((n, s) => {
    let c = 1;
    if (s.branches) s.branches.forEach(b => { c += countSteps(b.steps); });
    return n + c;
  }, 0);

  const renderListItem = (tpl) => {
    const isApplied = tpl.id === currentTplId;
    const isPreviewed = tpl.id === previewId;
    return (
      <button
        key={tpl.id}
        onClick={() => { setPreviewId(tpl.id); setRenaming(false); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '9px 12px', textAlign: 'left',
          background: isPreviewed ? 'var(--brand-50)' : 'transparent',
          border: `1.5px solid ${isPreviewed ? 'var(--brand)' : 'transparent'}`,
          borderRadius: 'var(--r-md)', cursor: 'pointer', transition: 'all 120ms',
        }}
        onMouseEnter={e => { if (!isPreviewed) e.currentTarget.style.background = 'var(--grey-100)'; }}
        onMouseLeave={e => { if (!isPreviewed) e.currentTarget.style.background = 'transparent'; }}
      >
        <span style={{ color: 'var(--brand)', display: 'flex', flexShrink: 0 }}>{tpl.icon || (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        )}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tpl.name}</span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{countSteps(tpl.steps)} steps</span>
        </span>
        {isApplied && (
          <span title="Currently applied" style={{ display: 'flex', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
          </span>
        )}
      </button>
    );
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)',
    }} onClick={onClose}>
      <div
        style={{
          background: 'white', borderRadius: 'var(--r-xl)',
          width: '100%', maxWidth: mode === 'browse' ? 880 : 680,
          height: mode === 'browse' ? 'min(640px, 85vh)' : 'auto', maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          animation: 'slideUp 200ms ease both',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {mode === 'save' ? 'Save as Template' : 'Workflow Templates'}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              {mode === 'save' ? 'Save the current workflow as a reusable template.' : 'Choose a starting point for your intake flow.'}
            </p>
          </div>
          <button
            className="btn-icon"
            style={{ width: 32, height: 32 }}
            onClick={onClose}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        {mode === 'browse' ? (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', minHeight: 0 }}>
            {/* Left: searchable template list */}
            <div style={{ width: 268, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ padding: '14px 14px 10px', flexShrink: 0 }}>
                <div style={{ position: 'relative' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search templates..."
                    className="input"
                    style={{ paddingLeft: 32, height: 34, fontSize: 13 }}
                  />
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 14px' }}>
                {builtinFiltered.length > 0 && (
                  <>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)', margin: '4px 4px 6px' }}>Built-in</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {builtinFiltered.map(renderListItem)}
                    </div>
                  </>
                )}
                {customFiltered.length > 0 && (
                  <>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)', margin: '14px 4px 6px' }}>Custom</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {customFiltered.map(renderListItem)}
                    </div>
                  </>
                )}
                {filtered.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-tertiary)', fontSize: 12.5 }}>
                    No templates match "{search}"
                  </div>
                )}
              </div>
              {onSave && (
                <div style={{ padding: 12, borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                  <button
                    className="btn btn-secondary btn-xs"
                    onClick={() => setMode('save')}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Save Current as Template
                  </button>
                </div>
              )}
            </div>

            {/* Right: preview pane */}
            {previewTpl ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
                {/* Preview header */}
                <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                  {renaming ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        className="input"
                        autoFocus
                        value={renameVal}
                        onChange={e => setRenameVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(false); }}
                        style={{ height: 32, fontSize: 13, maxWidth: 280 }}
                      />
                      <button className="btn btn-primary btn-xs" onClick={handleRename} disabled={!renameVal.trim()}>Save</button>
                      <button className="btn btn-ghost btn-xs" onClick={() => setRenaming(false)}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{previewTpl.name}</h4>
                      {previewTpl.custom && <span className="badge badge-info" style={{ fontSize: 10 }}>Custom</span>}
                      {previewTpl.id === currentTplId && <span className="badge badge-success" style={{ fontSize: 10 }}>Applied</span>}
                      <span style={{ flex: 1 }} />
                      {previewTpl.custom && onUpdate && (
                        <button
                          className="btn-icon"
                          title="Rename template"
                          style={{ width: 26, height: 26 }}
                          onClick={() => { setRenameVal(previewTpl.name); setRenaming(true); }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                        </button>
                      )}
                      {previewTpl.custom && onDelete && (
                        <button
                          className="btn-icon danger"
                          title="Delete template"
                          style={{ width: 26, height: 26 }}
                          onClick={() => handleDelete(previewTpl.id)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      )}
                    </div>
                  )}
                  {previewTpl.desc && <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45, margin: '6px 0 0' }}>{previewTpl.desc}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>
                      {countSteps(previewTpl.steps)} step{countSteps(previewTpl.steps) !== 1 ? 's' : ''}
                    </span>
                    {previewTpl.steps.some(s => s.type === 'conditional' || s.branches) && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--warning)', fontWeight: 600 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
                        Branching
                      </span>
                    )}
                  </div>
                </div>

                {/* Step flow preview */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', background: 'var(--grey-100)' }}>
                  <div style={{ maxWidth: 400, margin: '0 auto' }}>
                    <TemplateMiniFlow steps={previewTpl.steps} />
                  </div>
                </div>

                {/* Apply footer */}
                <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <p style={{ flex: 1, fontSize: 11.5, color: 'var(--text-tertiary)', margin: 0 }}>
                    {previewTpl.id === currentTplId
                      ? 'This template is currently applied. Re-applying resets any customizations.'
                      : currentSteps.length > 0
                        ? `Applying replaces your current workflow (${currentSteps.length} step${currentSteps.length !== 1 ? 's' : ''}).`
                        : 'Applying sets this as your workflow starting point.'}
                  </p>
                  <button className="btn btn-primary btn-sm" onClick={() => onSelect(previewTpl)} style={{ flexShrink: 0 }}>
                    {previewTpl.id === currentTplId ? 'Re-apply Template' : 'Use This Template'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                Select a template to preview
              </div>
            )}
          </div>
        ) : (
          /* Save mode */
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Template Name</label>
              <input
                type="text"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                placeholder="e.g. My Custom Intake"
                className="input"
                style={{ maxWidth: 400 }}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
              />
            </div>
            {currentCustomTpl && onUpdate && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Save to</label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text-primary)' }}>
                  <input type="radio" name="tpl-save-target" checked={saveTarget === 'update'} onChange={() => setSaveTarget('update')} style={{ marginTop: 2 }} />
                  <span>
                    Update "{currentCustomTpl.name}"
                    <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-tertiary)' }}>Overwrites the existing template everywhere it's used as a starting point.</span>
                  </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text-primary)' }}>
                  <input type="radio" name="tpl-save-target" checked={saveTarget === 'new'} onChange={() => setSaveTarget('new')} style={{ marginTop: 2 }} />
                  <span>
                    Save as a new template
                    <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-tertiary)' }}>Keeps "{currentCustomTpl.name}" unchanged.</span>
                  </span>
                </label>
              </div>
            )}
            <div style={{ padding: '12px 14px', background: 'var(--grey-50)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                {saveTarget === 'update' && currentCustomTpl && onUpdate
                  ? `This will replace the steps of "${currentCustomTpl.name}" with the current workflow (${currentSteps.length} step${currentSteps.length !== 1 ? 's' : ''}).`
                  : `This will save the current workflow (${currentSteps.length} step${currentSteps.length !== 1 ? 's' : ''}) as a reusable template. You can apply it to other workflows later.`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => initialMode === 'save' ? onClose() : setMode('browse')}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={!saveName.trim()}>
                {saveTarget === 'update' && currentCustomTpl && onUpdate ? 'Update Template' : 'Save Template'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Workflow Customizer ─────────────────────────────── */

export default function WorkflowCustomizer({ workflow, onChange, clinic, customTemplates = [], onSaveTemplate, onUpdateTemplate, onDeleteTemplate, access, onConfigureAccess, accessScopeLabel }) {
  const [addingAtIndex, setAddingAtIndex] = useState(null);
  const [dragFrom, setDragFrom] = useState(null);
  const [showTplModal, setShowTplModal] = useState(false);
  const steps = normalizeSteps(workflow?.steps || []);
  const guestAllowed = accessConfig(access).allowGuest;

  const updateStep = (index, updated) => {
    const newSteps = steps.map((s, i) => i === index ? updated : s);
    onChange({ ...workflow, steps: newSteps });
  };

  const deleteStep = (index) => {
    onChange({ ...workflow, steps: steps.filter((_, i) => i !== index) });
    if (addingAtIndex > index) setAddingAtIndex(addingAtIndex - 1);
  };

  const moveStep = (from, to) => {
    const newSteps = [...steps];
    const [moved] = newSteps.splice(from, 1);
    newSteps.splice(to, 0, moved);
    onChange({ ...workflow, steps: newSteps });
  };

  const dropAtSlot = (slotIndex) => {
    if (dragFrom === null) return;
    // slotIndex = position *before* which the item should land
    // If dragging down, the target shifts after removal
    let to = slotIndex;
    if (dragFrom < slotIndex) to -= 1;
    if (dragFrom !== to) moveStep(dragFrom, to);
    setDragFrom(null);
  };

  const insertStep = (index, type) => {
    const newStep = createStep(type, clinic);
    const newSteps = [...steps];
    newSteps.splice(index, 0, newStep);
    onChange({ ...workflow, steps: newSteps });
    setAddingAtIndex(null);
  };

  const allTemplates = [...WORKFLOW_TEMPLATES, ...customTemplates];
  const currentTplId = workflow?.templateId || '';
  const currentTpl = allTemplates.find(t => t.id === currentTplId);

  const applyTemplate = (tpl) => {
    onChange({
      ...workflow,
      name: tpl.name,
      templateId: tpl.id,
      steps: stampIds(tpl.steps),
    });
    setShowTplModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
      {/* Workflow template bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <label className="form-label" style={{ marginBottom: 6 }}>Workflow Template</label>
          <button
            onClick={() => setShowTplModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 420,
              padding: '8px 14px', background: 'white',
              border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
              cursor: 'pointer', textAlign: 'left', transition: 'border-color 150ms',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            {currentTpl ? (
              <>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{currentTpl.name}</span>
                {currentTpl.custom && <span className="badge badge-info" style={{ fontSize: 10 }}>Custom</span>}
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{currentTpl.steps.length} steps</span>
              </>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--text-tertiary)', flex: 1 }}>— Select a template —</span>
            )}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" style={{ flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
        {steps.length > 0 && onSaveTemplate && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowTplModal('save')}
            style={{ flexShrink: 0, height: 36, alignSelf: 'flex-end' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save as Template
          </button>
        )}
      </div>

      {/* Template modal */}
      {showTplModal && (
        <WorkflowTemplateModal
          builtinTemplates={WORKFLOW_TEMPLATES}
          customTemplates={customTemplates}
          currentTplId={currentTplId}
          initialMode={showTplModal === 'save' ? 'save' : 'browse'}
          currentSteps={steps}
          currentName={workflow?.name || ''}
          onSelect={applyTemplate}
          onSave={onSaveTemplate ? (tpl) => {
            onSaveTemplate(tpl);
            onChange({ ...workflow, name: tpl.name, templateId: tpl.id });
            setShowTplModal(false);
          } : null}
          onUpdate={onUpdateTemplate ? (tpl) => {
            onUpdateTemplate(tpl);
            if (workflow?.templateId === tpl.id) onChange({ ...workflow, name: tpl.name });
          } : null}
          onDelete={onDeleteTemplate}
          onClose={() => setShowTplModal(false)}
        />
      )}

      {/* Flow canvas */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '20px 0',
        background: 'var(--grey-100)', borderRadius: 'var(--r-xl)',
        border: '1px solid var(--border)',
        minHeight: 200,
      }}>
        <FlowGate access={access} onConfigure={onConfigureAccess} scopeLabel={accessScopeLabel} />

        {steps.length === 0 && addingAtIndex === null && (
          <>
            <Connector onAdd={() => setAddingAtIndex(0)} />
            <div className="empty-state" style={{ padding: '24px 16px', border: 'none' }}>
              <p className="empty-state-desc">No steps yet. Click + to add your first step.</p>
            </div>
          </>
        )}

        {steps.length === 0 && addingAtIndex === 0 && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 32, justifyContent: 'center' }}>
              <div style={{ width: 2, height: '100%', background: 'var(--border-strong)' }} />
            </div>
            <AddStepPicker onSelect={type => insertStep(0, type)} onCancel={() => setAddingAtIndex(null)} existingSteps={steps} />
          </>
        )}

        {steps.map((step, i) => (
          <div key={step.id} style={{ width: '100%', maxWidth: step.type === 'conditional' ? 820 : 560, display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'max-width 200ms' }}>
            {/* Connector before step (or add-step picker) */}
            {addingAtIndex === i ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 16 }}>
                  <div style={{ width: 2, height: '100%', background: 'var(--border-strong)' }} />
                </div>
                <AddStepPicker onSelect={type => insertStep(i, type)} onCancel={() => setAddingAtIndex(null)} existingSteps={steps} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 16 }}>
                  <div style={{ width: 2, height: '100%', background: 'var(--border-strong)' }} />
                </div>
              </>
            ) : (
              <Connector
                onAdd={() => setAddingAtIndex(i)}
                dropTarget={dragFrom !== null && dragFrom !== i && dragFrom !== i - 1 ? { onDrop: () => dropAtSlot(i) } : null}
              />
            )}

            {/* Step card */}
            <div style={{ width: '100%', padding: '0 20px' }}>
              <StepCard
                step={step}
                index={i}
                total={steps.length}
                onUpdate={updated => updateStep(i, updated)}
                onDelete={() => deleteStep(i)}
                onMoveUp={() => moveStep(i, i - 1)}
                onMoveDown={() => moveStep(i, i + 1)}
                clinic={clinic}
                allSteps={steps}
                guestAllowed={guestAllowed}
                access={access}
                dragHandlers={{
                  isDragging: dragFrom === i,
                  onDragStart: (e) => {
                    setAddingAtIndex(null);
                    e.dataTransfer.effectAllowed = 'move';
                    // Defer state update so browser captures drag image before layout shifts
                    requestAnimationFrame(() => setDragFrom(i));
                  },
                  onDragEnd: () => setDragFrom(null),
                }}
              />
            </div>
          </div>
        ))}

        {/* Final connector + add */}
        {steps.length > 0 && (
          addingAtIndex === steps.length ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 16 }}>
                <div style={{ width: 2, height: '100%', background: 'var(--border-strong)' }} />
              </div>
              <AddStepPicker onSelect={type => insertStep(steps.length, type)} onCancel={() => setAddingAtIndex(null)} existingSteps={steps} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 16 }}>
                <div style={{ width: 2, height: '100%', background: 'var(--border-strong)' }} />
              </div>
            </>
          ) : (
            <Connector
              onAdd={() => setAddingAtIndex(steps.length)}
              dropTarget={dragFrom !== null && dragFrom !== steps.length - 1 ? { onDrop: () => dropAtSlot(steps.length) } : null}
            />
          )
        )}

        <FlowTerminal label="Visit Complete" color="end" />
      </div>

      {/* Quick stats */}
      <div style={{ display: 'flex', gap: 16, marginTop: 14, justifyContent: 'center' }}>
        {[
          { label: 'Steps', count: countSteps(steps) },
          { label: 'Forms', count: countByType(steps, 'form') },
          { label: 'Branches', count: countByType(steps, 'conditional') },
        ].map(s => (
          <span key={s.label} style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            <strong style={{ color: 'var(--text-secondary)' }}>{s.count}</strong> {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Counting helpers ─────────────────────────────────────── */

function countSteps(steps) {
  let count = 0;
  for (const s of steps) {
    count++;
    if (s.branches) {
      for (const b of s.branches) {
        count += countSteps(b.steps || []);
      }
    }
  }
  return count;
}

function countByType(steps, type) {
  let count = 0;
  for (const s of steps) {
    if (s.type === type) count++;
    if (s.branches) {
      for (const b of s.branches) {
        count += countByType(b.steps || [], type);
      }
    }
  }
  return count;
}

/* ── Compact workflow preview (for use in visit option modal) ── */

export function WorkflowPreview({ workflow }) {
  if (!workflow?.steps?.length) return <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No steps defined</span>;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
      {workflow.steps.map((step, i) => {
        const typeDef = STEP_TYPES.find(t => t.id === step.type);
        return (
          <span key={step.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {i > 0 && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2"><polyline points="9 6 15 12 9 18"/></svg>}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 'var(--r-full)',
              background: typeDef?.bgColor, fontSize: 11, fontWeight: 600,
              color: typeDef?.color,
            }}>
              {typeDef?.icon}
              {step.label || typeDef?.label}
            </span>
          </span>
        );
      })}
    </div>
  );
}
