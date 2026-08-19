/* What is known at a given point in the intake flow.
 *
 * A condition can only test data an earlier step produced. Branching on an
 * answer to a form the patient hasn't filled in — or on the visit mode before
 * they've chosen a visit — is always a mistake, so the editor needs to know
 * what's in scope at each position. The same model supplies the variable
 * namespace for lo-code rules.
 *
 * Scope in a tree is not "every step above". A conditional nested in a branch
 * sees its own branch's earlier steps plus everything before its parent, and
 * nothing from sibling branches. A step inside an earlier conditional only
 * counts as guaranteed if it appears in *every* branch of it — otherwise some
 * patients skipped it.
 */

import { allForms, findForm, formFields } from './forms';
import { accessConfig } from './patientAccess';

/* Steps that produce data later conditions can test. */
const PRODUCERS = {
  visit_selection: 'visitSelected',
  dependant_list: 'dependantChosen',
  emr: 'emrPulled',
  payment: 'paid',
  pharmacy: 'pharmacyChosen',
  test_device: 'deviceTested',
};

const emptyAcc = () => ({ formIds: [], flags: new Set() });

const cloneAcc = (acc) => ({ formIds: [...acc.formIds], flags: new Set(acc.flags) });

function record(step, acc) {
  if (step.type === 'form' && step.formId && !acc.formIds.includes(step.formId)) {
    acc.formIds.push(step.formId);
  }
  const flag = PRODUCERS[step.type];
  if (flag) acc.flags.add(flag);
}

/* Everything a step list is guaranteed to produce, whatever path is taken. */
function guaranteed(steps) {
  const acc = emptyAcc();
  for (const s of steps || []) {
    if (s.type === 'conditional') {
      const branches = s.branches || [];
      if (branches.length === 0) continue;
      const perBranch = branches.map(b => guaranteed(b.steps || []));
      // Only what every branch produces survives.
      const commonForms = perBranch[0].formIds.filter(id => perBranch.every(p => p.formIds.includes(id)));
      const commonFlags = [...perBranch[0].flags].filter(f => perBranch.every(p => p.flags.has(f)));
      for (const id of commonForms) if (!acc.formIds.includes(id)) acc.formIds.push(id);
      for (const f of commonFlags) acc.flags.add(f);
      continue;
    }
    record(s, acc);
  }
  return acc;
}

/* Walk to `stepId`, accumulating what precedes it. Returns null if not found. */
function walkTo(steps, stepId, acc) {
  for (const s of steps || []) {
    if (s.id === stepId) return acc;         // the step is not in its own scope

    if (s.type === 'conditional') {
      for (const b of s.branches || []) {
        const inner = walkTo(b.steps || [], stepId, cloneAcc(acc));
        if (inner) return inner;
      }
      // Past the conditional, only what all branches guarantee is in scope.
      const g = guaranteed([s]);
      for (const id of g.formIds) if (!acc.formIds.includes(id)) acc.formIds.push(id);
      for (const f of g.flags) acc.flags.add(f);
      continue;
    }

    record(s, acc);
  }
  return null;
}

/* ── Variable namespace ───────────────────────────────────── */

const PT_VALUES = { 'self-pay': 'self-pay', 'insurance': 'insurance', 'group-covered': 'group-covered' };

export function formKey(formId) {
  return String(formId || '').replace(/^_/, '');
}

/* A stable, readable variable path for a form field. */
export function fieldPath(formId, fieldId) {
  return `form.${formKey(formId)}.${fieldId}`;
}

/* Scope at the position of `stepId`, plus the variables legal there. */
export function scopeForStep(steps, stepId, clinic, access) {
  const acc = walkTo(steps, stepId, emptyAcc()) || emptyAcc();
  const cfg = accessConfig(access);

  const forms = acc.formIds.map(id => findForm(clinic, id)).filter(Boolean);
  const flags = acc.flags;

  // A date of birth only exists if registration collected it, or guests were
  // asked for it. Without one there is no age to band.
  const hasDob = cfg.allowSignup || (cfg.allowGuest && (cfg.guestFields || []).includes('dob'));

  const variables = [
    { path: 'patient.type', label: 'Patient type', kind: 'enum', values: (clinic?.patientTypes || []).map(p => PT_VALUES[p] || p) },
    { path: 'patient.isReturning', label: 'Returning patient', kind: 'boolean' },
    { path: 'auth.method', label: 'How they signed in', kind: 'enum', values: ['account', 'sso', 'guest'] },
    { path: 'insurance.status', label: 'Eligibility result', kind: 'enum', values: ['eligible', 'not_eligible', 'pending', 'error'] },
    { path: 'clinic.isOpen', label: 'Within operating hours', kind: 'boolean' },
  ];

  if (hasDob) variables.push({ path: 'patient.age', label: 'Patient age', kind: 'number' });
  if (flags.has('visitSelected')) {
    variables.push({ path: 'visit.mode', label: 'Visit mode', kind: 'enum', values: ['Video', 'Phone', 'In-person', 'E-Consult'] });
    variables.push({ path: 'visit.name', label: 'Visit name', kind: 'string' });
    variables.push({ path: 'visit.duration', label: 'Visit duration (min)', kind: 'number' });
  }
  if (flags.has('dependantChosen')) {
    variables.push({ path: 'visit.for', label: 'Who the visit is for', kind: 'enum', values: ['self', 'dependant'] });
  }
  if (flags.has('paid')) variables.push({ path: 'payment.collected', label: 'Payment collected', kind: 'boolean' });
  if (flags.has('emrPulled')) variables.push({ path: 'emr.matched', label: 'EMR record matched', kind: 'boolean' });

  for (const f of forms) {
    for (const fld of formFields(f)) {
      variables.push({
        path: fieldPath(f.id, fld.id),
        label: `${f.name} · ${fld.label || fld.id}`,
        kind: fld.type === 'scale' ? 'number' : fld.type === 'checkbox' ? 'boolean' : 'string',
        values: fld.options,
      });
    }
  }

  return { forms, flags, hasDob, variables };
}

/* ── Condition prerequisites ──────────────────────────────── */
// Which conditions need an upstream step, and what to say when it's missing.

export const CONDITION_REQUIREMENTS = {
  visit_mode: {
    flag: 'visitSelected',
    step: 'Consultation',
    why: 'Visit mode is a property of the chosen visit, so there is nothing to test until the patient has picked one.',
  },
  visit_for: {
    flag: 'dependantChosen',
    step: 'Dependant List',
    why: 'Who the visit is for is decided by the Dependant List step, so this branches on a value that has not been set yet.',
  },
};

/* Why this conditional can't work where it sits, or null if it's fine. */
export function conditionIssue(step, scope, clinic) {
  const ctype = step?.conditionType || 'patient_type';

  const req = CONDITION_REQUIREMENTS[ctype];
  if (req && !scope.flags.has(req.flag)) {
    return { kind: 'missing_step', step: req.step, why: req.why };
  }

  if (ctype === 'age_group' && !scope.hasDob) {
    return {
      kind: 'no_dob',
      why: 'No access method on this room collects a date of birth, so there is no age to band. Enable account registration, or add Date of birth to the guest fields.',
    };
  }

  if (ctype === 'form_answer') {
    if (scope.forms.length === 0) {
      return {
        kind: 'no_forms',
        why: 'No form runs before this point, so there is no answer to test. Add a Form step above this branch.',
      };
    }
    if (step.conditionFormId && !scope.forms.some(f => f.id === step.conditionFormId)) {
      const name = findForm(clinic, step.conditionFormId)?.name || step.conditionFormId;
      return {
        kind: 'stale_form',
        why: `“${name}” no longer runs before this point, so its answers aren't available here. Pick a form from the list, or move the form step back above this branch.`,
      };
    }
  }

  return null;
}

export { allForms };
