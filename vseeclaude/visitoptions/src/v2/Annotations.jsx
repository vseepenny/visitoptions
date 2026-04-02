import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';

/* ── Persistence ────────────────────────────────────────── */

const STORAGE_KEY = 'vsee_annotations';
const load = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } };
const save = (pins) => localStorage.setItem(STORAGE_KEY, JSON.stringify(pins));

/* ── Page context — lets child components report the active page ── */

const AnnotationPageContext = createContext({ page: 'default', setPage: () => {}, setOverlayPage: () => {} });
export const useAnnotationPage = () => useContext(AnnotationPageContext);

/* ── Colors for contributors ────────────────────────────── */

const COLORS = ['#4F46E5', '#0D875C', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#BE185D', '#4338CA'];
const nameColor = (name) => COLORS[Math.abs([...name].reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)) % COLORS.length];

/* ── Pin on the page ────────────────────────────────────── */

function Pin({ pin, isSelected, onClick, aboveModal, onMove }) {
  const color = nameColor(pin.author);
  const dragging = useRef(false);
  const startPos = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    dragging.current = false;
    startPos.current = { mx: e.clientX, my: e.clientY, px: pin.x, py: pin.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!startPos.current.mx && !startPos.current.my) return;
    const dx = e.clientX - startPos.current.mx;
    const dy = e.clientY - startPos.current.my;
    if (!dragging.current && Math.abs(dx) + Math.abs(dy) > 4) dragging.current = true;
    if (dragging.current) {
      onMove(pin.id, startPos.current.px + dx, startPos.current.py + dy);
    }
  };

  const handlePointerUp = (e) => {
    if (dragging.current) {
      e.stopPropagation();
      dragging.current = false;
    }
    startPos.current = { mx: 0, my: 0, px: 0, py: 0 };
  };

  return (
    <div
      onClick={(e) => { if (!dragging.current) { e.stopPropagation(); onClick(); } }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'absolute', left: pin.x, top: pin.y, transform: 'translate(-12px, -24px)',
        cursor: 'grab', zIndex: aboveModal ? 45 : 35, filter: isSelected ? 'drop-shadow(0 0 4px rgba(0,0,0,0.3))' : 'none',
        transition: 'filter 150ms', touchAction: 'none',
      }}
    >
      {/* Pin SVG */}
      <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20C24 5.373 18.627 0 12 0z" fill={color} />
        <circle cx="12" cy="12" r="5" fill="white" />
        <text x="12" y="15" textAnchor="middle" fontSize="8" fontWeight="700" fill={color}>
          {pin.index}
        </text>
      </svg>
    </div>
  );
}

/* ── Comment form (inline at pin location or in panel) ──── */

function CommentForm({ onSubmit, onCancel, defaultAuthor }) {
  const [author, setAuthor] = useState(defaultAuthor);
  const [text, setText] = useState('');
  const inputRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => { (defaultAuthor ? textRef : inputRef).current?.focus(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(author.trim() || 'Anonymous', text.trim());
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input
        ref={inputRef}
        type="text"
        value={author}
        onChange={e => setAuthor(e.target.value)}
        placeholder="Your name"
        style={{
          padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E7EB',
          fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none',
        }}
        onFocus={e => e.target.style.borderColor = '#4F46E5'}
        onBlur={e => e.target.style.borderColor = '#E5E7EB'}
      />
      <textarea
        ref={textRef}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Leave a comment..."
        rows={3}
        style={{
          padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E7EB',
          fontSize: 13, fontFamily: 'Inter, sans-serif', resize: 'vertical',
          outline: 'none', lineHeight: 1.5,
        }}
        onFocus={e => e.target.style.borderColor = '#4F46E5'}
        onBlur={e => e.target.style.borderColor = '#E5E7EB'}
      />
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{
          padding: '5px 12px', borderRadius: 6, border: '1px solid #E5E7EB',
          background: 'white', cursor: 'pointer', fontSize: 12, color: '#6B7280',
        }}>Cancel</button>
        <button type="submit" disabled={!text.trim()} style={{
          padding: '5px 12px', borderRadius: 6, border: 'none',
          background: text.trim() ? '#4F46E5' : '#D1D5DB', color: 'white',
          cursor: text.trim() ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 600,
        }}>Post</button>
      </div>
    </form>
  );
}

/* ── Reply thread ───────────────────────────────────────── */

function ReplyThread({ pin, onAddReply, onDelete, defaultAuthor }) {
  const [replying, setReplying] = useState(false);
  const color = nameColor(pin.author);

  return (
    <div style={{ fontSize: 13, lineHeight: 1.5 }}>
      {/* Original comment */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%', background: color,
          color: 'white', fontSize: 11, fontWeight: 700, display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{pin.author[0]?.toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontWeight: 600, color: '#111827' }}>{pin.author}</span>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>{formatTime(pin.time)}</span>
          </div>
          <p style={{ margin: 0, color: '#374151', wordBreak: 'break-word' }}>{pin.text}</p>
        </div>
      </div>

      {/* Replies */}
      {pin.replies?.length > 0 && (
        <div style={{ marginLeft: 32, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8, borderLeft: '2px solid #E5E7EB', paddingLeft: 12 }}>
          {pin.replies.map((r, i) => {
            const rc = nameColor(r.author);
            return (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: rc,
                  color: 'white', fontSize: 10, fontWeight: 700, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{r.author[0]?.toUpperCase()}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 600, color: '#111827', fontSize: 12 }}>{r.author}</span>
                    <span style={{ fontSize: 10, color: '#9CA3AF' }}>{formatTime(r.time)}</span>
                  </div>
                  <p style={{ margin: 0, color: '#374151', fontSize: 12 }}>{r.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reply form or button */}
      <div style={{ marginTop: 8, marginLeft: 32 }}>
        {replying ? (
          <CommentForm
            defaultAuthor={defaultAuthor}
            onSubmit={(author, text) => { onAddReply(author, text); setReplying(false); }}
            onCancel={() => setReplying(false)}
          />
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setReplying(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, color: '#4F46E5', padding: 0,
            }}>Reply</button>
            <button onClick={onDelete} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: '#9CA3AF', padding: 0,
            }}>Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ── Inline popup when placing a pin ────────────────────── */

function InlineCommentPopup({ x, y, defaultAuthor, onSubmit, onCancel }) {
  const ref = useRef(null);

  // Adjust position to stay within viewport
  const [pos, setPos] = useState({ left: x, top: y + 8 });
  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const adj = { left: x, top: y + 8 };
    if (rect.right > window.innerWidth - 16) adj.left = x - rect.width;
    if (rect.bottom > window.innerHeight - 16) adj.top = y - rect.height - 8;
    setPos(adj);
  }, [x, y]);

  return (
    <div
      ref={ref}
      onClick={e => e.stopPropagation()}
      style={{
        position: 'fixed', left: pos.left, top: pos.top, width: 280,
        background: 'white', borderRadius: 10, padding: 14,
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)', border: '1px solid #E5E7EB',
        zIndex: 10000,
      }}
    >
      <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Add comment</p>
      <CommentForm defaultAuthor={defaultAuthor} onSubmit={onSubmit} onCancel={onCancel} />
    </div>
  );
}

/* ── Main Annotations Component ─────────────────────────── */

export default function Annotations({ children }) {
  const [pins, setPins] = useState(load);
  const [active, setActive] = useState(false); // annotation mode
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null);
  const [placing, setPlacing] = useState(null); // { x, y } screen coords while placing
  const [lastAuthor, setLastAuthor] = useState(() => localStorage.getItem('vsee_annotation_author') || '');
  const [basePage, setBasePage] = useState('default');
  const [overlayPage, setOverlayPage] = useState(null);
  const currentPage = overlayPage || basePage;
  const containerRef = useRef(null);

  useEffect(() => { save(pins); }, [pins]);
  useEffect(() => { if (lastAuthor) localStorage.setItem('vsee_annotation_author', lastAuthor); }, [lastAuthor]);
  // Clear placement and selection when navigating pages
  useEffect(() => { setPlacing(null); setSelectedPin(null); }, [currentPage]);

  // Shift+Space shortcut to toggle pin mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && e.code === 'Space' && !e.target.closest('input, textarea, [contenteditable]')) {
        e.preventDefault();
        setActive(a => !a);
        setPlacing(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClick = useCallback((e) => {
    if (!active || placing) return;
    // Don't place on the panel or FAB
    if (e.target.closest('[data-annotation-ui]')) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + containerRef.current.scrollLeft;
    const y = e.clientY - rect.top + containerRef.current.scrollTop;
    setPlacing({ x, y, screenX: e.clientX, screenY: e.clientY });
  }, [active, placing]);

  const addPin = (author, text) => {
    if (!placing) return;
    const pin = {
      id: `pin_${Date.now()}`,
      x: placing.x, y: placing.y,
      author, text,
      time: Date.now(),
      index: pins.length + 1,
      replies: [],
      page: currentPage,
    };
    setPins(prev => [...prev, pin]);
    setLastAuthor(author);
    setPlacing(null);
  };

  const deletePin = (id) => {
    setPins(prev => prev.filter(p => p.id !== id));
    if (selectedPin === id) setSelectedPin(null);
  };

  const addReply = (pinId, author, text) => {
    setPins(prev => prev.map(p => p.id === pinId ? {
      ...p,
      replies: [...(p.replies || []), { author, text, time: Date.now() }],
    } : p));
    setLastAuthor(author);
  };

  const movePin = useCallback((id, x, y) => {
    setPins(prev => prev.map(p => p.id === id ? { ...p, x, y } : p));
  }, []);

  const visiblePins = pins.filter(p => p.page === currentPage);
  const pageComments = visiblePins.reduce((n, p) => n + 1 + (p.replies?.length || 0), 0);
  const totalComments = pins.reduce((n, p) => n + 1 + (p.replies?.length || 0), 0);

  return (
    <AnnotationPageContext.Provider value={{ page: currentPage, setPage: setBasePage, setOverlayPage }}>
    <div ref={containerRef} style={{ position: 'relative', minHeight: '100vh' }}>
      {/* The app content */}
      <div
        onClick={handleClick}
        style={{ cursor: active && !placing ? 'crosshair' : 'default', minHeight: '100vh' }}
      >
        {children}
      </div>

      {/* Pins on page */}
      {visiblePins.map(pin => (
        <Pin
          key={pin.id}
          pin={pin}
          isSelected={selectedPin === pin.id}
          aboveModal={!!overlayPage}
          onMove={movePin}
          onClick={() => { setSelectedPin(pin.id === selectedPin ? null : pin.id); setPanelOpen(true); }}
        />
      ))}

      {/* Inline popup while placing */}
      {placing && (
        <InlineCommentPopup
          x={placing.screenX}
          y={placing.screenY}
          defaultAuthor={lastAuthor}
          onSubmit={addPin}
          onCancel={() => setPlacing(null)}
        />
      )}

      {/* ── Floating action buttons ── */}
      <div data-annotation-ui style={{
        position: 'fixed', bottom: 20, right: panelOpen ? 356 : 20,
        display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10001,
        transition: 'right 250ms ease',
      }}>
        {/* Toggle annotation mode */}
        <button
          onClick={() => { setActive(a => !a); setPlacing(null); }}
          title={active ? 'Exit comment mode (Shift+Space)' : 'Enter comment mode (Shift+Space)'}
          style={{
            width: 48, height: 48, borderRadius: '50%',
            border: active ? '2px solid #4F46E5' : '2px solid transparent',
            background: active ? '#4F46E5' : 'white',
            color: active ? 'white' : '#6B7280',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 200ms',
          }}
        >
          {/* Crosshair / pin icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </button>

        {/* Open panel */}
        <button
          onClick={() => setPanelOpen(o => !o)}
          title="View all comments"
          style={{
            width: 48, height: 48, borderRadius: '50%', border: 'none',
            background: 'white', color: '#6B7280',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {pageComments > 0 && (
            <span style={{
              position: 'absolute', top: -2, right: -2,
              width: 20, height: 20, borderRadius: '50%', background: '#EF4444',
              color: 'white', fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{pageComments}</span>
          )}
        </button>
      </div>

      {/* ── Side panel ── */}
      <div
        data-annotation-ui
        style={{
          position: 'fixed', top: 0, right: panelOpen ? 0 : -340, bottom: 0,
          width: 340, background: 'white', borderLeft: '1px solid #E5E7EB',
          boxShadow: panelOpen ? '-4px 0 20px rgba(0,0,0,0.08)' : 'none',
          zIndex: 10000, display: 'flex', flexDirection: 'column',
          transition: 'right 250ms ease',
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}
      >
        {/* Panel header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Comments</h3>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>
              {pageComments} on this page{totalComments > pageComments ? ` · ${totalComments} total` : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {pins.length > 0 && (
              <button
                onClick={() => { if (confirm('Clear all comments?')) { setPins([]); setSelectedPin(null); } }}
                title="Clear all"
                style={{
                  background: 'none', border: '1px solid #E5E7EB', borderRadius: 6,
                  padding: '4px 10px', cursor: 'pointer', fontSize: 11, color: '#9CA3AF',
                }}
              >Clear all</button>
            )}
            <button
              onClick={() => setPanelOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Panel body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 0' }}>
          {visiblePins.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block', color: '#D1D5DB' }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>No comments on this page</p>
              <p style={{ fontSize: 12 }}>Click the pin button, then click anywhere to leave a comment.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {visiblePins.map(pin => (
                <div
                  key={pin.id}
                  onClick={() => setSelectedPin(pin.id === selectedPin ? null : pin.id)}
                  style={{
                    padding: '12px 20px', cursor: 'pointer',
                    background: selectedPin === pin.id ? '#F5F3FF' : 'transparent',
                    borderLeft: selectedPin === pin.id ? '3px solid #4F46E5' : '3px solid transparent',
                    transition: 'all 150ms',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%', background: nameColor(pin.author),
                      color: 'white', fontSize: 9, fontWeight: 700, display: 'inline-flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>#{pin.index}</span>
                  </div>
                  <ReplyThread
                    pin={pin}
                    defaultAuthor={lastAuthor}
                    onAddReply={(author, text) => addReply(pin.id, author, text)}
                    onDelete={() => deletePin(pin.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Annotation mode hint */}
        {active && (
          <div style={{
            padding: '10px 20px', borderTop: '1px solid #E5E7EB',
            background: '#FFFBEB', fontSize: 12, color: '#92400E',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            Click anywhere on the page to place a comment pin
          </div>
        )}
      </div>
    </div>
    </AnnotationPageContext.Provider>
  );
}
