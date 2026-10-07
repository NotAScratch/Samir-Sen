import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Markup contract for index.html: the hooks Tasks 7-8 (styles.css, script.js)
// and robots/index.js rely on. Reads the page as text; no DOM needed.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const ROBOTS = ['humanoid', 'bust', 'quadruped', 'arm', 'hand', 'waver'];

test('every page section id is present', () => {
  for (const id of ['top', 'about', 'work', 'services', 'experience', 'notes', 'contact']) {
    assert.ok(ids.includes(id), `missing #${id}`);
  }
});

test('ids are unique', () => {
  const seen = new Set();
  for (const id of ids) {
    assert.ok(!seen.has(id), `duplicate id "${id}"`);
    seen.add(id);
  }
});

test('exactly six robot containers, one per robot, each with an aria-hidden poster', () => {
  const names = [...html.matchAll(/\bdata-robot="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(names.length, 6);
  assert.deepEqual([...names].sort(), [...ROBOTS].sort());

  // Slice the page at each container's opening tag; its poster is the first <img> after it.
  const chunks = html.split(/(?=<div class="robot )/).slice(1);
  assert.equal(chunks.length, 6);
  for (const chunk of chunks) {
    const open = chunk.match(/^<div [^>]*>/)[0];
    const name = open.match(/data-robot="([^"]+)"/)?.[1];
    assert.ok(ROBOTS.includes(name), `unknown robot in ${open}`);
    assert.match(open, /\baria-hidden="true"/, `${name} container must be aria-hidden`);
    const img = chunk.match(/<img class="robot-poster"[^>]*>/)?.[0];
    assert.ok(img, `${name} has no <img class="robot-poster">`);
    assert.match(img, /\balt=""/, `${name} poster must have empty alt`);
    const src = img.match(/\bsrc="([^"]+)"/)?.[1];
    assert.ok(src && fs.existsSync(path.join(root, src)), `${name} poster file missing: ${src}`);
    assert.match(img, /\bwidth="\d+"/);
    assert.match(img, /\bheight="\d+"/);
  }
});

test('exactly two display-hero headings (hero H1 and contact H2)', () => {
  const heroes = [...html.matchAll(/<h[1-6][^>]*class="[^"]*\bdisplay-hero\b[^"]*"/g)];
  assert.equal(heroes.length, 2);
  assert.equal([...html.matchAll(/class="[^"]*\bdisplay-hero\b/g)].length, 2);
});

test('one h1, and no heading carries more than one <em>', () => {
  assert.equal([...html.matchAll(/<h1[\s>]/g)].length, 1);
  const headings = [...html.matchAll(/<(h[1-3])\b[^>]*>([\s\S]*?)<\/\1>/g)];
  assert.ok(headings.length >= 10, 'expected the page headings to be found');
  for (const [, tag, inner] of headings) {
    const ems = (inner.match(/<em[\s>]/g) ?? []).length;
    assert.ok(ems <= 1, `<${tag}> has ${ems} <em>: ${inner.slice(0, 60)}`);
  }
});

test('retired v2 features are gone', () => {
  for (const word of ['gsap', 'hero-scene', 'theme-toggle', 'cursor-dot', 'grain']) {
    assert.ok(!html.toLowerCase().includes(word), `index.html still mentions "${word}"`);
  }
});

test('case-study triggers and the six project detail ids exist', () => {
  assert.match(html, /data-case="vision"/);
  assert.match(html, /data-case="edge"/);
  for (let n = 1; n <= 6; n += 1) {
    assert.ok(ids.includes(`project-detail-${n}`), `missing #project-detail-${n}`);
  }
  for (const id of ['case-index', 'case-kicker', 'case-title', 'case-summary', 'case-problem', 'case-approach', 'case-lesson']) {
    assert.ok(ids.includes(id), `missing dialog #${id}`);
  }
});

test('only index rows 03-06 toggle; featured details are visible', () => {
  for (const n of [1, 2]) {
    const tag = html.match(new RegExp(`<p [^>]*id="project-detail-${n}"[^>]*>`))[0];
    assert.doesNotMatch(tag, /\bhidden\b/, `#project-detail-${n} must be visible`);
  }
  for (const n of [3, 4, 5, 6]) {
    const tag = html.match(new RegExp(`<p [^>]*id="project-detail-${n}"[^>]*>`))[0];
    assert.match(tag, /\bhidden\b/, `#project-detail-${n} must start hidden`);
    assert.match(html, new RegExp(`<button class="index-row"[^>]*aria-controls="project-detail-${n}"`));
  }
  assert.equal([...html.matchAll(/aria-controls="project-detail-/g)].length, 4);
});

test('aria-controls, aria-labelledby and in-page links resolve', () => {
  for (const [, attr, value] of html.matchAll(/\b(aria-controls|aria-labelledby)="([^"]+)"/g)) {
    for (const id of value.split(/\s+/)) assert.ok(ids.includes(id), `${attr} -> #${id} does not exist`);
  }
  for (const [, id] of html.matchAll(/\bhref="#([^"]+)"/g)) {
    assert.ok(ids.includes(id), `href="#${id}" does not exist`);
  }
});

test('landmarks, skip link and hero callouts', () => {
  assert.match(html, /<a class="skip-link" href="#main"/);
  assert.match(html, /<main id="main"/);
  assert.match(html, /<header[\s>]/);
  assert.match(html, /<footer[\s>]/);
  for (const anchor of ['perception', 'edge', 'actuation']) {
    assert.match(html, new RegExp(`class="callout" data-anchor="${anchor}" style="--ax:[\\d.]+%;--ay:[\\d.]+%"`));
  }
  assert.match(html, /<a class="email-link" data-attends="hand" href="mailto:/);
  assert.match(html, /<a class="to-top" data-attends="waver" href="#top"/);
  assert.match(html, /<svg class="interlude-track"/);
  assert.match(html, /<button class="menu-toggle"[^>]*aria-expanded="false"[^>]*aria-controls="menu"/);
});

test('head: import map, fonts, token + page stylesheets, module script', () => {
  const map = html.match(/<script type="importmap">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(map, 'import map missing');
  assert.deepEqual(JSON.parse(map), {
    imports: {
      three: 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js',
      'three/addons/': 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/',
    },
  });
  assert.ok(html.indexOf('type="importmap"') < html.indexOf('type="module"'), 'import map must precede the module script');
  assert.match(html, /family=Geist:wght@400;500&family=Geist\+Mono:wght@400;500&family=Instrument\+Serif:ital@1&display=swap/);
  assert.ok(html.indexOf('href="design/tokens.css"') < html.indexOf('href="styles.css"'));
  assert.match(html, /<meta name="theme-color" content="#FFFFFF">/);
  assert.match(html, /<script type="module" src="script\.js"><\/script>/);
});

test('hero-scene.js is deleted', () => {
  assert.equal(fs.existsSync(path.join(root, 'hero-scene.js')), false);
});
