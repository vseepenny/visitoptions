/* Provider dashboard — the live waiting-room queue. Closes the loop:
   what a patient books in the patient app shows up here. */

import { useState } from 'react';
import { NotesTemplatePreview } from './TemplateEditors';

const PT_LABEL = { 'self-pay': 'Self-Pay', insurance: 'Insurance', 'group-covered': 'Group-Covered' };

const STATUS_META = {
  waiting:   { label: 'Waiting',    color: 'var(--warning)', bg: 'var(--warning-light)', text: '#92400E' },
  in_visit:  { label: 'In Visit',   color: 'var(--brand)',   bg: 'var(--brand-light)',   text: '#065F46' },
  scheduled: { label: 'Scheduled',  color: 'var(--info)',    bg: 'var(--info-light)',    text: '#075985' },
  completed: { label: 'Completed',  color: 'var(--grey-600)',bg: 'var(--grey-100)',      text: 'var(--grey-600)' },
};

const initials = (n) => n.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

function waitColor(mins) {
  if (mins >= 20) return 'var(--danger)';
  if (mins >= 10) return 'var(--warning)';
  return 'var(--text-secondary)';
}

/* ── Stat tile ────────────────────────────────────────────── */

function Stat({ label, value, tone }) {
  return (
    <div style={{ flex: 1, minWidth: 130, border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '14px 18px', background: 'white' }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginTop: 4, color: tone || 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}

/* ── Visit drawer: what the provider opens ────────────────── */

function VisitDrawer({ booking, clinic, rooms, onClose, onStart, onComplete }) {
  const room = rooms.find(r => r.id === booking.roomId);
  const visit = room?.visitOptions?.find(v => v.id === booking.visitOptionId);
  // Resolve the notes template the same way the config does: override or clinic default
  const notesId = visit?.notesTemplateId ?? clinic.defaultNotesTemplateId;
  const template = clinic.notesTemplates?.find(t => t.id === notesId);
  const inherited = visit?.notesTemplateId == null;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 90 }} onClick={onClose} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(560px, 94vw)', background: 'white', zIndex: 100, boxShadow: '-12px 0 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--grey-100)', color: 'var(--grey-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
            {initials(booking.patientName)}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 700 }}>{booking.patientName}</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
              {booking.patientAge} yrs · {booking.mrn} · {PT_LABEL[booking.patientType] || booking.patientType}
            </p>
          </div>
          <button className="btn-icon" style={{ width: 30, height: 30 }} onClick={onClose} aria-label="Close visit panel">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
          {/* Visit facts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
            {[
              ['Visit type', booking.visitName],
              ['Provider', booking.providerName],
              ['Room', room?.roomName || '—'],
              ['Mode', booking.mode],
            ].map(([k, v]) => (
              <div key={k} style={{ background: 'var(--grey-50)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '9px 12px' }}>
                <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-tertiary)' }}>{k}</p>
                <p style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{v}</p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)', marginBottom: 6 }}>Reason for visit</p>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, marginBottom: 18 }}>{booking.reason}</p>

          {/* Readiness */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {[['Intake', booking.intakeComplete], ['Payment', booking.paid]].map(([k, ok]) => (
              <span key={k} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600,
                padding: '5px 11px', borderRadius: 999,
                background: ok ? 'var(--success-light)' : 'var(--warning-light)',
                color: ok ? '#065F46' : '#92400E',
              }}>
                {ok
                  ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
                {k} {ok ? 'complete' : 'incomplete'}
              </span>
            ))}
          </div>

          {/* Notes template, resolved through the config */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>Visit notes</p>
            <span className="badge" style={{ fontSize: 10, background: inherited ? 'var(--grey-100)' : 'var(--warning-light)', color: inherited ? 'var(--grey-600)' : '#92400E' }}>
              {inherited ? 'clinic default' : 'visit-type override'}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 'auto' }}>{template?.name || 'None'}</span>
          </div>
          {template
            ? <NotesTemplatePreview tmpl={template} />
            : <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No notes template configured for this visit type.</p>}
        </div>

        {/* Actions */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
          {booking.status === 'in_visit'
            ? <button className="btn btn-primary btn-sm" onClick={() => { onComplete(booking.id); onClose(); }}>Complete Visit</button>
            : <button className="btn btn-primary btn-sm" onClick={() => { onStart(booking.id); onClose(); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                Start Visit
              </button>}
        </div>
      </div>
    </>
  );
}

/* ── Main page ────────────────────────────────────────────── */

export default function DashboardPage({ bookings, clinic, rooms, onChange, onOpenRoom }) {
  const [roomFilter, setRoomFilter] = useState('all');
  const [openId, setOpenId] = useState(null);

  const visible = bookings.filter(b => roomFilter === 'all' || b.roomId === roomFilter);
  const waiting = visible.filter(b => b.status === 'waiting');
  const inVisit = visible.filter(b => b.status === 'in_visit');
  const scheduled = visible.filter(b => b.status === 'scheduled');
  const longestWait = waiting.reduce((m, b) => Math.max(m, b.waitingMinutes || 0), 0);
  const needsAttention = visible.filter(b => !b.intakeComplete || !b.paid).length;

  const setStatus = (id, status) =>
    onChange(bookings.map(b => b.id === id ? { ...b, status, waitingMinutes: 0 } : b));

  const openBooking = bookings.find(b => b.id === openId);

  const ORDER = { waiting: 0, in_visit: 1, scheduled: 2, completed: 3 };
  const sorted = [...visible].sort((a, b) =>
    (ORDER[a.status] - ORDER[b.status]) || ((b.waitingMinutes || 0) - (a.waitingMinutes || 0)));

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '32px 24px 80px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px', marginBottom: 4 }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Live queue across your waiting rooms. Patients appear here after completing the booking flow.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <Stat label="Waiting now" value={waiting.length} tone={waiting.length ? 'var(--warning)' : undefined} />
        <Stat label="In visit" value={inVisit.length} tone={inVisit.length ? 'var(--brand)' : undefined} />
        <Stat label="Scheduled later" value={scheduled.length} />
        <Stat label="Longest wait" value={longestWait ? `${longestWait}m` : '—'} tone={waitColor(longestWait)} />
        <Stat label="Needs attention" value={needsAttention} tone={needsAttention ? 'var(--danger)' : undefined} />
      </div>

      {/* Room filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {[{ id: 'all', name: 'All rooms' }, ...rooms.map(r => ({ id: r.id, name: r.roomName }))].map(f => (
          <button
            key={f.id}
            onClick={() => setRoomFilter(f.id)}
            style={{
              border: `1.5px solid ${roomFilter === f.id ? 'var(--brand)' : 'var(--border)'}`,
              background: roomFilter === f.id ? 'var(--brand)' : 'white',
              color: roomFilter === f.id ? 'white' : 'var(--text-secondary)',
              borderRadius: 999, fontSize: 12.5, fontWeight: 600, padding: '6px 14px', cursor: 'pointer',
            }}
          >{f.name}</button>
        ))}
      </div>

      {/* Queue */}
      <div className="panel">
        {sorted.length === 0 && (
          <div className="empty-state" style={{ padding: '48px 24px' }}>
            <p className="empty-state-title">Queue is empty</p>
            <p className="empty-state-desc">No patients are waiting in this room right now.</p>
          </div>
        )}
        {sorted.map((b, i) => {
          const meta = STATUS_META[b.status] || STATUS_META.waiting;
          const room = rooms.find(r => r.id === b.roomId);
          const flagged = !b.intakeComplete || !b.paid;
          return (
            <div
              key={b.id}
              onClick={() => setOpenId(b.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                borderTop: i === 0 ? 'none' : '1px solid var(--border)', cursor: 'pointer',
                transition: 'background 120ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--grey-50)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--grey-100)', color: 'var(--grey-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700, flexShrink: 0 }}>
                {initials(b.patientName)}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{b.patientName}</p>
                  {flagged && (
                    <span title={!b.intakeComplete ? 'Intake incomplete' : 'Payment incomplete'} style={{ color: 'var(--warning)', display: 'flex' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>
                  {b.visitName} · {room?.roomName} · {b.providerName}
                </p>
              </div>

              <span className="badge" style={{ background: meta.bg, color: meta.text, fontSize: 11 }}>{meta.label}</span>

              <span style={{ fontSize: 12.5, fontWeight: 700, color: waitColor(b.waitingMinutes), minWidth: 74, textAlign: 'right' }}>
                {b.status === 'waiting' ? `${b.waitingMinutes}m wait`
                  : b.status === 'scheduled' ? (b.scheduledFor || 'later')
                  : b.status === 'in_visit' ? 'now' : '—'}
              </span>

              <button
                className={`btn btn-sm ${b.status === 'in_visit' ? 'btn-secondary' : 'btn-primary'}`}
                style={{ flexShrink: 0 }}
                onClick={e => { e.stopPropagation(); b.status === 'in_visit' ? setStatus(b.id, 'completed') : setStatus(b.id, 'in_visit'); }}
              >
                {b.status === 'in_visit' ? 'Complete' : b.status === 'completed' ? 'Reopen' : 'Start Visit'}
              </button>
            </div>
          );
        })}
      </div>

      {rooms.length > 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 12 }}>
          Configure what these patients go through before arriving here in{' '}
          <button onClick={() => onOpenRoom?.(rooms[0].id)} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 12 }}>
            Waiting Room Settings
          </button>.
        </p>
      )}

      {openBooking && (
        <VisitDrawer
          booking={openBooking}
          clinic={clinic}
          rooms={rooms}
          onClose={() => setOpenId(null)}
          onStart={id => setStatus(id, 'in_visit')}
          onComplete={id => setStatus(id, 'completed')}
        />
      )}
    </div>
  );
}
