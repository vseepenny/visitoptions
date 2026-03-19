import { useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { defaultPaymentConfig, defaultSchedule } from '../data/initialData';

const VISIBILITY_BADGE = {
  public:   { label: 'Public',   cls: 'badge badge-success' },
  unlisted: { label: 'Unlisted', cls: 'badge badge-neutral' },
};

function newRoom() {
  return {
    id: `room_${Date.now()}`,
    roomName: 'New Waiting Room',
    roomCode: Math.random().toString(36).slice(2, 7).toUpperCase(),
    hours: {
      timezone: 'UTC -08:00 Pacific Time (US & Canada)',
      mode: 'always',
      schedule: defaultSchedule,
      closureMessage: 'Service currently not available. Please check back later.',
    },
    visibility: 'unlisted',
    patientTypes: ['self-pay'],
    visitOptions: [],
  };
}

export default function WaitingRoomsListPage({ rooms, onSelect, onAdd, onDelete }) {
  const [confirmId, setConfirmId] = useState(null);

  const handleAdd = () => {
    const room = newRoom();
    onAdd(room);
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 24px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: 4 }}>
            Waiting Rooms
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Manage the waiting rooms patients use to access your clinic.
          </p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary btn-sm">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
          Add Room
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className="panel" style={{ padding: 48, textAlign: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--grey-300)" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>No waiting rooms yet</p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4, marginBottom: 20 }}>Create your first waiting room to start accepting patients.</p>
          <button onClick={handleAdd} className="btn btn-primary btn-sm">Add Room</button>
        </div>
      ) : (
        <div className="panel">
          <table className="table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Code</th>
                <th>Visibility</th>
                <th>Patient Types</th>
                <th>Visit Options</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => {
                const vis = VISIBILITY_BADGE[room.visibility] ?? VISIBILITY_BADGE.unlisted;
                const enabledVisits = room.visitOptions.filter(v => v.visible).length;
                return (
                  <tr key={room.id} style={{ cursor: 'pointer' }} onClick={() => onSelect(room.id)}>
                    <td>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{room.roomName}</p>
                    </td>
                    <td>
                      <code style={{ fontSize: 12, background: 'var(--grey-100)', padding: '2px 6px', borderRadius: 4, letterSpacing: '0.05em' }}>
                        {room.roomCode}
                      </code>
                    </td>
                    <td>
                      <span className={vis.cls}>{vis.label}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{room.patientTypes.length} type{room.patientTypes.length !== 1 ? 's' : ''}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {enabledVisits} of {room.visitOptions.length} enabled
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => onSelect(room.id)}
                          className="btn btn-ghost btn-sm"
                        >
                          Configure
                        </button>
                        <button
                          onClick={() => setConfirmId(room.id)}
                          className="btn-icon danger"
                          title="Delete room"
                          aria-label={`Delete ${room.roomName}`}
                          disabled={rooms.length === 1}
                          style={{ opacity: rooms.length === 1 ? 0.35 : 1 }}
                        >
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

      {confirmId && (
        <ConfirmModal
          title="Delete Waiting Room"
          message={`Are you sure you want to delete "${rooms.find(r => r.id === confirmId)?.roomName}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => { onDelete(confirmId); setConfirmId(null); }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
