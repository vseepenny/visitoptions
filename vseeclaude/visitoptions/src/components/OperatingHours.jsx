import { HOURS, TIMEZONES } from '../data/initialData';

function TimeSelect({ value, onChange, id }) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="time-select"
      style={{ width: 115 }}
    >
      {HOURS.map((h) => (
        <option key={h} value={h}>{h}</option>
      ))}
    </select>
  );
}

function DayRow({ day, closed, slots, onChange }) {
  const toggleClosed = () => onChange({ closed: !closed, slots });

  const updateSlot = (index, field, value) => {
    const updated = slots.map((s, i) => i === index ? { ...s, [field]: value } : s);
    onChange({ closed, slots: updated });
  };

  const addSlot = () => {
    onChange({ closed, slots: [...slots, { open: '09:00 AM', close: '05:00 PM' }] });
  };

  const removeSlot = (index) => {
    onChange({ closed, slots: slots.filter((_, i) => i !== index) });
  };

  return (
    <div className="hours-row">
      <label className="check-item" style={{ paddingTop: 6 }}>
        <input
          type="checkbox"
          checked={!closed}
          onChange={toggleClosed}
          aria-label={`${day} open`}
        />
        <span style={{ fontSize: 13, fontWeight: 500 }}>{day}</span>
      </label>

      <div>
        {closed ? (
          <div style={{ display: 'flex', alignItems: 'center', height: 36 }}>
            <span className="badge badge-neutral">Closed</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {slots.map((slot, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TimeSelect
                  id={`${day}-open-${i}`}
                  value={slot.open}
                  onChange={(v) => updateSlot(i, 'open', v)}
                />
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>to</span>
                <TimeSelect
                  id={`${day}-close-${i}`}
                  value={slot.close}
                  onChange={(v) => updateSlot(i, 'close', v)}
                />
                {slots.length > 1 && (
                  <button
                    onClick={() => removeSlot(i)}
                    className="btn-icon danger"
                    aria-label="Remove time slot"
                    style={{ width: 24, height: 24 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addSlot}
              className="btn btn-xs"
              style={{
                background: 'none', border: 'none', padding: '2px 0',
                color: 'var(--brand)', fontWeight: 600, fontSize: 12,
                cursor: 'pointer', alignSelf: 'flex-start',
              }}
            >
              + Add hours
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OperatingHours({ data, onChange }) {
  const { timezone, mode, schedule, closureMessage } = data;

  const updateSchedule = (index, value) => {
    const updated = schedule.map((s, i) => i === index ? { ...s, ...value } : s);
    onChange({ ...data, schedule: updated });
  };

  return (
    <section>
      <p className="section-title">Operating Hours</p>
      <p className="section-desc" style={{ marginBottom: 20 }}>Set when patients can access this waiting room.</p>

      <div className="form-group" style={{ maxWidth: 340, marginBottom: 20 }}>
        <label htmlFor="timezone" className="form-label">Timezone</label>
        <select
          id="timezone"
          value={timezone}
          onChange={(e) => onChange({ ...data, timezone: e.target.value })}
          className="input"
          style={{ height: 40 }}
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>

      <fieldset style={{ border: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <legend className="form-label" style={{ marginBottom: 8 }}>Room Status</legend>

        <label className="radio-option">
          <input
            type="radio"
            name="hours-mode"
            value="always"
            checked={mode === 'always'}
            onChange={() => onChange({ ...data, mode: 'always' })}
          />
          <div>
            <p className="radio-option-label">Open — All the time</p>
            <p className="radio-option-desc">Patients can join any time of day.</p>
          </div>
        </label>

        <label className="radio-option">
          <input
            type="radio"
            name="hours-mode"
            value="scheduled"
            checked={mode === 'scheduled'}
            onChange={() => onChange({ ...data, mode: 'scheduled' })}
          />
          <div>
            <p className="radio-option-label">Open — According to standard open hours</p>
            <p className="radio-option-desc">Set specific days and times below.</p>
          </div>
        </label>

        <label className="radio-option">
          <input
            type="radio"
            name="hours-mode"
            value="closed"
            checked={mode === 'closed'}
            onChange={() => onChange({ ...data, mode: 'closed' })}
          />
          <div>
            <p className="radio-option-label" style={{ color: 'var(--danger)', fontWeight: 600 }}>Closed Now</p>
            <p className="radio-option-desc">Patients cannot enter until re-opened.</p>
          </div>
        </label>
      </fieldset>

      {mode === 'scheduled' && (
        <div className="hours-grid" style={{ marginTop: 16 }}>
          {schedule.map((s, i) => (
            <DayRow
              key={s.day}
              day={s.day}
              closed={s.closed}
              slots={s.slots}
              onChange={(val) => updateSchedule(i, val)}
            />
          ))}
        </div>
      )}

      {mode === 'closed' && (
        <div style={{ marginTop: 16 }}>
          <div className="alert alert-danger" style={{ marginBottom: 12 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
            </svg>
            <span>Patients cannot enter while the room is closed.</span>
          </div>
          <div className="form-group">
            <label htmlFor="closure-msg" className="form-label">Closure Message</label>
            <textarea
              id="closure-msg"
              value={closureMessage}
              onChange={(e) => onChange({ ...data, closureMessage: e.target.value })}
              placeholder="e.g. Service currently not available. Please check back later."
              className="input"
            />
            <p className="form-hint">Shown to patients when they try to access this room.</p>
          </div>
        </div>
      )}
    </section>
  );
}
