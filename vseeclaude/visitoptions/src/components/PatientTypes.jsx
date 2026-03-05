const PATIENT_TYPES = [
  {
    id: 'self-pay',
    label: 'Self-Pay',
    description: 'Patients paying out of pocket',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    id: 'group-covered',
    label: 'Group-Covered',
    description: 'Patients with employer coverage',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'insurance',
    label: 'Insurance',
    description: 'Patients with private insurance',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
];

export default function PatientTypes({ selected, onChange }) {
  const toggle = (id) => {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    onChange(next);
  };

  return (
    <section>
      <p className="section-title">Patient Types Accepted</p>
      <p className="section-desc" style={{ marginBottom: 16 }}>
        Select which types of patients your practice accepts. This determines available options when creating visit types.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {PATIENT_TYPES.map((pt) => {
          const checked = selected.includes(pt.id);
          return (
            <label key={pt.id} className={`pt-card${checked ? ' selected' : ''}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(pt.id)}
                style={{ display: 'none' }}
              />
              <div
                className={`ds-checkbox${checked ? ' checked' : ''}`}
                style={{ marginTop: 2 }}
                aria-hidden="true"
              >
                {checked && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 14, fontWeight: 600,
                  color: checked ? 'var(--text-primary)' : 'var(--text-secondary)',
                  marginBottom: 3,
                }}>
                  <span style={{ color: checked ? 'var(--brand)' : 'var(--grey-400)' }}>{pt.icon}</span>
                  {pt.label}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{pt.description}</p>
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
}

export { PATIENT_TYPES };
