/* Landing page editors — clinic-level branding/welcome + per-room overrides,
   each with a live patient-view preview. */

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
/* Renders inside a small browser-chrome card. `room` switches it from the
   clinic front door to a specific room's landing page. */

export function LandingPreview({ clinic, room, rooms = [] }) {
  const lp = clinicLanding(clinic);
  const rlp = room?.landingPage || null;
  const heading = room ? (rlp?.heading || room.roomName) : lp.displayName;
  const message = room ? (rlp?.message || lp.welcome) : lp.welcome;
  const showHours = room ? (rlp ? rlp.showHours !== false : lp.showHours) : lp.showHours;
  const showVisitOptions = room ? (rlp ? rlp.showVisitOptions !== false : true) : false;
  const url = room ? `vsee.me/${(room.roomCode || 'ROOM').toLowerCase()}` : 'vsee.me/clinic';
  const initial = (lp.displayName || 'V').trim().charAt(0).toUpperCase();

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

      {/* Body */}
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
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)', marginBottom: 8 }}>Patient view — clinic front door</p>
        <LandingPreview clinic={{ ...clinic, landingPage: lp }} rooms={rooms} />
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
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)', marginBottom: 8 }}>
          Patient view — this room {inheriting ? '(inherited welcome)' : '(custom welcome)'}
        </p>
        <LandingPreview clinic={clinic} room={room} />
      </div>
    </div>
  );
}
