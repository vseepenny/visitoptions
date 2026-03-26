import { useState } from 'react';

/* ── Step type definitions ────────────────────────────────── */

const STEP_TYPES = [
  { id: 'visit_selection', label: 'Visit Option Selection', color: '#0D875C', bgColor: '#ECFDF5', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
  ), singleton: true },
  { id: 'scheduling', label: 'Appointment Scheduling', color: 'var(--info)', bgColor: 'var(--info-light)', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
  )},
  { id: 'form', label: 'Form', color: '#7C3AED', bgColor: '#F5F3FF', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
  )},
  { id: 'payment', label: 'Payment Collection', color: 'var(--success)', bgColor: 'var(--success-light)', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
  )},
  { id: 'conditional', label: 'Conditional Branch', color: '#D97706', bgColor: 'var(--warning-light)', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></svg>
  )},
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

const uid = () => `step_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

/* ── Connector line between steps ─────────────────────────── */

function Connector({ onAdd }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', height: 32 }}>
      <div style={{ width: 2, height: '100%', background: 'var(--border-strong)' }} />
      <button
        onClick={onAdd}
        title="Add step"
        style={{
          position: 'absolute', top: '50%', transform: 'translateY(-50%)',
          width: 22, height: 22, borderRadius: '50%',
          background: 'white', border: '1.5px dashed var(--border-strong)',
          color: 'var(--text-tertiary)', fontSize: 16, lineHeight: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 150ms',
          zIndex: 1,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; e.currentTarget.style.background = 'var(--brand-50)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'white'; }}
      >+</button>
    </div>
  );
}

/* ── Add Step Picker (inline dropdown) ────────────────────── */

function AddStepPicker({ onSelect, onCancel, existingSteps = [] }) {
  const existingTypes = existingSteps.map(s => s.type);
  const available = STEP_TYPES.filter(st => !st.singleton || !existingTypes.includes(st.id));

  return (
    <div style={{
      background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--shadow-md)', padding: 8, display: 'flex', flexDirection: 'column', gap: 4,
      minWidth: 240, animation: 'slideUp 150ms ease both',
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)', padding: '4px 8px' }}>Add Step</p>
      {available.map(st => (
        <button
          key={st.id}
          onClick={() => onSelect(st.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
            background: 'none', border: 'none', borderRadius: 'var(--r-md)',
            cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
            transition: 'background 100ms',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--grey-100)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <span style={{ color: st.color, display: 'flex' }}>{st.icon}</span>
          {st.label}
        </button>
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

function StepCard({ step, index, total, onUpdate, onDelete, onMoveUp, onMoveDown, clinic, depth = 0 }) {
  const [expanded, setExpanded] = useState(step.type === 'conditional');
  const typeDef = STEP_TYPES.find(t => t.id === step.type);

  return (
    <div style={{
      border: `1px solid ${step.type === 'conditional' ? 'var(--warning)' : 'var(--border)'}`,
      borderRadius: 'var(--r-lg)',
      background: 'white',
      overflow: 'hidden',
      transition: 'all 150ms',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        background: typeDef?.bgColor ?? 'var(--grey-100)',
        borderBottom: expanded && step.type === 'conditional' ? '1px solid var(--border)' : 'none',
      }}>
        {/* Drag handle placeholder */}
        <span style={{ color: 'var(--text-tertiary)', cursor: 'grab', display: 'flex', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
        </span>

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
                {clinic?.formLibrary?.find(f => f.id === step.formId)?.name || step.formId}
              </span>
            )}
            {step.type === 'conditional' && (
              <span className="badge badge-warning" style={{ fontSize: 10 }}>
                {CONDITION_TYPES.find(ct => ct.id === step.conditionType)?.label || step.conditionType} · {step.branches?.length || 0} branches
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {index > 0 && (
            <button className="btn-icon" style={{ width: 26, height: 26 }} onClick={onMoveUp} title="Move up">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
          )}
          {index < total - 1 && (
            <button className="btn-icon" style={{ width: 26, height: 26 }} onClick={onMoveDown} title="Move down">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          )}
          {step.type === 'conditional' && (
            <button className="btn-icon" style={{ width: 26, height: 26 }} onClick={() => setExpanded(!expanded)} title={expanded ? 'Collapse' : 'Expand'}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                {expanded ? <polyline points="6 9 12 15 18 9"/> : <polyline points="9 6 15 12 9 18"/>}
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
                const form = clinic?.formLibrary?.find(f => f.id === formId);
                onUpdate({ ...step, formId, label: form?.name || step.label });
              }}
              className="input"
              style={{ height: 32, fontSize: 12, padding: '0 28px 0 8px', width: 240 }}
            >
              <option value="">— Select a form —</option>
              {clinic?.formLibrary?.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>
      )}

      {step.type === 'scheduling' && (
        <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
          Patient selects an available appointment time slot based on provider availability.
        </div>
      )}

      {step.type === 'visit_selection' && (
        <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
          Patient selects a visit type from available options. Steps before this are completed before choosing; steps after follow the selected visit's workflow.
        </div>
      )}

      {step.type === 'payment' && (
        <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
          Payment collection per clinic payment settings. Amount determined by visit option pricing rules.
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

/* ── Conditional Branches Editor ──────────────────────────── */

function ConditionalBranches({ step, onUpdate, clinic, depth }) {
  const [addingAt, setAddingAt] = useState(null); // { branchIndex, insertIndex }

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

      {/* Branch columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.max(step.branches?.length || 1, 1)}, 1fr)`,
        gap: 10,
      }}>
        {(step.branches || []).map((branch, bi) => (
          <div key={branch.id} style={{
            border: '1.5px dashed var(--border-strong)',
            borderRadius: 'var(--r-lg)',
            background: 'var(--grey-100)',
            padding: 10,
            minWidth: 0,
          }}>
            {/* Branch header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: `hsl(${bi * 90}, 60%, 50%)`, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
                {branch.label || branch.condition || `Branch ${bi + 1}`}
              </span>
            </div>

            {/* Branch steps */}
            {branch.steps.length === 0 && !(addingAt?.branchIndex === bi) && (
              <div
                style={{
                  padding: '12px 8px', textAlign: 'center', fontSize: 11,
                  color: 'var(--text-tertiary)', border: '1px dashed var(--border)',
                  borderRadius: 'var(--r-md)', background: 'white', cursor: 'pointer',
                }}
                onClick={() => setAddingAt({ branchIndex: bi, insertIndex: 0 })}
              >
                + Add step
              </div>
            )}

            {branch.steps.map((bs, si) => (
              <div key={bs.id}>
                {si > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
                    <div style={{ width: 1.5, height: 16, background: 'var(--border-strong)' }} />
                  </div>
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
                />
                {/* Add between */}
                {addingAt?.branchIndex === bi && addingAt?.insertIndex === si + 1 ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
                    <AddStepPicker
                      onSelect={type => addStepToBranch(bi, si + 1, type)}
                      onCancel={() => setAddingAt(null)}
                    />
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
                    <button
                      onClick={() => setAddingAt({ branchIndex: bi, insertIndex: si + 1 })}
                      style={{
                        width: 18, height: 18, borderRadius: '50%', background: 'white',
                        border: '1px dashed var(--border-strong)', color: 'var(--text-tertiary)',
                        fontSize: 12, cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                      title="Add step"
                    >+</button>
                  </div>
                )}
              </div>
            ))}

            {branch.steps.length === 0 && addingAt?.branchIndex === bi && addingAt?.insertIndex === 0 && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <AddStepPicker
                  onSelect={type => addStepToBranch(bi, 0, type)}
                  onCancel={() => setAddingAt(null)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

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
  switch (type) {
    case 'visit_selection':
      return { ...base, label: 'Choose Visit Option' };
    case 'scheduling':
      return { ...base, label: 'Appointment Scheduling' };
    case 'form':
      return { ...base, label: 'Form', formId: null };
    case 'payment':
      return { ...base, label: 'Payment Collection' };
    case 'conditional':
      return {
        ...base,
        label: 'Conditional Branch',
        conditionType: 'patient_type',
        branches: branchesForCondition('patient_type', clinic),
      };
    default:
      return base;
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

/* ── Main Workflow Customizer ─────────────────────────────── */

export default function WorkflowCustomizer({ workflow, onChange, clinic }) {
  const [addingAtIndex, setAddingAtIndex] = useState(null);
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

  const insertStep = (index, type) => {
    const newStep = createStep(type, clinic);
    const newSteps = [...steps];
    newSteps.splice(index, 0, newStep);
    onChange({ ...workflow, steps: newSteps });
    setAddingAtIndex(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
      {/* Workflow name */}
      <div className="form-group" style={{ marginBottom: 20 }}>
        <label className="form-label">Workflow Name</label>
        <input
          type="text"
          value={workflow?.name || ''}
          onChange={e => onChange({ ...workflow, name: e.target.value })}
          placeholder="e.g. Default Intake Flow"
          className="input"
          style={{ maxWidth: 400 }}
        />
      </div>

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
          <div key={step.id} style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
              <Connector onAdd={() => setAddingAtIndex(i)} />
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
            <Connector onAdd={() => setAddingAtIndex(steps.length)} />
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
