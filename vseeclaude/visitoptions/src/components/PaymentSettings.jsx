import { useState } from 'react';
import { PATIENT_TYPES } from './PatientTypes';

/* ── helpers ────────────────────────────────────────────── */

function Toggle({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`toggle${checked ? ' on' : ''}`}
    >
      <span className="toggle-track"><span className="toggle-thumb" /></span>
    </button>
  );
}

function SegmentControl({ value, options, onChange }) {
  return (
    <div className="segment">
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`segment-btn${value === opt.value ? ' active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}


function PaymentRow({ label, description, right }) {
  return (
    <div className="payment-row">
      <div className="payment-row-info">
        <span className="payment-row-label">{label}</span>
        {description && <span className="payment-row-desc">{description}</span>}
      </div>
      {right}
    </div>
  );
}

function StripeStatus({ connected }) {
  return connected ? (
    <span className="badge badge-success" style={{ gap: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
      Stripe Connected
    </span>
  ) : (
    <span className="badge badge-neutral" style={{ gap: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--grey-500)', display: 'inline-block' }} />
      Not configured
    </span>
  );
}

/* ── Panel tabs ─────────────────────────────────────────── */

function SelfPayPanel({ config, onChange }) {
  const set = (field, value) => onChange({ ...config, [field]: value });

  return (
    <div className="payment-panel-body">
      <PaymentRow
        label="Accept Payments"
        description="Collect payment from self-pay patients at time of booking."
        right={
          <Toggle
            checked={config.acceptPayments}
            onChange={() => set('acceptPayments', !config.acceptPayments)}
            label="Accept payments toggle"
          />
        }
      />

      {config.acceptPayments && (
        <div className="form-group">
          <label className="form-label">Payment Processor</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <SegmentControl
              value={config.processor}
              options={[
                { value: 'stripe', label: 'Stripe' },
                { value: 'manual', label: 'Manual' },
              ]}
              onChange={(v) => set('processor', v)}
            />
            {config.processor === 'stripe' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StripeStatus connected={config.stripeConnected} />
                {!config.stripeConnected && (
                  <button
                    className="btn btn-secondary btn-xs"
                    onClick={() => set('stripeConnected', true)}
                  >
                    Connect Stripe
                  </button>
                )}
              </div>
            )}
          </div>
          {config.processor === 'manual' && (
            <p className="form-hint">
              Payments are collected outside VSee (cash, check, etc.). No online billing.
            </p>
          )}
        </div>
      )}

      {!config.acceptPayments && (
        <div className="alert alert-info">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" />
          </svg>
          <span style={{ fontSize: 13 }}>
            Self-pay patients can join without payment. Enable to collect fees at booking.
          </span>
        </div>
      )}
    </div>
  );
}

function GroupCoveredPanel({ config, onChange }) {
  const set = (field, value) => onChange({ ...config, [field]: value });

  return (
    <div className="payment-panel-body">
      <PaymentRow
        label="Require Group ID"
        description="Patient must provide their employer/group ID at check-in."
        right={
          <Toggle
            checked={config.requireGroupId}
            onChange={() => set('requireGroupId', !config.requireGroupId)}
            label="Require group ID"
          />
        }
      />
      <PaymentRow
        label="Require Referral"
        description="Patient must have a referral from their primary care provider."
        right={
          <Toggle
            checked={config.requireReferral}
            onChange={() => set('requireReferral', !config.requireReferral)}
            label="Require referral"
          />
        }
      />
      <div className="form-group">
        <label className="form-label">Verification-Based Access</label>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
          Control whether patients can book based on their group ID verification outcome.{' '}
          <span style={{ color: 'var(--text-tertiary)' }}>Review = patient can book but requires staff approval. Payment amounts are configured per visit option.</span>
        </p>
        <StatusAccessTable
          statuses={GROUP_STATUSES}
          config={config.verificationAccess}
          onChangeConfig={(v) => set('verificationAccess', v)}
        />
      </div>
    </div>
  );
}

const ELIGIBILITY_STATUSES = [
  { id: 'eligible',     label: 'Eligible',       dot: 'var(--success)' },
  { id: 'not_eligible', label: 'Not Eligible',    dot: 'var(--danger)' },
  { id: 'pending',      label: 'Pending',         dot: 'var(--warning)' },
  { id: 'error',        label: 'Error / Unknown', dot: 'var(--grey-400)' },
];

const GROUP_STATUSES = [
  { id: 'verified',     label: 'Verified',       dot: 'var(--success)' },
  { id: 'not_verified', label: 'Not Verified',    dot: 'var(--danger)' },
  { id: 'pending',      label: 'Pending',         dot: 'var(--warning)' },
  { id: 'error',        label: 'Error / Unknown', dot: 'var(--grey-400)' },
];

const ACCESS_OPTIONS = [
  { value: 'allow',  label: 'Allow' },
  { value: 'block',  label: 'Block' },
  { value: 'review', label: 'Review' },
];

function StatusAccessTable({ statuses, config, onChangeConfig }) {
  const setAccess = (id, access) =>
    onChangeConfig({ ...config, [id]: { ...(config?.[id] ?? {}), access } });

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
      {statuses.map((status, i) => {
        const access = config?.[status.id]?.access ?? 'allow';
        const blocked = access === 'block';
        return (
          <div key={status.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', gap: 12, borderBottom: i < statuses.length - 1 ? '1px solid var(--border)' : 'none', background: blocked ? 'var(--grey-50)' : 'var(--surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: status.dot, flexShrink: 0, display: 'inline-block' }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: blocked ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{status.label}</span>
            </div>
            <SegmentControl
              value={access}
              options={ACCESS_OPTIONS}
              onChange={(v) => setAccess(status.id, v)}
            />
          </div>
        );
      })}
    </div>
  );
}

function InsurancePanel({ config, onChange }) {
  const set = (field, value) => onChange({ ...config, [field]: value });
  return (
    <div className="payment-panel-body">
      <div className="form-group">
        <label className="form-label">Eligibility-Based Access</label>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
          Control whether patients can book based on their insurance eligibility status.{' '}
          <span style={{ color: 'var(--text-tertiary)' }}>Review = patient can book but requires staff approval. Payment amounts are configured per visit option.</span>
        </p>
        <StatusAccessTable
          statuses={ELIGIBILITY_STATUSES}
          config={config.eligibilityAccess}
          onChangeConfig={(v) => set('eligibilityAccess', v)}
        />
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────── */

const TAB_META = {
  'self-pay':      { label: 'Self-Pay',      color: 'var(--info)' },
  'group-covered': { label: 'Group-Covered', color: 'var(--text-secondary)' },
  'insurance':     { label: 'Insurance',     color: 'var(--success)' },
};

export default function PaymentSettings({ enabledTypes, config, onChange, noHeader }) {
  const activeTabs = PATIENT_TYPES.filter((pt) => enabledTypes.includes(pt.id));
  const [activeTab, setActiveTab] = useState(activeTabs[0]?.id ?? null);

  // If active tab was removed, fall back to first available
  const currentTab = activeTabs.find((t) => t.id === activeTab) ? activeTab : activeTabs[0]?.id;

  const setTabConfig = (id, value) => onChange({ ...config, [id]: value });

  if (activeTabs.length === 0) {
    return (
      <section>
        {!noHeader && <p className="section-title">Payment Settings</p>}
        <div className="alert alert-warning" style={{ marginTop: noHeader ? 0 : 12 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span style={{ fontSize: 13 }}>
            Enable at least one patient type above to configure payment settings.
          </span>
        </div>
      </section>
    );
  }

  return (
    <section>
      {!noHeader && (
        <>
          <p className="section-title">Payment Settings</p>
          <p className="section-desc" style={{ marginBottom: 16 }}>
            Configure how payments are collected for each patient type. Prices can be overridden per visit option.
          </p>
        </>
      )}

      <div className="payment-panel">
        {/* Tabs */}
        <div className="tabs" style={{ padding: '0 4px' }}>
          {activeTabs.map((pt) => (
            <button
              key={pt.id}
              className={`tab-item${currentTab === pt.id ? ' active' : ''}`}
              onClick={() => setActiveTab(pt.id)}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: TAB_META[pt.id].color }}>{pt.icon}</span>
                {pt.label}
              </span>
            </button>
          ))}
        </div>

        {/* Panel body */}
        {currentTab === 'self-pay' && (
          <SelfPayPanel
            config={config['self-pay']}
            onChange={(v) => setTabConfig('self-pay', v)}
          />
        )}
        {currentTab === 'group-covered' && (
          <GroupCoveredPanel
            config={config['group-covered']}
            onChange={(v) => setTabConfig('group-covered', v)}
          />
        )}
        {currentTab === 'insurance' && (
          <InsurancePanel
            config={config['insurance']}
            onChange={(v) => setTabConfig('insurance', v)}
          />
        )}
      </div>
    </section>
  );
}
