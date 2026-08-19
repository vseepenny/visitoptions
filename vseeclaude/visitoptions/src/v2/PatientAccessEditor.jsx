import {
  ACCESS_DEFAULTS, ACCESS_METHODS, METHOD_KEYS, SIGNUP_ACCESS, ELIGIBILITY_SOURCES,
  SSO_PROVIDERS, GUEST_FIELDS, LANDING_METHODS,
  accessConfig, resolvePatientAccess, landingMethod, accessSummary,
} from './patientAccess';

/* ── Small shared controls ────────────────────────────────── */

function OptCheck({ checked, onChange, label, hint, disabled }) {
  return (
    <label
      title={hint}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12,
        cursor: disabled ? 'default' : 'pointer',
        color: disabled ? 'var(--text-tertiary)' : 'var(--text-primary)',
      }}
    >
      <input type="checkbox" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} style={{ accentColor: 'var(--brand)' }} />
      {label}
    </label>
  );
}

function OptGroup({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', minWidth: 96 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px 16px', flexWrap: 'wrap', flex: 1 }}>{children}</div>
    </div>
  );
}

function WarnNote({ children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
      background: 'var(--warning-light)', border: '1px solid #FDE68A', borderRadius: 'var(--r-md)',
      fontSize: 11.5, color: '#92400E',
    }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      {children}
    </div>
  );
}

export function AccessChips({ access, size = 10 }) {
  const chips = accessSummary(access);
  if (chips.length === 0) return <span className="badge badge-warning" style={{ fontSize: size }}>No way in</span>;
  return (
    <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
      {chips.map(c => <span key={c} className="badge badge-success" style={{ fontSize: size }}>{c}</span>)}
    </span>
  );
}

/* ── Clinic-level editor ──────────────────────────────────── */
// The full capability set: which methods exist, plus the infrastructure behind
// them. Rooms may narrow this but never extend it.

export function PatientAccessEditor({ access, onChange }) {
  const cfg = accessConfig(access);
  const set = (patch) => onChange({ ...cfg, ...patch });

  const toggleIn = (key, list, id, on) => {
    set({ [key]: on ? [...new Set([...list, id])] : list.filter(v => v !== id) });
  };

  const enabledCount = METHOD_KEYS.filter(k => cfg[k]).length;
  const landing = landingMethod(cfg);

  const subOptions = {
    allowLogin: (
      <OptCheck checked={cfg.rememberMe} onChange={v => set({ rememberMe: v })} label="Offer “Remember me”" hint="Keeps the patient signed in on this device." />
    ),
    allowSignup: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <OptGroup label="Who can register">
          {SIGNUP_ACCESS.map(sa => (
            <label key={sa.id} title={sa.hint} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer', color: 'var(--text-primary)' }}>
              <input type="radio" name="clinic-signup-access" checked={cfg.signupAccess === sa.id} onChange={() => set({ signupAccess: sa.id })} style={{ accentColor: 'var(--brand)' }} />
              {sa.label}
            </label>
          ))}
        </OptGroup>
        {cfg.signupAccess === 'eligibility' && (
          <OptGroup label="Checked against">
            <select
              value={cfg.eligibilitySource}
              onChange={e => set({ eligibilitySource: e.target.value })}
              className="input"
              style={{ height: 30, fontSize: 12, padding: '0 26px 0 8px', maxWidth: 230 }}
            >
              {ELIGIBILITY_SOURCES.map(es => <option key={es.id} value={es.id}>{es.label}</option>)}
            </select>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              The same source backs the <strong>Insurance Status</strong> branch condition.
            </span>
          </OptGroup>
        )}
        <OptGroup label="Verify identity">
          <OptCheck checked={cfg.verifyEmail} onChange={v => set({ verifyEmail: v })} label="Email code" hint="Patient enters a 6-digit code sent to their inbox." />
          <OptCheck checked={cfg.verifyPhone} onChange={v => set({ verifyPhone: v })} label="SMS code" hint="Patient enters a code texted to their phone." />
        </OptGroup>
      </div>
    ),
    allowSSO: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <OptGroup label="Providers">
          {SSO_PROVIDERS.map(p => (
            <OptCheck key={p.id} checked={cfg.ssoProviders.includes(p.id)} onChange={v => toggleIn('ssoProviders', cfg.ssoProviders, p.id, v)} label={p.label} />
          ))}
        </OptGroup>
        <OptCheck
          checked={cfg.ssoAutoRedirect}
          onChange={v => set({ ssoAutoRedirect: v })}
          label="Send patients straight to the provider"
          hint="Skips the sign-in screen entirely. Only sensible when SSO is the one way in."
        />
        {cfg.allowSSO && cfg.ssoProviders.length === 0 && (
          <WarnNote>Pick at least one provider — until then SSO falls back to a generic clinic IdP button.</WarnNote>
        )}
      </div>
    ),
    allowMagicLink: null,
    allowGuest: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <OptGroup label="Collect">
          {GUEST_FIELDS.map(f => (
            <OptCheck key={f.id} checked={cfg.guestFields.includes(f.id)} onChange={v => toggleIn('guestFields', cfg.guestFields, f.id, v)} label={f.label} />
          ))}
        </OptGroup>
        <OptCheck checked={cfg.guestUpgrade} onChange={v => set({ guestUpgrade: v })} label="Offer to save an account after the visit" />
      </div>
    ),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {enabledCount === 0 && (
        <WarnNote>Turn on at least one way in — with all of these off, no patient can start a visit in any room.</WarnNote>
      )}

      {ACCESS_METHODS.map(m => {
        const on = !!cfg[m.key];
        return (
          <div
            key={m.key}
            style={{
              border: `1px solid ${on ? '#A7DFC8' : 'var(--border)'}`,
              borderRadius: 'var(--r-md)',
              background: on ? 'var(--brand-50)' : 'white',
              transition: 'all 150ms',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={on} onChange={e => set({ [m.key]: e.target.checked })} style={{ accentColor: 'var(--brand)', marginTop: 2, flexShrink: 0 }} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{m.label}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{m.desc}</span>
              </span>
            </label>
            {on && subOptions[m.key] && (
              <div style={{ margin: '0 12px 0 32px', padding: '10px 0 11px', borderTop: '1px dashed var(--border)' }}>
                {subOptions[m.key]}
              </div>
            )}
          </div>
        );
      })}

      {enabledCount > 1 && (
        <div style={{ paddingTop: 2 }}>
          <OptGroup label="Land on">
            <select
              value={landing || ''}
              onChange={e => set({ defaultMethod: e.target.value })}
              className="input"
              style={{ height: 30, fontSize: 12, padding: '0 26px 0 8px', maxWidth: 200 }}
            >
              {LANDING_METHODS.filter(lm => cfg[lm.requires]).map(lm => <option key={lm.id} value={lm.id}>{lm.label}</option>)}
            </select>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>The screen patients see first — the rest are one tap away.</span>
          </OptGroup>
        </div>
      )}
    </div>
  );
}

/* ── Room-level override ──────────────────────────────────── */
// Rooms choose from what the clinic set up. Methods the clinic has switched off
// are shown disabled rather than hidden, so it's clear why they aren't offered
// and where to go to change that.

export function RoomAccessOverride({ clinic, room, onChange, onConfigureClinic }) {
  const clinicCfg = accessConfig(clinic?.patientAccess);
  const override = room?.accessOverride ?? null;
  const usingDefault = !override;
  const effective = resolvePatientAccess(clinic, room);
  const landing = landingMethod(effective);

  const startOverride = () => {
    // Seed the override from the clinic config so nothing changes on the first click.
    const seeded = { defaultMethod: clinicCfg.defaultMethod };
    for (const key of METHOD_KEYS) seeded[key] = clinicCfg[key];
    onChange(seeded);
  };

  const setMethod = (key, on) => onChange({ ...override, [key]: on });

  const effectiveCount = METHOD_KEYS.filter(k => effective[k]).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--grey-100)', borderRadius: 'var(--r-md)', marginBottom: 12, gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600 }}>Use clinic default patient access</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            Currently: <AccessChips access={clinicCfg} />
          </p>
        </div>
        <button
          role="switch"
          aria-checked={usingDefault}
          aria-label="Use clinic default patient access"
          onClick={() => usingDefault ? startOverride() : onChange(null)}
          className={`toggle${usingDefault ? ' on' : ''}`}
          style={{ flexShrink: 0 }}
        >
          <span className="toggle-track"><span className="toggle-thumb" /></span>
        </button>
      </div>

      {usingDefault ? (
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          Patients in this room get whatever the clinic offers.{' '}
          {onConfigureClinic && (
            <button onClick={onConfigureClinic} style={{ background: 'none', border: 'none', padding: 0, fontSize: 12, color: 'var(--brand)', fontWeight: 600, cursor: 'pointer' }}>
              Change it for the whole clinic
            </button>
          )}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Choose which of the clinic's methods this room offers. A room can narrow the list but not add to it.
          </p>

          {effectiveCount === 0 && (
            <WarnNote>No method left on — patients can't start a visit in this room.</WarnNote>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ACCESS_METHODS.map(m => {
              const clinicHas = !!clinicCfg[m.key];
              const on = !!effective[m.key];
              return (
                <label
                  key={m.key}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 12px',
                    border: `1px solid ${on ? '#A7DFC8' : 'var(--border)'}`,
                    borderRadius: 'var(--r-md)',
                    background: !clinicHas ? 'var(--grey-50)' : on ? 'var(--brand-50)' : 'white',
                    cursor: clinicHas ? 'pointer' : 'default',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={!clinicHas}
                    onChange={e => setMethod(m.key, e.target.checked)}
                    style={{ accentColor: 'var(--brand)', marginTop: 2, flexShrink: 0 }}
                  />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: clinicHas ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                      {m.label}
                    </span>
                    <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {clinicHas ? m.desc : 'Not set up for this clinic.'}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          {effectiveCount > 1 && (
            <OptGroup label="Land on">
              <select
                value={landing || ''}
                onChange={e => onChange({ ...override, defaultMethod: e.target.value })}
                className="input"
                style={{ height: 30, fontSize: 12, padding: '0 26px 0 8px', maxWidth: 200 }}
              >
                {LANDING_METHODS.filter(lm => effective[lm.requires]).map(lm => <option key={lm.id} value={lm.id}>{lm.label}</option>)}
              </select>
            </OptGroup>
          )}

          {onConfigureClinic && (
            <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
              Need a method that isn't listed?{' '}
              <button onClick={onConfigureClinic} style={{ background: 'none', border: 'none', padding: 0, fontSize: 11.5, color: 'var(--brand)', fontWeight: 600, cursor: 'pointer' }}>
                Set it up in Clinic Settings
              </button>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export { ACCESS_DEFAULTS };
