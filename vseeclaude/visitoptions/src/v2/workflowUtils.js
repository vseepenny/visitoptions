/* Shared workflow helpers used by both the editor and the patient preview. */

import { ACCESS_DEFAULTS, METHOD_KEYS } from './patientAccess';

/* ── Account steps are no longer part of the flow ─────────── */
// Auth moved out of the intake flow and into Patient Access (clinic-level, with
// a per-room override). Workflows saved before that move still carry the old
// steps, so they are stripped on read and their settings can be lifted up to
// the clinic with liftPatientAccess().

const LEGACY_ACCOUNT_TYPES = ['account', 'login', 'signup', 'signup_verification'];

const ACCESS_OFF = {
  allowLogin: false,
  allowSignup: false,
  verifyEmail: false,
  verifyPhone: false,
  allowSSO: false,
  ssoProviders: [],
  ssoAutoRedirect: false,
  allowMagicLink: false,
  allowGuest: false,
};

/* What each retired step type implied. The old Login screen had a built-in
   "Continue as Guest" escape hatch, so it lifts with guest access on. */
const LEGACY_ACCESS = {
  login:               { allowLogin: true, allowGuest: true, defaultMethod: 'signin' },
  signup:              { allowSignup: true, signupAccess: 'open', defaultMethod: 'signup' },
  signup_verification: { verifyEmail: true },
};

export function isAccountStep(step) {
  return !!step && LEGACY_ACCOUNT_TYPES.includes(step.type);
}

/* Read a workflow's retired account steps as a Patient Access config, or null
   if it had none. Used once, to seed the clinic config from an old workflow. */
export function liftPatientAccess(steps) {
  if (!Array.isArray(steps)) return null;
  let found = false;
  let acc = { ...ACCESS_DEFAULTS, ...ACCESS_OFF };
  let first = true;

  const walk = (list) => {
    for (const s of list || []) {
      if (isAccountStep(s)) {
        // An `account` step already carries the full shape; the older three
        // only imply parts of it.
        const patch = s.type === 'account' ? s : LEGACY_ACCESS[s.type];
        const next = { ...acc };
        for (const key of [...METHOD_KEYS, 'verifyEmail', 'verifyPhone']) {
          next[key] = acc[key] || !!patch[key];
        }
        for (const key of ['signupAccess', 'eligibilitySource', 'ssoProviders', 'ssoAutoRedirect', 'guestFields', 'guestUpgrade', 'rememberMe']) {
          if (patch[key] !== undefined) next[key] = patch[key];
        }
        /* The landing screen comes from the first step that names one. Later
           steps in the same run were downstream of it (Signup then Verify), not
           alternative entry points, so they must not overwrite it. */
        if (first && patch.defaultMethod !== undefined) next.defaultMethod = patch.defaultMethod;
        acc = next;
        found = true;
        first = false;
      }
      if (s.branches) s.branches.forEach(b => walk(b.steps));
    }
  };
  walk(steps);

  return found ? acc : null;
}

export function normalizeSteps(steps) {
  if (!Array.isArray(steps)) return steps;
  let changed = false;

  const out = [];

  for (const s of steps) {
    /* Auth is no longer a step. Drop it — Patient Access owns it now. */
    if (isAccountStep(s)) {
      changed = true;
      continue;
    }

    /* Pharmacy used to be modelled as a built-in form. Any workflow saved
       before it became its own step module is converted on read, so custom
       templates and per-visit overrides keep working. */
    if (s.type === 'form' && s.formId === '_pharmacy') {
      changed = true;
      const { formId, ...rest } = s;
      void formId;
      out.push({
        ...rest,
        type: 'pharmacy',
        label: 'Pharmacy Picker',
        allowSearch: true,
        showMap: true,
        allowMailOrder: true,
        allowSkip: true,
      });
      continue;
    }

    if (s.branches) {
      let branchChanged = false;
      const branches = s.branches.map(b => {
        const bs = normalizeSteps(b.steps || []);
        if (bs !== b.steps) { branchChanged = true; return { ...b, steps: bs }; }
        return b;
      });
      if (branchChanged) { changed = true; out.push({ ...s, branches }); continue; }
    }

    out.push(s);
  }

  return changed ? out : steps;
}
