import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Style contract for styles.css + design/tokens.css (v5 "Field Edition"):
// tokens only, no depth effects, one signal colour used where it means
// something, and the hooks robots/index.js and script.js rely on. Reads the
// files as text; no browser needed.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const tokens = fs.readFileSync(path.join(root, 'design/tokens.css'), 'utf8');

const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '');
const code = stripComments(css);

// Custom properties written at runtime (inline style / robots/index.js), not tokens.
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
const NO_PREF = '@media (prefers-reduced-motion: no-preference)';

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

test('lengths outside media/container queries come from tokens', () => {
  const hits = rules
    .filter((r) => !/^@/.test(r.prelude))
    .flatMap((r) => [...r.body.matchAll(/(?<![\w-])\d*\.?\d+(rem|ch|vw|vh)\b/g)].map((m) => `${r.prelude}: ${m[0]}`));
  assert.deepEqual(hits, [], `invented lengths: ${hits.join(', ')}`);
});

test('styles.css has no shadows, gradients or backdrop blur', () => {
  assert.doesNotMatch(css, /text-shadow/);
  assert.doesNotMatch(css, /gradient\(/);
  assert.doesNotMatch(css, /backdrop-filter/);
  assert.doesNotMatch(css, /box-shadow/);
  assert.doesNotMatch(css, /border-radius:\s*(?!\s)(?!var\(--radius\)|50%)/, 'only --radius (0) and round dots');
});

test('every var(--name) in styles.css is defined in design/tokens.css', () => {
  const defined = new Set([...stripComments(tokens).matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  const used = new Set([...code.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]));
  const missing = [...used].filter((name) => !defined.has(name) && !RUNTIME_VARS.has(name));
  assert.deepEqual(missing, [], `undefined tokens: ${missing.join(', ')}`);
});

// WCAG 2 relative luminance / contrast ratio for #RRGGBB.
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const tokenValue = (name) => stripComments(tokens).match(new RegExp(`${name}\\s*:\\s*([^;]+);`))?.[1].trim();

test('tokens.css: v5 palette and contrast floors', () => {
  const palette = {
    '--paper': '#F1EDE4', '--paper-deep': '#E6E0D3', '--ink': '#0F0E0C', '--ink-muted': '#45423C',
    '--ink-faint': '#625E55', '--signal': '#E8380C', '--on-ink-muted': '#B9B3A6',
  };
  for (const [name, hex] of Object.entries(palette)) assert.equal(tokenValue(name), hex, name);
  assert.equal(tokenValue('--on-ink'), 'var(--paper)');
  assert.equal(tokenValue('--on-signal'), 'var(--ink)');

  const c = (fg, bg) => contrast(palette[fg], palette[bg]);
  assert.ok(c('--ink-muted', '--paper') >= 4.5, 'body on paper');
  assert.ok(c('--ink-muted', '--paper-deep') >= 4.5, 'body on deep paper');
  assert.ok(c('--ink-faint', '--paper') >= 4.5, 'labels on paper');
  assert.ok(c('--ink-faint', '--paper-deep') >= 4.5, 'labels on deep paper');
  assert.ok(c('--on-ink-muted', '--ink') >= 4.5, 'secondary type on ink');
  assert.ok(c('--ink', '--signal') >= 4.5, 'ink type on the back page');
  assert.ok(c('--signal', '--paper') >= 3, 'signal display type on paper');
  assert.ok(c('--signal', '--paper-deep') >= 3, 'signal display type on deep paper');
});

test('tokens.css: type families, robot materials, retired v4 tokens', () => {
  assert.match(tokenValue('--font-display'), /^"Archivo"/);
  assert.match(tokenValue('--font-serif'), /^"Newsreader"/);
  assert.match(tokenValue('--font-mono'), /^"JetBrains Mono"/);
  // The shell keeps the value the posters were rendered with.
  assert.equal(tokenValue('--robot-shell'), '#F4F5F7');
  assert.equal(tokenValue('--robot-joint'), 'var(--ink)');
  assert.equal(tokenValue('--robot-signal'), 'var(--signal)');
  assert.match(tokens, /--robot-activation-margin\s*:\s*12\.5rem/);
  assert.match(tokens, /--dur-gait\s*:\s*1140ms/);
  for (const retired of ['--bg', '--red', '--blue', '--yellow', '--perception', '--compute', '--actuation', '--font-sans', '--servo-reach']) {
    assert.doesNotMatch(stripComments(tokens), new RegExp(`${retired}\\s*:`), `${retired} still defined`);
  }
});

test('--text-cover is set once, on the shared .display-cover rule', () => {
  assert.equal(code.split('--text-cover').length - 1, 1);
  assert.ok(rules.some((r) => r.prelude === '.display-cover' && /font-size:\s*var\(--text-cover\)/.test(r.body)));
});

test('signal colour appears only where TASTE allows it', () => {
  const allowed = new Set([
    '.hl', '.status-dot', '.callout::before', '.feature-no', '.service-index',
    '.diagram-box', '.diagram-signal', '.diagram-heading', '.contact', '.contact .button-ink:hover',
  ]);
  const owners = rules.filter((r) => /var\(--signal\)/.test(r.body)).flatMap(selectorsOf);
  const stray = owners.filter((sel) => !allowed.has(sel));
  assert.deepEqual(stray, [], `signal used on: ${stray.join(', ')}`);
});

test('type roles: display caps, serif reading text, mono for data', () => {
  const display = rules.find((r) => selectorsOf(r).includes('.display-cover') && /font-family:\s*var\(--font-display\)/.test(r.body));
  assert.ok(display && /text-transform:\s*uppercase/.test(display.body) && /var\(--display-width\)/.test(display.body));
  const body = rules.find((r) => r.prelude === 'body');
  assert.match(body.body, /font-family:\s*var\(--font-serif\)/);
  const mono = rules.find((r) => /font-family:\s*var\(--font-mono\)/.test(r.body) && selectorsOf(r).length > 10);
  assert.ok(mono, 'no shared mono rule');
  for (const sel of ['.folio', '.caption', '.button', '.spec dt']) assert.ok(selectorsOf(mono).includes(sel), `${sel} is not mono`);
  for (const prose of ['.pull-quote', '.note-copy', '.standfirst']) assert.ok(!selectorsOf(mono).includes(prose), `${prose} must not be mono`);
});

test('the cover sets itself: lines rise from masks, only without reduced motion', () => {
  const rise = rules.find((r) => r.prelude === '.cover-line-inner' && /animation:[^;]*cover-rise/.test(r.body));
  assert.ok(rise && rise.parents.includes(NO_PREF), 'cover-rise must sit in the no-preference gate');
  assert.match(rise.body, /var\(--dur-cover\)/);
  assert.ok(rules.some((r) => r.prelude === '.cover-line' && /overflow:\s*clip/.test(r.body)), 'cover lines need a mask');
});

test('focus rings: global ring, inverse on the ink spreads', () => {
  const focus = rules.find((r) => selectorsOf(r).includes(':focus-visible'));
  assert.ok(focus, 'no global :focus-visible rule');
  assert.match(focus.body, /outline:\s*var\(--focus-ring\)/);
  assert.match(focus.body, /outline-offset:\s*var\(--focus-offset\)/);
  const inverse = rules.filter((r) => /outline:\s*var\(--focus-ring-inverse\)/.test(r.body)).flatMap(selectorsOf);
  for (const sel of ['.essay-band :focus-visible', '.site-footer :focus-visible']) assert.ok(inverse.includes(sel), `${sel} lacks the inverse ring`);
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
  assert.ok(rules.some((r) => r.prelude === '.robot--specimen' && /aspect-ratio/.test(r.body)), 'specimen stage has no size');
  const canvas = rules.find((r) => r.prelude === '.robot > canvas');
  assert.ok(canvas, 'no .robot > canvas rule');
  for (const decl of [/position:\s*absolute/, /inset:\s*0/, /width:\s*100%/, /height:\s*100%/, /opacity:\s*0/]) {
    assert.match(canvas.body, decl);
  }
  assert.ok(rules.some((r) => r.prelude === '.robot.is-live > canvas' && /opacity:\s*1/.test(r.body)));
  assert.ok(rules.some((r) => r.prelude === '.robot.is-live > .robot-poster' && /visibility:\s*hidden/.test(r.body)));
  assert.ok(rules.some((r) => r.prelude === '.robot.is-failed > canvas' && /display:\s*none/.test(r.body)));
  assert.ok(rules.some((r) => r.prelude === '.robot.is-failed > .robot-poster' && /visibility:\s*visible/.test(r.body)));
});

test('cover callouts sit on their anchors above the canvas', () => {
  const callout = rules.find((r) => r.prelude === '.callout');
  assert.ok(callout);
  assert.match(callout.body, /left:\s*var\(--ax\)/);
  assert.match(callout.body, /top:\s*var\(--ay\)/);
  assert.match(callout.body, /z-index:\s*[1-9]/);
  assert.ok(rules.some((r) => r.prelude === '.callout[data-anchor="actuation"]' && /display:\s*none/.test(r.body) && r.parents.some((p) => /\(width < 48rem\)/.test(p))), 'actuation callout not hidden below 48rem');
  assert.ok(rules.some((r) => r.parents.some((p) => /^@container \(max-width: 28rem\)/.test(p))), 'no compact-callout container query');
  assert.match(tokens, /--bp-callout-compact\s*:\s*28rem/);
});

test('reveal is gated on scripting and motion preference', () => {
  const gate = '@media (scripting: enabled) and (prefers-reduced-motion: no-preference)';
  const hiding = rules.filter((r) => selectorsOf(r).includes('.reveal') && /opacity:\s*0/.test(r.body));
  assert.ok(hiding.length > 0, 'no .reveal initial state');
  for (const rule of hiding) assert.ok(rule.parents.includes(gate), '.reveal hidden outside the scripting/motion gate');
  const shown = rules.find((r) => r.prelude === '.reveal.is-in');
  assert.ok(shown && shown.parents.includes(gate) && /opacity:\s*1/.test(shown.body));
  assert.match(hiding[0].body, /calc\(var\(--i, 0\) \* var\(--stagger\)\)/);
});

test('photo-essay track walks only while walking, never under reduced motion', () => {
  const track = rules.find((r) => r.prelude === '.interlude-track line');
  assert.ok(track && /vector-effect:\s*non-scaling-stroke/.test(track.body), 'track line needs non-scaling-stroke');
  const animated = rules.filter((r) => /animation(-name)?\s*:/.test(r.body) && /interlude-track/.test(r.prelude));
  assert.ok(animated.length > 0, 'track has no animation');
  for (const rule of animated) {
    assert.ok(rule.parents.includes(NO_PREF), `${rule.prelude} animates outside no-preference`);
    assert.match(rule.body, /var\(--dur-gait\) linear infinite paused/);
  }
  const running = rules.find((r) => r.prelude === '.interlude.is-walking .interlude-track line');
  assert.ok(running && /animation-play-state:\s*running/.test(running.body));
  assert.ok(rules.some((r) => /^@keyframes\b/.test(r.parents.at(-1) ?? '') && /stroke-dashoffset:\s*var\(--walk-distance\)/.test(r.body)));
});

test('shared accessibility hooks are styled', () => {
  assert.ok(rules.some((r) => r.prelude === '.visually-hidden' && /clip/.test(r.body)));
  assert.ok(rules.some((r) => /\.skip-link:focus/.test(r.prelude)));
  const button = rules.find((r) => r.prelude === '.button');
  assert.match(button.body, /min-height:\s*var\(--control-h\)/);
  assert.ok(rules.some((r) => r.prelude === '.index-row' && /min-height:\s*var\(--control-h\)/.test(r.body)));
});

test('the page never scrolls sideways', () => {
  const body = rules.find((r) => r.prelude === 'body');
  assert.match(body.body, /overflow-x:\s*clip/);
  assert.ok(rules.some((r) => r.prelude === '.site-footer' && /overflow:\s*clip/.test(r.body)));
});
