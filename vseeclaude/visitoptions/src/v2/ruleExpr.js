/* A small expression language for lo-code branch rules.
 *
 * Admins type an expression; it is stored and shown as a JSON rule tree so it
 * can be exported, versioned and evaluated by a backend later. Parsing is a
 * hand-written recursive-descent parser — deliberately NOT eval(), which would
 * hand arbitrary JS execution to whoever can edit a workflow.
 *
 *   form.intake_form.pain_level >= 7 and patient.type != "insurance"
 *   (insurance.status == "not_eligible" or patient.type == "self-pay") and visit.mode == "Video"
 *   auth.method in ["guest", "sso"]
 *
 * Grammar (lowest to highest precedence):
 *   or   := and (('or' | '||') and)*
 *   and  := not (('and' | '&&') not)*
 *   not  := ('not' | '!') not | cmp
 *   cmp  := unary (OP unary)?        OP: == != >= <= > < in contains
 *   unary:= '(' or ')' | list | literal | path
 */

const OPERATORS = ['==', '!=', '>=', '<=', '>', '<', 'in', 'contains'];

/* ── Tokenizer ────────────────────────────────────────────── */

function tokenize(src) {
  const tokens = [];
  let i = 0;
  const s = String(src);

  while (i < s.length) {
    const c = s[i];

    if (/\s/.test(c)) { i++; continue; }

    if (c === '(' || c === ')' || c === '[' || c === ']' || c === ',') {
      tokens.push({ type: c, at: i }); i++; continue;
    }

    // Two-character operators first so '>=' doesn't read as '>'
    const two = s.slice(i, i + 2);
    if (['==', '!=', '>=', '<=', '&&', '||'].includes(two)) {
      tokens.push({ type: 'op', value: two, at: i }); i += 2; continue;
    }
    if (c === '>' || c === '<') { tokens.push({ type: 'op', value: c, at: i }); i++; continue; }
    if (c === '!') { tokens.push({ type: 'op', value: '!', at: i }); i++; continue; }
    if (c === '=') {
      // A single '=' is a near-certain typo for '=='; say so rather than
      // failing with a confusing "unexpected character".
      throw { message: 'Use == to compare (a single = is not a comparison)', at: i };
    }

    if (c === '"' || c === "'") {
      const quote = c;
      let j = i + 1, out = '';
      while (j < s.length && s[j] !== quote) {
        if (s[j] === '\\' && j + 1 < s.length) { out += s[j + 1]; j += 2; continue; }
        out += s[j]; j++;
      }
      if (j >= s.length) throw { message: 'Unclosed string', at: i };
      tokens.push({ type: 'string', value: out, at: i });
      i = j + 1; continue;
    }

    if (/[0-9]/.test(c) || (c === '-' && /[0-9]/.test(s[i + 1] || ''))) {
      let j = i + 1;
      while (j < s.length && /[0-9._]/.test(s[j])) j++;
      const raw = s.slice(i, j).replace(/_/g, '');
      const num = Number(raw);
      if (Number.isNaN(num)) throw { message: `“${raw}” is not a number`, at: i };
      tokens.push({ type: 'number', value: num, at: i });
      i = j; continue;
    }

    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < s.length && /[A-Za-z0-9_.]/.test(s[j])) j++;
      const word = s.slice(i, j);
      const lower = word.toLowerCase();
      if (['and', 'or', 'not', 'in', 'contains'].includes(lower)) {
        tokens.push({ type: lower === 'in' || lower === 'contains' ? 'op' : lower, value: lower, at: i });
      } else if (lower === 'true' || lower === 'false') {
        tokens.push({ type: 'boolean', value: lower === 'true', at: i });
      } else if (lower === 'null') {
        tokens.push({ type: 'null', value: null, at: i });
      } else {
        tokens.push({ type: 'path', value: word, at: i });
      }
      i = j; continue;
    }

    throw { message: `Unexpected character “${c}”`, at: i };
  }

  tokens.push({ type: 'eof', at: s.length });
  return tokens;
}

/* ── Parser ───────────────────────────────────────────────── */

function parseTokens(tokens) {
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  const expect = (type, what) => {
    if (peek().type !== type) throw { message: `Expected ${what}`, at: peek().at };
    return next();
  };

  function parseOr() {
    let left = parseAnd();
    const parts = [left];
    while (peek().type === 'or' || (peek().type === 'op' && peek().value === '||')) {
      next();
      parts.push(parseAnd());
    }
    return parts.length === 1 ? left : { or: parts };
  }

  function parseAnd() {
    let left = parseNot();
    const parts = [left];
    while (peek().type === 'and' || (peek().type === 'op' && peek().value === '&&')) {
      next();
      parts.push(parseNot());
    }
    return parts.length === 1 ? left : { and: parts };
  }

  function parseNot() {
    if (peek().type === 'not' || (peek().type === 'op' && peek().value === '!')) {
      next();
      return { '!': parseNot() };
    }
    return parseCmp();
  }

  function parseCmp() {
    const left = parseUnary();
    const t = peek();
    if (t.type === 'op' && OPERATORS.includes(t.value)) {
      next();
      const right = parseUnary();
      return { [t.value]: [left, right] };
    }
    return left;
  }

  function parseUnary() {
    const t = peek();

    if (t.type === '(') {
      next();
      const inner = parseOr();
      expect(')', 'a closing )');
      return inner;
    }

    if (t.type === '[') {
      next();
      const items = [];
      if (peek().type !== ']') {
        items.push(parseUnary());
        while (peek().type === ',') { next(); items.push(parseUnary()); }
      }
      expect(']', 'a closing ]');
      return items;
    }

    if (t.type === 'string' || t.type === 'number' || t.type === 'boolean' || t.type === 'null') {
      next();
      return t.value;
    }

    if (t.type === 'path') {
      next();
      return { var: t.value };
    }

    throw { message: t.type === 'eof' ? 'Expression is incomplete' : 'Expected a value, variable or (', at: t.at };
  }

  const ast = parseOr();
  if (peek().type !== 'eof') throw { message: 'Unexpected extra input', at: peek().at };
  return ast;
}

/* Parse an expression. Never throws — returns { ok, rule, error }. */
export function parseRule(src) {
  const text = String(src ?? '').trim();
  if (!text) return { ok: false, rule: null, error: null, empty: true };
  try {
    return { ok: true, rule: parseTokens(tokenize(text)), error: null };
  } catch (e) {
    return { ok: false, rule: null, error: { message: e.message || 'Could not parse this expression', at: e.at ?? 0 } };
  }
}

/* ── Variables referenced ─────────────────────────────────── */

export function ruleVariables(rule, out = new Set()) {
  if (rule === null || rule === undefined) return out;
  if (Array.isArray(rule)) { rule.forEach(r => ruleVariables(r, out)); return out; }
  if (typeof rule !== 'object') return out;
  if (typeof rule.var === 'string') { out.add(rule.var); return out; }
  for (const key of Object.keys(rule)) ruleVariables(rule[key], out);
  return out;
}

/* ── JSON → expression text ───────────────────────────────── */
// Used when a rule tree arrives as pasted JSON and needs an editable form.

const PRECEDENCE = { or: 1, and: 2, '!': 3 };

export function unparseRule(rule, parentPrec = 0) {
  if (rule === null) return 'null';
  if (Array.isArray(rule)) return `[${rule.map(r => unparseRule(r)).join(', ')}]`;
  if (typeof rule === 'string') return JSON.stringify(rule);
  if (typeof rule === 'number' || typeof rule === 'boolean') return String(rule);
  if (typeof rule !== 'object') return String(rule);

  if (typeof rule.var === 'string') return rule.var;

  const key = Object.keys(rule)[0];
  const val = rule[key];

  if (key === 'and' || key === 'or') {
    const parts = (Array.isArray(val) ? val : [val]).map(v => unparseRule(v, PRECEDENCE[key]));
    const joined = parts.join(` ${key} `);
    return PRECEDENCE[key] < parentPrec ? `(${joined})` : joined;
  }
  if (key === '!') {
    return `not ${unparseRule(val, PRECEDENCE['!'])}`;
  }
  if (OPERATORS.includes(key)) {
    const [a, b] = Array.isArray(val) ? val : [val, undefined];
    return `${unparseRule(a, 4)} ${key} ${unparseRule(b, 4)}`;
  }
  return JSON.stringify(rule);
}

/* ── Evaluation ───────────────────────────────────────────── */

function lookup(path, ctx) {
  return String(path).split('.').reduce((o, k) => (o == null ? undefined : o[k]), ctx);
}

const UNSET = Symbol('unset');

/* Evaluate a rule against a context.
   Returns { value, unknown: [paths] } — a rule that leans on a variable the
   context has no value for is reported rather than quietly treated as false. */
export function evalRule(rule, ctx) {
  const unknown = [];

  const walk = (node) => {
    if (node === null || typeof node === 'number' || typeof node === 'boolean' || typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(walk);
    if (typeof node !== 'object') return node;

    if (typeof node.var === 'string') {
      const v = lookup(node.var, ctx);
      if (v === undefined) { unknown.push(node.var); return UNSET; }
      return v;
    }

    const key = Object.keys(node)[0];
    const val = node[key];

    if (key === 'and') return (Array.isArray(val) ? val : [val]).reduce((acc, n) => {
      const r = walk(n);
      if (acc === UNSET || r === UNSET) return UNSET;
      return acc && truthy(r);
    }, true);

    if (key === 'or') return (Array.isArray(val) ? val : [val]).reduce((acc, n) => {
      const r = walk(n);
      if (acc === UNSET || r === UNSET) return UNSET;
      return acc || truthy(r);
    }, false);

    if (key === '!') {
      const r = walk(val);
      return r === UNSET ? UNSET : !truthy(r);
    }

    if (OPERATORS.includes(key)) {
      const [aNode, bNode] = Array.isArray(val) ? val : [val, undefined];
      const a = walk(aNode);
      const b = walk(bNode);
      if (a === UNSET || b === UNSET) return UNSET;
      return compare(key, a, b);
    }

    return UNSET;
  };

  const truthy = (v) => !!v;

  const compare = (op, a, b) => {
    switch (op) {
      case '==': return looseEq(a, b);
      case '!=': return !looseEq(a, b);
      case '>':  return Number(a) > Number(b);
      case '<':  return Number(a) < Number(b);
      case '>=': return Number(a) >= Number(b);
      case '<=': return Number(a) <= Number(b);
      case 'in': return Array.isArray(b) ? b.some(x => looseEq(x, a)) : String(b ?? '').includes(String(a));
      case 'contains': return Array.isArray(a) ? a.some(x => looseEq(x, b)) : String(a ?? '').toLowerCase().includes(String(b ?? '').toLowerCase());
      default: return false;
    }
  };

  const looseEq = (a, b) => {
    if (typeof a === 'string' && typeof b === 'string') return a.toLowerCase() === b.toLowerCase();
    return a === b;
  };

  const result = walk(rule);
  return { value: result === UNSET ? null : !!result, unknown: [...new Set(unknown)] };
}

/* Pretty-print a rule tree for the JSON panel. */
export function formatRule(rule) {
  return JSON.stringify(rule, null, 2);
}
