/* Layout engine for the flow canvas.
 *
 * Written in main/cross terms rather than x/y, then projected onto an axis at
 * the end. Steps advance along the MAIN axis; a conditional's branches spread
 * along the CROSS axis as parallel lanes.
 *
 *   vertical   — main = down, cross = across.  Length is unbounded and scrolls
 *                natively; branches only ever need 3-4 slots across.
 *   horizontal — main = across, cross = down.  Unlimited room for wide or deep
 *                branching, but a long flow overflows the width.
 *
 * Every box exposes a `port`: its connector's offset along the CROSS axis,
 * relative to its own cross origin. That lets a plain step line up with the
 * centre of a multi-lane branch group without either knowing about the other.
 */

export const NODE_W = 178;
export const NODE_H = 46;

const AXES = {
  vertical: {
    nodeMain: NODE_H, nodeCross: NODE_W,
    mainGap: 30, crossGap: 20,
    labelMain: 20, labelCross: 0,   // branch name sits at the top of its column
    terminalMain: NODE_H, terminalCross: 132,
  },
  horizontal: {
    nodeMain: NODE_W, nodeCross: NODE_H,
    mainGap: 44, crossGap: 16,
    labelMain: 0, labelCross: 18,   // branch name sits above its row
    terminalMain: 108, terminalCross: NODE_H,
  },
};

export function axisMetrics(axis) {
  return AXES[axis] || AXES.vertical;
}

/* ── Measure ──────────────────────────────────────────────── */

const placeholderBox = (m) => ({ kind: 'placeholder', main: m.nodeMain, cross: m.nodeCross, port: m.nodeCross / 2 });

function measure(step, opts) {
  const { m, collapsed } = opts;

  if (step.type !== 'conditional' || collapsed.has(step.id)) {
    return { kind: 'node', step, main: m.nodeMain, cross: m.nodeCross, port: m.nodeCross / 2 };
  }

  const branches = step.branches || [];
  if (branches.length === 0) {
    return { kind: 'node', step, main: m.nodeMain, cross: m.nodeCross, port: m.nodeCross / 2 };
  }

  const lanes = branches.map(b => {
    const inner = (b.steps && b.steps.length) ? measureSeq(b.steps, opts) : placeholderBox(m);
    return {
      branch: b,
      inner,
      main: inner.main + m.labelMain,
      cross: inner.cross + m.labelCross,
      port: m.labelCross + inner.port,
    };
  });

  const laneStackCross = lanes.reduce((sum, l) => sum + l.cross, 0) + m.crossGap * (lanes.length - 1);
  const maxLaneMain = Math.max(...lanes.map(l => l.main));
  const cross = Math.max(m.nodeCross, laneStackCross);
  const main = m.nodeMain + m.mainGap + maxLaneMain;

  return { kind: 'group', step, lanes, laneStackCross, maxLaneMain, main, cross, port: cross / 2 };
}

function measureSeq(steps, opts) {
  const { m } = opts;
  const items = steps.map(s => measure(s, opts));
  const main = items.reduce((sum, it) => sum + it.main, 0) + m.mainGap * (items.length - 1);
  // One shared centre line, set by whichever item reaches furthest either side.
  const before = Math.max(...items.map(it => it.port));
  const after = Math.max(...items.map(it => it.cross - it.port));
  return { kind: 'seq', items, main, cross: before + after, port: before };
}

/* ── Place ────────────────────────────────────────────────── */

function place(box, mainPos, crossPos, ctx, path) {
  const { m, project } = ctx;

  if (box.kind === 'node') {
    ctx.nodes.push({
      id: box.step.id, step: box.step, path, depth: path.depth,
      isCondition: false,
      ...project(mainPos, crossPos, box.main, box.cross),
      inPort: project.point(mainPos, crossPos + box.port),
      outPort: project.point(mainPos + box.main, crossPos + box.port),
    });
    return;
  }

  if (box.kind === 'placeholder') {
    ctx.placeholders.push({ path, ...project(mainPos, crossPos, box.main, box.cross) });
    ctx.slots.push({
      ...project.point(mainPos + box.main / 2, crossPos + box.port),
      containerId: path.containerId, branchIndex: path.branchIndex, index: 0, empty: true,
    });
    return;
  }

  if (box.kind === 'seq') {
    let cm = mainPos;
    let prev = null;
    const centre = crossPos + box.port;
    ctx.slots.push({ ...project.point(cm - m.mainGap / 2, centre), containerId: path.containerId, branchIndex: path.branchIndex, index: 0 });
    box.items.forEach((it, i) => {
      const ic = crossPos + box.port - it.port;
      place(it, cm, ic, ctx, { ...path, index: i });
      const entry = { main: cm, cross: ic, box: it };
      if (prev) {
        ctx.edges.push({
          from: project.point(prev.main + prev.box.main, prev.cross + prev.box.port),
          to: project.point(entry.main, entry.cross + entry.box.port),
          kind: 'seq',
        });
        ctx.slots.push({ ...project.point(cm - m.mainGap / 2, centre), containerId: path.containerId, branchIndex: path.branchIndex, index: i });
      }
      prev = entry;
      cm += it.main + m.mainGap;
    });
    ctx.slots.push({ ...project.point(cm - m.mainGap / 2, centre), containerId: path.containerId, branchIndex: path.branchIndex, index: box.items.length });
    return;
  }

  if (box.kind === 'group') {
    // Condition node, centred across the group's lanes
    const condCross = crossPos + box.cross / 2 - m.nodeCross / 2;
    ctx.nodes.push({
      id: box.step.id, step: box.step, path, depth: path.depth,
      isCondition: true,
      ...project(mainPos, condCross, m.nodeMain, m.nodeCross),
      inPort: project.point(mainPos, crossPos + box.port),
      outPort: project.point(mainPos + m.nodeMain, crossPos + box.port),
    });

    const laneMain = mainPos + m.nodeMain + m.mainGap;
    const rejoinMain = mainPos + box.main;
    let lc = crossPos + (box.cross - box.laneStackCross) / 2;

    box.lanes.forEach((lane, bi) => {
      const lanePath = { containerId: box.step.id, branchIndex: bi, index: 0, depth: path.depth + 1 };
      ctx.lanes.push({
        branch: lane.branch, path: lanePath, index: bi,
        ...project(laneMain, lc, lane.main, lane.cross),
        labelMain: m.labelMain, labelCross: m.labelCross,
      });

      place(lane.inner, laneMain + m.labelMain, lc + m.labelCross, ctx, lanePath);

      const innerPort = lc + lane.port;
      ctx.edges.push({
        from: project.point(mainPos + m.nodeMain, crossPos + box.port),
        to: project.point(laneMain + m.labelMain, innerPort),
        kind: 'split', branchIndex: bi,
      });
      ctx.edges.push({
        from: project.point(laneMain + m.labelMain + lane.inner.main, innerPort),
        to: project.point(rejoinMain, crossPos + box.port),
        kind: 'join', branchIndex: bi,
      });

      lc += lane.cross + m.crossGap;
    });
  }
}

/* ── Public entry ─────────────────────────────────────────── */

export function layoutFlow(steps, collapsed = new Set(), axis = 'vertical') {
  const m = axisMetrics(axis);
  const opts = { m, collapsed };
  const body = (steps && steps.length) ? measureSeq(steps, opts) : placeholderBox(m);

  const vertical = axis === 'vertical';
  const project = vertical
    ? (main, cross, mainSize, crossSize) => ({ x: cross, y: main, w: crossSize, h: mainSize })
    : (main, cross, mainSize, crossSize) => ({ x: main, y: cross, w: mainSize, h: crossSize });
  project.point = vertical
    ? (main, cross) => ({ x: cross, y: main })
    : (main, cross) => ({ x: main, y: cross });

  const ctx = { nodes: [], edges: [], lanes: [], placeholders: [], slots: [], m, project, axis };

  const startMain = 0;
  const bodyMain = m.terminalMain + m.mainGap;
  const endMain = bodyMain + body.main + m.mainGap;
  const centre = body.port;

  place(body, bodyMain, 0, ctx, { containerId: null, branchIndex: null, index: 0, depth: 0 });

  const start = {
    ...project(startMain, centre - m.terminalCross / 2, m.terminalMain, m.terminalCross),
    port: project.point(m.terminalMain, centre),
  };
  const end = {
    ...project(endMain, centre - m.terminalCross / 2, m.terminalMain, m.terminalCross),
    port: project.point(endMain, centre),
  };

  const lastMain = body.kind === 'seq'
    ? bodyMain + body.items.slice(0, -1).reduce((sum, it) => sum + it.main + m.mainGap, 0) + body.items[body.items.length - 1].main
    : bodyMain + body.main;

  ctx.edges.push({ from: start.port, to: project.point(bodyMain, centre), kind: 'terminal' });
  ctx.edges.push({ from: project.point(lastMain, centre), to: end.port, kind: 'terminal' });

  const totalMain = endMain + m.terminalMain;
  const totalCross = Math.max(body.cross, m.terminalCross);

  const { w: width, h: height } = project(0, 0, totalMain, totalCross);

  delete ctx.project;
  return { ...ctx, start, end, width, height, centre, axis, metrics: m };
}

/* An orthogonal elbow along the flow's main axis, with rounded turns. */
export function elbowPath(from, to, axis = 'vertical') {
  const vertical = axis === 'vertical';
  const [fm, fc] = vertical ? [from.y, from.x] : [from.x, from.y];
  const [tm, tc] = vertical ? [to.y, to.x] : [to.x, to.y];
  const pt = vertical ? (mm, cc) => `${cc} ${mm}` : (mm, cc) => `${mm} ${cc}`;

  if (Math.abs(fc - tc) < 0.5) return `M ${pt(fm, fc)} L ${pt(tm, tc)}`;

  const midMain = fm + Math.max(12, (tm - fm) / 2);
  const r = Math.min(10, Math.abs(tc - fc) / 2, Math.max(2, Math.abs(tm - fm) / 4));
  const dir = tc > fc ? 1 : -1;
  return [
    `M ${pt(fm, fc)}`,
    `L ${pt(midMain - r, fc)}`,
    `Q ${pt(midMain, fc)} ${pt(midMain, fc + r * dir)}`,
    `L ${pt(midMain, tc - r * dir)}`,
    `Q ${pt(midMain, tc)} ${pt(midMain + r, tc)}`,
    `L ${pt(tm, tc)}`,
  ].join(' ');
}
