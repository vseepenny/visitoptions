import { useState, useRef, useMemo, useEffect } from 'react';
import { STEP_TYPES, CONDITION_TYPES } from './stepTypes';
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
  return (
    <div style={{
      width: 208, flexShrink: 0, borderRight: '1px solid var(--border)',
      height: VIEWPORT_H, overflowY: 'auto', background: 'var(--grey-50)', padding: '8px 6px',
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', padding: '2px 6px 6px' }}>
        Outline
      </p>
      {rows.length === 0 && <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', padding: '0 6px' }}>No steps yet.</p>}
      {rows.map((r, i) => {
        if (r.branch) {
          const color = r.branch.kind === 'otherwise' ? 'var(--grey-500)' : BRANCH_COLORS[i % BRANCH_COLORS.length];
          return (
            <div key={`b${r.branch.id}`} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '2px 6px', paddingLeft: 6 + r.depth * 9,
              fontSize: 10.5, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.03em',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.branch.label}</span>
            </div>
          );
        }
        const def = STEP_TYPES.find(t => t.id === r.step.type);
        const on = selection.has(r.step.id);
        return (
          <button
            key={r.step.id}
            onClick={() => onPick(r.step.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, width: '100%',
              padding: '3px 6px', paddingLeft: 6 + r.depth * 9,
              background: on ? 'var(--brand-50)' : 'none',
              border: 'none', borderRadius: 4, cursor: 'pointer', textAlign: 'left',
              fontSize: 11.5, fontWeight: on ? 700 : 500,
              color: on ? 'var(--brand)' : 'var(--text-primary)',
            }}
          >
            <span style={{ color: def?.color, display: 'flex', flexShrink: 0, opacity: 0.9 }}>{def?.icon}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.step.label || def?.label}</span>
          </button>
        );
      })}
    </div>
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
  const viewportRef = useRef(null);
  const rootRef = useRef(null);
  const panRef = useRef(null);

  /* The outline is a genuine win on a long flow, but it costs ~210px — in a
     784px container that leaves the canvas too cramped to read. So it only
     offers itself when there's room for both. */
  const roomForOutline = rootW >= 700;
  const outlineVisible = outlineOn && roomForOutline;

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
  useEffect(() => { actions.current.fit?.(); }, [layout.width, layout.height, outlineVisible, size.w, size.h]);

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
          title={roomForOutline ? 'Toggle the outline list' : 'Not enough width for the outline alongside the canvas'}
        >Outline</button>
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

            {/* Insert points */}
            {layout.slots.map((slot, i) => {
              const key = `${slot.containerId || 'root'}-${slot.branchIndex ?? '-'}-${slot.index}-${i}`;
              const active = hoverSlot === key;
              return (
                <button
                  key={key}
                  onMouseEnter={() => setHoverSlot(key)}
                  onMouseLeave={() => setHoverSlot(null)}
                  onMouseDown={e => { e.stopPropagation(); onAddStep?.(slot); }}
                  title="Insert a step here"
                  style={{
                    position: 'absolute', left: slot.x - 9, top: slot.y - 9,
                    width: 18, height: 18, borderRadius: '50%', padding: 0,
                    border: `1.5px ${active ? 'solid' : 'dashed'} ${active ? 'var(--brand)' : 'var(--border-strong)'}`,
                    background: active ? 'var(--brand)' : 'white',
                    color: active ? 'white' : 'var(--text-tertiary)',
                    fontSize: 12, lineHeight: 1, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: active ? 1 : 0.5, transition: 'all 120ms', zIndex: 3,
                  }}
                >+</button>
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
      </div>

      <Inspector step={selectedStep} count={selection.size} clinic={clinic} steps={steps} onChange={commit} onRename={rename} />

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
// Everything that used to pad out every card: the description, the form
// picker, the branch list.

function Inspector({ step, count, clinic, steps, onChange, onRename }) {
  if (count > 1) {
    return (
      <div style={inspectorShell}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          <strong>{count} steps selected.</strong> ⌘C to copy, ⌫ to delete, or click one to inspect it.
        </p>
      </div>
    );
  }
  if (!step) {
    return (
      <div style={inspectorShell}>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          Select a step to edit it. Every branch is visible on the canvas — nothing is hidden behind a tab.
        </p>
      </div>
    );
  }

  const def = STEP_TYPES.find(t => t.id === step.type);
  const isCond = step.type === 'conditional';
  const forms = allForms(clinic);

  return (
    <div style={inspectorShell}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ color: def?.color, display: 'flex' }}>{def?.icon}</span>
        <input
          value={step.label || ''}
          onChange={e => onRename(step.id, e.target.value)}
          className="input"
          style={{ height: 28, fontSize: 12.5, fontWeight: 600, maxWidth: 260 }}
        />
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{def?.category}</span>
      </div>

      {def?.desc && !isCond && (
        <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: 8 }}>{def.desc}</p>
      )}

      {step.type === 'form' && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--text-secondary)' }}>
          Form
          <select
            value={step.formId || ''}
            onChange={e => {
              const formId = e.target.value || null;
              const f = forms.find(x => x.id === formId);
              onChange(mapStep(steps, step.id, s => ({ ...s, formId, label: f?.name || s.label })));
            }}
            className="input"
            style={{ height: 28, fontSize: 12, padding: '0 26px 0 8px', maxWidth: 240 }}
          >
            <option value="">— Select a form —</option>
            {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </label>
      )}

      {isCond && (
        <div>
          <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Branching on <strong>{CONDITION_TYPES.find(c => c.id === step.conditionType)?.label}</strong>.
            {step.conditionType === 'rule' && ' Rules are checked top to bottom; the first match runs.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(step.branches || []).map((b, bi) => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: b.kind === 'otherwise' ? 'var(--grey-500)' : BRANCH_COLORS[bi % BRANCH_COLORS.length] }} />
                <input
                  value={b.label || ''}
                  onChange={e => onChange(updateBranch(steps, step.id, bi, { label: e.target.value }))}
                  className="input"
                  style={{ height: 24, fontSize: 11.5, maxWidth: 180 }}
                />
                <span style={{ color: 'var(--text-tertiary)' }}>{(b.steps || []).length} steps</span>
                <span style={{ flex: 1 }} />
                <button className="btn btn-ghost btn-xs" onClick={() => onChange(duplicateBranch(steps, step.id, bi, uid))} title="Duplicate this branch and its steps">Duplicate</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const inspectorShell = { padding: '12px 14px', borderTop: '1px solid var(--border)', background: 'white', minHeight: 76 };
