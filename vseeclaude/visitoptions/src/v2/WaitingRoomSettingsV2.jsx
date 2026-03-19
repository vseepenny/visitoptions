import { useState, useCallback } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import OperatingHours from '../components/OperatingHours';
import PatientTypes from '../components/PatientTypes';
import RoomVisitOptionModal from './RoomVisitOptionModal';
import ConfirmModal from '../components/ConfirmModal';
import PatientPreview from './PatientPreview';

/* ── Helpers ──────────────────────────────────────────────── */

function useDirty(initial) {
  const [savedStr, setSavedStr] = useState(JSON.stringify(initial));
  const [state, setState] = useState(initial);
  const isDirty = JSON.stringify(state) !== savedStr;
  const save = () => setSavedStr(JSON.stringify(state));
  return { state, setState, isDirty, save };
}

function Toggle({ checked, onChange, label }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} onClick={onChange} className={`toggle${checked ? ' on' : ''}`}>
      <span className="toggle-track"><span className="toggle-thumb" /></span>
    </button>
  );
}

const MODE_ICONS = {
  Video:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>,
  Phone:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
  'In-person':<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>,
  Chat:       <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
};

const PT_BADGES = {
  'self-pay':  { cls: 'badge badge-info',    label: 'Self-Pay'  },
  'insurance': { cls: 'badge badge-success', label: 'Insurance' },
};

/* ── Payment completeness check ──────────────────────────── */

function isPaymentIncomplete(item, clinic) {
  const payConfig = clinic.paymentConfig;

  for (const ptId of item.patientTypes) {
    if (ptId === 'self-pay') {
      if (!payConfig?.['self-pay']?.acceptPayments) continue;
      const p = item.pricing?.['self-pay'];
      if (!p || p.method === 'none') continue;
      if (p.method === 'specific' && !p.amount) return true;
    }

    if (ptId === 'insurance') {
      const accessConfig = payConfig?.['insurance']?.eligibilityAccess;
      for (const statusId of ['eligible', 'not_eligible', 'pending', 'error']) {
        if ((accessConfig?.[statusId]?.access ?? 'allow') === 'block') continue;
        const sc = item.pricing?.['insurance']?.[statusId];
        if (!sc || sc.method === 'none') continue;
        if (sc.method === 'specific' && !sc.amount) return true;
      }
    }

    if (ptId === 'group-covered') {
      const accessConfig = payConfig?.['group-covered']?.verificationAccess;
      for (const statusId of ['verified', 'not_verified', 'pending', 'error']) {
        if ((accessConfig?.[statusId]?.access ?? 'allow') === 'block') continue;
        const sc = item.pricing?.['group-covered']?.[statusId];
        if (!sc || sc.method === 'none') continue;
        if (sc.method === 'specific' && !sc.amount) return true;
      }
    }
  }

  return false;
}

/* ── Visit Options Table V2 ───────────────────────────────── */

function VisitOptionsTableV2({ items, clinic, allowedPatientTypes, onChange }) {
  const [modal, setModal] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const handleDragStart = (e, id) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag image so the row doesn't ghost weirdly
    const el = e.currentTarget;
    e.dataTransfer.setDragImage(el, el.offsetWidth / 2, el.offsetHeight / 2);
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== dragId) setDragOverId(id);
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) return;
    const from = items.findIndex(it => it.id === dragId);
    const to   = items.findIndex(it => it.id === targetId);
    const next = [...items];
    next.splice(to, 0, next.splice(from, 1)[0]);
    onChange(next);
    setDragId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setDragOverId(null);
  };

  const handleSave = (formData) => {
    const DEFAULT_PRICING = {
      'self-pay':      { method: 'specific', amount: '', fallback: '' },
      'group-covered': {
        verified:     { method: 'copay', amount: '', fallback: '' },
        not_verified: { method: 'none',  amount: '', fallback: '' },
        pending:      { method: 'none',  amount: '', fallback: '' },
        error:        { method: 'none',  amount: '', fallback: '' },
      },
      'insurance': {
        eligible:     { method: 'copay', amount: '', fallback: '' },
        not_eligible: { method: 'none',  amount: '', fallback: '' },
        pending:      { method: 'none',  amount: '', fallback: '' },
        error:        { method: 'none',  amount: '', fallback: '' },
      },
    };
    const pricing = { ...(formData.pricing ?? {}) };
    formData.patientTypes.forEach(ptId => {
      if (!pricing[ptId]) pricing[ptId] = DEFAULT_PRICING[ptId] ?? { method: 'none', amount: '', fallback: '' };
    });
    const saved = { ...formData, pricing };
    if (modal.mode === 'add') {
      onChange([...items, { ...saved, id: `vo_${Date.now()}` }]);
    } else {
      onChange(items.map(it => it.id === modal.item.id ? { ...it, ...saved } : it));
    }
    setModal(null);
  };

  const handleDelete = (id) => setConfirmId(id);

  const toggleVisible = (id) =>
    onChange(items.map(it => it.id === id ? { ...it, visible: !it.visible } : it));

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p className="section-title">Visit Options</p>
          <p className="section-desc">Configure the appointment types patients can book in this room.</p>
        </div>
        <button onClick={() => setModal({ mode: 'add' })} className="btn btn-secondary btn-sm">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
          Add Visit Option
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--grey-400)' }}>
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <div>
            <p className="empty-state-title">No visit options yet</p>
            <p className="empty-state-desc">Add your first visit option to let patients book appointments.</p>
          </div>
          <button onClick={() => setModal({ mode: 'add' })} className="btn btn-secondary btn-sm">Add Visit Option</button>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th style={{ width: 32 }} />
                <th>Name</th>
                <th>Duration</th>
                <th>Mode</th>
                <th>Visible</th>
                <th>Patient Types</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const isDragging = dragId === item.id;
                const isOver = dragOverId === item.id;
                const incomplete = isPaymentIncomplete(item, clinic);
                return (
                  <tr
                    key={item.id}
                    draggable
                    onDragStart={e => handleDragStart(e, item.id)}
                    onDragOver={e => handleDragOver(e, item.id)}
                    onDrop={e => handleDrop(e, item.id)}
                    onDragEnd={handleDragEnd}
                    style={{
                      opacity: isDragging ? 0.35 : 1,
                      outline: isOver ? '2px solid var(--brand)' : 'none',
                      outlineOffset: -2,
                      transition: 'opacity 150ms',
                    }}
                  >
                    <td style={{ width: 32, padding: '0 4px 0 8px', cursor: 'grab' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--grey-400)" strokeWidth="2" style={{ display: 'block' }}>
                        <circle cx="9" cy="5"  r="1" fill="var(--grey-400)" stroke="none" />
                        <circle cx="9" cy="12" r="1" fill="var(--grey-400)" stroke="none" />
                        <circle cx="9" cy="19" r="1" fill="var(--grey-400)" stroke="none" />
                        <circle cx="15" cy="5"  r="1" fill="var(--grey-400)" stroke="none" />
                        <circle cx="15" cy="12" r="1" fill="var(--grey-400)" stroke="none" />
                        <circle cx="15" cy="19" r="1" fill="var(--grey-400)" stroke="none" />
                      </svg>
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      <div>{item.name}</div>
                      {incomplete && (
                        <button
                          onClick={() => setModal({ mode: 'edit', item, initialTab: 'payment' })}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                          title="Payment amount missing — click to complete setup"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                          <span style={{ fontSize: 11, color: '#D97706', fontWeight: 600 }}>Set up payment</span>
                        </button>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{item.duration}</span>
                        {item.type === '1:1'
                          ? <span className="badge badge-neutral">1:1</span>
                          : <span className="badge badge-warning">Group</span>}
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)' }}>
                        {MODE_ICONS[item.mode]}
                        <span style={{ fontSize: 13 }}>{item.mode}</span>
                      </span>
                    </td>
                    <td>
                      <Toggle checked={item.visible} onChange={() => toggleVisible(item.id)} label={`Toggle visibility for ${item.name}`} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {item.patientTypes.map(ptId => {
                          const badge = PT_BADGES[ptId];
                          if (!badge) return null;
                          return <span key={ptId} className={badge.cls} style={{ padding: '1px 8px', fontSize: 11 }}>{badge.label}</span>;
                        })}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setModal({ mode: 'edit', item })} className="btn-icon brand" title="Edit" aria-label={`Edit ${item.name}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="btn-icon danger" title="Delete" aria-label={`Delete ${item.name}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <RoomVisitOptionModal
          existing={modal.mode === 'edit' ? modal.item : null}
          allowedPatientTypes={allowedPatientTypes}
          clinic={clinic}
          initialTab={modal.initialTab}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {confirmId && (
        <ConfirmModal
          title="Delete Visit Option"
          message="Are you sure you want to delete this visit option? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => { onChange(items.filter(it => it.id !== confirmId)); setConfirmId(null); }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </section>
  );
}

/* ── Main Page ────────────────────────────────────────────── */

export default function WaitingRoomSettingsV2({ room, clinic, onChange, onSave, onBack }) {
  const { state, setState, isDirty, save } = useDirty(room);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const update = useCallback((field, value) => {
    setState(s => ({ ...s, [field]: value }));
  }, [setState]);

  const handleSave = () => {
    save();
    onChange?.(state);
    onSave?.();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(state.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: showPreview ? '100%' : 880, margin: '0 auto', padding: '32px 24px 80px', display: showPreview ? 'grid' : 'block', gridTemplateColumns: showPreview ? 'minmax(0, 1fr) 400px' : undefined, gap: showPreview ? 24 : undefined, alignItems: 'flex-start' }}>
      <div>
      <div style={{ marginBottom: 20 }}>
        <Breadcrumb items={[
          'Dashboard',
          'My Clinic',
          { label: 'Waiting Rooms', onClick: onBack },
          state.roomName,
        ]} />
      </div>

      <div className="panel">
        {/* Header */}
        <div style={{ padding: '28px 32px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: 6 }}>
              Waiting Room Settings
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Configure settings for <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{state.roomName}</strong>
            </p>
          </div>
          <button
            onClick={() => setShowPreview(p => !p)}
            className={`btn btn-sm ${showPreview ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ flexShrink: 0 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
            {showPreview ? 'Hide Preview' : 'Patient Preview'}
          </button>
        </div>

        <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Room Identity */}
          <section>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="form-group">
                <label htmlFor="room-name-v2" className="form-label">Room Name</label>
                <input id="room-name-v2" type="text" value={state.roomName} onChange={e => update('roomName', e.target.value)} className="input" />
              </div>
              <div className="form-group">
                <label className="form-label">Room Code</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="input-readonly">{state.roomCode}</div>
                  <button onClick={handleCopy} className="btn btn-ghost btn-sm">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    Copy
                  </button>
                </div>
                <p className="form-hint">Share this code with patients to join directly.</p>
              </div>
            </div>
          </section>

          <div className="divider" style={{ margin: 0 }} />

          <OperatingHours data={state.hours} onChange={val => update('hours', val)} />

          <div className="divider" style={{ margin: 0 }} />

          {/* Visibility */}
          <section>
            <p className="section-title">Visibility</p>
            <p className="section-desc" style={{ marginBottom: 16 }}>Control who can discover this waiting room.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { value: 'public',   label: 'Public',   desc: 'Anyone can search for and find this room in the VSee Clinic mobile app.' },
                { value: 'unlisted', label: 'Unlisted', desc: 'Patients can only access this room using a direct link or room code.' },
              ].map(opt => (
                <label key={opt.value} className="radio-option">
                  <input type="radio" name="visibility-v2" value={opt.value} checked={state.visibility === opt.value} onChange={() => update('visibility', opt.value)} />
                  <div>
                    <p className="radio-option-label">{opt.label}</p>
                    <p className="radio-option-desc">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <div className="divider" style={{ margin: 0 }} />

          <PatientTypes selected={state.patientTypes} onChange={val => update('patientTypes', val)} />

          <div className="divider" style={{ margin: 0 }} />

          {/* Visit Options */}
          <VisitOptionsTableV2
            items={state.visitOptions}
            clinic={clinic}
            allowedPatientTypes={state.patientTypes}
            onChange={val => update('visitOptions', val)}
          />

        </div>

        {/* Footer */}
        <div className="panel-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isDirty && (
              <span className="unsaved-badge">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>
                Unsaved changes
              </span>
            )}
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Powered by <span style={{ color: 'var(--brand)', fontWeight: 600 }}>VSee</span>
            </p>
          </div>
          <button onClick={handleSave} disabled={!isDirty} className="btn btn-primary btn-sm">Update Settings</button>
        </div>
      </div>

      {copied && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--grey-900)', color: 'white', fontSize: 13, fontWeight: 600, padding: '8px 20px', borderRadius: 'var(--r-full)', boxShadow: 'var(--shadow-lg)', zIndex: 50, animation: 'slideUp 200ms ease both' }}>
          Room code copied!
        </div>
      )}
      </div>

      {showPreview && (
        <PatientPreview room={state} clinic={clinic} />
      )}
    </div>
  );
}
