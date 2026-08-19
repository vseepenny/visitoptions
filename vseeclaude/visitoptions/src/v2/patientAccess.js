/* Patient Access — how patients identify themselves before a visit starts.
 *
 * This is deliberately NOT part of the intake flow. Auth is a precondition of
 * booking, not a step in it: it can't be meaningfully reordered, and its
 * settings are infrastructure (IdP metadata, eligibility sources) rather than
 * per-visit choices. The clinic configures which methods exist; each waiting
 * room picks which of those it offers. The intake flow starts once we know who
 * the patient is.
 */

/* Clinic-level config — the full set of capabilities. */
export const ACCESS_DEFAULTS = {
  allowLogin: true,
  rememberMe: true,
  allowSignup: true,
  signupAccess: 'open',             // open | eligibility | invite
  eligibilitySource: 'member_list', // member_list | payer_api | employer_domain
  verifyEmail: true,
  verifyPhone: false,
  allowSSO: false,
  ssoProviders: [],                 // saml | google | apple | microsoft
  ssoAutoRedirect: false,
  allowMagicLink: false,
  allowGuest: false,
  guestFields: ['name', 'email'],   // name | email | phone | dob
  guestUpgrade: false,
  defaultMethod: 'signin',          // signin | signup | sso | guest
};

/* The toggles a room may narrow. A room can only ever turn a method OFF — it
   can't enable SSO the clinic never set up. */
export const METHOD_KEYS = ['allowLogin', 'allowSignup', 'allowSSO', 'allowMagicLink', 'allowGuest'];

export const ACCESS_METHODS = [
  { key: 'allowLogin', label: 'Sign in', desc: 'Existing patients sign in with email and password.' },
  { key: 'allowSignup', label: 'Create an account', desc: 'New patients register before booking.' },
  { key: 'allowSSO', label: 'Single sign-on (SSO)', desc: 'Sign in through an identity provider instead of a VSee password.' },
  { key: 'allowMagicLink', label: 'Email a sign-in link', desc: 'Passwordless — the patient clicks a one-time link or types the code.' },
  { key: 'allowGuest', label: 'Guest access', desc: 'Continue with no account. No portal login or visit history afterwards.' },
];

export const SIGNUP_ACCESS = [
  { id: 'open', label: 'Free signup', hint: 'Anyone who finds the room can register.' },
  { id: 'eligibility', label: 'Eligibility check', hint: 'Registration only completes for patients found in an eligibility source.' },
  { id: 'invite', label: 'Invite or access code', hint: 'Patient must enter a code the clinic issued.' },
];

export const ELIGIBILITY_SOURCES = [
  { id: 'member_list', label: 'Uploaded member list' },
  { id: 'payer_api', label: 'Payer eligibility API' },
  { id: 'employer_domain', label: 'Employer email domain' },
];

export const SSO_PROVIDERS = [
  { id: 'saml', label: 'SAML / OIDC (clinic IdP)' },
  { id: 'google', label: 'Google' },
  { id: 'apple', label: 'Apple' },
  { id: 'microsoft', label: 'Microsoft' },
];

export const GUEST_FIELDS = [
  { id: 'name', label: 'Full name' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
  { id: 'dob', label: 'Date of birth' },
];

export const LANDING_METHODS = [
  { id: 'signin', label: 'Sign in', requires: 'allowLogin' },
  { id: 'signup', label: 'Create an account', requires: 'allowSignup' },
  { id: 'sso', label: 'Single sign-on', requires: 'allowSSO' },
  { id: 'guest', label: 'Guest access', requires: 'allowGuest' },
];

export function accessConfig(access) {
  return { ...ACCESS_DEFAULTS, ...(access || {}) };
}

/* Effective config for a room: the clinic's settings, narrowed by the room's
   override. `room.accessOverride === null` (or absent) means "use the clinic
   default". Pass room = null for the clinic-wide view. */
export function resolvePatientAccess(clinic, room) {
  const base = accessConfig(clinic?.patientAccess);
  const override = room?.accessOverride;
  if (!override) return base;

  const resolved = { ...base };
  for (const key of METHOD_KEYS) {
    resolved[key] = base[key] && override[key] !== false;
  }
  if (override.defaultMethod) resolved.defaultMethod = override.defaultMethod;
  return resolved;
}

export function enabledMethods(access) {
  const cfg = accessConfig(access);
  return METHOD_KEYS.filter(k => cfg[k]);
}

/* The screen a patient sees first, falling back to whatever is still on when
   the configured default has since been switched off. */
export function landingMethod(access) {
  const cfg = accessConfig(access);
  const available = LANDING_METHODS.filter(lm => cfg[lm.requires]).map(lm => lm.id);
  if (available.includes(cfg.defaultMethod)) return cfg.defaultMethod;
  return available[0] || null;
}

/* Short chips for the flow's entry gate and the room summary. */
export function accessSummary(access) {
  const cfg = accessConfig(access);
  const chips = [];
  if (cfg.allowLogin) chips.push('Sign in');
  if (cfg.allowSignup) chips.push(cfg.signupAccess === 'open' ? 'Free signup' : cfg.signupAccess === 'invite' ? 'Invite signup' : 'Eligibility signup');
  if (cfg.allowSSO) chips.push('SSO');
  if (cfg.allowMagicLink) chips.push('Sign-in link');
  if (cfg.allowGuest) chips.push('Guest');
  return chips;
}

/* ── Guest capability guards ──────────────────────────────── */
// A guest has no account, so a few steps can't complete for them. The editor
// warns instead of silently skipping — an admin should see what patients hit.

export const GUEST_BLOCKED_STEPS = {
  dependant_list: 'Guests have no family members on file, so there is nothing to choose from.',
  emr: 'Record lookup needs an identified patient — a guest has no chart to match against.',
};

export const GUEST_BLOCKED_FORMS = {
  _create_dependant: 'A dependant has to attach to an account, which a guest does not have.',
};

/* Why this step can't complete for a guest, or null if it can. */
export function guestBlockReason(step) {
  if (!step) return null;
  if (GUEST_BLOCKED_STEPS[step.type]) return GUEST_BLOCKED_STEPS[step.type];
  if (step.type === 'form' && GUEST_BLOCKED_FORMS[step.formId]) return GUEST_BLOCKED_FORMS[step.formId];
  return null;
}

/* ── Auth outcome as a branch condition ───────────────────── */
// Auth config lives outside the flow, but its outcome is the biggest fork
// inside it, so the flow can still branch on how the patient got in.

export const AUTH_METHOD_BRANCHES = [
  { id: 'account', label: 'Signed-in Account', requires: ['allowLogin', 'allowSignup', 'allowMagicLink'] },
  { id: 'sso', label: 'SSO', requires: ['allowSSO'] },
  { id: 'guest', label: 'Guest', requires: ['allowGuest'] },
];

/* Only the outcomes the clinic actually allows. */
export function authMethodBranches(clinic) {
  const cfg = accessConfig(clinic?.patientAccess);
  const live = AUTH_METHOD_BRANCHES.filter(b => b.requires.some(k => cfg[k]));
  return live.length ? live : AUTH_METHOD_BRANCHES;
}
