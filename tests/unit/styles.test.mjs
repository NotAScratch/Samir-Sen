import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Style contract for styles.css + design/tokens.css (v5 "Quiet instrument"):
// tokens only, one accent, restrained motion, and the hooks robots/index.js
// and script.js rely on. Reads the files as text; no browser needed.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const tokens = fs.readFileSync(path.join(root, 'design/tokens.css'), 'utf8');

const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '');
const code = stripComments(css);
const tokenCode = stripComments(tokens);

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
const ruleFor = (selector, pattern = /./) => rules.find((r) => selectorsOf(r).includes(selector) && pattern.test(r.body));
const tokenValue = (name) => tokenCode.match(new RegExp(`${name}\\s*:\\s*([^;]+);`))?.[1].trim();
const NO_PREF = '@media (prefers-reduced-motion: no-preference)';
const DESKTOP = '@media (width >= 48rem)';
const PHONE = '@media (width < 48rem)';

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

test('styles.css has no raw colours, px lengths or durations', () => {
  const banned = [
    ['hex colour', /#[0-9a-fA-F]{3,8}\b/g],
    ['rgb()/hsl()/oklch()', /(rgba?|hsla?|oklch)\(/g],
    ['px length', /\d+(\.\d+)?px\b/g],
    ['ms/s duration', /\d+(\.\d+)?m?s\b/g],
  ];
  for (const [what, re] of banned) {
    const hits = [...code.matchAll(re)].map((m) => `${m[0]} (code line ${lineOf(m.index)})`);
    assert.deepEqual(hits, [], `${what} in styles.css: ${hits.join(', ')}`);
  }
});

test('every var(--name) in styles.css is defined in design/tokens.css', () => {
  const defined = new Set([...tokenCode.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  const used = new Set([...code.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]));
  const missing = [...used].filter((name) => !defined.has(name) && !RUNTIME_VARS.has(name));
  assert.deepEqual(missing, [], `undefined tokens: ${missing.join(', ')}`);
});

test('no depth effects or decoration: shadows, gradients, glass, blur, dotted grids', () => {
  for (const banned of [/text-shadow/, /linear-gradient/, /radial-gradient/, /conic-gradient/, /backdrop-filter/, /filter:\s*blur/, /dotted/]) {
    assert.doesNotMatch(code, banned, `styles.css uses ${banned}`);
  }
  for (const m of code.matchAll(/box-shadow\s*:\s*([^;}]*)/g)) {
    assert.equal(m[1].trim(), 'var(--shadow)', `box-shadow other than the none token: ${m[0]}`);
  }
  assert.equal(tokenValue('--shadow'), 'none');
});

test('palette: warm near-white ground (never pure white), one accent, readable text everywhere', () => {
  const hex = (name) => {
    const value = tokenValue(name);
    assert.match(value ?? '', /^#[0-9A-F]{6}$/, `${name} must be a literal hex in tokens.css`);
    return value;
  };
  const bg = hex('--bg');
  assert.notEqual(bg, '#FFFFFF', 'the page is never pure white');
  const [r, , b] = [1, 3, 5].map((i) => parseInt(bg.slice(i, i + 2), 16));
  assert.ok(r >= b, 'the ground leans warm (red channel at least blue)');
  assert.ok(luminance(bg) > 0.85, 'the ground is near-white');

  const floors = [
    ['--ink', '--bg', 7], ['--ink-muted', '--bg', 4.5], ['--ink-muted', '--surface', 4.5],
    ['--ink-faint', '--bg', 4.5], ['--ink-faint', '--surface', 4.5], ['--ink-faint', '--field', 4.5],
    ['--accent', '--bg', 4.5], ['--accent', '--surface', 4.5], ['--accent-strong', '--bg', 4.5],
    ['--on-accent', '--accent', 4.5], ['--on-accent', '--accent-strong', 4.5],
    ['--error', '--bg', 4.5], ['--error', '--field', 4.5], ['--error', '--surface', 4.5],
    ['--line-strong', '--bg', 3], ['--line-strong', '--field', 3],
  ];
  for (const [fg, bgName, min] of floors) {
    const ratio = contrast(hex(fg), hex(bgName));
    assert.ok(ratio >= min, `${fg} on ${bgName} is ${ratio.toFixed(2)}:1, needs ${min}:1`);
  }
});

test('the accent marks only what you can act on', () => {
  const accentRules = rules.filter((r) => /var\(--accent(-strong)?\)/.test(r.body));
  const allowed = /^a(:hover)?$|::selection|\.button|\.menu-link:hover|\.index-row:hover|\.email-link:hover|\.field-input:focus-visible/;
  assert.ok(accentRules.length > 0);
  for (const rule of accentRules) assert.match(rule.prelude, allowed, `accent used on "${rule.prelude}"`);
  assert.equal(tokenValue('--focus-ring'), '2px solid var(--accent)');
  assert.equal(tokenValue('--robot-signal'), 'var(--accent)', 'the robots share the one accent');
});

test('--error appears only on form validation', () => {
  const owners = rules.filter((r) => /var\(--error\)/.test(r.body)).map((r) => r.prelude);
  assert.deepEqual(owners.sort(), ['.field-error', '.field-input[aria-invalid="true"]'].sort());
});

test('type: Schibsted Grotesk for reading, Martian Mono only for data; no overused faces', () => {
  assert.match(tokenValue('--font-sans'), /^"Schibsted Grotesk"/);
  assert.match(tokenValue('--font-mono'), /^"Martian Mono"/);
  for (const src of [code, tokenCode]) assert.doesNotMatch(src, /\b(Inter|Geist|Space Grotesk|Jost|Unbounded)\b/);
  const mono = rules.filter((r) => /font-family:\s*var\(--font-mono\)/.test(r.body)).flatMap(selectorsOf);
  for (const selector of mono) assert.match(selector, /label|diagram|review-flag|code/, `mono used for "${selector}"`);
});

test('--text-display is used once, for the hero headline', () => {
  const owners = rules.filter((r) => r.body.includes('var(--text-display)'));
  assert.equal(owners.length, 1);
  assert.equal(owners[0].prelude, '.hero-title');
});

test('square corners: pills only on buttons, the menu trigger, the skip link and callout dots', () => {
  for (const rule of rules.filter((r) => /border-radius:/.test(r.body))) {
    const value = rule.body.match(/border-radius:\s*([^;]+);/)[1].trim();
    assert.match(value, /^var\(--radius-(pill|none)\)$/, `${rule.prelude} uses border-radius ${value}`);
    if (value === 'var(--radius-pill)') assert.match(rule.prelude, /^(\.button|\.menu-toggle|\.skip-link|\.callout::before)$/, `pill on ${rule.prelude}`);
  }
});

test('hover changes colour only: nothing moves, scales or animates on hover', () => {
  for (const rule of rules.filter((r) => /:hover/.test(r.prelude))) {
    assert.doesNotMatch(rule.body, /\b(transform|translate|scale|rotate|transition|animation)\s*:/, `${rule.prelude} moves on hover`);
  }
  const transitions = rules.filter((r) => /\btransition\s*:/.test(r.body)).map((r) => r.prelude);
  assert.deepEqual(transitions.sort(), ['.reveal', '.robot > canvas', '.robot-poster'].sort(), 'only the reveal and the robot canvas fade');
});

test('motion: the gait track is the only animation, and only without reduced motion', () => {
  const animated = rules.filter((r) => /\banimation\s*:/.test(r.body));
  assert.deepEqual(animated.map((r) => r.prelude), ['.interlude-track line']);
  assert.ok(animated[0].parents.includes(NO_PREF));
  const keyframes = rules.filter((r) => /^@keyframes\b/.test(r.prelude)).map((r) => r.prelude);
  assert.deepEqual(keyframes, ['@keyframes track-walk']);
  assert.doesNotMatch(code, /scroll-behavior:\s*smooth/, 'normal scrolling is preserved');
  assert.doesNotMatch(code, /animation-timeline/, 'no scroll-driven animation');
});

test('reduced motion stops every animation and transition in tokens.css', () => {
  const block = tokens.slice(tokens.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(block, /animation-duration:\s*0\.01ms\s*!important/);
  assert.match(block, /transition-duration:\s*0\.01ms\s*!important/);
  assert.match(block, /scroll-behavior:\s*auto\s*!important/);
});

test('reveal is gated on scripting and motion preference', () => {
  const gate = '@media (scripting: enabled) and (prefers-reduced-motion: no-preference)';
  const hiding = rules.filter((r) => selectorsOf(r).includes('.reveal') && /opacity:\s*0/.test(r.body));
  assert.ok(hiding.length > 0, 'no .reveal initial state');
  for (const rule of hiding) assert.ok(rule.parents.includes(gate), '.reveal hidden outside the scripting/motion gate');
  const shown = rules.find((r) => r.prelude === '.reveal.is-in');
  assert.ok(shown && shown.parents.includes(gate) && /opacity:\s*1/.test(shown.body));
  assert.match(hiding[0].body, /var\(--reveal-distance\)/);
  assert.match(hiding[0].body, /var\(--dur-reveal\)/);
  assert.match(hiding[0].body, /calc\(var\(--i, 0\) \* var\(--stagger\)\)/);
});

test('media queries use the single 48rem breakpoint', () => {
  const sized = rules.filter((r) => r.prelude.startsWith('@media') && /width/.test(r.prelude));
  assert.ok(sized.length > 0);
  for (const rule of sized) assert.match(rule.prelude, /\b48rem\b/, rule.prelude);
});

test('hit targets: controls are at least --control-h tall', () => {
  for (const selector of ['.button', '.menu-toggle', '.nav-list a', '.footer-links a', '.field-input', '.to-top', '.wordmark', '.skip-link']) {
    const rule = ruleFor(selector, /min-height/);
    assert.ok(rule, `${selector} has no min-height`);
    assert.match(rule.body, /min-height:\s*(var\(--control-h\)|calc\(var\(--control-h\))/, `${selector} min-height`);
  }
  assert.match(ruleFor('.index-row', /min-height/).body, /min-height:\s*calc\(var\(--control-h\) \+ var\(--space-4\)\)/);
});

test('forms: invalid fields and their messages, and status lines that hide when empty', () => {
  assert.match(ruleFor('.field-input[aria-invalid="true"]').body, /border-color:\s*var\(--error\)/);
  assert.match(ruleFor('.field-error').body, /color:\s*var\(--error\)/);
  const empty = rules.find((r) => selectorsOf(r).includes('.form-status:empty') && selectorsOf(r).includes('.copy-status:empty'));
  assert.ok(empty && /display:\s*none/.test(empty.body));
  assert.match(ruleFor('.field-input', /border:/).body, /border:\s*var\(--hairline\) solid var\(--line-strong\)/);
});

test('shared accessibility hooks are styled', () => {
  assert.ok(rules.some((r) => r.prelude === '.visually-hidden' && /clip/.test(r.body)));
  assert.ok(rules.some((r) => r.prelude === '.skip-link:focus-visible' && /translate:\s*none/.test(r.body)));
  const focus = rules.find((r) => r.prelude === ':focus-visible');
  assert.ok(focus, 'no global :focus-visible rule');
  assert.match(focus.body, /outline:\s*var\(--focus-ring\)/);
  assert.match(focus.body, /outline-offset:\s*var\(--focus-offset\)/);
  assert.match(ruleFor('body.menu-open').body, /overflow:\s*hidden/);
  assert.match(ruleFor('.menu[hidden]').body, /display:\s*none/);
  const desktop = rules.find((r) => r.parents.includes(DESKTOP) && selectorsOf(r).includes('.menu-toggle') && selectorsOf(r).includes('.menu'));
  assert.ok(desktop && /display:\s*none/.test(desktop.body), 'the phone menu must not exist on wide screens');
});

test('robot containers: poster aspect ratios, canvas overlay, live and failed states', () => {
  const posters = { humanoid: [1208, 1800], bust: [1072, 1200], quadruped: [1836, 1233], arm: [1200, 1400], hand: [2120, 1422], waver: [720, 900] };
  for (const [name, [w, h]] of Object.entries(posters)) {
    const rule = rules.find((r) => r.prelude === `.robot--${name}` && /aspect-ratio/.test(r.body));
    assert.ok(rule, `.robot--${name} has no aspect-ratio`);
    assert.match(rule.body, new RegExp(`aspect-ratio:\\s*${w}\\s*/\\s*${h}\\s*;`), `.robot--${name} aspect-ratio`);
  }
  assert.match(rules.find((r) => r.prelude === '.robot').body, /position:\s*relative/);
  const canvas = rules.find((r) => r.prelude === '.robot > canvas');
  for (const decl of [/position:\s*absolute/, /inset:\s*0/, /width:\s*100%/, /height:\s*100%/, /opacity:\s*0/, /var\(--dur-base\)/]) assert.match(canvas.body, decl);
  assert.ok(rules.some((r) => r.prelude === '.robot.is-live > canvas' && /opacity:\s*1/.test(r.body)));
  assert.ok(rules.some((r) => r.prelude === '.robot.is-live > .robot-poster' && /visibility:\s*hidden/.test(r.body)));
  assert.ok(rules.some((r) => r.prelude === '.robot.is-failed > canvas' && /display:\s*none/.test(r.body)));
  assert.ok(rules.some((r) => r.prelude === '.robot.is-failed > .robot-poster' && /visibility:\s*visible/.test(r.body)));
});

test('captions say whether a robot is live or a still', () => {
  const hide = rules.find((r) => /display:\s*none/.test(r.body) && selectorsOf(r).includes('.hero-figure:has(.robot.is-live) .when-still'));
  assert.ok(hide, 'the still caption shows while the robot is live');
  for (const selector of ['.interlude:has(.robot.is-live) .when-still', '.hero-figure:not(:has(.robot.is-live)) .when-live', '.interlude:not(:has(.robot.is-live)) .when-live']) {
    assert.ok(selectorsOf(hide).includes(selector), `missing ${selector}`);
  }
});

test('hero callouts sit on their anchors above the canvas; phones show titles only', () => {
  const callout = rules.find((r) => r.prelude === '.callout');
  assert.match(callout.body, /position:\s*absolute/);
  assert.match(callout.body, /left:\s*var\(--ax\)/);
  assert.match(callout.body, /top:\s*var\(--ay\)/);
  assert.match(callout.body, /z-index:\s*[1-9]/);
  assert.match(callout.body, /right:\s*calc\(-1 \* var\(--callout-room-compact\)\)/);
  assert.match(ruleFor('.callout-detail', /display/).body, /display:\s*none/);
  assert.match(rules.find((r) => r.prelude === '.callout[data-anchor="actuation"]' && r.parents.length === 0).body, /display:\s*none/);
  const wide = (sel, pattern) => rules.some((r) => r.parents.includes(DESKTOP) && r.prelude === sel && pattern.test(r.body));
  assert.ok(wide('.callout-detail', /display:\s*block/), 'details return on wide screens');
  assert.ok(wide('.callout[data-anchor="actuation"]', /display:\s*grid/), 'the actuation callout returns on wide screens');
  assert.ok(wide('.hero-figure', /padding-right:\s*var\(--callout-room\)/), 'the figure reserves room for the labels');
});

test('the hero robot fills its figure, capped by a token, and bands never widen the page', () => {
  assert.match(ruleFor('.hero-figure', /container-type/).body, /container-type:\s*inline-size/);
  assert.match(ruleFor('.robot--humanoid', /height/).body, /height:\s*min\(var\(--hero-robot-h\), calc\(100cqi \* 1800 \/ 1208\)\)/);
  for (const band of ['.hero', '.interlude', '.contact']) assert.match(ruleFor(band, /overflow-x/).body, /overflow-x:\s*clip/, `${band} must clip its bleed`);
});

test('interlude track walks only while walking, never under reduced motion', () => {
  const track = rules.find((r) => r.prelude === '.interlude-track line' && r.parents.length === 0);
  assert.ok(track && /vector-effect:\s*non-scaling-stroke/.test(track.body), 'track line needs non-scaling-stroke');
  const animated = rules.find((r) => r.prelude === '.interlude-track line' && r.parents.includes(NO_PREF));
  for (const part of [/var\(--dur-gait\)/, /linear/, /infinite/, /paused/]) assert.match(animated.body, part);
  const running = rules.find((r) => r.prelude === '.interlude.is-walking .interlude-track line');
  assert.ok(running && /animation-play-state:\s*running/.test(running.body));
  assert.ok(rules.some((r) => r.parents.includes('@keyframes track-walk') && /stroke-dashoffset:\s*var\(--walk-distance\)/.test(r.body)));
  // A seamless loop: the walk distance is a whole number of dash periods (--space-6 + --space-2 = 40px).
  assert.match(track.body, /stroke-dasharray:\s*var\(--space-6\) var\(--space-2\)/);
  assert.equal(parseFloat(tokenValue('--walk-distance')) % 40, 0);
});

test('robot and lifecycle tokens', () => {
  assert.equal(tokenValue('--robot-shell'), '#F7F5F0');
  assert.equal(tokenValue('--robot-joint'), 'var(--ink)');
  assert.match(tokenValue('--robot-shadow'), /^0?\.\d+$/);
  assert.equal(tokenValue('--robot-activation-margin'), '12.5rem');
  assert.equal(tokenValue('--dur-gait'), '1140ms');
  assert.match(tokenValue('--look-max'), /^\d+deg$/);
  assert.match(tokenValue('--hand-nudge'), /^\d+px$/);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'robots/logic.js'), 'utf8'), /margin\s*=\s*200/);
});

test('retired v4 hooks are gone from styles and tokens', () => {
  for (const name of ['shape', 'word--', 'actuator', 'lock', 'servo', 'strip', 'hero-shapes', 'hero-orbit', 'viewfinder', 'note--']) {
    assert.doesNotMatch(code, new RegExp(`\\.${name}`), `styles.css still styles .${name}`);
  }
  for (const name of ['--perception', '--compute', '--actuation', '--red', '--yellow', '--paper', '--servo-reach', '--dur-assembly', '--dur-orbit', '--font-display']) {
    assert.doesNotMatch(tokenCode, new RegExp(`${name}\\s*:`), `${name} still defined`);
  }
});

test('phones get full-width primary actions; wide screens use a 12-column grid', () => {
  assert.ok(rules.some((r) => r.parents.includes(PHONE) && r.prelude === '.hero-actions .button' && /flex:\s*1 1 100%/.test(r.body)));
  assert.ok(rules.some((r) => r.parents.includes(DESKTOP) && r.prelude === '.hero-grid' && /repeat\(12, minmax\(0, 1fr\)\)/.test(r.body)));
});
