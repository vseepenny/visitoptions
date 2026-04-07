import { useState } from 'react';

/* ── SVG icon helpers ─────────────────────────────────────── */

const I = (d, sw = '2') => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw}>{d}</svg>;

/* ── Step type definitions ────────────────────────────────── */
// Categories match the VSee API: account, forms, steps, logic

const STEP_TYPES = [
  // ── Account / Auth ──
  { id: 'signup', category: 'Account', label: 'Signup', color: '#0D875C', bgColor: '#ECFDF5',
    desc: 'Full account registration — collects name, DOB, gender, email, address, phone, and password.',
    autoPair: 'signup_verification',
    icon: I(<><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></>),
  },
  { id: 'signup_verification', category: 'Account', label: 'Signup Verification', color: '#0D875C', bgColor: '#ECFDF5',
    desc: 'Verifies the patient\'s email after registration — they enter a code sent to their inbox.',
    icon: I(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>),
  },
  { id: 'login', category: 'Account', label: 'Login', color: '#0D875C', bgColor: '#ECFDF5',
    desc: 'Handles user sign-in for existing patient accounts.',
    icon: I(<><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></>),
  },

  // ── Forms ──
  { id: 'form', category: 'Forms', label: 'Form', color: '#7C3AED', bgColor: '#F5F3FF',
    desc: 'A form from the clinic form library — includes intake forms, custom forms, and more.',
    icon: I(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>),
  },

  // ── Steps ──
  { id: 'visit_selection', category: 'Steps', label: 'Consultation', color: '#0D875C', bgColor: '#ECFDF5',
    desc: 'Patient selects a visit type from available options.',
    singleton: true,
    icon: I(<><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>),
  },
  { id: 'dependant_list', category: 'Steps', label: 'Dependant List', color: 'var(--info)', bgColor: 'var(--info-light)',
    desc: 'Lets the patient choose who the visit is for — themselves or a family member/dependant.',
    icon: I(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>),
  },
  { id: 'scheduling', category: 'Steps', label: 'Calendar Picker', color: 'var(--info)', bgColor: 'var(--info-light)',
    desc: 'Displays appointment availability for scheduling.',
    icon: I(<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>),
  },
  { id: 'payment', category: 'Steps', label: 'Payment Options', color: 'var(--success)', bgColor: 'var(--success-light)',
    desc: 'Handles payment — patient selects or adds a credit/debit card to pay for the visit.',
    icon: I(<><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></>),
  },
  { id: 'test_device', category: 'Steps', label: 'Test Device', color: 'var(--info)', bgColor: 'var(--info-light)',
    desc: 'Tests the patient\'s camera and microphone to ensure they work before the video visit.',
    icon: I(<><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></>),
  },
  { id: 'emr', category: 'Steps', label: 'EMR', color: '#6366F1', bgColor: '#EEF2FF',
    desc: 'Pulls and verifies patient info from the electronic medical record system.',
    icon: I(<><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></>),
  },
  { id: 'setup_session', category: 'Steps', label: 'Setup Session', color: 'var(--grey-600)', bgColor: 'var(--grey-100)',
    desc: 'Creates the visit session on the backend — required before patient enters the waiting room.',
    icon: I(<><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></>),
  },
  { id: 'confirmation', category: 'Steps', label: 'Confirmation', color: 'var(--success)', bgColor: 'var(--success-light)',
    desc: 'Final step — shows a summary of the scheduled appointment with provider and time details.',
    icon: I(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>),
  },
  { id: 'walkin_confirmation', category: 'Steps', label: 'Walk-in Confirmation', color: 'var(--success)', bgColor: 'var(--success-light)',
    desc: 'Final step for walk-ins — confirms the patient has been placed in the waiting room.',
    icon: I(<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>),
  },

  // ── Logic ──
  { id: 'conditional', category: 'Logic', label: 'Conditional Branch', color: '#D97706', bgColor: 'var(--warning-light)',
    desc: 'Branch the workflow based on patient type or insurance status.',
    icon: I(<><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></>),
  },
];


const CONDITION_TYPES = [
  { id: 'patient_type', label: 'Patient Type' },
  { id: 'insurance_status', label: 'Insurance Status' },
];

const PT_LABELS = {
  'self-pay': 'Self-Pay',
  'insurance': 'Insurance',
  'group-covered': 'Group-Covered',
};

const INSURANCE_STATUSES = [
  { id: 'eligible', label: 'Eligible' },
  { id: 'not_eligible', label: 'Not Eligible' },
  { id: 'pending', label: 'Pending' },
  { id: 'error', label: 'Error' },
];

function branchesForCondition(conditionType, clinic) {
  if (conditionType === 'patient_type') {
    return (clinic?.patientTypes || []).map(pt => ({
      id: uid(),
      condition: pt,
      label: PT_LABELS[pt] || pt,
      steps: [],
    }));
  }
  if (conditionType === 'insurance_status') {
    return INSURANCE_STATUSES.map(s => ({
      id: uid(),
      condition: s.id,
      label: s.label,
      steps: [],
    }));
  }
  return [];
}

const BUILTIN_FORMS = [
  { id: '_intake_form',       name: 'Intake Form',       desc: 'Basic patient intake — demographics, contact info, reason for visit, and file attachments.' },
  { id: '_guest_intake',      name: 'Guest Intake',      desc: 'Simplified intake for walk-in guests — health concern and optional file attachments.' },
  { id: '_insurance_form',    name: 'Insurance Form',    desc: 'Insurance carrier, subscriber ID, group number, guarantor, and card photo uploads.' },
  { id: '_guarantor',         name: 'Guarantor',         desc: 'Billing/responsible party details — name, relationship, contact info, and address.' },
  { id: '_pharmacy',          name: 'Pharmacy',          desc: 'Patient\'s preferred pharmacy for prescriptions.' },
  { id: '_emergency_contact', name: 'Emergency Contact', desc: 'Emergency contact person\'s name, relationship, phone, and address.' },
  { id: '_create_dependant',  name: 'Create Dependant',  desc: 'Register a new family member/dependant under the patient\'s account.' },
  { id: '_cancel_survey',     name: 'Cancel Intake Survey', desc: 'Asks the patient why they\'re cancelling the intake.' },
];

const uid = () => `step_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

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
    desc: 'Full intake with login, scheduling, intake form, payment branching, device test, and confirmation.',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
    steps: [
      { type: 'login', label: 'Login' },
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
      { type: 'form', label: 'Pharmacy', formId: '_pharmacy' },
      { type: 'form', label: 'Emergency Contact', formId: '_emergency_contact' },
      { type: 'test_device', label: 'Test Device' },
      { type: 'setup_session', label: 'Setup Session' },
      { type: 'confirmation', label: 'Confirmation' },
    ],
  },
  {
    id: 'tpl_quick_walkin',
    name: 'Quick Walk-in',
    desc: 'Minimal steps for walk-in urgent care — signup, guest intake, device test, straight to waiting room.',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    steps: [
      { type: 'signup', label: 'Signup' },
      { type: 'signup_verification', label: 'Signup Verification' },
      { type: 'form', label: 'Guest Intake', formId: '_guest_intake' },
      { type: 'test_device', label: 'Test Device' },
      { type: 'setup_session', label: 'Setup Session' },
      { type: 'walkin_confirmation', label: 'Walk-in Confirmation' },
    ],
  },
  {
    id: 'tpl_scheduled',
    name: 'Scheduled Visit',
    desc: 'Login, pick a visit, schedule, intake form, payment, and confirmation. No walk-in path.',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    steps: [
      { type: 'login', label: 'Login' },
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
      { type: 'login', label: 'Login' },
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
      { type: 'login', label: 'Login' },
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
  const existingTypes = existingSteps.map(s => s.type);
  const available = STEP_TYPES.filter(st => !st.singleton || !existingTypes.includes(st.id));

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

function StepCard({ step, index, total, onUpdate, onDelete, onMoveUp, onMoveDown, clinic, depth = 0, dragHandlers }) {
  const [expanded, setExpanded] = useState(step.type === 'conditional');
  const typeDef = STEP_TYPES.find(t => t.id === step.type);

  return (
    <div style={{
      border: `1px solid ${step.type === 'conditional' ? 'var(--warning)' : 'var(--border)'}`,
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
        borderBottom: expanded && step.type === 'conditional' ? '1px solid var(--border)' : 'none',
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
                {[...BUILTIN_FORMS, ...(clinic?.formLibrary || [])].find(f => f.id === step.formId)?.name || step.formId}
              </span>
            )}
            {step.type === 'conditional' && (
              <span className="badge badge-warning" style={{ fontSize: 10 }}>
                {CONDITION_TYPES.find(ct => ct.id === step.conditionType)?.label || step.conditionType} · {step.branches?.length || 0} branches
              </span>
            )}
            {typeDef?.category && typeDef.category !== 'Logic' && (
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 500 }}>{typeDef.category}</span>
            )}
          </div>
        </div>

        {/* Actions: expand + delete on right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {step.type === 'conditional' && (
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
                const allForms = [...BUILTIN_FORMS, ...(clinic?.formLibrary || [])];
                const form = allForms.find(f => f.id === formId);
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

      {step.type !== 'form' && step.type !== 'conditional' && typeDef?.desc && (
        <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
          {typeDef.desc}
        </div>
      )}

      {/* Conditional branches */}
      {step.type === 'conditional' && expanded && (
        <ConditionalBranches
          step={step}
          onUpdate={onUpdate}
          clinic={clinic}
          depth={depth}
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

function ConditionalBranches({ step, onUpdate, clinic, depth }) {
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

  // When condition type changes, rebuild branches from known values,
  // preserving steps from any old branches that match by condition key
  const handleConditionTypeChange = (newType) => {
    const newBranches = branchesForCondition(newType, clinic);
    const oldMap = {};
    for (const b of (step.branches || [])) {
      if (b.condition) oldMap[b.condition] = b.steps || [];
    }
    for (const b of newBranches) {
      if (oldMap[b.condition]) b.steps = oldMap[b.condition];
    }
    onUpdate({ ...step, conditionType: newType, branches: newBranches });
  };

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

  const [activeTab, setActiveTab] = useState(0);
  const branches = step.branches || [];
  const safeBi = Math.min(activeTab, branches.length - 1);

  const BRANCH_COLORS = ['#0D875C', '#2563EB', '#7C3AED', '#D97706', '#DC2626', '#0891B2', '#4F46E5', '#BE185D'];

  const renderBranchContent = (branch, bi) => (
    <>
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
          />
        </div>
      )}
    </>
  );

  return (
    <div style={{ padding: '14px' }}>
      {/* Condition selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Branch on:</label>
        <select
          value={step.conditionType || 'patient_type'}
          onChange={e => handleConditionTypeChange(e.target.value)}
          className="input"
          style={{ height: 32, fontSize: 12, padding: '0 28px 0 8px', maxWidth: 200 }}
        >
          {CONDITION_TYPES.map(ct => <option key={ct.id} value={ct.id}>{ct.label}</option>)}
        </select>
      </div>

      {/* Branch tabs */}
      <div style={{
        display: 'flex', gap: 0, borderBottom: '2px solid var(--border)',
        marginBottom: 0, overflowX: 'auto',
      }}>
        {branches.map((branch, bi) => {
          const color = BRANCH_COLORS[bi % BRANCH_COLORS.length];
          const isActive = safeBi === bi;
          const stepCount = branch.steps.length;
          return (
            <button
              key={branch.id}
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
        Branches are auto-populated from {step.conditionType === 'patient_type' ? 'Clinic Patient Types' : 'known statuses'}.
      </p>
    </div>
  );
}

/* ── Create step helper ───────────────────────────────────── */

function createStep(type, clinic) {
  const base = { id: uid(), type };
  const typeDef = STEP_TYPES.find(t => t.id === type);
  const label = typeDef?.label || type;

  switch (type) {
    case 'form':
      return { ...base, label: 'Form', formId: null };
    case 'conditional':
      return {
        ...base,
        label: 'Conditional Branch',
        conditionType: 'patient_type',
        branches: branchesForCondition('patient_type', clinic),
      };
    default:
      return { ...base, label };
  }
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

/* ── Workflow Template Modal ─────────────────────────────── */

function WorkflowTemplateModal({ builtinTemplates, customTemplates, currentTplId, initialMode, currentSteps, currentName, onSelect, onSave, onDelete, onClose }) {
  const [mode, setMode] = useState(initialMode); // 'browse' | 'save'
  const [saveName, setSaveName] = useState(currentName);
  const [search, setSearch] = useState('');

  const allTemplates = [...builtinTemplates, ...customTemplates];
  const filtered = search.trim()
    ? allTemplates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.desc?.toLowerCase().includes(search.toLowerCase()))
    : allTemplates;

  const builtinFiltered = filtered.filter(t => !t.custom);
  const customFiltered = filtered.filter(t => t.custom);

  const handleSave = () => {
    if (!saveName.trim() || !onSave) return;
    const stripIds = (steps) => steps.map(s => {
      const { id, ...rest } = s;
      if (rest.branches) rest.branches = rest.branches.map(b => {
        const { id: bid, ...brest } = b;
        return { ...brest, steps: stripIds(b.steps) };
      });
      return rest;
    });
    onSave({
      id: `custom_${Date.now()}`,
      name: saveName.trim(),
      desc: `Custom template — ${currentSteps.length} steps`,
      custom: true,
      steps: stripIds(currentSteps),
    });
  };

  // Count steps including branch sub-steps
  const countSteps = (steps) => steps.reduce((n, s) => {
    let c = 1;
    if (s.branches) s.branches.forEach(b => { c += countSteps(b.steps); });
    return n + c;
  }, 0);

  const renderCard = (tpl) => {
    const isActive = tpl.id === currentTplId;
    const totalSteps = countSteps(tpl.steps);
    const hasBranch = tpl.steps.some(s => s.type === 'conditional' || s.branches);
    return (
      <div
        key={tpl.id}
        style={{
          display: 'flex', flexDirection: 'column', gap: 8,
          padding: '16px',
          background: isActive ? 'var(--brand-50)' : 'white',
          border: `1.5px solid ${isActive ? 'var(--brand)' : 'var(--border)'}`,
          borderRadius: 'var(--r-lg)',
          cursor: 'pointer',
          transition: 'all 150ms',
          position: 'relative',
        }}
        onClick={() => onSelect(tpl)}
        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}}
      >
        {isActive && (
          <span style={{ position: 'absolute', top: 10, right: 12 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
          </span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--brand)', display: 'flex', flexShrink: 0 }}>{tpl.icon || (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          )}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{tpl.name}</span>
          {tpl.custom && <span className="badge badge-info" style={{ fontSize: 10 }}>Custom</span>}
        </div>
        {tpl.desc && <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>{tpl.desc}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>
            {totalSteps} step{totalSteps !== 1 ? 's' : ''}
          </span>
          {hasBranch && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--warning)', fontWeight: 600 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
              Branching
            </span>
          )}
          {/* Step type summary */}
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
            {tpl.steps.filter(s => s.type !== 'conditional').map(s => s.label).slice(0, 4).join(' → ')}{tpl.steps.length > 4 ? ' → …' : ''}
          </span>
        </div>
        {tpl.custom && onDelete && (
          <button
            className="btn-icon danger"
            style={{ position: 'absolute', bottom: 12, right: 12, width: 24, height: 24 }}
            onClick={(e) => { e.stopPropagation(); onDelete(tpl.id); }}
            title="Delete custom template"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        )}
      </div>
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
          width: '100%', maxWidth: 680, maxHeight: '85vh',
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
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Search + tabs */}
            <div style={{ padding: '14px 24px 0', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ position: 'relative', flex: 1 }}>
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
              {onSave && (
                <button
                  className="btn btn-secondary btn-xs"
                  onClick={() => setMode('save')}
                  style={{ flexShrink: 0 }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Save Current
                </button>
              )}
            </div>

            {/* Template grid */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 24px 24px' }}>
              {builtinFiltered.length > 0 && (
                <>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)', marginBottom: 8 }}>Built-in</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10, marginBottom: 18 }}>
                    {builtinFiltered.map(renderCard)}
                  </div>
                </>
              )}
              {customFiltered.length > 0 && (
                <>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)', marginBottom: 8 }}>Custom</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                    {customFiltered.map(renderCard)}
                  </div>
                </>
              )}
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: 13 }}>
                  No templates match "{search}"
                </div>
              )}
            </div>
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
            <div style={{ padding: '12px 14px', background: 'var(--grey-50)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                This will save the current workflow ({currentSteps.length} step{currentSteps.length !== 1 ? 's' : ''}) as a reusable template. You can apply it to other workflows later.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => initialMode === 'save' ? onClose() : setMode('browse')}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={!saveName.trim()}>
                Save Template
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Workflow Customizer ─────────────────────────────── */

export default function WorkflowCustomizer({ workflow, onChange, clinic, customTemplates = [], onSaveTemplate, onDeleteTemplate }) {
  const [addingAtIndex, setAddingAtIndex] = useState(null);
  const [dragFrom, setDragFrom] = useState(null);
  const [showTplModal, setShowTplModal] = useState(false);
  const steps = workflow?.steps || [];

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
        <FlowTerminal label="Patient Enters" color="start" />

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
