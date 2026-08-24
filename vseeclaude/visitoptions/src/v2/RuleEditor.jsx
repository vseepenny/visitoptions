import { useState } from 'react';
import { parseRule, unparseRule, formatRule, ruleVariables } from './ruleExpr';

/* ── Lo-code rule editor ──────────────────────────────────── */
// The expression is what the admin authors; the JSON tree beside it is what
// gets stored and exported. Both stay in sync, and JSON can be pasted back in.

export function VariablePalette({ variables, onPick }) {
  const [open, setOpen] = useState(false);
  if (!variables.length) return null;
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', padding: 0, fontSize: 11, fontWeight: 600, color: 'var(--brand)', cursor: 'pointer' }}
      >
        {open ? 'Hide' : 'Show'} available variables ({variables.length})
      </button>
      {open && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {variables.map(v => (
            <button
              key={v.path}
              title={`${v.label}${v.values ? ` — ${v.values.join(', ')}` : ` (${v.kind})`}`}
              onClick={() => onPick(v)}
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 10.5, padding: '2px 7px', borderRadius: 'var(--r-full)',
                border: '1px solid var(--border)', background: 'white',
                color: 'var(--text-secondary)', cursor: 'pointer',
              }}
            >{v.path}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export function RuleEditor({ branch, variables, onChange }) {
  const [showJson, setShowJson] = useState(false);
  const [pasting, setPasting] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState(null);

  const parsed = parseRule(branch.expr || '');
  const known = new Set(variables.map(v => v.path));
  const used = parsed.ok ? [...ruleVariables(parsed.rule)] : [];
  const unknownVars = used.filter(v => !known.has(v));

  const setExpr = (expr) => {
    const r = parseRule(expr);
    onChange({ ...branch, expr, rule: r.ok ? r.rule : null });
  };

  const applyPaste = () => {
    try {
      const json = JSON.parse(pasteText);
      const expr = unparseRule(json);
      const check = parseRule(expr);
      if (!check.ok) throw new Error('That JSON does not describe a rule this editor can read.');
      onChange({ ...branch, expr, rule: check.rule });
      setPasting(false); setPasteText(''); setPasteError(null);
    } catch (e) {
      setPasteError(e.message || 'Not valid JSON');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Run this branch when</label>
        <span style={{ flex: 1 }} />
        <button
          onClick={() => setShowJson(j => !j)}
          style={{ background: 'none', border: 'none', padding: 0, fontSize: 11, fontWeight: 600, color: 'var(--brand)', cursor: 'pointer' }}
        >{showJson ? 'Hide JSON' : 'View JSON'}</button>
        <span style={{ color: 'var(--grey-300)' }}>·</span>
        <button
          onClick={() => { setPasting(p => !p); setPasteError(null); }}
          style={{ background: 'none', border: 'none', padding: 0, fontSize: 11, fontWeight: 600, color: 'var(--brand)', cursor: 'pointer' }}
        >Paste JSON</button>
      </div>

      <textarea
        value={branch.expr || ''}
        onChange={e => setExpr(e.target.value)}
        rows={2}
        spellCheck={false}
        placeholder={'e.g. form.intake_form.pain_level >= 7 and patient.type != "insurance"'}
        className="input"
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 12, lineHeight: 1.5, padding: '8px 10px', height: 'auto', resize: 'vertical',
          borderColor: parsed.error ? 'var(--danger, #DC2626)' : undefined,
        }}
      />

      {parsed.error && (
        <p style={{ fontSize: 11, color: '#B91C1C', margin: 0 }}>
          {parsed.error.message} — at character {parsed.error.at + 1}
        </p>
      )}
      {parsed.empty && (
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>
          No rule yet, so this branch never runs. Everyone falls through to the next one.
        </p>
      )}
      {parsed.ok && unknownVars.length > 0 && (
        <p style={{ fontSize: 11, color: '#92400E', margin: 0 }}>
          Not available at this point in the flow: <strong>{unknownVars.join(', ')}</strong>. This branch will never match.
        </p>
      )}
      {parsed.ok && unknownVars.length === 0 && (
        <p style={{ fontSize: 11, color: 'var(--success)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
          Valid{used.length ? ` — tests ${used.length} variable${used.length !== 1 ? 's' : ''}` : ''}
        </p>
      )}

      <VariablePalette
        variables={variables}
        onPick={v => setExpr(`${branch.expr || ''}${branch.expr && !/\s$/.test(branch.expr) ? ' ' : ''}${v.path}`)}
      />

      {showJson && (
        <pre style={{
          margin: 0, padding: '10px 12px', background: 'var(--grey-900, #111827)', color: '#E5E7EB',
          borderRadius: 'var(--r-md)', fontSize: 11, lineHeight: 1.5, overflowX: 'auto',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}>{parsed.ok ? formatRule(parsed.rule) : '// fix the expression above to see its JSON'}</pre>
      )}

      {pasting && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            rows={4}
            spellCheck={false}
            placeholder={'{"and":[{">=":[{"var":"patient.age"},18]}]}'}
            className="input"
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11, height: 'auto', resize: 'vertical' }}
          />
          {pasteError && <p style={{ fontSize: 11, color: '#B91C1C', margin: 0 }}>{pasteError}</p>}
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-primary btn-xs" onClick={applyPaste} disabled={!pasteText.trim()}>Replace rule</button>
            <button className="btn btn-ghost btn-xs" onClick={() => { setPasting(false); setPasteError(null); }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
