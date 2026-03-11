import { useState } from 'react';
import WaitingRoomSettings from './WaitingRoomSettings';
import VersionBLayout from './v2/VersionBLayout';
import './index.css';

function VersionBanner({ version, onSwitch }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 999,
      background: '#111827', color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
      padding: '8px 24px', fontSize: 13,
    }}>
      <span style={{ color: '#9CA3AF', fontWeight: 500 }}>Design Prototype</span>
      <div style={{ display: 'flex', border: '1px solid #374151', borderRadius: 6, overflow: 'hidden' }}>
        {['A', 'B'].map((v) => (
          <button
            key={v}
            onClick={() => onSwitch(v)}
            style={{
              padding: '4px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: version === v ? '#0D875C' : 'transparent',
              color: version === v ? 'white' : '#9CA3AF',
              transition: 'all 150ms',
            }}
          >
            Version {v}
          </button>
        ))}
      </div>
      <span style={{ color: '#6B7280', fontSize: 12 }}>
        {version === 'A'
          ? 'Current: all config inline per room'
          : 'New: clinic-level templates, rooms reference by ID'}
      </span>
    </div>
  );
}

export default function App() {
  const [version, setVersion] = useState('A');

  return (
    <>
      <VersionBanner version={version} onSwitch={setVersion} />
      {version === 'A' ? <WaitingRoomSettings /> : <VersionBLayout />}
    </>
  );
}
