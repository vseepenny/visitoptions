import { useState, useMemo } from 'react';
import WorkflowCustomizer from './WorkflowCustomizer';
import { createStep } from './stepTypes';
import FlowCanvas from './FlowCanvas';
import { FIXTURES, loadFixture } from './workflowFixtures';
import { resolvePatientAccess } from './patientAccess';
import { countSteps } from './flowTree';
import { AddStepPickerModal } from './AddStepModal';
import { insertSteps } from './flowTree';

/* Design sandbox for the workflow editor.
 *
 * Renders the real components — never a fork — so anything improved here is
 * live in Clinic Settings and the visit-option modal immediately. The frames
 * matter: a conditional card asks for 820px, the clinic Intake Flow tab gives
 * it ~784, and the visit-option modal ~850. Iterating only at full width hides
 * exactly the problems worth fixing.
 */

const FRAMES = [
  { id: 'clinic', label: 'Clinic Settings tab', width: 784, note: 'Narrowest real home — conditionals are squeezed here today.' },
  { id: 'modal', label: 'Visit option modal', width: 850, note: 'Where per-visit overrides are edited.' },
  { id: 'full', label: 'Unconstrained', width: null, note: 'No container limit — useful for layout exploration only.' },
];

export default function WorkflowPlayground() {
  const [fixtureId, setFixtureId] = useState('default');
  const [layout, setLayout] = useState('spine'); // spine | hgraph | legacy | compare
  const [frameId, setFrameId] = useState('full');
  const [addTarget, setAddTarget] = useState(null);

  const [state, setState] = useState(() => loadFixture('default'));

  const swapFixture = (id) => {
    setFixtureId(id);
    setState(loadFixture(id));
    setAddTarget(null);
  };

  const reset = () => setState(loadFixture(fixtureId));

  const access = useMemo(() => resolvePatientAccess(state.clinic, null), [state.clinic]);
  const frame = FRAMES.find(f => f.id === frameId);
  const fixture = FIXTURES.find(f => f.id === fixtureId);

  const setWorkflow = (wf) => setState(s => ({ ...s, workflow: wf }));

  const showSpine = layout === 'spine' || layout === 'compare';
  const showHGraph = layout === 'hgraph';
  const showLegacy = layout === 'legacy' || layout === 'compare';

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 24px 80px' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Flow Lab</h1>
          <span className="badge badge-warning" style={{ fontSize: 10 }}>Design sandbox</span>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          The real workflow editor, driven by fixture data. Edits here are throwaway — nothing touches the clinic.
        </p>
      </div>

      {/* Controls */}
      <div className="panel" style={{ padding: 16, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Row label="Fixture">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {FIXTURES.map(f => (
              <button
                key={f.id}
                onClick={() => swapFixture(f.id)}
                title={f.desc}
                className={`btn btn-xs ${fixtureId === f.id ? 'btn-primary' : 'btn-secondary'}`}
              >
                {f.name}
                <span style={{ opacity: 0.65, marginLeft: 5 }}>{countSteps(f.workflow.steps)}</span>
              </button>
            ))}
            <button className="btn btn-ghost btn-xs" onClick={reset} title="Discard sandbox edits">Reset</button>
          </div>
        </Row>
        {fixture?.desc && (
          <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', margin: 0, paddingLeft: 92 }}>{fixture.desc}</p>
        )}

        <Row label="Layout">
          <Segmented
            value={layout}
            onChange={setLayout}
            options={[
              { id: 'spine', label: 'Vertical spine (new)' },
              { id: 'hgraph', label: 'Horizontal graph' },
              { id: 'legacy', label: 'Tabs (shipping)' },
              { id: 'compare', label: 'Compare' },
            ]}
          />
        </Row>

        <Row label="Frame width">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Segmented
              value={frameId}
              onChange={setFrameId}
              options={FRAMES.map(f => ({ id: f.id, label: f.width ? `${f.label} · ${f.width}px` : f.label }))}
            />
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{frame?.note}</span>
          </div>
        </Row>
      </div>

      {/* Canvases */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {showSpine && (
          <Frame title="Vertical spine" width={frame?.width} subtitle="Steps run down, branches spread across. Native scroll for length; every branch visible.">
            <FlowCanvas
              axis="vertical"
              workflow={state.workflow}
              onChange={setWorkflow}
              clinic={state.clinic}
              access={access}
              onAddStep={slot => setAddTarget(slot)}
            />
          </Frame>
        )}

        {showHGraph && (
          <Frame title="Horizontal graph" width={frame?.width} subtitle="Unlimited room for wide branching — but a long flow needs sideways panning.">
            <FlowCanvas
              axis="horizontal"
              workflow={state.workflow}
              onChange={setWorkflow}
              clinic={state.clinic}
              access={access}
              onAddStep={slot => setAddTarget(slot)}
            />
          </Frame>
        )}

        {showLegacy && (
          <Frame title="Branch tabs (shipping today)" width={frame?.width} subtitle="One branch at a time behind tabs; description on every card.">
            <WorkflowCustomizer
              workflow={state.workflow}
              onChange={setWorkflow}
              clinic={state.clinic}
              access={access}
              customTemplates={state.clinic.workflowTemplates || []}
              accessScopeLabel="Patient Access"
            />
          </Frame>
        )}
      </div>

      {addTarget && (
        <AddStepPickerModal
          steps={state.workflow.steps}
          onPick={type => {
            setWorkflow(insertAt(state.workflow, addTarget, type, state.clinic));
            setAddTarget(null);
          }}
          onClose={() => setAddTarget(null)}
        />
      )}
    </div>
  );
}

/* ── Chrome ───────────────────────────────────────────────── */

function Row({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', width: 80, flexShrink: 0, paddingTop: 4 }}>{label}</span>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', background: 'white' }}>
      {options.map((o, i) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          style={{
            padding: '5px 11px', fontSize: 12, fontWeight: value === o.id ? 700 : 500,
            border: 'none', borderLeft: i ? '1px solid var(--border)' : 'none',
            background: value === o.id ? 'var(--brand-50)' : 'white',
            color: value === o.id ? 'var(--brand)' : 'var(--text-secondary)',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >{o.label}</button>
      ))}
    </div>
  );
}

function Frame({ title, subtitle, width, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{subtitle}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)' }}>
          {width ? `${width}px` : 'full width'}
        </span>
      </div>
      <div style={{
        width: width || '100%', maxWidth: '100%',
        border: width ? '1px dashed var(--border-strong)' : 'none',
        borderRadius: width ? 'var(--r-lg)' : 0,
        padding: width ? 12 : 0,
        background: width ? 'var(--grey-50)' : 'transparent',
        boxSizing: 'border-box',
      }}>
        {children}
      </div>
    </div>
  );
}

/* Insert a new step into whichever list the clicked slot belongs to. */
function insertAt(workflow, slot, type, clinic) {
  const step = createStep(type, clinic);
  return {
    ...workflow,
    steps: insertSteps(workflow.steps || [], slot.containerId, slot.branchIndex, slot.index, [step]),
  };
}
