import { useState, useCallback } from 'react';
import Breadcrumb from './components/Breadcrumb';
import OperatingHours from './components/OperatingHours';
import PatientTypes from './components/PatientTypes';
import PaymentSettings from './components/PaymentSettings';
import VisitOptionsTable from './components/VisitOptionsTable';
import { defaultSchedule, defaultVisitOptions, defaultPaymentConfig } from './data/initialData';

const INITIAL_STATE = {
  roomName: "Dr. Provider's Waiting Room 1",
  roomCode: 'GHTNC',
  hours: {
    timezone: 'UTC -08:00 Pacific Time (US & Canada)',
    mode: 'always',
    schedule: defaultSchedule,
    closureMessage: 'Service currently not available. Please check back later.',
  },
  visibility: 'public',
  patientTypes: ['self-pay', 'group-covered', 'insurance'],
  paymentConfig: defaultPaymentConfig,
  visitOptions: defaultVisitOptions,
};

function useDirty(initial) {
  const [savedStr, setSavedStr] = useState(JSON.stringify(initial));
  const [state, setState] = useState(initial);
  const isDirty = JSON.stringify(state) !== savedStr;
  const save = () => setSavedStr(JSON.stringify(state));
  return { state, setState, isDirty, save };
}

function Toast({ show, onDone }) {
  if (!show) return null;
  return (
    <div className="toast toast-success" role="status" aria-live="polite">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" style={{ flexShrink: 0 }}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      <div className="toast-body">
        <p className="toast-title">Settings saved</p>
        <p className="toast-msg">Waiting room configuration updated successfully.</p>
      </div>
      <button
        onClick={onDone}
        style={{ background: 'none', border: 'none', fontSize: 18, color: 'var(--grey-400)', cursor: 'pointer', lineHeight: 1 }}
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  );
}

function CopyToast({ show }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--grey-900)', color: 'white',
      fontSize: 13, fontWeight: 600, padding: '8px 20px',
      borderRadius: 'var(--r-full)', boxShadow: 'var(--shadow-lg)',
      zIndex: 'var(--z-toast)', animation: 'slideUp 200ms ease both',
    }}>
      Room code copied!
    </div>
  );
}

export default function WaitingRoomSettings() {
  const { state, setState, isDirty, save } = useDirty(INITIAL_STATE);
  const [showSaved, setShowSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const update = useCallback((field, value) => {
    setState((s) => ({ ...s, [field]: value }));
  }, [setState]);

  const handleSave = () => {
    save();
    setShowSaved(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(state.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-subtle)' }}>
      {/* Navbar */}
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, background: 'var(--brand)', color: 'white',
            borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 15,
          }}>V</div>
          <span className="navbar-logo" style={{ fontSize: 18 }}>VSee Clinic</span>
        </div>
        <div className="navbar-links">
          <a href="#" className="navbar-link">Dashboard</a>
          <a href="#" className="navbar-link">Patients</a>
          <a href="#" className="navbar-link">Calendar</a>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: 'var(--grey-300)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'var(--grey-600)',
          }}>D</div>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Dr. Provider</span>
        </div>
      </nav>

      {/* Page content */}
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: 20 }}>
          <Breadcrumb items={['Dashboard', 'My Clinic', 'Waiting Rooms', state.roomName]} />
        </div>

        <div className="panel">
          {/* Page header */}
          <div style={{ padding: '28px 32px 24px', borderBottom: '1px solid var(--border)' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: 6 }}>
              Waiting Room Settings
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Configure settings for{' '}
              <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{state.roomName}</strong>
            </p>
          </div>

          <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 32 }}>

            {/* Room Identity */}
            <section>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="form-group">
                  <label htmlFor="room-name" className="form-label">Room Name</label>
                  <input
                    id="room-name"
                    type="text"
                    value={state.roomName}
                    onChange={(e) => update('roomName', e.target.value)}
                    className="input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Room Code</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="input-readonly">{state.roomCode}</div>
                    <button onClick={handleCopy} className="btn btn-ghost btn-sm">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy
                    </button>
                  </div>
                  <p className="form-hint">Share this code with patients to join directly.</p>
                </div>
              </div>
            </section>

            <div className="divider" style={{ margin: 0 }} />

            {/* Operating Hours */}
            <OperatingHours
              data={state.hours}
              onChange={(val) => update('hours', val)}
            />

            <div className="divider" style={{ margin: 0 }} />

            {/* Visibility */}
            <section>
              <p className="section-title">Visibility</p>
              <p className="section-desc" style={{ marginBottom: 16 }}>Control who can discover this waiting room.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  {
                    value: 'public',
                    label: 'Public',
                    desc: 'Anyone can search for and find this room in the VSee Clinic mobile app.',
                  },
                  {
                    value: 'unlisted',
                    label: 'Unlisted',
                    desc: 'Patients can only access this room using a direct link or room code.',
                  },
                ].map((opt) => (
                  <label key={opt.value} className="radio-option">
                    <input
                      type="radio"
                      name="visibility"
                      value={opt.value}
                      checked={state.visibility === opt.value}
                      onChange={() => update('visibility', opt.value)}
                    />
                    <div>
                      <p className="radio-option-label">{opt.label}</p>
                      <p className="radio-option-desc">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            <div className="divider" style={{ margin: 0 }} />

            {/* Patient Types */}
            <PatientTypes
              selected={state.patientTypes}
              onChange={(val) => update('patientTypes', val)}
            />

            <div className="divider" style={{ margin: 0 }} />

            {/* Payment Settings */}
            <PaymentSettings
              enabledTypes={state.patientTypes}
              config={state.paymentConfig}
              onChange={(val) => update('paymentConfig', val)}
            />

            <div className="divider" style={{ margin: 0 }} />

            {/* Visit Options */}
            <VisitOptionsTable
              items={state.visitOptions}
              allowedPatientTypes={state.patientTypes}
              paymentConfig={state.paymentConfig}
              onChange={(val) => update('visitOptions', val)}
            />
          </div>

          {/* Footer */}
          <div className="panel-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {isDirty && (
                <span className="unsaved-badge">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  Unsaved changes
                </span>
              )}
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                Powered by <span style={{ color: 'var(--brand)', fontWeight: 600 }}>VSee</span>
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={!isDirty}
              className="btn btn-primary btn-sm"
            >
              Update Settings
            </button>
          </div>
        </div>
      </div>

      <Toast show={showSaved} onDone={() => setShowSaved(false)} />
      <CopyToast show={copied} />
    </div>
  );
}
