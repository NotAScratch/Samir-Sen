import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Style contract for styles.css + design/tokens.css (v3 "Precision White"):
// tokens only, no depth effects, and the hooks robots/index.js and script.js
// rely on. Reads the files as text; no browser needed.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const tokens = fs.readFileSync(path.join(root, 'design/tokens.css'), 'utf8');

const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '');
const code = stripComments(css);

// Custom properties written at runtime (inline style / robots/index.js), not tokens. Ruling D.
const RUNTIME_VARS = new Set(['--ax', '--ay', '--i']);

// Minimal CSS reader: every block with its prelude, own declarations and enclosing preludes.
function parseRules(src) {
  const out = [];
  const stack = [];
  let buf = '';
  for (const ch of src) {
    if (ch === '{') {
      stack.push({ prelude: buf.trim().replace(/\s+/g, ' '), body: '' });
      buf = '';
    } else if (ch === '}') {
      const rule = stack.pop();
      rule.body += buf;
      rule.parents = stack.map((s) => s.prelude);
      out.push(rule);
      buf = '';
    } else if (ch === ';' && stack.length) {
      stack[stack.length - 1].body += `${buf};`;
      buf = '';
    } else {
      buf += ch;
    }
  }
  assert.equal(stack.length, 0, 'unbalanced braces in styles.css');
  return out;
}
const rules = parseRules(code);
const lineOf = (index) => code.slice(0, index).split('\n').length;
const selectorsOf = (rule) => rule.prelude.split(',').map((s) => s.trim());

test('styles.css has no raw colours, px lengths or durations', () => {
  const banned = [
    ['hex colour', /#[0-9a-fA-F]{3,8}\b/g],
    ['rgb()/rgba()', /rgba?\(/g],
    ['px length', /\d+(\.\d+)?px\b/g],
    ['ms/s duration', /\d+(\.\d+)?m?s\b/g],
  ];
  for (const [what, re] of banned) {
    const hits = [...code.matchAll(re)].map((m) => `${m[0]} (code line ${lineOf(m.index)})`);
    assert.deepEqual(hits, [], `${what} in styles.css: ${hits.join(', ')}`);
  }
});

test('styles.css has no shadows, gradients or backdrop blur', () => {
  assert.doesNotMatch(css, /text-shadow/);
  assert.doesNotMatch(css, /linear-gradient/);
  assert.doesNotMatch(css, /radial-gradient/);
  assert.doesNotMatch(css, /backdrop-filter/);
  for (const m of css.matchAll(/box-shadow\s*:\s*([^;}]*)/g)) {
    assert.equal(m[1].trim(), 'none', `box-shadow other than none: ${m[0]}`);
  }
});

test('every var(--name) in styles.css is defined in design/tokens.css', () => {
  const defined = new Set([...stripComments(tokens).matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  const used = new Set([...code.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]));
  const missing = [...used].filter((name) => !defined.has(name) && !RUNTIME_VARS.has(name));
  assert.deepEqual(missing, [], `undefined tokens: ${missing.join(', ')}`);
});

test('tokens.css: legacy aliases removed, --dur-gait added', () => {
  assert.doesNotMatch(tokens, /LEGACY ALIASES/);
  assert.match(tokens, /--dur-gait\s*:\s*1140ms/);
  for (const legacy of ['--surface', '--text-muted', '--text-xs', '--radius-sm', '--shadow-1', '--ease-spring', '--font-display']) {
    assert.doesNotMatch(tokens, new RegExp(`${legacy}\\s*:`), `${legacy} still defined`);
    assert.doesNotMatch(code, new RegExp(`var\\(${legacy}\\)`), `${legacy} still used`);
  }
});

test('--text-figure token is used for profile facts, contact email and interlude line', () => {
  assert.match(tokens, /--text-figure\s*:\s*clamp\(1\.875rem,\s*3\.1vw,\s*2\.75rem\)/);
  for (const selector of ['.fact-value', '.email-link', '.interlude-line']) {
    const rule = rules.find((r) => r.prelude === selector);
    assert.ok(rule, `${selector} rule is missing`);
    assert.match(rule.body, /font-size:\s*var\(--text-figure\)/, `${selector} must use --text-figure`);
  }
});

test('humanoid callouts adapt to the robot container and stay on one line when constrained', () => {
  const humanoid = rules.find((r) => r.prelude === '.robot--humanoid' && /container-type/.test(r.body));
  assert.ok(humanoid, '.robot--humanoid must establish an inline-size query container');
  assert.match(humanoid.body, /container-type:\s*inline-size/);

  const constrained = rules.filter((r) => r.parents.some((p) => /^@container\b/.test(p)));
  assert.match(tokens, /--bp-callout-compact\s*:\s*28rem/);
  assert.ok(constrained.some((r) => r.parents.includes('@container (max-width: 28rem)')), 'query must use the token threshold');
  assert.ok(constrained.length > 0, 'no callout adaptation uses a container query');
  assert.ok(constrained.some((r) => r.prelude === '.callout[data-anchor="actuation"]' && /display:\s*none/.test(r.body)), 'actuation is not hidden in a constrained robot container');
  assert.ok(constrained.some((r) => r.prelude === '.callout-title' && /white-space:\s*nowrap/.test(r.body)), 'callout titles are not kept on one line');
  assert.ok(constrained.some((r) => r.prelude === '.callout-detail' && /display:\s*none/.test(r.body)), 'callout details are not hidden in the constrained robot container');
});

test('approved mobile and hover corrections are present', () => {
  const viewfinder = rules.find((r) => r.prelude === '.profile-grid .viewfinder' && r.parents.length === 0);
  assert.ok(viewfinder, 'mobile viewfinder rule is missing');
  assert.match(viewfinder.body, /grid-column:\s*1\s*\/\s*-1/);

  const hover = rules.find((r) => r.prelude === '.button-primary:hover');
  assert.ok(hover, 'primary button has no hover state');
  assert.match(hover.body, /border-color:\s*var\(--ink-muted\)/);
  assert.match(hover.body, /background:\s*var\(--ink-muted\)/);
  const credits = rules.find((r) => r.prelude === '.footer-credits');
  assert.ok(credits);
  assert.match(credits.body, /color:\s*var\(--ink-muted\)/);
});

test('--text-hero appears exactly once, in the shared .display-hero rule', () => {
  assert.equal(css.split('--text-hero').length - 1, 1);
  const owners = rules.filter((r) => r.body.includes('--text-hero'));
  assert.equal(owners.length, 1);
  assert.ok(selectorsOf(owners[0]).includes('.display-hero'), `--text-hero set on "${owners[0].prelude}"`);
});

test('the accent is only used for status dots', () => {
  const owners = rules.filter((r) => r.body.includes('var(--accent)'));
  assert.ok(owners.length > 0, 'no status dot styled');
  for (const rule of owners) {
    assert.ok(selectorsOf(rule).every((s) => /\.status-dot$/.test(s)), `accent used on "${rule.prelude}"`);
  }
  const diagram = rules.filter((r) => /diagram-accent/.test(r.prelude));
  assert.ok(diagram.length > 0, 'diagram-accent classes not restyled');
  for (const rule of diagram) assert.match(rule.body, /var\(--ink\)/, `${rule.prelude} must render in ink`);
});

test('media queries use the single 48rem breakpoint', () => {
  const sized = rules.filter((r) => r.prelude.startsWith('@media') && /width/.test(r.prelude));
  assert.ok(sized.length > 0);
  for (const rule of sized) assert.match(rule.prelude, /\b48rem\b/, rule.prelude);
});

test('robot containers: poster aspect ratios, canvas overlay, live and failed states', () => {
  const posters = { humanoid: [1208, 1800], bust: [1072, 1200], quadruped: [1836, 1233], arm: [1200, 1400], hand: [2120, 1422], waver: [720, 900] };
  for (const [name, [w, h]] of Object.entries(posters)) {
    const rule = rules.find((r) => r.prelude === `.robot--${name}` && /aspect-ratio/.test(r.body));
    assert.ok(rule, `.robot--${name} has no aspect-ratio`);
    assert.match(rule.body, new RegExp(`aspect-ratio:\\s*${w}\\s*/\\s*${h}\\s*;`), `.robot--${name} aspect-ratio`);
  }
  const base = rules.find((r) => r.prelude === '.robot');
  assert.match(base.body, /position:\s*relative/);
  const canvas = rules.find((r) => r.prelude === '.robot > canvas');
  assert.ok(canvas, 'no .robot > canvas rule');
  for (const decl of [/position:\s*absolute/, /inset:\s*0/, /width:\s*100%/, /height:\s*100%/, /opacity:\s*0/, /var\(--dur-base\)/]) {
    assert.match(canvas.body, decl);
  }
  assert.ok(rules.some((r) => r.prelude === '.robot.is-live > canvas' && /opacity:\s*1/.test(r.body)));
  assert.ok(rules.some((r) => r.prelude === '.robot.is-live > .robot-poster' && /visibility:\s*hidden/.test(r.body)));
  assert.ok(rules.some((r) => r.prelude === '.robot.is-failed > canvas' && /display:\s*none/.test(r.body)));
  assert.ok(rules.some((r) => r.prelude === '.robot.is-failed > .robot-poster' && /visibility:\s*visible/.test(r.body)));
});

test('hero callouts sit on their anchors above the canvas', () => {
  const callout = rules.find((r) => r.prelude === '.callout');
  assert.ok(callout);
  assert.match(callout.body, /position:\s*absolute/);
  assert.match(callout.body, /left:\s*var\(--ax\)/);
  assert.match(callout.body, /top:\s*var\(--ay\)/);
  assert.match(callout.body, /z-index:\s*[1-9]/);
  const hidden = rules.find((r) => r.prelude === '.callout[data-anchor="actuation"]' && /display:\s*none/.test(r.body) && r.parents.some((p) => /\(width < 48rem\)/.test(p)));
  assert.ok(hidden && hidden.parents.some((p) => /\(width < 48rem\)/.test(p)), 'actuation callout not hidden below 48rem');
});

test('reveal is gated on scripting and motion preference', () => {
  const gate = '@media (scripting: enabled) and (prefers-reduced-motion: no-preference)';
  const hiding = rules.filter((r) => selectorsOf(r).includes('.reveal') && /opacity:\s*0/.test(r.body));
  assert.ok(hiding.length > 0, 'no .reveal initial state');
  for (const rule of hiding) assert.ok(rule.parents.includes(gate), '.reveal hidden outside the scripting/motion gate');
  const shown = rules.find((r) => r.prelude === '.reveal.is-in');
  assert.ok(shown && shown.parents.includes(gate) && /opacity:\s*1/.test(shown.body));
  const reveal = hiding[0];
  assert.match(reveal.body, /var\(--reveal-distance\)/);
  assert.match(reveal.body, /var\(--dur-reveal\)/);
  assert.match(reveal.body, /calc\(var\(--i, 0\) \* var\(--stagger\)\)/);
});

test('interlude track walks only while walking, never under reduced motion', () => {
  const track = rules.find((r) => r.prelude === '.interlude-track line');
  assert.ok(track && /vector-effect:\s*non-scaling-stroke/.test(track.body), 'track line needs non-scaling-stroke');
  const animated = rules.filter((r) => /animation(-name)?\s*:/.test(r.body) && /interlude-track/.test(r.prelude));
  assert.ok(animated.length > 0, 'track has no animation');
  for (const rule of animated) {
    assert.ok(rule.parents.includes('@media (prefers-reduced-motion: no-preference)'), `${rule.prelude} animates outside no-preference`);
    assert.match(rule.body, /var\(--dur-gait\)/);
    assert.match(rule.body, /linear/);
    assert.match(rule.body, /infinite/);
    assert.match(rule.body, /paused/);
  }
  const running = rules.find((r) => r.prelude === '.interlude.is-walking .interlude-track line');
  assert.ok(running && /animation-play-state:\s*running/.test(running.body));
  const keyframes = rules.find((r) => /^@keyframes\b/.test(r.parents.at(-1) ?? '') && /stroke-dashoffset:\s*var\(--walk-distance\)/.test(r.body));
  assert.ok(keyframes, 'keyframes must move the dash offset by --walk-distance');
});

test('shared accessibility hooks are styled', () => {
  assert.ok(rules.some((r) => r.prelude === '.visually-hidden' && /clip/.test(r.body)));
  assert.ok(rules.some((r) => /\.skip-link:focus/.test(r.prelude)));
  const focus = rules.find((r) => selectorsOf(r).includes(':focus-visible'));
  assert.ok(focus, 'no global :focus-visible rule');
  assert.match(focus.body, /outline:\s*var\(--focus-ring\)/);
  assert.match(focus.body, /outline-offset:\s*var\(--focus-offset\)/);
  assert.ok(rules.some((r) => r.prelude === 'body.menu-open #menu'), 'no open-menu state');
});
