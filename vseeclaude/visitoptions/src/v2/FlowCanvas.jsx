import { useState, useRef, useMemo, useEffect } from 'react';
import { STEP_TYPES, CONDITION_TYPES, changeConditionType, uid as freshId } from './stepTypes';
import { RuleEditor } from './RuleEditor';
import { scopeForStep, conditionIssue } from './flowScope';
import { formFields } from './forms';
import { normalizeSteps } from './workflowUtils';
import { accessConfig, accessSummary, guestBlockReason } from './patientAccess';
import { layoutFlow, elbowPath } from './flowLayout';
import {
  findStep, mapStep, removeSteps, insertSteps, updateBranch, duplicateBranch, reId,
  countSteps, allConditionalIds,
} from './flowTree';
import { allForms } from './forms';

/* Flow canvas.
 *
 * Steps run along the main axis, branches spread across the cross axis as
 * parallel lanes — so every path is visible at once instead of hidden behind
 * tabs. Defaults to `vertical`, because an intake flow is 6-17 steps long and
 * only 3-4 branches wide: the long dimension belongs on the axis that scrolls
 * natively and never runs out.
 *
 * Positions are always computed from the step tree. Authors can't drag nodes
 * around, deliberately: array order IS the execution order here, so a layout
 * the author controls could contradict what actually happens.
 */

const BRANCH_COLORS = ['#0D875C', '#2563EB', '#7C3AED', '#D97706', '#DC2626', '#0891B2', '#4F46E5', '#BE185D'];
const uid = () => `step_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
const MIN_Z = 0.3;
const MAX_Z = 1.6;
const MIN_FIT_Z = 0.5;   // below this, labels stop being readable — pan instead
const PAD = 40;
const VIEWPORT_H = 520;

/* ── Node ─────────────────────────────────────────────────── */

function FlowNode({ node, selected, collapsed, guestBlocked, onSelect, onToggleCollapse, onRename }) {
  const { step } = node;
  const def = STEP_TYPES.find(t => t.id === step.type);
  const isCond = step.type === 'conditional';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const commit = () => {
    const v = draft.trim();
    if (v && v !== step.label) onRename(step.id, v);
    setEditing(false);
  };

  const branchCount = isCond
    ? (step.conditionType === 'rule'
        ? (step.branches || []).filter(b => b.kind === 'rule').length
        : (step.branches || []).length)
    : 0;

  return (
    <div
      data-node-id={step.id}
      onMouseDown={e => { e.stopPropagation(); onSelect(step.id, e.shiftKey); }}
      onDoubleClick={e => { e.stopPropagation(); setDraft(step.label || def?.label || ''); setEditing(true); }}
      style={{
        position: 'absolute', left: node.x, top: node.y, width: node.w, height: node.h,
        display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px 0 10px',
        background: isCond ? 'var(--warning-light)' : 'white',
        border: `1.5px solid ${selected ? 'var(--brand)' : isCond ? 'var(--warning)' : 'var(--border)'}`,
        borderLeft: `4px solid ${selected ? 'var(--brand)' : def?.color || 'var(--border)'}`,
        borderRadius: 'var(--r-md)',
        boxShadow: selected ? '0 0 0 3px rgba(13,135,92,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
        cursor: 'pointer', userSelect: 'none', boxSizing: 'border-box',
        transition: 'box-shadow 120ms, border-color 120ms',
      }}
      title={def?.desc}
    >
      <span style={{ color: def?.color, display: 'flex', flexShrink: 0 }}>{def?.icon}</span>

      <span style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') setEditing(false);
              e.stopPropagation();
            }}
            onMouseDown={e => e.stopPropagation()}
            style={{ width: '100%', font: 'inherit', fontSize: 12, fontWeight: 600, border: '1px solid var(--brand)', borderRadius: 4, padding: '1px 4px' }}
          />
        ) : (
          <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {step.label || def?.label}
          </span>
        )}
        {isCond && !editing && (
          <span style={{ display: 'block', fontSize: 10, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {CONDITION_TYPES.find(c => c.id === step.conditionType)?.label} · {branchCount}
          </span>
        )}
      </span>

      {guestBlocked && (
        <span title={`Guests can't complete this step. ${guestBlocked}`} style={{ display: 'flex', flexShrink: 0, color: '#B45309' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </span>
      )}

      {isCond && (
        <button
          onMouseDown={e => { e.stopPropagation(); onToggleCollapse(step.id); }}
          title={collapsed ? 'Expand branches' : 'Collapse branches'}
          style={{
            width: 20, height: 20, flexShrink: 0, borderRadius: 4, cursor: 'pointer', padding: 0,
            border: '1px solid var(--warning)', background: 'white', color: '#92400E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            {collapsed ? <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></> : <line x1="5" y1="12" x2="19" y2="12"/>}
          </svg>
        </button>
      )}
    </div>
  );
}

function Terminal({ box, label, tone }) {
  return (
    <div style={{
      position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: tone === 'start' ? 'var(--brand)' : 'var(--grey-700)',
      color: 'white', fontSize: 10, fontWeight: 800, letterSpacing: '0.05em',
      textTransform: 'uppercase', borderRadius: 'var(--r-full)',
      textAlign: 'center', padding: '0 8px', boxSizing: 'border-box', lineHeight: 1.2,
    }}>{label}</div>
  );
}

/* ── Outline ──────────────────────────────────────────────── */
// A text view of the whole flow. The canvas can never show everything at once;
// this always can.

function flatten(steps, depth = 0, out = []) {
  for (const s of steps || []) {
    out.push({ step: s, depth });
    if (s.branches) {
      for (const b of s.branches) {
        out.push({ branch: b, depth: depth + 1, parent: s });
        flatten(b.steps || [], depth + 2, out);
      }
    }
  }
  return out;
}

function Outline({ steps, selection, onPick }) {
  const rows = flatten(steps);
  /* Numbering is what makes this read as an outline of *this* flow rather than
     a palette of step types you could drag in. Top-level steps get 1, 2, 3;
     steps inside a branch get 3a.1, 3a.2 and so on. */
  const numbered = [];
  const counters = [0];
  let branchLetter = {};
  for (const r of rows) {
    const d = r.depth;
    if (r.branch) {
      const key = d;
      branchLetter[key] = (branchLetter[key] || 0) + 1;
      numbered.push({ ...r, marker: String.fromCharCode(96 + branchLetter[key]) });
      counters[d + 1] = 0;
      continue;
    }
    counters[d] = (counters[d] || 0) + 1;
    for (let i = d + 1; i < counters.length; i++) counters[i] = 0;
    if (d === 0) branchLetter = {};
    numbered.push({ ...r, marker: String(counters[d]) });
  }

  return (
    <div style={{
      width: 214, flexShrink: 0, borderRight: '1px solid var(--border)',
      height: VIEWPORT_H, overflowY: 'auto', background: 'white',
    }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 1, background: 'white',
        padding: '9px 12px 7px', borderBottom: '1px solid var(--border)',
      }}>
        <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)' }}>
          Flow outline
        </p>
        <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 1 }}>
          {countSteps(steps)} steps, in order
        </p>
      </div>

      <div style={{ padding: '6px 0 10px' }}>
        {numbered.length === 0 && (
          <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', padding: '8px 12px' }}>No steps yet.</p>
        )}
        {numbered.map((r) => {
          const indent = 12 + r.depth * 11;

          if (r.branch) {
            const color = r.branch.kind === 'otherwise' ? 'var(--grey-500)' : BRANCH_COLORS[(r.depth + (r.marker.charCodeAt(0) - 97)) % BRANCH_COLORS.length];
            return (
              <div key={`b${r.branch.id}`} style={{ position: 'relative', paddingLeft: indent, paddingRight: 8, marginTop: 3 }}>
                <Guides depth={r.depth} />
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, padding: '2px 0' }}>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', minWidth: 12 }}>{r.marker})</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.04em',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{r.branch.label}</span>
                </div>
              </div>
            );
          }

          const def = STEP_TYPES.find(t => t.id === r.step.type);
          const on = selection.has(r.step.id);
          const isCond = r.step.type === 'conditional';
          return (
            <div key={r.step.id} style={{ position: 'relative', paddingLeft: indent, paddingRight: 6 }}>
              <Guides depth={r.depth} />
              <button
                onClick={() => onPick(r.step.id)}
                style={{
                  display: 'flex', alignItems: 'baseline', gap: 6, width: '100%',
                  padding: '3px 6px 3px 0', background: 'none', border: 'none',
                  borderRadius: 4, cursor: 'pointer', textAlign: 'left',
                  color: on ? 'var(--brand)' : 'var(--text-primary)',
                }}
                onMouseEnter={e => { if (!on) e.currentTarget.style.color = 'var(--brand)'; }}
                onMouseLeave={e => { if (!on) e.currentTarget.style.color = 'var(--text-primary)'; }}
              >
                <span style={{
                  fontSize: 10, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                  color: on ? 'var(--brand)' : 'var(--text-tertiary)', minWidth: 13, flexShrink: 0,
                }}>{r.marker}.</span>
                <span style={{
                  fontSize: 11.5, fontWeight: on ? 700 : isCond ? 600 : 400,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  textDecoration: on ? 'underline' : 'none', textUnderlineOffset: 2,
                }}>
                  {r.step.label || def?.label}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Indent guides — the vertical rules that make nesting legible in a tree. */
function Guides({ depth }) {
  if (depth === 0) return null;
  return (
    <>
      {Array.from({ length: depth }, (_, i) => (
        <span key={i} style={{
          position: 'absolute', left: 16 + i * 11, top: 0, bottom: 0,
          width: 1, background: 'var(--border)', pointerEvents: 'none',
        }} />
      ))}
    </>
  );
}

/* ── Minimap ──────────────────────────────────────────────── */

function Minimap({ layout, view, size, onJump }) {
  const MAP = 132;
  const scale = Math.min(MAP / Math.max(1, layout.width), MAP / Math.max(1, layout.height));
  const mw = layout.width * scale, mh = layout.height * scale;

  const vx = (-view.x / view.z) * scale;
  const vy = (-view.y / view.z) * scale;
  const vw = (size.w / view.z) * scale;
  const vh = (size.h / view.z) * scale;

  const jump = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    onJump(((e.clientX - r.left) / scale), ((e.clientY - r.top) / scale));
  };

  return (
    <div
      onMouseDown={e => { e.stopPropagation(); jump(e); }}
      title="Click to jump"
      style={{
        position: 'absolute', right: 10, bottom: 10, width: mw + 12, height: mh + 12,
        padding: 6, background: 'rgba(255,255,255,0.92)', border: '1px solid var(--border)',
        borderRadius: 8, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ position: 'relative', width: mw, height: mh }}>
        {layout.nodes.map(n => (
          <div key={n.id} style={{
            position: 'absolute',
            left: n.x * scale, top: n.y * scale,
            width: Math.max(2, n.w * scale), height: Math.max(2, n.h * scale),
            background: n.isCondition ? 'var(--warning)' : 'var(--grey-400)',
            borderRadius: 1,
          }} />
        ))}
        <div style={{
          position: 'absolute', left: vx, top: vy, width: vw, height: vh,
          border: '1.5px solid var(--brand)', background: 'rgba(13,135,92,0.10)',
          borderRadius: 2, pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}

/* ── Jump palette (⌘K) ────────────────────────────────────── */

function JumpPalette({ steps, onPick, onClose }) {
  const [q, setQ] = useState('');
  const rows = flatten(steps).filter(r => r.step);
  const def = (s) => STEP_TYPES.find(t => t.id === s.type);
  const hits = rows.filter(r => {
    const label = (r.step.label || def(r.step)?.label || '').toLowerCase();
    return !q.trim() || label.includes(q.toLowerCase());
  });

  return (
    <div
      onMouseDown={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '14vh', background: 'rgba(0,0,0,0.35)' }}
    >
      <div
        onMouseDown={e => e.stopPropagation()}
        style={{ width: 'min(460px, 92vw)', background: 'white', borderRadius: 'var(--r-lg)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}
      >
        <input
          autoFocus
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter' && hits[0]) onPick(hits[0].step.id);
          }}
          placeholder="Jump to a step…"
          style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--border)', padding: '13px 16px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
        />
        <div style={{ maxHeight: 300, overflowY: 'auto', padding: 6 }}>
          {hits.length === 0 && <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', padding: '12px 10px' }}>No step matches “{q}”.</p>}
          {hits.map((r, i) => (
            <button
              key={r.step.id}
              onClick={() => onPick(r.step.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '7px 10px', background: i === 0 && q ? 'var(--brand-50)' : 'none',
                border: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'left', fontSize: 12.5,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--grey-100)'}
              onMouseLeave={e => e.currentTarget.style.background = i === 0 && q ? 'var(--brand-50)' : 'none'}
            >
              <span style={{ color: def(r.step)?.color, display: 'flex', flexShrink: 0 }}>{def(r.step)?.icon}</span>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.step.label || def(r.step)?.label}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{def(r.step)?.category}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Canvas ───────────────────────────────────────────────── */

export default function FlowCanvas({ workflow, onChange, clinic, access, onAddStep, axis = 'vertical', showOutline = true }) {
  const steps = useMemo(() => normalizeSteps(workflow?.steps || []), [workflow]);
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [selection, setSelection] = useState(() => new Set());
  const [clipboard, setClipboard] = useState(null);
  const [view, setView] = useState({ x: PAD, y: PAD, z: 1 });
  const [hoverSlot, setHoverSlot] = useState(null);
  const [panning, setPanning] = useState(false);
  const [jumping, setJumping] = useState(false);
  const [size, setSize] = useState({ w: 800, h: VIEWPORT_H });
  const [rootW, setRootW] = useState(900);
  const [outlineOn, setOutlineOn] = useState(showOutline);
  const [inspectorOn, setInspectorOn] = useState(true);
  const viewportRef = useRef(null);
  const rootRef = useRef(null);
  const panRef = useRef(null);

  /* Side panels cost width the canvas needs. The inspector earns its place
     first — it's where editing happens — so it appears from 660px up, and the
     outline only once there's room for both. */
  const INSPECTOR_W = 268;
  const roomForInspector = rootW >= 660;
  const roomForOutline = rootW >= 1000;
  const outlineVisible = outlineOn && roomForOutline;
  const inspectorVisible = inspectorOn && roomForInspector;

  const vertical = axis === 'vertical';
  const guestAllowed = accessConfig(access).allowGuest;
  const layout = useMemo(() => layoutFlow(steps, collapsed, axis), [steps, collapsed, axis]);
  const commit = (nextSteps) => onChange({ ...workflow, steps: nextSteps });

  useEffect(() => {
    const vp = viewportRef.current;
    const root = rootRef.current;
    if (!vp || !root) return;
    const sync = () => {
      setSize({ w: vp.clientWidth, h: vp.clientHeight });
      setRootW(root.clientWidth);
    };
    const ro = new ResizeObserver(sync);
    ro.observe(vp);
    ro.observe(root);
    sync();
    return () => ro.disconnect();
  }, []);

  /* ── View ── */

  /* Fit sizes to the CROSS axis only. The main axis is meant to run off-screen
     and be scrolled — squeezing a 19-step flow into 520px of height just makes
     every label unreadable. So a long vertical flow opens at 100% and scrolls,
     like a page. */
  const fit = () => {
    const vp = viewportRef.current;
    if (!vp) return;
    const crossRoom = (vertical ? vp.clientWidth : vp.clientHeight) - PAD * 2;
    const crossSize = vertical ? layout.width : layout.height;
    const z = Math.max(MIN_FIT_Z, Math.min(1, crossRoom / Math.max(1, crossSize)));

    const centreCross = (room, extent) => Math.max(PAD / 2, (room + PAD * 2 - extent * z) / 2);
    setView({
      x: vertical ? centreCross(crossRoom, layout.width) : PAD,
      y: vertical ? PAD / 2 : centreCross(crossRoom, layout.height),
      z,
    });
  };

  const centreOn = (id) => {
    const n = layout.nodes.find(x => x.id === id);
    const vp = viewportRef.current;
    if (!n || !vp) return;
    setView(v => ({
      ...v,
      x: vp.clientWidth / 2 - (n.x + n.w / 2) * v.z,
      y: vp.clientHeight / 2 - (n.y + n.h / 2) * v.z,
    }));
  };

  const zoomBy = (factor) => setView(v => {
    const vp = viewportRef.current;
    const z = Math.max(MIN_Z, Math.min(MAX_Z, v.z * factor));
    if (!vp) return { ...v, z };
    const cx = vp.clientWidth / 2, cy = vp.clientHeight / 2;
    return { x: cx - (cx - v.x) * (z / v.z), y: cy - (cy - v.y) * (z / v.z), z };
  });

  const onWheel = (e) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
      const rect = viewportRef.current.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      setView(v => {
        const z = Math.max(MIN_Z, Math.min(MAX_Z, v.z * factor));
        return { x: px - (px - v.x) * (z / v.z), y: py - (py - v.y) * (z / v.z), z };
      });
    } else {
      setView(v => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
    }
  };

  const onBackgroundDown = (e) => {
    setSelection(new Set());
    panRef.current = { sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y };
    setPanning(true);
  };

  useEffect(() => {
    const move = (e) => {
      const p = panRef.current;
      if (!p) return;
      setView(v => ({ ...v, x: p.ox + (e.clientX - p.sx), y: p.oy + (e.clientY - p.sy) }));
    };
    const up = () => { panRef.current = null; setPanning(false); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, []);

  /* ── Editing ── */

  const select = (id, additive) => setSelection(prev => {
    if (!additive) return new Set([id]);
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const rename = (id, label) => commit(mapStep(steps, id, s => ({ ...s, label })));

  const toggleCollapse = (id) => setCollapsed(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const deleteSelected = () => {
    if (selection.size === 0) return;
    commit(removeSteps(steps, selection));
    setSelection(new Set());
  };

  const copySelected = () => {
    if (selection.size === 0) return;
    setClipboard(structuredClone([...selection].map(id => findStep(steps, id)?.step).filter(Boolean)));
  };

  const pasteClipboard = () => {
    if (!clipboard?.length) return;
    const anchorId = [...selection].pop();
    const anchor = anchorId ? findStep(steps, anchorId) : null;
    const fresh = reId(clipboard, uid);
    if (!anchor) commit([...steps, ...fresh]);
    else {
      const parent = findParentOf(steps, anchorId);
      commit(insertSteps(steps, parent.containerId, parent.branchIndex, anchor.index + 1, fresh));
    }
    setSelection(new Set(fresh.map(s => s.id)));
  };

  const actions = useRef({});
  useEffect(() => { actions.current = { deleteSelected, copySelected, pasteClipboard, fit }; });
  // Re-fit when the flow's shape changes, or when the space available for it does
  useEffect(() => { actions.current.fit?.(); }, [layout.width, layout.height, outlineVisible, inspectorVisible, size.w, size.h]);

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || tag === 'select';
      const a = actions.current;
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setJumping(true); return; }
      if (typing) return;
      if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); a.deleteSelected(); }
      else if ((e.metaKey || e.ctrlKey) && e.key === 'c') a.copySelected();
      else if ((e.metaKey || e.ctrlKey) && e.key === 'v') { e.preventDefault(); a.pasteClipboard(); }
      else if (e.key === 'Escape') setSelection(new Set());
      else if (e.key === '0' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); a.fit(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const selectedStep = selection.size === 1 ? findStep(steps, [...selection][0])?.step : null;

  return (
    <div ref={rootRef} style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden', background: 'white' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--grey-50)', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>{countSteps(steps)}</strong> steps
          {accessSummary(access).length > 0 && <> · enters via {accessSummary(access).join(', ')}</>}
        </span>
        <span style={{ flex: 1 }} />
        {selection.size > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand)' }}>{selection.size} selected</span>}
        <button
          className={`btn btn-xs ${outlineVisible ? 'btn-secondary' : 'btn-ghost'}`}
          onClick={() => setOutlineOn(o => !o)}
          disabled={!roomForOutline}
          title={roomForOutline ? 'Toggle the flow outline' : 'Needs ~1000px of width to show alongside the canvas and inspector'}
        >Outline</button>
        <button
          className={`btn btn-xs ${inspectorVisible ? 'btn-secondary' : 'btn-ghost'}`}
          onClick={() => setInspectorOn(o => !o)}
          disabled={!roomForInspector}
          title={roomForInspector ? 'Toggle the step editor' : 'Not enough width for the side editor'}
        >Editor</button>
        <button className="btn btn-ghost btn-xs" onClick={() => setJumping(true)} title="Jump to a step (⌘K)">⌘K Jump</button>
        <button className="btn btn-ghost btn-xs" onClick={() => setCollapsed(new Set(allConditionalIds(steps)))}>Collapse all</button>
        <button className="btn btn-ghost btn-xs" onClick={() => setCollapsed(new Set())}>Expand all</button>
        <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', background: 'white' }}>
          <button onClick={() => zoomBy(1 / 1.2)} title="Zoom out" style={zBtn}>–</button>
          <button onClick={fit} title="Fit to view (⌘0)" style={{ ...zBtn, width: 'auto', padding: '0 8px', fontSize: 11, fontWeight: 600, borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
            {Math.round(view.z * 100)}%
          </button>
          <button onClick={() => zoomBy(1.2)} title="Zoom in" style={zBtn}>+</button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {outlineVisible && <Outline steps={steps} selection={selection} onPick={id => { select(id, false); centreOn(id); }} />}

        {/* Viewport */}
        <div
          ref={viewportRef}
          onWheel={onWheel}
          onMouseDown={onBackgroundDown}
          style={{
            position: 'relative', flex: 1, minWidth: 0, height: VIEWPORT_H, overflow: 'hidden',
            background: 'var(--grey-100)',
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)',
            backgroundSize: `${18 * view.z}px ${18 * view.z}px`,
            backgroundPosition: `${view.x}px ${view.y}px`,
            cursor: panning ? 'grabbing' : 'grab',
          }}
        >
          <div style={{
            position: 'absolute', left: 0, top: 0,
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`,
            transformOrigin: '0 0', width: layout.width, height: layout.height,
          }}>
            {/* Lanes — every branch visible at once */}
            {layout.lanes.map((lane, i) => {
              const color = lane.branch.kind === 'otherwise' ? 'var(--grey-500)' : BRANCH_COLORS[lane.index % BRANCH_COLORS.length];
              return (
                <div key={`${lane.path.containerId}-${i}`} style={{
                  position: 'absolute', left: lane.x - 6, top: lane.y - 2,
                  width: lane.w + 12, height: lane.h + 4,
                  border: `1px dashed ${color}`, borderRadius: 8,
                  background: color.startsWith('#') ? `${color}0A` : 'rgba(0,0,0,0.02)',
                  boxSizing: 'border-box', pointerEvents: 'none',
                }}>
                  <span style={{
                    position: 'absolute', left: 8, top: 2, maxWidth: lane.w,
                    fontSize: 10, fontWeight: 700, color, whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {lane.branch.label}
                    {lane.branch.kind === 'rule' && lane.branch.expr && (
                      <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontWeight: 500, color: 'var(--text-tertiary)' }}>{'  '}{lane.branch.expr}</span>
                    )}
                    {lane.path.depth > 1 && <span style={{ color: 'var(--text-tertiary)' }}>{'  '}L{lane.path.depth}</span>}
                  </span>
                </div>
              );
            })}

            {/* Connectors */}
            <svg width={layout.width} height={layout.height} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', overflow: 'visible' }}>
              {layout.edges.map((e, i) => (
                <path
                  key={i}
                  d={elbowPath(e.from, e.to, axis)}
                  fill="none"
                  stroke={e.kind === 'split' || e.kind === 'join' ? 'var(--border-strong)' : 'var(--grey-400)'}
                  strokeWidth={e.kind === 'terminal' ? 2 : 1.5}
                  strokeDasharray={e.kind === 'join' ? '3 3' : undefined}
                />
              ))}
            </svg>

            {layout.placeholders.map((ph, i) => (
              <div key={i} style={{
                position: 'absolute', left: ph.x, top: ph.y, width: ph.w, height: ph.h,
                border: '1.5px dashed var(--border-strong)', borderRadius: 'var(--r-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, color: 'var(--text-tertiary)', background: 'rgba(255,255,255,0.6)',
                boxSizing: 'border-box', pointerEvents: 'none', textAlign: 'center', padding: 4,
              }}>continues straight on</div>
            ))}

            {/* Insert points — a real affordance, not a faint dot. Generous
                transparent hit area, branded circle, and a label on hover so
                it's obvious what clicking does. */}
            {layout.slots.map((slot, i) => {
              const key = `${slot.containerId || 'root'}-${slot.branchIndex ?? '-'}-${slot.index}-${i}`;
              const active = hoverSlot === key;
              const HIT = 30;
              return (
                <button
                  key={key}
                  onMouseEnter={() => setHoverSlot(key)}
                  onMouseLeave={() => setHoverSlot(null)}
                  onMouseDown={e => { e.stopPropagation(); onAddStep?.(slot); }}
                  title="Insert a step here"
                  style={{
                    position: 'absolute', left: slot.x - HIT / 2, top: slot.y - HIT / 2,
                    width: HIT, height: HIT, padding: 0, border: 'none', background: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', zIndex: 4,
                  }}
                >
                  {/* Neutral at rest — 18 of these along a long flow, so brand
                      colour on every one competes with the steps. Visibility
                      comes from size, a solid edge and the shadow lifting it off
                      the connector; green is saved for hover. */}
                  <span style={{
                    width: active ? 26 : 22, height: active ? 26 : 22, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: active ? 'var(--brand)' : 'white',
                    border: `2px solid ${active ? 'var(--brand)' : 'var(--border-strong)'}`,
                    color: active ? 'white' : 'var(--text-secondary)',
                    boxShadow: active
                      ? '0 0 0 4px rgba(13,135,92,0.18), 0 2px 6px rgba(0,0,0,0.12)'
                      : '0 1px 3px rgba(0,0,0,0.10)',
                    transition: 'all 120ms',
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </span>
                  {active && (
                    <span style={{
                      position: 'absolute',
                      ...(vertical ? { left: '100%', marginLeft: 8 } : { top: '100%', marginTop: 6 }),
                      padding: '3px 8px', borderRadius: 'var(--r-full)',
                      background: 'var(--brand)', color: 'white',
                      fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap',
                      pointerEvents: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    }}>Add step</span>
                  )}
                </button>
              );
            })}

            {layout.nodes.map(node => (
              <FlowNode
                key={node.id}
                node={node}
                selected={selection.has(node.id)}
                collapsed={collapsed.has(node.id)}
                guestBlocked={guestAllowed ? guestBlockReason(node.step) : null}
                onSelect={select}
                onToggleCollapse={toggleCollapse}
                onRename={rename}
              />
            ))}

            <Terminal box={layout.start} label="Patient Enters" tone="start" />
            <Terminal box={layout.end} label="Visit Complete" tone="end" />
          </div>

          <Minimap
            layout={layout}
            view={view}
            size={size}
            onJump={(cx, cy) => setView(v => ({ ...v, x: size.w / 2 - cx * v.z, y: size.h / 2 - cy * v.z }))}
          />

          <div style={{
            position: 'absolute', left: 10, bottom: 10, fontSize: 10, color: 'var(--text-tertiary)',
            background: 'rgba(255,255,255,0.85)', padding: '3px 8px', borderRadius: 'var(--r-full)', pointerEvents: 'none',
          }}>
            {vertical ? 'scroll to move down the flow' : 'scroll to move along the flow'} · ⌘scroll zoom · dbl-click rename · shift-click multi · ⌘C/⌘V · ⌫ delete
          </div>
        </div>

        {inspectorVisible && (
          <Inspector
            step={selectedStep}
            count={selection.size}
            clinic={clinic}
            steps={steps}
            access={access}
            onChange={commit}
            onRename={rename}
            width={INSPECTOR_W}
          />
        )}
      </div>

      {/* Too narrow for a side panel — fall back to a strip under the canvas */}
      {!inspectorVisible && selectedStep && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: STEP_TYPES.find(t => t.id === selectedStep.type)?.color, display: 'flex' }}>
            {STEP_TYPES.find(t => t.id === selectedStep.type)?.icon}
          </span>
          <input
            value={selectedStep.label || ''}
            onChange={e => rename(selectedStep.id, e.target.value)}
            className="input"
            style={{ height: 28, fontSize: 12.5, fontWeight: 600, maxWidth: 240 }}
          />
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            Widen the panel to edit {selectedStep.type === 'conditional' ? 'this branch condition' : 'its settings'}.
          </span>
        </div>
      )}

      {jumping && (
        <JumpPalette
          steps={steps}
          onPick={id => { select(id, false); centreOn(id); setJumping(false); }}
          onClose={() => setJumping(false)}
        />
      )}
    </div>
  );
}

const zBtn = { width: 26, height: 24, border: 'none', background: 'white', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1, padding: 0 };

function findParentOf(steps, id, containerId = null, branchIndex = null) {
  for (const s of steps || []) {
    if (s.id === id) return { containerId, branchIndex };
    if (s.branches) {
      for (let bi = 0; bi < s.branches.length; bi++) {
        const hit = findParentOf(s.branches[bi].steps || [], id, s.id, bi);
        if (hit) return hit;
      }
    }
  }
  return null;
}

/* ── Inspector ────────────────────────────────────────────── */
// Lives on the right, beside the canvas. Holds everything that used to pad out
// every card: the description, the form picker, and the full conditional
// editor — condition type, its operands, and the per-branch rules.

function Inspector({ step, count, clinic, steps, access, onChange, onRename, width }) {
  const shell = {
    width, flexShrink: 0, borderLeft: '1px solid var(--border)',
    height: VIEWPORT_H, overflowY: 'auto', background: 'white', padding: '12px 14px',
  };

  if (count > 1) {
    return (
      <div style={shell}>
        <InspectorHeader title={`${count} steps selected`} />
        <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          ⌘C to copy, ⌫ to delete, or click a single step to edit it.
        </p>
      </div>
    );
  }

  if (!step) {
    return (
      <div style={shell}>
        <InspectorHeader title="Nothing selected" />
        <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          Click a step on the canvas or in the outline to edit it here.
        </p>
      </div>
    );
  }

  const def = STEP_TYPES.find(t => t.id === step.type);
  const isCond = step.type === 'conditional';
  const forms = allForms(clinic);
  const set = (patch) => onChange(mapStep(steps, step.id, s => ({ ...s, ...patch })));
  const replace = (nextStep) => onChange(mapStep(steps, step.id, () => nextStep));

  return (
    <div style={shell}>
      <InspectorHeader title={def?.category || 'Step'} icon={def?.icon} color={def?.color} />

      <div className="form-group" style={{ marginBottom: 12 }}>
        <label style={fieldLabel}>Name</label>
        <input
          value={step.label || ''}
          onChange={e => onRename(step.id, e.target.value)}
          className="input"
          style={{ height: 30, fontSize: 12.5, fontWeight: 600 }}
        />
      </div>

      {def?.desc && !isCond && (
        <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>{def.desc}</p>
      )}

      {step.type === 'form' && (
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label style={fieldLabel}>Form</label>
          <select
            value={step.formId || ''}
            onChange={e => {
              const formId = e.target.value || null;
              const f = forms.find(x => x.id === formId);
              set({ formId, label: f?.name || step.label });
            }}
            className="input"
            style={{ height: 30, fontSize: 12, padding: '0 26px 0 8px' }}
          >
            <option value="">— Select a form —</option>
            {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
      )}

      {step.type === 'pharmacy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          <label style={fieldLabel}>Options</label>
          {[
            { key: 'allowSearch', label: 'Directory search' },
            { key: 'showMap', label: 'Show map' },
            { key: 'allowMailOrder', label: 'Mail-order option' },
            { key: 'allowSkip', label: 'Allow skip' },
          ].map(o => (
            <label key={o.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, cursor: 'pointer' }}>
              <input type="checkbox" checked={step[o.key] ?? true} onChange={e => set({ [o.key]: e.target.checked })} style={{ accentColor: 'var(--brand)' }} />
              {o.label}
            </label>
          ))}
        </div>
      )}

      {isCond && (
        <ConditionalInspector
          step={step}
          steps={steps}
          clinic={clinic}
          access={access}
          onChange={onChange}
          onReplace={replace}
        />
      )}
    </div>
  );
}

function InspectorHeader({ title, icon, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
      paddingBottom: 8, borderBottom: '1px solid var(--border)',
    }}>
      {icon && <span style={{ color, display: 'flex' }}>{icon}</span>}
      <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)' }}>
        {title}
      </span>
    </div>
  );
}

const fieldLabel = {
  display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 4,
};

/* ── Conditional editor ───────────────────────────────────── */
// The graph view previously showed the condition type as read-only text, so
// there was no way to change what a branch tested. This is the full editor:
// condition type, its operands, prerequisite warnings, and per-branch rules.

function ConditionalInspector({ step, steps, clinic, access, onChange, onReplace }) {
  const scope = scopeForStep(steps, step.id, clinic, access);
  const issue = conditionIssue(step, scope, clinic);
  const isRule = (step.conditionType || 'patient_type') === 'rule';
  const branches = step.branches || [];

  const setBranch = (bi, patch) => onChange(updateBranch(steps, step.id, bi, patch));

  const addRule = () => {
    const next = [...branches];
    const at = next.findIndex(b => b.kind === 'otherwise');
    const n = next.filter(b => b.kind === 'rule').length + 1;
    next.splice(at === -1 ? next.length : at, 0, { id: freshId(), kind: 'rule', label: `Rule ${n}`, expr: '', rule: null, steps: [] });
    onReplace({ ...step, branches: next });
  };

  const moveRule = (from, dir) => {
    const to = from + dir;
    const next = [...branches];
    if (to < 0 || to >= next.length || next[to].kind === 'otherwise' || next[from].kind === 'otherwise') return;
    [next[from], next[to]] = [next[to], next[from]];
    onReplace({ ...step, branches: next });
  };

  const removeRule = (bi) => onReplace({ ...step, branches: branches.filter((_, i) => i !== bi) });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label style={fieldLabel}>Branch on</label>
        <select
          value={step.conditionType || 'patient_type'}
          onChange={e => onReplace(changeConditionType(step, e.target.value, clinic))}
          className="input"
          style={{ height: 30, fontSize: 12, padding: '0 26px 0 8px' }}
        >
          {CONDITION_TYPES.map(ct => <option key={ct.id} value={ct.id}>{ct.label}</option>)}
        </select>
      </div>

      {issue && (
        <div style={warnBox}>
          <strong>
            {issue.kind === 'missing_step' && `Add a ${issue.step} step above this. `}
            {issue.kind === 'stale_form' && 'Form is no longer in scope. '}
            {issue.kind === 'no_forms' && 'No form to test. '}
            {issue.kind === 'no_dob' && 'No date of birth collected. '}
          </strong>
          {issue.why}
        </div>
      )}

      {/* Form-answer needs a form and a question, both scoped to what runs earlier */}
      {step.conditionType === 'form_answer' && (() => {
        const selForm = scope.forms.find(f => f.id === step.conditionFormId);
        const fields = formFields(selForm);
        return (
          <>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={fieldLabel}>Form</label>
              <select
                value={step.conditionFormId || ''}
                onChange={e => onReplace({ ...step, conditionFormId: e.target.value || null, conditionFieldId: null })}
                className="input"
                style={{ height: 30, fontSize: 12, padding: '0 26px 0 8px' }}
              >
                <option value="">{scope.forms.length ? '— Select a form —' : '— No forms run before this —'}</option>
                {scope.forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            {selForm && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={fieldLabel}>Question</label>
                <select
                  value={step.conditionFieldId || ''}
                  onChange={e => onReplace({ ...step, conditionFieldId: e.target.value || null })}
                  className="input"
                  style={{ height: 30, fontSize: 12, padding: '0 26px 0 8px' }}
                >
                  <option value="">— Select a question —</option>
                  {fields.length === 0 && <option disabled>No fields on this form</option>}
                  {fields.map(f => <option key={f.id} value={f.id}>{f.label || f.id}</option>)}
                </select>
              </div>
            )}
          </>
        );
      })()}

      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
          <label style={{ ...fieldLabel, marginBottom: 0 }}>{isRule ? 'Rules' : 'Branches'}</label>
          <span style={{ flex: 1 }} />
          {isRule && <button className="btn btn-ghost btn-xs" onClick={addRule}>+ Add rule</button>}
        </div>

        {isRule && (
          <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)', lineHeight: 1.45, marginBottom: 8 }}>
            Checked top to bottom. The first match runs; anyone left over takes Otherwise.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {branches.map((b, bi) => {
            const color = b.kind === 'otherwise' ? 'var(--grey-500)' : BRANCH_COLORS[bi % BRANCH_COLORS.length];
            return (
              <div key={b.id} style={{
                border: '1px solid var(--border)', borderLeft: `3px solid ${color}`,
                borderRadius: 'var(--r-md)', padding: '8px 9px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                  {b.kind === 'otherwise' ? (
                    <span style={{ fontSize: 11.5, fontWeight: 700, color, flex: 1 }}>{b.label}</span>
                  ) : (
                    <input
                      value={b.label || ''}
                      onChange={e => setBranch(bi, { label: e.target.value })}
                      className="input"
                      style={{ height: 24, fontSize: 11.5, fontWeight: 600, flex: 1, minWidth: 0 }}
                    />
                  )}
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)', flexShrink: 0 }}>{(b.steps || []).length}</span>
                  {isRule && b.kind === 'rule' && (
                    <>
                      <button className="btn-icon" style={miniBtn} title="Check earlier" disabled={bi === 0} onClick={() => moveRule(bi, -1)}>↑</button>
                      <button className="btn-icon" style={miniBtn} title="Check later" disabled={branches[bi + 1]?.kind !== 'rule'} onClick={() => moveRule(bi, 1)}>↓</button>
                      <button className="btn-icon danger" style={miniBtn} title="Remove rule" disabled={branches.filter(x => x.kind === 'rule').length <= 1} onClick={() => removeRule(bi)}>×</button>
                    </>
                  )}
                  {!isRule && (
                    <button className="btn btn-ghost btn-xs" style={{ flexShrink: 0 }} onClick={() => onChange(duplicateBranch(steps, step.id, bi, freshId))} title="Duplicate this branch and its steps">Copy</button>
                  )}
                </div>

                {b.kind === 'rule' && (
                  <RuleEditor branch={b} variables={scope.variables} onChange={nb => setBranch(bi, nb)} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const miniBtn = { width: 20, height: 20, flexShrink: 0, fontSize: 11, lineHeight: 1, padding: 0 };
const warnBox = {
  padding: '7px 10px', background: 'var(--warning-light)', border: '1px solid #FDE68A',
  borderRadius: 'var(--r-md)', fontSize: 11, color: '#92400E', lineHeight: 1.45,
};
