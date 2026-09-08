/* Workflow step metadata and construction.
 *
 * Split out of WorkflowCustomizer so the vertical editor, the graph canvas and
 * the step picker can all share it — a component file that also exports
 * constants breaks fast refresh, and these are needed in three places now.
 */

import { authMethodBranches } from './patientAccess';

/* ── SVG icon helpers ─────────────────────────────────────── */

const svgIcon = (d, sw = '2') => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw}>{d}</svg>;

/* ── Step type definitions ────────────────────────────────── */
// Categories match the VSee API: account, forms, steps, logic

export const STEP_TYPES = [
  // ── Account / Auth ──
  // Auth is not a flow step — Patient Access owns it (clinic-level, with a
  // per-room override), and the flow starts once the patient is identified.
  // These types are kept only so an un-normalized workflow can still render a
  // label and icon; all of them are hidden from the step picker.
  { id: 'account', category: 'Account', label: 'Account', color: '#0D875C', bgColor: '#ECFDF5', legacy: true,
    desc: 'Moved to Patient Access.',
    icon: svgIcon(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>),
  },
  { id: 'signup', category: 'Account', label: 'Signup', color: '#0D875C', bgColor: '#ECFDF5', legacy: true,
    desc: 'Full account registration — collects name, DOB, gender, email, address, phone, and password.',
    icon: svgIcon(<><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></>),
  },
  { id: 'signup_verification', category: 'Account', label: 'Signup Verification', color: '#0D875C', bgColor: '#ECFDF5', legacy: true,
    desc: 'Verifies the patient\'s email after registration — they enter a code sent to their inbox.',
    icon: svgIcon(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>),
  },
  { id: 'login', category: 'Account', label: 'Login', color: '#0D875C', bgColor: '#ECFDF5', legacy: true,
    desc: 'Handles user sign-in for existing patient accounts.',
    icon: svgIcon(<><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></>),
  },

  // ── Forms ──
  { id: 'form', category: 'Forms', label: 'Form', color: '#7C3AED', bgColor: '#F5F3FF',
    desc: 'A form from the clinic form library — includes intake forms, custom forms, and more.',
    icon: svgIcon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>),
  },

  // ── Steps ──
  { id: 'visit_selection', category: 'Steps', label: 'Consultation', color: '#0D875C', bgColor: '#ECFDF5',
    desc: 'Patient selects a visit type from available options.',
    singleton: true,
    icon: svgIcon(<><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>),
  },
  { id: 'dependant_list', category: 'Steps', label: 'Dependant List', color: 'var(--info)', bgColor: 'var(--info-light)',
    desc: 'Lets the patient choose who the visit is for — themselves or a family member/dependant.',
    icon: svgIcon(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>),
  },
  { id: 'scheduling', category: 'Steps', label: 'Calendar Picker', color: 'var(--info)', bgColor: 'var(--info-light)',
    desc: 'Displays appointment availability for scheduling.',
    icon: svgIcon(<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>),
  },
  { id: 'payment', category: 'Steps', label: 'Payment Options', color: 'var(--success)', bgColor: 'var(--success-light)',
    desc: 'Handles payment — patient selects or adds a credit/debit card to pay for the visit.',
    icon: svgIcon(<><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></>),
  },
  { id: 'test_device', category: 'Steps', label: 'Test Device', color: 'var(--info)', bgColor: 'var(--info-light)',
    desc: 'Tests the patient\'s camera and microphone to ensure they work before the video visit.',
    icon: svgIcon(<><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></>),
  },
  { id: 'pharmacy', category: 'Steps', label: 'Pharmacy Picker', color: '#0891B2', bgColor: '#ECFEFF',
    desc: 'Patient searches a pharmacy directory and selects where prescriptions are sent. A selector module, not a form.',
    icon: svgIcon(<><path d="M3 3h18v4H3z"/><path d="M3 7v13a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></>),
  },
  { id: 'emr', category: 'Steps', label: 'EMR', color: '#6366F1', bgColor: '#EEF2FF',
    desc: 'Pulls and verifies patient info from the electronic medical record system.',
    icon: svgIcon(<><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></>),
  },
  { id: 'setup_session', category: 'Steps', label: 'Setup Session', color: 'var(--grey-600)', bgColor: 'var(--grey-100)',
    desc: 'Creates the visit session on the backend — required before patient enters the waiting room.',
    icon: svgIcon(<><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></>),
  },
  { id: 'confirmation', category: 'Steps', label: 'Confirmation', color: 'var(--success)', bgColor: 'var(--success-light)',
    desc: 'Final step — shows a summary of the scheduled appointment with provider and time details.',
    icon: svgIcon(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>),
  },
  { id: 'walkin_confirmation', category: 'Steps', label: 'Walk-in Confirmation', color: 'var(--success)', bgColor: 'var(--success-light)',
    desc: 'Final step for walk-ins — confirms the patient has been placed in the waiting room.',
    icon: svgIcon(<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>),
  },

  // ── Logic ──
  { id: 'conditional', category: 'Logic', label: 'Conditional Branch', color: '#D97706', bgColor: 'var(--warning-light)',
    desc: 'Branch the workflow based on patient type or insurance status.',
    icon: svgIcon(<><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></>),
  },
];


export const CONDITION_TYPES = [
  { id: 'patient_type',     label: 'Patient Type',        hint: 'Clinic Patient Types' },
  { id: 'insurance_status', label: 'Insurance Status',    hint: 'eligibility verification results' },
  { id: 'visit_mode',       label: 'Visit Mode',          hint: 'how the visit is delivered' },
  { id: 'patient_status',   label: 'New vs Returning',    hint: 'whether the patient has visited before' },
  { id: 'visit_for',        label: 'Who the Visit Is For', hint: 'the patient or a dependant' },
  { id: 'age_group',        label: 'Age Group',           hint: 'age bands' },
  { id: 'clinic_hours',     label: 'Clinic Hours',        hint: "the room's operating hours" },
  { id: 'form_answer',      label: 'Answer to a Form Question', hint: 'the selected form field' },
  { id: 'auth_method',      label: 'How the Patient Signed In', hint: "the room's Patient Access settings" },
  { id: 'rule',             label: 'Custom Rule (lo-code)',     hint: 'rules you write' },
];

// Fixed branch sets per condition type (patient_type is derived from the clinic).
const STATIC_BRANCHES = {
  insurance_status: [
    { id: 'eligible',     label: 'Eligible' },
    { id: 'not_eligible', label: 'Not Eligible' },
    { id: 'pending',      label: 'Pending' },
    { id: 'error',        label: 'Error' },
  ],
  visit_mode: [
    { id: 'video',      label: 'Video' },
    { id: 'phone',      label: 'Phone' },
    { id: 'in_person',  label: 'In-person' },
    { id: 'e_consult',  label: 'E-Consult' },
  ],
  patient_status: [
    { id: 'new',       label: 'New Patient' },
    { id: 'returning', label: 'Returning Patient' },
  ],
  visit_for: [
    { id: 'self',      label: 'Themselves' },
    { id: 'dependant', label: 'A Dependant' },
  ],
  age_group: [
    { id: 'adult', label: 'Adult (18+)' },
    { id: 'minor', label: 'Minor (under 18)' },
  ],
  clinic_hours: [
    { id: 'open_hours',  label: 'During Open Hours' },
    { id: 'after_hours', label: 'After Hours' },
  ],
  form_answer: [
    { id: 'yes',          label: 'Answered Yes' },
    { id: 'no',           label: 'Answered No' },
    { id: 'not_answered', label: 'Not Answered' },
  ],
};

const PT_LABELS = {
  'self-pay': 'Self-Pay',
  'insurance': 'Insurance',
  'group-covered': 'Group-Covered',
};

export function branchesForCondition(conditionType, clinic) {
  if (conditionType === 'patient_type') {
    return (clinic?.patientTypes || []).map(pt => ({
      id: uid(),
      condition: pt,
      label: PT_LABELS[pt] || pt,
      steps: [],
    }));
  }
  /* Rule branches are ordered and evaluated top-down, so unlike the derived
     condition types they are neither exhaustive nor mutually exclusive — hence
     the permanent Otherwise branch at the end. */
  if (conditionType === 'rule') {
    return [
      { id: uid(), kind: 'rule', label: 'Rule 1', expr: '', rule: null, steps: [] },
      { id: uid(), kind: 'otherwise', label: 'Otherwise', steps: [] },
    ];
  }
  // Only the sign-in outcomes the clinic's Patient Access actually allows.
  if (conditionType === 'auth_method') {
    return authMethodBranches(clinic).map(b => ({ id: uid(), condition: b.id, label: b.label, steps: [] }));
  }
  const set = STATIC_BRANCHES[conditionType];
  if (set) {
    return set.map(s => ({ id: uid(), condition: s.id, label: s.label, steps: [] }));
  }
  return [];
}

export const uid = () => `step_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

/* ── Create step helper ───────────────────────────────────── */

export function createStep(type, clinic) {
  const base = { id: uid(), type };
  const typeDef = STEP_TYPES.find(t => t.id === type);
  const label = typeDef?.label || type;

  switch (type) {
    case 'form':
      return { ...base, label: 'Form', formId: null };
    case 'pharmacy':
      return { ...base, label, allowSearch: true, showMap: true, allowMailOrder: true, allowSkip: true };
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

/* Switching what a conditional branches on rebuilds its branch set, keeping any
   steps whose branch survives the change (matched by condition key). Shared by
   the vertical editor and the graph inspector so they can't drift. */
export function changeConditionType(step, newType, clinic) {
  const newBranches = branchesForCondition(newType, clinic);
  const oldMap = {};
  for (const b of (step.branches || [])) {
    if (b.condition) oldMap[b.condition] = b.steps || [];
  }
  for (const b of newBranches) {
    if (oldMap[b.condition]) b.steps = oldMap[b.condition];
  }
  // Keep the step name in sync while it is still auto-generated; a name the
  // admin typed themselves is left alone.
  const autoLabels = CONDITION_TYPES.map(ct => `By ${ct.label}`);
  const label = (!step.label || step.label === 'Conditional Branch' || autoLabels.includes(step.label))
    ? `By ${CONDITION_TYPES.find(ct => ct.id === newType)?.label || 'Condition'}`
    : step.label;
  const next = { ...step, conditionType: newType, branches: newBranches, label };
  if (newType !== 'form_answer') { delete next.conditionFormId; delete next.conditionFieldId; }
  return next;
}

/* Swapping a step's type rebuilds it from scratch — every type carries its own
   settings, so carrying the old ones over would leave orphaned fields behind.
   The id survives so selection, copy buffers and edges keep pointing at it. */
export function changeStepType(step, newType, clinic) {
  if (step.type === newType) return step;
  return { ...createStep(newType, clinic), id: step.id };
}

/* Every type in use anywhere in the tree, branches included — a singleton is
   used up wherever it sits. */
export function usedStepTypes(steps, out = new Set()) {
  for (const s of steps || []) {
    out.add(s.type);
    if (s.branches) s.branches.forEach(b => usedStepTypes(b.steps, out));
  }
  return out;
}
