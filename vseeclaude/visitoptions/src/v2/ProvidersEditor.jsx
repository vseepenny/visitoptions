/* Provider roster + weekly availability. Availability drives the real
   bookable slots patients see in the Calendar Picker step. */

import { useState } from 'react';
import { DAYS } from '../data/initialData';
import { fromMinutes, toMinutes, slotsForDate, durationMinutes } from './scheduling';

const WEEK = DAYS.slice(1).concat(DAYS[0]); // Monday-first

const CREDENTIALS = ['MD', 'DO', 'NP', 'PA', 'PsyD', 'PhD', 'LCSW', 'RN'];

const initials = (name) => name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

function weeklyHours(provider) {
  let mins = 0;
  for (const day of DAYS) {
    for (const w of (provider.availability?.[day] || [])) {
      mins += Math.max(0, toMinutes(w.end) - toMinutes(w.start));
    }
  }
  return Math.round(mins / 60);
}

/* ── Availability grid for one provider ───────────────────── */

function AvailabilityGrid({ provider, onChange }) {
  const setWindows = (day, windows) => {
    const availability = { ...(provider.availability || {}) };
    if (windows.length) availability[day] = windows;
    else delete availability[day];
    onChange({ ...provider, availability });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {WEEK.map(day => {
        const windows = provider.availability?.[day] || [];
        const on = windows.length > 0;
        return (
          <div key={day} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 12px',
            background: on ? 'white' : 'var(--grey-50)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, width: 118, flexShrink: 0, cursor: 'pointer', paddingTop: 5 }}>
              <input
                type="checkbox"
                checked={on}
                onChange={e => setWindows(day, e.target.checked ? [{ start: '09:00', end: '17:00' }] : [])}
                style={{ accentColor: 'var(--brand)' }}
              />
              <span style={{ fontSize: 13, fontWeight: on ? 600 : 400, color: on ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{day}</span>
            </label>

            {!on && <span style={{ fontSize: 12, color: 'var(--text-tertiary)', paddingTop: 6 }}>Unavailable</span>}

            {on && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                {windows.map((w, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="time" className="input" value={w.start}
                      onChange={e => setWindows(day, windows.map((x, xi) => xi === i ? { ...x, start: e.target.value } : x))}
                      style={{ height: 30, fontSize: 12, width: 118 }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>to</span>
                    <input
                      type="time" className="input" value={w.end}
                      onChange={e => setWindows(day, windows.map((x, xi) => xi === i ? { ...x, end: e.target.value } : x))}
                      style={{ height: 30, fontSize: 12, width: 118 }}
                    />
                    {windows.length > 1 && (
                      <button className="btn-icon danger" style={{ width: 24, height: 24 }} title="Remove window"
                        onClick={() => setWindows(day, windows.filter((_, xi) => xi !== i))}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    )}
                    {i === windows.length - 1 && (
                      <button className="btn btn-ghost btn-xs" onClick={() => setWindows(day, [...windows, { start: '13:00', end: '17:00' }])}>
                        + Split
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Main editor ──────────────────────────────────────────── */

export default function ProvidersEditor({ clinic, rooms = [], onChange }) {
  const providers = clinic.providers || [];
  const [expandedId, setExpandedId] = useState(null);

  const update = (updated) => onChange(providers.map(p => p.id === updated.id ? updated : p));
  const remove = (id) => onChange(providers.filter(p => p.id !== id));
  const add = () => {
    const id = `prv_${Date.now()}`;
    onChange([...providers, {
      id, name: '', credential: 'MD', specialty: clinic.specialties?.[0]?.id || '',
      roomIds: [],
      availability: { Monday: [{ start: '09:00', end: '17:00' }], Tuesday: [{ start: '09:00', end: '17:00' }], Wednesday: [{ start: '09:00', end: '17:00' }], Thursday: [{ start: '09:00', end: '17:00' }], Friday: [{ start: '09:00', end: '17:00' }] },
    }]);
    setExpandedId(id);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {providers.length} provider{providers.length !== 1 ? 's' : ''} — availability here generates the real time slots patients can book.
        </p>
        <button onClick={add} className="btn btn-secondary btn-sm">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
          Add Provider
        </button>
      </div>

      {providers.length === 0 && (
        <div className="empty-state" style={{ padding: '40px 24px' }}>
          <p className="empty-state-title">No providers yet</p>
          <p className="empty-state-desc">Add a provider so patients have bookable appointment times.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {providers.map(p => {
          const open = expandedId === p.id;
          const hrs = weeklyHours(p);
          const spec = clinic.specialties?.find(s => s.id === p.specialty);
          const roomLabels = p.roomIds?.length
            ? rooms.filter(r => p.roomIds.includes(r.id)).map(r => r.roomName)
            : ['All rooms'];
          return (
            <div key={p.id} style={{ border: `1px solid ${open ? 'var(--brand)' : 'var(--border)'}`, borderRadius: 'var(--r-lg)', background: open ? 'var(--brand-50)' : 'white', transition: 'all 150ms' }}>
              {/* Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--grey-200, #E5E7EB)', color: 'var(--grey-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700, flexShrink: 0 }}>
                  {initials(p.name || '?')}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {p.name || <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>Unnamed provider</span>}
                    {p.credential && <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>, {p.credential}</span>}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>
                    {spec?.name || 'No specialty'} · {hrs}h/week · {roomLabels.join(', ')}
                  </p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setExpandedId(open ? null : p.id)}>
                  {open ? 'Close' : 'Edit'}
                </button>
                <button className="btn-icon danger" title="Remove provider" aria-label={`Remove ${p.name || 'provider'}`} onClick={() => remove(p.id)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                </button>
              </div>

              {/* Expanded editor */}
              {open && (
                <div style={{ padding: '4px 16px 16px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, margin: '14px 0 16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Name</label>
                      <input className="input" value={p.name} placeholder="e.g. Amara Osei" onChange={e => update({ ...p, name: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Credential</label>
                      <select className="input" value={p.credential || ''} onChange={e => update({ ...p, credential: e.target.value })}>
                        {CREDENTIALS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Specialty</label>
                      <select className="input" value={p.specialty || ''} onChange={e => update({ ...p, specialty: e.target.value })}>
                        <option value="">— None —</option>
                        {(clinic.specialties || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>Works in</label>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={!p.roomIds?.length} onChange={() => update({ ...p, roomIds: [] })} style={{ accentColor: 'var(--brand)' }} />
                      All rooms
                    </label>
                    {rooms.map(r => (
                      <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!p.roomIds?.includes(r.id)}
                          onChange={e => {
                            const cur = p.roomIds || [];
                            update({ ...p, roomIds: e.target.checked ? [...cur, r.id] : cur.filter(x => x !== r.id) });
                          }}
                          style={{ accentColor: 'var(--brand)' }}
                        />
                        {r.roomName}
                      </label>
                    ))}
                  </div>

                  <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>Weekly availability</label>
                  <AvailabilityGrid provider={p} onChange={update} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {providers.length > 0 && <SlotSanityCheck clinic={clinic} rooms={rooms} />}
    </div>
  );
}

/* ── Shows what the availability actually produces ────────── */

function SlotSanityCheck({ clinic, rooms }) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const rows = [];
  for (const room of rooms) {
    for (const visit of (room.visitOptions || []).filter(v => v.visible)) {
      const slots = slotsForDate({ clinic, room, visit, date: tomorrow });
      rows.push({
        room: room.roomName,
        visit: visit.name,
        dur: durationMinutes(visit.duration),
        count: slots.length,
        first: slots[0]?.time,
        last: slots[slots.length - 1] ? fromMinutes(slots[slots.length - 1].minutes) : null,
      });
    }
  }
  if (!rows.length) return null;

  return (
    <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
      <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>Bookable slots tomorrow</p>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
        Generated from the availability above and each visit type's duration — this is exactly what patients will see.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, padding: '7px 12px', background: 'var(--grey-50)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
            <span style={{ fontWeight: 600, minWidth: 170 }}>{r.visit}</span>
            <span style={{ color: 'var(--text-tertiary)', minWidth: 150 }}>{r.room}</span>
            <span style={{ color: 'var(--text-secondary)' }}>{r.dur} min</span>
            <span style={{ marginLeft: 'auto', fontWeight: 700, color: r.count ? 'var(--brand)' : 'var(--danger)' }}>
              {r.count ? `${r.count} slots · ${r.first}–${r.last}` : 'No availability'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
