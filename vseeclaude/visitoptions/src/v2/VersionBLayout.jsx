import { useState, useCallback, useEffect } from 'react';
import ClinicTemplatesPage from './ClinicTemplatesPage';
import WaitingRoomsListPage from './WaitingRoomsListPage';
import WaitingRoomSettingsV2 from './WaitingRoomSettingsV2';
import { useAnnotationPage } from './Annotations';
import DashboardPage from './DashboardPage';
import PatientApp from './PatientApp';
import { initialClinic, initialRooms, initialBookings } from '../data/initialDataV2';

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
  const [clinic, setClinic]         = useState(initialClinic);
  const [rooms, setRooms]           = useState(initialRooms);
  const [selectedRoomId, setSelectedRoomId] = useState(
    initialRooms.length === 1 ? initialRooms[0].id : null
  );
  const [page, setPage]             = useState(  // 'rooms' | 'room' | 'clinic'
    initialRooms.length === 1 ? 'room' : 'rooms'
  );
  const [showSaved, setShowSaved]   = useState(false);
  const [bookings, setBookings]     = useState(initialBookings);
  const [copyToast, setCopyToast]   = useState('');
  const [patientAppOpen, setPatientAppOpen] = useState(false);

  const selectedRoom = rooms.find(r => r.id === selectedRoomId) ?? null;
  const { setPage: setAnnotationPage, setNavigate } = useAnnotationPage();

  useEffect(() => {
    const label = page === 'clinic' ? 'clinic'
      : page === 'rooms' ? 'rooms'
      : selectedRoom ? `room:${selectedRoom.id}` : 'rooms';
    setAnnotationPage(label);
  }, [page, selectedRoom, setAnnotationPage]);

  // Register navigation handler for annotation panel
  useEffect(() => {
    setNavigate('layout', (targetPage) => {
      if (targetPage === 'rooms') {
        setPage('rooms');
        setSelectedRoomId(null);
      } else if (targetPage.startsWith('room:')) {
        const roomId = targetPage.split(':')[1];
        setSelectedRoomId(roomId);
        setPage('room');
      } else if (targetPage.startsWith('clinic')) {
        setPage('clinic');
      }
    });
  }, [setNavigate]);

  const handleSelectRoom = useCallback((id) => {
    setSelectedRoomId(id);
    setPage('room');
  }, []);

  const handleAddRoom = useCallback((room) => {
    setRooms(rs => [...rs, room]);
    setSelectedRoomId(room.id);
    setPage('room');
  }, []);

  const handleDeleteRoom = useCallback((id) => {
    setRooms(rs => rs.filter(r => r.id !== id));
  }, []);

  // Duplicate a whole room, including its visit options, with fresh ids
  const handleDuplicateRoom = useCallback((id) => {
    setRooms(rs => {
      const src = rs.find(r => r.id === id);
      if (!src) return rs;
      const base = src.roomName.replace(/ \(copy( \d+)?\)$/, '');
      let name = `${base} (copy)`;
      let n = 2;
      while (rs.some(r => r.roomName === name)) name = `${base} (copy ${n++})`;
      const stamp = Date.now();
      const copy = {
        ...structuredClone(src),
        id: `room_${stamp}`,
        roomName: name,
        roomCode: Math.random().toString(36).slice(2, 7).toUpperCase(),
        visitOptions: (src.visitOptions || []).map((v, i) => ({ ...structuredClone(v), id: `vo_${stamp}_${i}` })),
      };
      const idx = rs.findIndex(r => r.id === id);
      const next = [...rs];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }, []);

  // Copy one visit option into other rooms; renames on collision
  const handleCopyToRooms = useCallback((item, targetRoomIds) => {
    setRooms(rs => rs.map(r => {
      if (!targetRoomIds.includes(r.id)) return r;
      const existing = r.visitOptions || [];
      let name = item.name;
      let n = 2;
      while (existing.some(v => v.name === name)) name = `${item.name} (${n++})`;
      return {
        ...r,
        visitOptions: [...existing, { ...structuredClone(item), id: `vo_${Date.now()}_${r.id}`, name }],
      };
    }));
    setCopyToast(`Copied “${item.name}” to ${targetRoomIds.length} room${targetRoomIds.length !== 1 ? 's' : ''}`);
    setTimeout(() => setCopyToast(''), 2600);
  }, []);

  const handleRoomChange = useCallback((updated) => {
    setRooms(rs => rs.map(r => r.id === updated.id ? updated : r));
  }, []);

  const handleSave = useCallback(() => setShowSaved(true), []);

  const handleBackToRooms = useCallback(() => {
    setPage('rooms');
    setSelectedRoomId(null);
  }, []);

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
            onClick={() => setPage('dashboard')}
            className={`navbar-link${page === 'dashboard' ? ' active' : ''}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Dashboard
            {bookings.filter(b => b.status === 'waiting').length > 0 && (
              <span style={{
                marginLeft: 6, background: 'var(--warning)', color: 'white', fontSize: 10,
                fontWeight: 800, borderRadius: 999, padding: '1px 6px',
              }}>{bookings.filter(b => b.status === 'waiting').length}</span>
            )}
          </button>
          <button
            onClick={() => {
            if (rooms.length === 1) {
              setSelectedRoomId(rooms[0].id);
              setPage('room');
            } else {
              setPage('rooms');
              setSelectedRoomId(null);
            }
          }}
            className={`navbar-link${page === 'rooms' || page === 'room' ? ' active' : ''}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Waiting Rooms
          </button>
          <button
            onClick={() => setPage('clinic')}
            className={`navbar-link${page === 'clinic' ? ' active' : ''}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Clinic Settings
          </button>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setPatientAppOpen(true)}
            className="btn btn-secondary btn-sm"
            title="Open the patient-facing app"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
            Patient App
          </button>
          <div style={{
            width: 32, height: 32, background: 'var(--grey-300)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'var(--grey-600)',
          }}>D</div>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Dr. Provider</span>
        </div>
      </nav>

      {page === 'dashboard' && (
        <DashboardPage
          bookings={bookings}
          clinic={clinic}
          rooms={rooms}
          onChange={setBookings}
          onOpenRoom={id => { setSelectedRoomId(id); setPage('room'); }}
        />
      )}

      {page === 'clinic' && (
        <ClinicTemplatesPage clinic={clinic} rooms={rooms} onChange={setClinic} onSave={handleSave} />
      )}

      {page === 'rooms' && (
        <WaitingRoomsListPage
          rooms={rooms}
          onSelect={handleSelectRoom}
          onAdd={handleAddRoom}
          onDelete={handleDeleteRoom}
          onDuplicate={handleDuplicateRoom}
        />
      )}

      {page === 'room' && selectedRoom && (
        <WaitingRoomSettingsV2
          key={selectedRoom.id}
          room={selectedRoom}
          clinic={clinic}
          onChange={updated => handleRoomChange({ ...updated, id: selectedRoom.id })}
          onSave={handleSave}
          onBack={handleBackToRooms}
          onSaveTemplate={tpl => setClinic(c => ({ ...c, workflowTemplates: [...(c.workflowTemplates || []), tpl] }))}
          allRooms={rooms}
          onCopyToRooms={handleCopyToRooms}
          onUpdateTemplate={tpl => setClinic(c => ({ ...c, workflowTemplates: (c.workflowTemplates || []).map(t => t.id === tpl.id ? tpl : t) }))}
          onDeleteTemplate={id => setClinic(c => ({ ...c, workflowTemplates: (c.workflowTemplates || []).filter(t => t.id !== id) }))}
        />
      )}

      {patientAppOpen && (
        <PatientApp
          clinic={clinic}
          rooms={rooms}
          onBooked={booking => setBookings(bs => [booking, ...bs])}
          onClose={() => setPatientAppOpen(false)}
        />
      )}

      {copyToast && (
        <div className="toast toast-success" role="status" aria-live="polite">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" style={{ flexShrink: 0 }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div className="toast-body">
            <p className="toast-title">Copied</p>
            <p className="toast-msg">{copyToast}</p>
          </div>
        </div>
      )}

      <Toast show={showSaved} onDone={() => setShowSaved(false)} />
    </div>
  );
}
