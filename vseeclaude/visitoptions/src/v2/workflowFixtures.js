/* Fixture workflows for the design sandbox.
 *
 * Design decisions made against the default flow fall over on the hard cases,
 * so the sandbox loads those deliberately: empty, rule-heavy, deeply nested,
 * guest-hostile, and far too long.
 */

import { initialClinic } from '../data/initialDataV2';

const s = (n) => `fx_${n}`;

/* ── Access presets ───────────────────────────────────────── */

const ACCESS_STANDARD = {
  allowLogin: true, rememberMe: true,
  allowSignup: true, signupAccess: 'open', eligibilitySource: 'member_list',
  verifyEmail: true, verifyPhone: false,
  allowSSO: false, ssoProviders: [], ssoAutoRedirect: false,
  allowMagicLink: false,
  allowGuest: false, guestFields: ['name', 'email'], guestUpgrade: false,
  defaultMethod: 'signin',
};

const ACCESS_EVERYTHING = {
  ...ACCESS_STANDARD,
  allowSSO: true, ssoProviders: ['saml', 'google'],
  allowMagicLink: true,
  allowGuest: true, guestFields: ['name', 'email', 'phone', 'dob'], guestUpgrade: true,
};

/* ── Fixtures ─────────────────────────────────────────────── */

const EMPTY = { id: 'wf_fx_empty', name: 'Empty', steps: [] };

const RULES = {
  id: 'wf_fx_rules',
  name: 'Rule-heavy triage',
  steps: [
    { id: s('r1'), type: 'visit_selection', label: 'Consultation' },
    { id: s('r2'), type: 'form', label: 'Intake Form', formId: '_intake_form' },
    { id: s('r3'), type: 'conditional', label: 'By Custom Rule (lo-code)', conditionType: 'rule', branches: [
      { id: s('rb1'), kind: 'rule', label: 'Rule 1', expr: 'form.intake_form.pain_level >= 8',
        rule: { '>=': [{ var: 'form.intake_form.pain_level' }, 8] }, steps: [
          { id: s('r3a'), type: 'emr', label: 'EMR' },
          { id: s('r3b'), type: 'test_device', label: 'Test Device' },
        ] },
      { id: s('rb2'), kind: 'rule', label: 'Rule 2', expr: 'patient.type == "self-pay" and visit.mode == "Video"',
        rule: { and: [{ '==': [{ var: 'patient.type' }, 'self-pay'] }, { '==': [{ var: 'visit.mode' }, 'Video'] }] }, steps: [
          { id: s('r3c'), type: 'payment', label: 'Payment Options' },
        ] },
      { id: s('rb3'), kind: 'rule', label: 'Rule 3', expr: 'auth.method in ["guest", "sso"]',
        rule: { in: [{ var: 'auth.method' }, ['guest', 'sso']] }, steps: [] },
      { id: s('rb4'), kind: 'otherwise', label: 'Otherwise', steps: [
        { id: s('r3d'), type: 'form', label: 'Emergency Contact', formId: '_emergency_contact' },
      ] },
    ] },
    { id: s('r4'), type: 'setup_session', label: 'Setup Session' },
    { id: s('r5'), type: 'confirmation', label: 'Confirmation' },
  ],
};

const NESTED = {
  id: 'wf_fx_nested',
  name: 'Three levels deep',
  steps: [
    { id: s('n1'), type: 'visit_selection', label: 'Consultation' },
    { id: s('n2'), type: 'conditional', label: 'By Patient Type', conditionType: 'patient_type', branches: [
      { id: s('nb1'), condition: 'self-pay', label: 'Self-Pay', steps: [
        { id: s('n3'), type: 'conditional', label: 'By Visit Mode', conditionType: 'visit_mode', branches: [
          { id: s('nb2'), condition: 'video', label: 'Video', steps: [
            { id: s('n4'), type: 'conditional', label: 'By Clinic Hours', conditionType: 'clinic_hours', branches: [
              { id: s('nb3'), condition: 'open_hours', label: 'During Open Hours', steps: [
                { id: s('n5'), type: 'payment', label: 'Payment Options' },
              ] },
              { id: s('nb4'), condition: 'after_hours', label: 'After Hours', steps: [
                { id: s('n6'), type: 'form', label: 'Guest Intake', formId: '_guest_intake' },
              ] },
            ] },
          ] },
          { id: s('nb5'), condition: 'phone', label: 'Phone', steps: [
            { id: s('n7'), type: 'payment', label: 'Payment Options' },
          ] },
          { id: s('nb6'), condition: 'in_person', label: 'In-person', steps: [] },
          { id: s('nb7'), condition: 'e_consult', label: 'E-Consult', steps: [] },
        ] },
      ] },
      { id: s('nb8'), condition: 'insurance', label: 'Insurance', steps: [
        { id: s('n8'), type: 'form', label: 'Insurance Form', formId: '_insurance_form' },
      ] },
      { id: s('nb9'), condition: 'group-covered', label: 'Group-Covered', steps: [] },
    ] },
    { id: s('n9'), type: 'setup_session', label: 'Setup Session' },
    { id: s('n10'), type: 'confirmation', label: 'Confirmation' },
  ],
};

const GUEST_HOSTILE = {
  id: 'wf_fx_guest',
  name: 'Guest-hostile flow',
  steps: [
    { id: s('g1'), type: 'dependant_list', label: 'Dependant List' },
    { id: s('g2'), type: 'form', label: 'Create Dependant', formId: '_create_dependant' },
    { id: s('g3'), type: 'visit_selection', label: 'Consultation' },
    { id: s('g4'), type: 'emr', label: 'EMR' },
    { id: s('g5'), type: 'payment', label: 'Payment Options' },
    { id: s('g6'), type: 'confirmation', label: 'Confirmation' },
  ],
};

const LONG = {
  id: 'wf_fx_long',
  name: 'Far too long',
  steps: [
    { id: s('l1'), type: 'dependant_list', label: 'Dependant List' },
    { id: s('l2'), type: 'visit_selection', label: 'Consultation' },
    { id: s('l3'), type: 'scheduling', label: 'Calendar Picker' },
    { id: s('l4'), type: 'form', label: 'Intake Form', formId: '_intake_form' },
    { id: s('l5'), type: 'form', label: 'Standard Intake', formId: 'form_1' },
    { id: s('l6'), type: 'form', label: 'PHQ-9 Assessment', formId: 'form_5' },
    { id: s('l7'), type: 'conditional', label: 'By Patient Type', conditionType: 'patient_type', branches: [
      { id: s('lb1'), condition: 'self-pay', label: 'Self-Pay', steps: [
        { id: s('l8'), type: 'payment', label: 'Payment Options' },
      ] },
      { id: s('lb2'), condition: 'insurance', label: 'Insurance', steps: [
        { id: s('l9'), type: 'form', label: 'Insurance Form', formId: '_insurance_form' },
        { id: s('l10'), type: 'form', label: 'Guarantor', formId: '_guarantor' },
        { id: s('l11'), type: 'payment', label: 'Payment Options' },
      ] },
      { id: s('lb3'), condition: 'group-covered', label: 'Group-Covered', steps: [
        { id: s('l12'), type: 'form', label: 'Group ID Verification', formId: 'form_6' },
      ] },
    ] },
    { id: s('l13'), type: 'pharmacy', label: 'Pharmacy Picker', allowSearch: true, showMap: true, allowMailOrder: true, allowSkip: true },
    { id: s('l14'), type: 'form', label: 'Emergency Contact', formId: '_emergency_contact' },
    { id: s('l15'), type: 'form', label: 'Consent Form', formId: 'form_3' },
    { id: s('l16'), type: 'emr', label: 'EMR' },
    { id: s('l17'), type: 'test_device', label: 'Test Device' },
    { id: s('l18'), type: 'setup_session', label: 'Setup Session' },
    { id: s('l19'), type: 'confirmation', label: 'Confirmation' },
  ],
};

export const FIXTURES = [
  { id: 'default', name: 'Clinic default', desc: 'What ships today — the baseline to beat.', workflow: initialClinic.defaultWorkflow, access: ACCESS_STANDARD },
  { id: 'empty', name: 'Empty', desc: 'First-run state. Does it invite the first step?', workflow: EMPTY, access: ACCESS_STANDARD },
  { id: 'rules', name: 'Rule-heavy', desc: 'Ordered lo-code rules plus Otherwise.', workflow: RULES, access: ACCESS_EVERYTHING },
  { id: 'nested', name: 'Nested 3 deep', desc: 'Conditional inside conditional inside conditional.', workflow: NESTED, access: ACCESS_STANDARD },
  { id: 'guest', name: 'Guest-hostile', desc: 'Every step a guest cannot complete, with guest access on.', workflow: GUEST_HOSTILE, access: ACCESS_EVERYTHING },
  { id: 'long', name: 'Far too long', desc: '19 steps and a three-way branch. Where does it break down?', workflow: LONG, access: ACCESS_STANDARD },
];

export const FIXTURE_CLINIC = initialClinic;

/* Deep clone so edits in the sandbox never mutate the shared seed data. */
export function loadFixture(id) {
  const fx = FIXTURES.find(f => f.id === id) || FIXTURES[0];
  return {
    ...fx,
    workflow: structuredClone(fx.workflow),
    clinic: { ...structuredClone(initialClinic), patientAccess: structuredClone(fx.access) },
  };
}
