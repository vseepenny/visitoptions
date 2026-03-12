import { useState } from 'react';
import { NOTES_PRESETS } from '../data/initialData';
import PaymentSettings from './PaymentSettings';

export default function RoomVisitDefaults({ intakeFields, notesTemplate, onIntakeChange, onNotesChange, enabledTypes, paymentConfig, onPaymentChange }) {
  const [activeTab, setActiveTab] = useState('payment');

  const setIntakeField = (id, patch) =>
    onIntakeChange(intakeFields.map((f) => f.id === id ? { ...f, ...patch } : f));

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p className="section-title">Visit Defaults</p>
          <p className="section-desc">Default payment, intake flow, and notes template for all visit options. Individual visit options can inherit or override these.</p>
        </div>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
        {/* Sub-tabs */}
        <div className="tabs" style={{ padding: '0 20px', background: 'var(--grey-100)', borderBottom: '1px solid var(--border)' }}>
          {[{ id: 'payment', label: 'Payment' }, { id: 'intake', label: 'Intake Flow' }, { id: 'notes', label: 'Visit Notes' }].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tab-item${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 20 }}>
          {activeTab === 'payment' && (
            <PaymentSettings
              enabledTypes={enabledTypes}
              config={paymentConfig}
              onChange={onPaymentChange}
              noHeader
            />
          )}

          {activeTab === 'intake' && (
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                The intake flow patients go through before a visit. Visit options can inherit or override this.
              </p>
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                {intakeFields.map((field, i, arr) => (
                  <div
                    key={field.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', gap: 12,
                      borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                      background: field.enabled ? 'var(--surface)' : 'var(--grey-50)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        role="switch"
                        aria-checked={field.enabled}
                        onClick={() => setIntakeField(field.id, { enabled: !field.enabled })}
                        className={`toggle${field.enabled ? ' on' : ''}`}
                        aria-label={`Toggle ${field.label}`}
                      >
                        <span className="toggle-track"><span className="toggle-thumb" /></span>
                      </button>
                      <span style={{ fontSize: 13, fontWeight: 500, color: field.enabled ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                        {field.label}
                      </span>
                    </div>
                    {field.enabled && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={() => setIntakeField(field.id, { required: !field.required })}
                        />
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Required</span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Default notes template pre-populated when a visit begins. Visit options can inherit or override this.
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {[
                  { key: 'soap', label: 'SOAP' },
                  { key: 'progress', label: 'Progress Note' },
                  { key: 'blank', label: 'Blank' },
                ].map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => onNotesChange(NOTES_PRESETS[preset.key])}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <textarea
                value={notesTemplate}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Enter your default visit notes template…"
                className="input"
                style={{ width: '100%', minHeight: 200, resize: 'vertical', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6, padding: '10px 12px' }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
