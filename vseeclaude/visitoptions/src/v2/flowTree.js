/* Tree operations on a workflow's steps, addressed by id or container.
 *
 * The graph canvas edits by identity rather than by array index path, so a
 * change deep inside a branch doesn't need the caller to know the route there.
 * Every helper returns new arrays — nothing is mutated in place.
 */

export function findStep(steps, id) {
  for (let i = 0; i < (steps || []).length; i++) {
    const s = steps[i];
    if (s.id === id) return { step: s, list: steps, index: i };
    if (s.branches) {
      for (let bi = 0; bi < s.branches.length; bi++) {
        const hit = findStep(s.branches[bi].steps || [], id);
        if (hit) return hit;
      }
    }
  }
  return null;
}

export function mapStep(steps, id, updater) {
  return (steps || []).map(s => {
    if (s.id === id) return updater(s);
    if (s.branches) {
      return { ...s, branches: s.branches.map(b => ({ ...b, steps: mapStep(b.steps || [], id, updater) })) };
    }
    return s;
  });
}

export function removeSteps(steps, ids) {
  const set = ids instanceof Set ? ids : new Set(ids);
  return (steps || [])
    .filter(s => !set.has(s.id))
    .map(s => (s.branches
      ? { ...s, branches: s.branches.map(b => ({ ...b, steps: removeSteps(b.steps || [], set) })) }
      : s));
}

/* Insert into the root list (containerId null) or into one branch of a
   conditional, at `index`. */
export function insertSteps(steps, containerId, branchIndex, index, newSteps) {
  if (containerId === null || containerId === undefined) {
    const out = [...(steps || [])];
    out.splice(index, 0, ...newSteps);
    return out;
  }
  return (steps || []).map(s => {
    if (s.id === containerId && s.branches) {
      return {
        ...s,
        branches: s.branches.map((b, bi) => {
          if (bi !== branchIndex) return b;
          const inner = [...(b.steps || [])];
          inner.splice(index, 0, ...newSteps);
          return { ...b, steps: inner };
        }),
      };
    }
    if (s.branches) {
      return { ...s, branches: s.branches.map(b => ({ ...b, steps: insertSteps(b.steps || [], containerId, branchIndex, index, newSteps) })) };
    }
    return s;
  });
}

export function updateBranch(steps, conditionalId, branchIndex, patch) {
  return mapStep(steps, conditionalId, s => ({
    ...s,
    branches: (s.branches || []).map((b, bi) => (bi === branchIndex ? { ...b, ...patch } : b)),
  }));
}

export function duplicateBranch(steps, conditionalId, branchIndex, freshId) {
  return mapStep(steps, conditionalId, s => {
    const branches = [...(s.branches || [])];
    const src = branches[branchIndex];
    if (!src) return s;
    const copy = { ...structuredClone(src), id: freshId(), label: `${src.label} (copy)` };
    copy.steps = reId(copy.steps || [], freshId);
    branches.splice(branchIndex + 1, 0, copy);
    return { ...s, branches };
  });
}

/* Fresh ids throughout a subtree, so a paste or duplicate can't collide. */
export function reId(steps, freshId) {
  return (steps || []).map(s => {
    const out = { ...s, id: freshId() };
    if (out.branches) {
      out.branches = out.branches.map(b => ({ ...b, id: freshId(), steps: reId(b.steps || [], freshId) }));
    }
    return out;
  });
}

export function countSteps(steps) {
  let n = 0;
  for (const s of steps || []) {
    n++;
    if (s.branches) for (const b of s.branches) n += countSteps(b.steps || []);
  }
  return n;
}

export function allConditionalIds(steps, out = []) {
  for (const s of steps || []) {
    if (s.type === 'conditional') out.push(s.id);
    if (s.branches) for (const b of s.branches) allConditionalIds(b.steps || [], out);
  }
  return out;
}
