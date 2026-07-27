/* The patient-facing app, end to end: clinic front door → room →
   visit type → configured intake flow → confirmation → a real booking
   that lands on the provider Dashboard. */

import { useState } from 'react';
import PatientPreview from './PatientPreview';
import { DEFAULT_CLINIC_LANDING } from './LandingPageEditor';
import { slotsForDate, providersForVisit } from './scheduling';

const landing = (clinic) => ({ ...DEFAULT_CLINIC_LANDING, ...(clinic.landingPage || {}) });

const FIRST = ['Alina', 'Marcus', 'Sofia', 'Theo', 'Naomi', 'Wren', 'Idris', 'Camille'];
const LAST = ['Delgado', 'Hartley', 'Nakamura', 'Boateng', 'Vasquez', 'Lindqvist', 'Ferreira', 'Adeyemi'];
const pick = (arr, seed) => arr[seed % arr.length];

/* ── Device frame ─────────────────────────────────────────── */

function PhoneFrame({ brandColor, title, onBack, onExit, children }) {
  return (
    <div style={{
      width: 390, maxWidth: '100%', border: '11px solid #1F2937', borderRadius: 40,
      overflow: 'hidden', background: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      display: 'flex', flexDirection: 'column', maxHeight: '86vh',
    }}>
      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 18px 6px', background: brandColor, color: 'white', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
        <span>9:41</span>
        <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M2 22h20V2z" opacity=".4"/><path d="M14 22h8V10z"/></svg>
          <svg width="15" height="11" viewBox="0 0 28 14" fill="none" stroke="currentColor"><rect x="1" y="1" width="22" height="12" rx="3"/><rect x="3.5" y="3.5" width="15" height="7" rx="1.5" fill="currentColor" stroke="none"/><path d="M25 5v4" strokeLinecap="round"/></svg>
        </span>
      </div>
      {/* App bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 13px', background: brandColor, color: 'white', flexShrink: 0 }}>
        {onBack && (
          <button onClick={onBack} aria-label="Back" style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', padding: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        )}
        <span style={{ fontSize: 14, fontWeight: 700, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
        <button onClick={onExit} aria-label="Exit patient app" title="Exit patient app" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', borderRadius: 6, padding: 4 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
      <div style={{ padding: '7px 0 9px', display: 'flex', justifyContent: 'center', background: 'var(--grey-50)', flexShrink: 0 }}>
        <span style={{ width: 100, height: 4, borderRadius: 4, background: 'var(--grey-300)' }} />
      </div>
    </div>
  );
}

/* ── Stage: clinic front door ─────────────────────────────── */

function ClinicDoor({ clinic, rooms, onEnterRoom }) {
  const lp = landing(clinic);
  const publicRooms = rooms.filter(r => r.visibility === 'public');
  const unlisted = rooms.filter(r => r.visibility !== 'public');

  return (
    <div style={{ padding: '22px 18px 18px' }}>
      <p style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.3px' }}>{lp.displayName}</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, margin: '6px 0 18px' }}>{lp.welcome}</p>

      {lp.showRooms && publicRooms.map(r => (
        <button
          key={r.id}
          onClick={() => onEnterRoom(r.id)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 8, background: 'white', cursor: 'pointer', textAlign: 'left' }}
        >
          <span>
            <span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>{r.roomName}</span>
            <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
              {(r.visitOptions || []).filter(v => v.visible).length} visit types · {r.hours?.mode === 'always' ? 'Open now' : 'Scheduled hours'}
            </span>
          </span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: lp.brandColor }}>Enter ›</span>
        </button>
      ))}

      {!lp.showRooms && (
        <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
          Room directory is turned off in Clinic Settings — patients would arrive via a direct room link.
        </p>
      )}

      {unlisted.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed var(--border)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)', marginBottom: 8 }}>Have a room code?</p>
          {unlisted.map(r => (
            <button
              key={r.id}
              onClick={() => onEnterRoom(r.id)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', border: '1px dashed var(--border-strong)', borderRadius: 12, padding: '11px 14px', marginBottom: 6, background: 'var(--grey-50)', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: 13, fontWeight: 600 }}>{r.roomName}</span>
              <code style={{ fontSize: 11 }}>{r.roomCode}</code>
            </button>
          ))}
        </div>
      )}

      {lp.showHours && (
        <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Hours vary by waiting room
        </p>
      )}
      <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        {lp.supportPhone} · {lp.supportEmail}
      </p>
    </div>
  );
}

/* ── Stage: room landing → choose a visit type ────────────── */

function RoomDoor({ clinic, room, onChooseVisit }) {
  const lp = landing(clinic);
  const rlp = room.landingPage || null;
  const heading = rlp?.heading || room.roomName;
  const message = rlp?.message || lp.welcome;
  const showVisits = rlp ? rlp.showVisitOptions !== false : true;
  const visits = (room.visitOptions || []).filter(v => v.visible);

  return (
    <div style={{ padding: '22px 18px 18px' }}>
      <p style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.3px' }}>{heading}</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, margin: '6px 0 18px' }}>{message}</p>

      {!showVisits && (
        <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', fontStyle: 'italic', marginBottom: 14 }}>
          Visit options are hidden on this room's landing page.
        </p>
      )}

      {showVisits && visits.length === 0 && (
        <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No visit types are available in this room.</p>
      )}

      {showVisits && visits.map(v => {
        const provs = providersForVisit(clinic, room, v);
        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
        const next = slotsForDate({ clinic, room, visit: v, date: tomorrow })[0];
        return (
          <button
            key={v.id}
            onClick={() => onChooseVisit(v.id)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 8, background: 'white', cursor: 'pointer', textAlign: 'left' }}
          >
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>{v.name}</span>
              <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 1 }}>
                {v.duration} · {(v.mode || []).join(', ')}
              </span>
              <span style={{ display: 'block', fontSize: 11, color: next ? 'var(--brand)' : 'var(--text-tertiary)', marginTop: 3, fontWeight: 600 }}>
                {next ? `Next available ${next.time}` : provs.length ? 'No times tomorrow' : 'No provider assigned'}
              </span>
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'white', background: lp.brandColor, borderRadius: 999, padding: '6px 14px', flexShrink: 0 }}>Book</span>
          </button>
        );
      })}

      {rlp?.showHours !== false && (
        <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {room.hours?.mode === 'always' ? 'Open now — join any time' : 'Open during scheduled hours'}
        </p>
      )}
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────── */

export default function PatientApp({ clinic, rooms, onBooked, onClose }) {
  const [stage, setStage] = useState('clinic'); // clinic | room | intake
  const [roomId, setRoomId] = useState(null);
  const [visitId, setVisitId] = useState(null);

  const lp = landing(clinic);
  const room = rooms.find(r => r.id === roomId) || null;
  const visit = room?.visitOptions?.find(v => v.id === visitId) || null;

  const title = stage === 'clinic' ? lp.displayName : room?.roomName || lp.displayName;
  const back = stage === 'clinic' ? null
    : stage === 'room' ? () => { setStage('clinic'); setRoomId(null); }
    : () => { setStage('room'); setVisitId(null); };

  // A completed intake becomes a real queue entry
  const handleBooked = () => {
    const seed = Date.now() % 997;
    const name = `${pick(FIRST, seed)} ${pick(LAST, Math.floor(seed / 7))}`;
    onBooked({
      id: `bk_${Date.now()}`,
      patientName: name,
      patientAge: 24 + (seed % 48),
      mrn: `MRN-${10000 + (seed * 7) % 89999}`,
      roomId: room.id,
      visitOptionId: visit?.id || room.visitOptions?.[0]?.id,
      visitName: visit?.name || 'Visit',
      providerName: providersForVisit(clinic, room, visit)[0]
        ? `${providersForVisit(clinic, room, visit)[0].name}, ${providersForVisit(clinic, room, visit)[0].credential}`
        : 'Unassigned',
      patientType: visit?.patientTypes?.[0] || 'self-pay',
      mode: (visit?.mode || ['Video'])[0],
      status: 'waiting',
      waitingMinutes: 0,
      intakeComplete: true,
      paid: true,
      reason: 'Booked from the patient app',
      isNew: true,
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(17,24,39,0.72)',
      backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 28, padding: 24, flexWrap: 'wrap',
    }}>
      {/* Context rail — makes it obvious this is driven by the config */}
      <div style={{ color: 'white', maxWidth: 260 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', opacity: 0.65 }}>Patient app</p>
        <p style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.3px', margin: '4px 0 10px' }}>
          {stage === 'clinic' ? 'Clinic front door' : stage === 'room' ? 'Room landing' : 'Intake flow'}
        </p>
        <p style={{ fontSize: 12.5, lineHeight: 1.6, opacity: 0.8 }}>
          {stage === 'clinic' && 'Rendered from Clinic Settings → Landing Page. Only public rooms are listed.'}
          {stage === 'room' && "Rendered from this room's Landing Page section. Next-available times come from provider availability."}
          {stage === 'intake' && 'Every step here is the intake flow you configured — including conditional branches. Completing it puts the patient on the Dashboard queue.'}
        </p>
        <button onClick={onClose} className="btn btn-sm" style={{ marginTop: 16, background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
          Exit patient app
        </button>
      </div>

      <PhoneFrame brandColor={lp.brandColor} title={title} onBack={back} onExit={onClose}>
        {stage === 'clinic' && (
          <ClinicDoor clinic={clinic} rooms={rooms} onEnterRoom={id => { setRoomId(id); setStage('room'); }} />
        )}
        {stage === 'room' && room && (
          <RoomDoor clinic={clinic} room={room} onChooseVisit={id => { setVisitId(id); setStage('intake'); }} />
        )}
        {stage === 'intake' && room && (
          <div style={{ padding: '4px 6px 10px' }}>
            <PatientPreview
              room={room}
              clinic={clinic}
              initialVisitId={visitId}
              embedded
              onBooked={handleBooked}
            />
          </div>
        )}
      </PhoneFrame>
    </div>
  );
}
