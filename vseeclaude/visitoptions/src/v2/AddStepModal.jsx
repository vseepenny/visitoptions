import { STEP_TYPES } from './stepTypes';

/* Step picker for the graph canvas.
 *
 * The vertical editor opens its picker inline between two cards, which works
 * when the insert point is a full-width row. On a pannable canvas the insert
 * point is a 18px dot, so the picker is a modal instead of a popover — it can't
 * be pushed off-screen and it doesn't reflow the layout underneath.
 */

const CATEGORY_ORDER = ['Steps', 'Forms', 'Logic', 'Account'];

/* A singleton is used up wherever it sits, including inside a branch. */
function usedTypes(steps, out = new Set()) {
  for (const s of steps || []) {
    out.add(s.type);
    if (s.branches) s.branches.forEach(b => usedTypes(b.steps, out));
  }
  return out;
}

export function AddStepPickerModal({ steps, onPick, onClose }) {
  const used = usedTypes(steps);
  const available = STEP_TYPES.filter(st => !st.legacy && (!st.singleton || !used.has(st.id)));

  const grouped = {};
  for (const st of available) {
    const cat = st.category || 'Other';
    (grouped[cat] ||= []).push(st);
  }

  return (
    <div
      onMouseDown={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onMouseDown={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 'var(--r-xl)', width: 'min(520px, 92vw)',
          maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)', animation: 'slideUp 180ms ease both',
        }}
      >
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Add a step</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Inserted at the point you clicked.
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {CATEGORY_ORDER.filter(c => grouped[c]?.length).map(cat => (
            <div key={cat} style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-tertiary)', padding: '4px 6px' }}>{cat}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 4 }}>
                {grouped[cat].map(st => (
                  <button
                    key={st.id}
                    onClick={() => onPick(st.id)}
                    title={st.desc}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px',
                      background: 'none', border: '1px solid transparent', borderRadius: 'var(--r-md)',
                      cursor: 'pointer', fontSize: 12.5, fontWeight: 500,
                      color: 'var(--text-primary)', textAlign: 'left', width: '100%',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--grey-100)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}
                  >
                    <span style={{ color: st.color, display: 'flex', flexShrink: 0 }}>{st.icon}</span>
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
