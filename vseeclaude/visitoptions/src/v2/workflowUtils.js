/* Shared workflow helpers used by both the editor and the patient preview. */

/* Pharmacy used to be modelled as a built-in form. Any workflow saved before
   it became its own step module is converted on read, so custom templates and
   per-visit overrides keep working. */
export function normalizeSteps(steps) {
  if (!Array.isArray(steps)) return steps;
  let changed = false;

  const out = steps.map(s => {
    if (s.type === 'form' && s.formId === '_pharmacy') {
      changed = true;
      const { formId, ...rest } = s;
      void formId;
      return {
        ...rest,
        type: 'pharmacy',
        label: 'Pharmacy Picker',
        allowSearch: true,
        allowMailOrder: true,
        allowSkip: true,
      };
    }
    if (s.branches) {
      let branchChanged = false;
      const branches = s.branches.map(b => {
        const bs = normalizeSteps(b.steps || []);
        if (bs !== b.steps) { branchChanged = true; return { ...b, steps: bs }; }
        return b;
      });
      if (branchChanged) { changed = true; return { ...s, branches }; }
    }
    return s;
  });

  return changed ? out : steps;
}
