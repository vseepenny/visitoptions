import { useState, useCallback } from 'react';
import ClinicTemplatesPage from './ClinicTemplatesPage';
import WaitingRoomSettingsV2 from './WaitingRoomSettingsV2';
import { initialClinicTemplates, initialRoomV2 } from '../data/initialDataV2';

function Toast({ show, onDone }) {
  if (!show) return null;
  return (
    <div className="toast toast-success" role="status" aria-live="polite">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" style={{ flexShrink: 0 }}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      <div className="toast-body">
        <p className="toast-title">Settings saved</p>
        <p className="toast-msg">Configuration updated successfully.</p>
      </div>
      <button onClick={onDone} style={{ background: 'none', border: 'none', fontSize: 18, color: 'var(--grey-400)', cursor: 'pointer', lineHeight: 1 }} aria-label="Dismiss">&times;</button>
    </div>
  );
}

export default function VersionBLayout() {
  const [page, setPage]           = useState('room');
  const [templates, setTemplates] = useState(initialClinicTemplates);
  const [room, setRoom]           = useState(initialRoomV2);
  const [showSaved, setShowSaved] = useState(false);

  const handleSave = useCallback(() => setShowSaved(true), []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-subtle)' }}>
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
          <button
            onClick={() => setPage('room')}
            className={`navbar-link${page === 'room' ? ' active' : ''}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Waiting Room
          </button>
          <button
            onClick={() => setPage('templates')}
            className={`navbar-link${page === 'templates' ? ' active' : ''}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Clinic Templates
          </button>
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

      {page === 'templates' ? (
        <ClinicTemplatesPage templates={templates} onChange={setTemplates} />
      ) : (
        <WaitingRoomSettingsV2
          room={room}
          templates={templates}
          onChange={setRoom}
          onSave={handleSave}
        />
      )}

      <Toast show={showSaved} onDone={() => setShowSaved(false)} />
    </div>
  );
}
