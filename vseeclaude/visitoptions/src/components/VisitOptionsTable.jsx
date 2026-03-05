import { useState } from 'react';
import VisitOptionsModal from './VisitOptionsModal';

const MODE_ICONS = {
  Video: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  Phone: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  'In-person': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  ),
  Chat: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
};

const PT_BADGES = {
  'self-pay':      { cls: 'badge badge-info',    label: 'Self-Pay' },
  'group-covered': { cls: 'badge badge-neutral',  label: 'Group' },
  'insurance':     { cls: 'badge badge-success',  label: 'Insurance' },
};

function Toggle({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`toggle${checked ? ' on' : ''}`}
    >
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
    </button>
  );
}

function PatientTypesCell({ item }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {item.patientTypes.map((ptId) => {
        const badge = PT_BADGES[ptId];
        if (!badge) return null;
        return (
          <span key={ptId} className={badge.cls} style={{ padding: '1px 8px', fontSize: 11 }}>
            {badge.label}
          </span>
        );
      })}
    </div>
  );
}

export default function VisitOptionsTable({ items, allowedPatientTypes, paymentConfig, onChange }) {
  const [modal, setModal] = useState(null);

  const handleSave = (formData) => {
    // Ensure all selected patient types have a pricing entry
    const DEFAULT_PRICING = {
      'self-pay':      { method: 'specific', amount: '', fallback: '' },
      'group-covered': {
        verified:     { method: 'copay', amount: '', fallback: '' },
        not_verified: { method: 'none',  amount: '', fallback: '' },
        pending:      { method: 'none',  amount: '', fallback: '' },
        error:        { method: 'none',  amount: '', fallback: '' },
      },
      'insurance': {
        eligible:     { method: 'copay', amount: '', fallback: '' },
        not_eligible: { method: 'none',  amount: '', fallback: '' },
        pending:      { method: 'none',  amount: '', fallback: '' },
        error:        { method: 'none',  amount: '', fallback: '' },
      },
    };
    const pricing = { ...(formData.pricing ?? {}) };
    formData.patientTypes.forEach((ptId) => {
      if (!pricing[ptId]) pricing[ptId] = DEFAULT_PRICING[ptId] ?? { method: 'none', amount: '', fallback: '' };
    });
    const saved = { ...formData, pricing };
    if (modal.mode === 'add') {
      onChange([...items, { ...saved, id: Date.now() }]);
    } else {
      onChange(items.map((it) => it.id === modal.item.id ? { ...it, ...saved } : it));
    }
    setModal(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this visit option?')) {
      onChange(items.filter((it) => it.id !== id));
    }
  };

  const toggleVisible = (id) => {
    onChange(items.map((it) => it.id === id ? { ...it, visible: !it.visible } : it));
  };

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p className="section-title">Visit Options</p>
          <p className="section-desc">Configure the appointment types patients can book.</p>
        </div>
        <button
          onClick={() => setModal({ mode: 'add' })}
          className="btn btn-secondary btn-sm"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Visit Option
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--grey-400)' }}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <div>
            <p className="empty-state-title">No visit options yet</p>
            <p className="empty-state-desc">Add your first visit option to let patients book appointments.</p>
          </div>
          <button onClick={() => setModal({ mode: 'add' })} className="btn btn-secondary btn-sm">
            Add Visit Option
          </button>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: 780 }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Duration · Type</th>
                <th title="Max concurrent patients">Slots</th>
                <th>Mode</th>
                <th>Visible</th>
                <th>Patient Types</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 500 }}>{item.name}</td>
                  <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {item.duration}
                    <span style={{ margin: '0 4px', color: 'var(--grey-400)' }}>·</span>
                    {item.type}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }} title="Max concurrent patients">
                    {item.slots}
                  </td>
                  <td>
                    <span
                      title={item.mode}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)' }}
                    >
                      {MODE_ICONS[item.mode]}
                      <span style={{ fontSize: 13 }}>{item.mode}</span>
                    </span>
                  </td>
                  <td>
                    <Toggle
                      checked={item.visible}
                      onChange={() => toggleVisible(item.id)}
                      label={`Toggle visibility for ${item.name}`}
                    />
                  </td>
                  <td>
                    <PatientTypesCell item={item} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => setModal({ mode: 'edit', item })}
                        className="btn-icon brand"
                        title="Edit"
                        aria-label={`Edit ${item.name}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="btn-icon danger"
                        title="Delete"
                        aria-label={`Delete ${item.name}`}
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <VisitOptionsModal
          existing={modal.mode === 'edit' ? modal.item : null}
          allowedPatientTypes={allowedPatientTypes}
          paymentConfig={paymentConfig}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}
