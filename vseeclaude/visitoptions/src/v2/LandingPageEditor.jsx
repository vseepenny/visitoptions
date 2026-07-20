/* Landing page editors — clinic-level branding/welcome + per-room overrides,
   each with a live patient-view preview (web + mobile app, expandable). */

import { useState, useEffect } from 'react';

export const DEFAULT_CLINIC_LANDING = {
  displayName: 'VSee Health Clinic',
  tagline: 'Care from anywhere',
  welcome: 'Welcome! Choose a waiting room below to see a provider. Most visits start within minutes.',
  brandColor: '#0D875C',
  supportEmail: 'support@vseehealth.com',
  supportPhone: '(650) 555-0142',
  showHours: true,
  showRooms: true,
};

const BRAND_COLORS = ['#0D875C', '#0284C7', '#7C3AED', '#0F766E', '#B91C1C', '#1F2937'];

const clinicLanding = (clinic) => ({ ...DEFAULT_CLINIC_LANDING, ...(clinic.landingPage || {}) });

/* ── Small form primitives (match app styles) ─────────────── */

function Field({ label, children }) {
  return (
    <div className="form-group" style={{ marginBottom: 14 }}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

function ToggleRow({ label, desc, on, onToggle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', background: 'var(--grey-100)', borderRadius: 'var(--r-md)', marginBottom: 8 }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600 }}>{label}</p>
        {desc && <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 1 }}>{desc}</p>}
      </div>
      <button
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onToggle}
        className={`toggle${on ? ' on' : ''}`}
      >
        <span className="toggle-track"><span className="toggle-thumb" /></span>
      </button>
    </div>
  );
}

function ColorSwatches({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {BRAND_COLORS.map(c => (
        <button
          key={c}
          type="button"
          title={c}
          aria-label={`Brand color ${c}`}
          onClick={() => onChange(c)}
          style={{
            width: 30, height: 30, borderRadius: '50%', background: c, cursor: 'pointer',
            border: value === c ? '2px solid var(--text-primary)' : '2px solid transparent',
            outline: value === c ? '2px solid white' : 'none', outlineOffset: -4,
          }}
        />
      ))}
    </div>
  );
}

/* ── Patient-view preview ─────────────────────────────────── */
/* `room` switches from the clinic front door to a room landing page.
   `device` renders it in browser chrome ('web') or a phone shell ('mobile'). */

function resolveLanding(clinic, room) {
  const lp = clinicLanding(clinic);
  const rlp = room?.landingPage || null;
  return {
    lp,
    heading: room ? (rlp?.heading || room.roomName) : lp.displayName,
    message: room ? (rlp?.message || lp.welcome) : lp.welcome,
    showHours: room ? (rlp ? rlp.showHours !== false : lp.showHours) : lp.showHours,
    showVisitOptions: room ? (rlp ? rlp.showVisitOptions !== false : true) : false,
    url: room ? `vsee.me/${(room.roomCode || 'ROOM').toLowerCase()}` : 'vsee.me/clinic',
    initial: (lp.displayName || 'V').trim().charAt(0).toUpperCase(),
  };
}

function LandingBody({ clinic, room, rooms }) {
  const { lp, heading, message, showHours, showVisitOptions } = resolveLanding(clinic, room);
  return (
    <>
      <div style={{ padding: '20px 18px 16px' }}>
        <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>{heading}</p>
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55, margin: '6px 0 14px' }}>{message}</p>

        {/* Clinic front door: room directory */}
        {!room && lp.showRooms && rooms.filter(r => r.visibility === 'public').length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {rooms.filter(r => r.visibility === 'public').map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '10px 14px' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>{r.roomName}</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: lp.brandColor }}>Enter ›</span>
              </div>
            ))}
          </div>
        )}
        {!room && lp.showRooms && rooms.filter(r => r.visibility === 'public').length === 0 && (
          <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', fontStyle: 'italic', marginBottom: 14 }}>No public rooms to list — unlisted rooms are reached by direct link.</p>
        )}

        {/* Room landing: visit options */}
        {room && showVisitOptions && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {(room.visitOptions || []).filter(vo => vo.visible).map(vo => (
              <div key={vo.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '10px 14px' }}>
                <span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, display: 'block' }}>{vo.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{vo.duration} · {(vo.mode || []).join(', ')}</span>
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'white', background: lp.brandColor, borderRadius: 'var(--r-full)', padding: '5px 12px' }}>Book</span>
              </div>
            ))}
          </div>
        )}

        {showHours && (
          <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 4 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {room ? (room.hours?.mode === 'always' ? 'Open now — join any time' : 'Open during scheduled hours') : 'Hours vary by waiting room'}
          </p>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '9px 18px', display: 'flex', gap: 14, fontSize: 10.5, color: 'var(--text-tertiary)', background: 'var(--grey-50)' }}>
        {lp.supportPhone && <span>{lp.supportPhone}</span>}
        {lp.supportEmail && <span>{lp.supportEmail}</span>}
        <span style={{ marginLeft: 'auto' }}>Powered by VSee</span>
      </div>
    </>
  );
}

export function LandingPreview({ clinic, room, rooms = [], device = 'web' }) {
  const { lp, url, initial } = resolveLanding(clinic, room);

  if (device === 'mobile') {
    return (
      <div style={{ width: '100%', maxWidth: 380, margin: '0 auto', border: '10px solid #1F2937', borderRadius: 36, overflow: 'hidden', background: 'white', boxShadow: '0 8px 28px rgba(0,0,0,0.16)' }}>
        {/* Status bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 16px 5px', background: lp.brandColor, color: 'white', fontSize: 10, fontWeight: 600 }}>
          <span>9:41</span>
          <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M2 22h20V2z" opacity=".4"/><path d="M14 22h8V10z"/></svg>
            <svg width="14" height="10" viewBox="0 0 28 14" fill="none" stroke="currentColor"><rect x="1" y="1" width="22" height="12" rx="3"/><rect x="3.5" y="3.5" width="14" height="7" rx="1.5" fill="currentColor" stroke="none"/><path d="M25 5v4" strokeLinecap="round"/></svg>
          </span>
        </div>
        {/* App bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px 12px', background: lp.brandColor, color: 'white' }}>
          {room && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>}
          <span style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>{initial}</span>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{lp.displayName}</span>
        </div>
        <LandingBody clinic={clinic} room={room} rooms={rooms} />
        {/* Home indicator */}
        <div style={{ padding: '6px 0 8px', display: 'flex', justifyContent: 'center', background: 'var(--grey-50)' }}>
          <span style={{ width: 90, height: 4, borderRadius: 4, background: 'var(--grey-300)' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden', background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
      {/* Browser chrome */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--grey-100)', borderBottom: '1px solid var(--border)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--grey-300)' }} />
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--grey-300)' }} />
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--grey-300)' }} />
        <span style={{ flex: 1, marginLeft: 8, background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--r-full)', fontSize: 10.5, color: 'var(--text-secondary)', padding: '3px 12px' }}>{url}</span>
      </div>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: lp.brandColor, color: 'white' }}>
        <span style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>{initial}</span>
        <span style={{ fontSize: 13.5, fontWeight: 700 }}>{lp.displayName}</span>
        {lp.tagline && <span style={{ fontSize: 11, opacity: 0.85, marginLeft: 'auto' }}>{lp.tagline}</span>}
      </div>
      <LandingBody clinic={clinic} room={room} rooms={rooms} />
    </div>
  );
}

/* ── Preview panel: device toggle + expand-to-modal ───────── */

export function PreviewPanel({ clinic, room, rooms = [], label }) {
  const [device, setDevice] = useState('web');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e) => { if (e.key === 'Escape') setExpanded(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  const deviceToggle = (
    <div style={{ display: 'inline-flex', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
      {[{ id: 'web', label: 'Web' }, { id: 'mobile', label: 'Mobile app' }].map(d => (
        <button
          key={d.id}
          type="button"
          onClick={() => setDevice(d.id)}
          style={{
            border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 600, padding: '5px 12px',
            background: device === d.id ? 'var(--brand)' : 'white',
            color: device === d.id ? 'white' : 'var(--text-secondary)',
          }}
        >{d.label}</button>
      ))}
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)', flex: 1, minWidth: 120 }}>{label}</p>
        {deviceToggle}
        <button
          type="button"
          className="btn-icon"
          title="Expand preview"
          aria-label="Expand preview"
          style={{ width: 26, height: 26 }}
          onClick={() => setExpanded(true)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
        </button>
      </div>
      <LandingPreview clinic={clinic} room={room} rooms={rooms} device={device} />

      {expanded && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setExpanded(false)}
        >
          <div
            style={{ background: 'white', borderRadius: 'var(--r-xl)', width: device === 'web' ? 'min(720px, 94vw)' : 'auto', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 70px rgba(0,0,0,0.25)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>{label}</p>
              {deviceToggle}
              <button className="btn-icon" style={{ width: 30, height: 30 }} onClick={() => setExpanded(false)} aria-label="Close preview">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ overflowY: 'auto', padding: 24, background: 'var(--grey-100)' }}>
              <div style={{ width: device === 'web' ? '100%' : 400, maxWidth: '100%', margin: '0 auto' }}>
                <LandingPreview clinic={clinic} room={room} rooms={rooms} device={device} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Clinic-level editor ──────────────────────────────────── */

export function ClinicLandingEditor({ clinic, rooms = [], onChange }) {
  const lp = clinicLanding(clinic);
  const set = (key, val) => onChange({ ...lp, [key]: val });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 28, alignItems: 'flex-start' }}>
      <div>
        <Field label="Clinic display name">
          <input className="input" value={lp.displayName} onChange={e => set('displayName', e.target.value)} style={{ maxWidth: 320 }} />
        </Field>
        <Field label="Tagline">
          <input className="input" value={lp.tagline} onChange={e => set('tagline', e.target.value)} placeholder="e.g. Care from anywhere" style={{ maxWidth: 320 }} />
        </Field>
        <Field label="Welcome message">
          <textarea className="input" value={lp.welcome} onChange={e => set('welcome', e.target.value)} rows={3} style={{ width: '100%', maxWidth: 440, resize: 'vertical', lineHeight: 1.5 }} />
        </Field>
        <Field label="Brand color">
          <ColorSwatches value={lp.brandColor} onChange={c => set('brandColor', c)} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 440 }}>
          <Field label="Support email">
            <input className="input" value={lp.supportEmail} onChange={e => set('supportEmail', e.target.value)} />
          </Field>
          <Field label="Support phone">
            <input className="input" value={lp.supportPhone} onChange={e => set('supportPhone', e.target.value)} />
          </Field>
        </div>
        <div style={{ maxWidth: 440 }}>
          <ToggleRow label="Show room directory" desc="List public waiting rooms on the clinic front door." on={lp.showRooms} onToggle={() => set('showRooms', !lp.showRooms)} />
          <ToggleRow label="Show operating hours" desc="Display availability to patients before they enter." on={lp.showHours} onToggle={() => set('showHours', !lp.showHours)} />
        </div>
      </div>
      <div style={{ position: 'sticky', top: 80 }}>
        <PreviewPanel clinic={{ ...clinic, landingPage: lp }} rooms={rooms} label="Patient view — clinic front door" />
      </div>
    </div>
  );
}

/* ── Room-level editor (inherit or override) ──────────────── */

export function RoomLandingEditor({ clinic, room, onChange }) {
  const rlp = room.landingPage || null;
  const inheriting = rlp === null;
  const set = (key, val) => onChange({ ...(rlp || {}), [key]: val });

  const startOverride = () => onChange({
    heading: room.roomName,
    message: clinicLanding(clinic).welcome,
    showVisitOptions: true,
    showHours: true,
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 28, alignItems: 'flex-start' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', background: 'var(--grey-100)', borderRadius: 'var(--r-md)', marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600 }}>Use clinic default welcome</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              {inheriting
                ? 'This room shows the clinic welcome message with its room name. Branding always comes from Clinic Settings.'
                : 'Custom welcome for this room. Branding (name, color, support info) still comes from Clinic Settings.'}
            </p>
          </div>
          <button
            role="switch"
            aria-checked={inheriting}
            aria-label="Use clinic default landing content"
            onClick={() => inheriting ? startOverride() : onChange(null)}
            className={`toggle${inheriting ? ' on' : ''}`}
          >
            <span className="toggle-track"><span className="toggle-thumb" /></span>
          </button>
        </div>

        {!inheriting && (
          <>
            <Field label="Welcome heading">
              <input className="input" value={rlp.heading} onChange={e => set('heading', e.target.value)} style={{ maxWidth: 320 }} />
            </Field>
            <Field label="Welcome message">
              <textarea className="input" value={rlp.message} onChange={e => set('message', e.target.value)} rows={3} style={{ width: '100%', maxWidth: 440, resize: 'vertical', lineHeight: 1.5 }} />
            </Field>
            <div style={{ maxWidth: 440 }}>
              <ToggleRow label="Show visit options" desc="List bookable visit types on this room's landing page." on={rlp.showVisitOptions !== false} onToggle={() => set('showVisitOptions', rlp.showVisitOptions === false)} />
              <ToggleRow label="Show operating hours" desc="Display this room's availability." on={rlp.showHours !== false} onToggle={() => set('showHours', rlp.showHours === false)} />
            </div>
          </>
        )}
        {inheriting && (
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            Toggle off to write a room-specific heading and message — useful when a room serves a distinct audience (e.g. mental health, pediatrics).
          </p>
        )}
      </div>
      <div>
        <PreviewPanel clinic={clinic} room={room} label={`Patient view — this room ${inheriting ? '(inherited welcome)' : '(custom welcome)'}`} />
      </div>
    </div>
  );
}
