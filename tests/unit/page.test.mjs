import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Markup and copy contract for index.html and the legal pages (v5): the hooks
// styles.css, script.js and robots/index.js rely on, plus the brief's copy
// rules. Reads the pages as text; no DOM needed.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const privacy = read('privacy.html');
const terms = read('terms.html');
const script = read('script.js');
const PAGES = { 'index.html': html, 'privacy.html': privacy, 'terms.html': terms };

const idsOf = (page) => [...page.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const ids = idsOf(html);
const ROBOTS = ['humanoid', 'bust', 'quadruped', 'arm', 'hand', 'waver'];
// Visible text: scripts, styles and tags removed, entities for quotes/ampersands decoded.
const textOf = (page) => page
  .replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ');
const section = (id) => html.match(new RegExp(`<section [^>]*id="${id}"[\\s\\S]*?</section>`))?.[0];

test('every page section id is present, in reading order', () => {
  const order = ['top', 'now', 'work', 'about', 'skills', 'experience', 'notes', 'contact'];
  const positions = order.map((id) => html.indexOf(`id="${id}"`));
  positions.forEach((pos, i) => assert.ok(pos > 0, `missing #${order[i]}`));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, 'sections out of order');
});

test('ids are unique on every page', () => {
  for (const [name, page] of Object.entries(PAGES)) {
    const seen = new Set();
    for (const id of idsOf(page)) {
      assert.ok(!seen.has(id), `${name}: duplicate id "${id}"`);
      seen.add(id);
    }
  }
});

test('no em dashes or en dashes in any page or in the case-study copy', () => {
  for (const [name, page] of Object.entries({ ...PAGES, 'script.js': script })) {
    assert.doesNotMatch(page, /[–—]|&mdash;|&ndash;|&#821[12];/, `${name} contains an em or en dash`);
  }
});

test('copy states things directly: no "not just X" or "it\'s not X, it\'s Y" formulas', () => {
  const formula = /\bnot just\b|\bnot only\b|\bisn[’']t just\b|\bit[’']s not\b[^.]*\bit[’']s\b|\brather than\b/i;
  for (const [name, page] of Object.entries(PAGES)) assert.doesNotMatch(textOf(page), formula, `${name} uses the rejection formula`);
  const caseCopy = script.slice(script.indexOf('const caseFields'), script.indexOf('const setCaseParam'));
  assert.doesNotMatch(caseCopy, formula, 'case-study copy uses the rejection formula');
});

test('no emoji, sparkles or decorative arrow glyphs in the pages', () => {
  for (const [name, page] of Object.entries(PAGES)) {
    assert.doesNotMatch(page, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}←-⇿↗↘]/u, `${name} has an emoji or arrow glyph`);
  }
});

test('exactly six robot containers, one per robot, each with an aria-hidden poster', () => {
  const names = [...html.matchAll(/\bdata-robot="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual([...names].sort(), [...ROBOTS].sort());
  const chunks = html.split(/(?=<div class="robot )/).slice(1);
  assert.equal(chunks.length, 6);
  for (const chunk of chunks) {
    const open = chunk.match(/^<div [^>]*>/)[0];
    const name = open.match(/data-robot="([^"]+)"/)?.[1];
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

test('one h1 per page; headings carry no <em> styling', () => {
  for (const [name, page] of Object.entries(PAGES)) {
    assert.equal([...page.matchAll(/<h1[\s>]/g)].length, 1, `${name} needs exactly one h1`);
    for (const [, tag, inner] of page.matchAll(/<(h[1-4])\b[^>]*>([\s\S]*?)<\/\1>/g)) {
      assert.doesNotMatch(inner, /<em[\s>]/, `${name} <${tag}> uses <em>`);
    }
  }
});

test('hero: concise headline, role in the intro, the work and the CV one click away', () => {
  const hero = section('top');
  assert.match(hero, /<h1 id="hero-title" class="hero-title[^"]*"[^>]*>Systems that see, think and move\.<\/h1>/);
  assert.match(hero, /<p class="hero-lead[^"]*"[^>]*>I’m Samir Sen, an AI robotics engineer in Kathmandu\./);
  assert.match(hero, /<a class="button button-primary" href="#now">See the work<\/a>/);
  const cv = hero.match(/<a class="button button-secondary" href="([^"]+)" download="Samir-Sen-CV\.pdf">/);
  assert.ok(cv, 'hero CV download link missing');
  assert.ok(fs.existsSync(path.join(root, decodeURIComponent(cv[1]))), 'CV file missing');
  const size = Math.round(fs.statSync(path.join(root, 'Samir Sen CV.pdf')).size / 1024);
  assert.match(hero, new RegExp(`PDF, ${size}&nbsp;KB`), `the CV size label should say ${size} KB`);
  assert.doesNotMatch(hero.slice(0, hero.indexOf('<h1')), /class="(eyebrow|label)/, 'no eyebrow label above the hero headline');
});

test('hero callouts map robot parts to skills and the caption says live or still', () => {
  for (const anchor of ['perception', 'edge', 'actuation']) {
    assert.match(html, new RegExp(`class="callout" data-anchor="${anchor}" style="--ax:[\\d.]+%;--ay:[\\d.]+%"`));
  }
  const titles = [...html.matchAll(/<span class="callout-title">([^<]+)<\/span>/g)].map((m) => m[1]);
  assert.deepEqual(titles, ['Perception', 'Edge compute', 'Actuation']);
  const caption = html.match(/<figcaption class="caption hero-caption">([\s\S]*?)<\/figcaption>/)?.[1];
  assert.match(caption, /class="when-live">Live 3D/);
  assert.match(caption, /class="when-still">Still render/);
});

test('Now: the current role as a spec sheet with the figures from the CV', () => {
  const now = section('now');
  assert.match(now, /Aug 2026 to present · Baliyo Ventures/);
  const figures = [...now.matchAll(/<div class="spec-figure"><dt>([^<]+)<\/dt><dd>([^<]+)<\/dd><\/div>/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(figures, [['Scan rate', '8&nbsp;Hz'], ['Points per turn', '~2,500'], ['Dropped packets', '0']]);
  assert.match(now, /slam_toolbox and Nav2/);
  const steps = [...now.matchAll(/<li><span class="label">\d{2}<\/span> ([^<]+)<\/li>/g)].map((m) => m[1]);
  assert.deepEqual(steps, ['Odometry', 'Mapping', 'Localization', 'Path planning', 'Exploration']);
  assert.match(now, /Bandar Sentinel/);
});

test('project figures are labelled as illustrations, never as live captures', () => {
  const figures = [...html.matchAll(/<figure class="project-figure">([\s\S]*?)<\/figure>/g)].map((m) => m[1]);
  assert.equal(figures.length, 2);
  for (const figure of figures) {
    assert.match(figure, /<svg class="diagram" viewBox="0 0 400 300" role="img" aria-label="Illustration: /);
    assert.match(figure, /<figcaption class="caption"><span class="label">Illustration<\/span> Drawn for this page/);
    assert.doesNotMatch(figure, /\blive\b|\bfeed\b|\bLocked\b/i);
  }
});

test('case-study triggers, dialog fields and the eight project detail ids exist', () => {
  assert.match(html, /data-case="vision"/);
  assert.match(html, /data-case="edge"/);
  for (let n = 1; n <= 8; n += 1) assert.ok(ids.includes(`project-detail-${n}`), `missing #project-detail-${n}`);
  for (const id of ['case-index', 'case-kicker', 'case-title', 'case-summary', 'case-problem', 'case-approach', 'case-lesson']) {
    assert.ok(ids.includes(id), `missing dialog #${id}`);
  }
  assert.match(html, /<button class="button button-secondary case-close" type="button">Close<span class="visually-hidden"> case study<\/span><\/button>/);
});

test('only index rows 03-08 toggle; featured details are visible', () => {
  for (const n of [1, 2]) {
    const tag = html.match(new RegExp(`<p [^>]*id="project-detail-${n}"[^>]*>`))[0];
    assert.doesNotMatch(tag, /\bhidden\b/, `#project-detail-${n} must be visible`);
  }
  for (const n of [3, 4, 5, 6, 7, 8]) {
    const tag = html.match(new RegExp(`<p [^>]*id="project-detail-${n}"[^>]*>`))[0];
    assert.match(tag, /\bhidden\b/, `#project-detail-${n} must start hidden`);
    assert.match(html, new RegExp(`<button class="index-row" type="button" aria-expanded="false" aria-controls="project-detail-${n}"`));
  }
  assert.equal([...html.matchAll(/aria-controls="project-detail-/g)].length, 6);
});

test('case-study buttons are dialog openers with distinct accessible names', () => {
  const buttons = [...html.matchAll(/<button class="[^"]*case-study-trigger"([^>]*)>([\s\S]*?)<\/button>/g)];
  assert.equal(buttons.length, 2);
  const names = buttons.map(([, attrs, inner]) => {
    assert.match(attrs, /\baria-haspopup="dialog"/);
    return inner.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  });
  assert.equal(new Set(names).size, 2, `names must differ: ${names.join(' | ')}`);
  for (const name of names) assert.match(name, /^Read the case study for /);
});

test('notes: an honest empty state that points somewhere useful', () => {
  const notes = section('notes');
  assert.match(notes, /<p class="empty-title">No notes published yet\.<\/p>/);
  assert.equal([...notes.matchAll(/<ul class="draft-list">[\s\S]*?<\/ul>/g)].length, 1);
  assert.equal([...notes.match(/<ul class="draft-list">([\s\S]*?)<\/ul>/)[1].matchAll(/<li>/g)].length, 3);
  const links = [...notes.matchAll(/<a href="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(links, ['https://github.com/NotAScratch']);
});

test('contact form: labelled fields, inline errors, a status line, and an honest description', () => {
  const contact = section('contact');
  const form = contact.match(/<form class="contact-form[^"]*"[^>]*>[\s\S]*?<\/form>/)?.[0];
  assert.ok(form, 'no contact form');
  assert.match(form, /^<form [^>]*\bnovalidate\b/, 'script.js validates, so native bubbles are off');
  for (const [field, tag] of [['name', 'input'], ['email', 'input'], ['message', 'textarea']]) {
    const id = `contact-${field}`;
    assert.match(form, new RegExp(`<label class="field-label" for="${id}">`), `${field} has no visible label`);
    const control = form.match(new RegExp(`<${tag} [^>]*id="${id}"[^>]*>`))?.[0];
    assert.ok(control, `no #${id}`);
    assert.match(control, new RegExp(`name="${field}"`));
    assert.match(control, /\brequired\b/);
    assert.match(control, new RegExp(`aria-describedby="[^"]*\\b${id}-error\\b`), `${field} is not described by its error`);
    assert.match(form, new RegExp(`<p class="field-error" id="${id}-error" hidden></p>`));
  }
  assert.match(form, /<input [^>]*id="contact-email"[^>]*type="email"[^>]*autocomplete="email"/);
  assert.match(form, /<textarea [^>]*maxlength="1500"/);
  assert.match(form, /<button class="button button-primary" type="submit">Open in my email app<\/button>/);
  assert.match(form, /<p class="form-status" role="status"><\/p>/);
  assert.match(form, /Nothing is stored on this site\./);
});

test('contact: the email is a link, can be copied, and the hand attends to it', () => {
  const contact = section('contact');
  assert.match(contact, /<a class="email-link" data-attends="hand" href="mailto:samirsen66@gmail\.com">samirsen66@gmail\.com<\/a>/);
  assert.match(contact, /<button class="button button-secondary copy-email" type="button" data-copy="samirsen66@gmail\.com">Copy address<\/button>/);
  assert.match(contact, /<p class="copy-status caption" role="status"><\/p>/);
  assert.match(contact, /<span class="local-clock">--:--<\/span> NPT \(UTC\+5:45\)/);
});

test('footer: legal links, honest credits and the back-to-top robot', () => {
  const footer = html.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)[0];
  assert.match(footer, /<a href="privacy\.html">Privacy Policy<\/a>/);
  assert.match(footer, /<a href="terms\.html">Terms of Service<\/a>/);
  assert.match(footer, /<a class="to-top" data-attends="waver" href="#top">Back to top<\/a>/);
  assert.match(footer, /Robot Arm by Yali Izzo and Animated Robot by Quaternius, both CC0\./);
  assert.match(footer, /GPL-3\.0/);
});

test('legal pages: drafts are marked, facts match the site, and they link home', () => {
  for (const [name, page] of [['privacy.html', privacy], ['terms.html', terms]]) {
    assert.match(page, /<strong>Draft for review\.<\/strong>/, `${name} is not marked as a draft`);
    assert.ok((page.match(/class="review-flag">To confirm</g) ?? []).length >= 2, `${name} needs its open points flagged`);
    assert.match(page, /<a class="wordmark" href="index\.html"/);
    assert.match(page, /href="design\/tokens\.css"[\s\S]*href="styles\.css"/);
    assert.match(page, /aria-current="page"/);
    assert.doesNotMatch(page, /<script/, `${name} needs no script`);
  }
  for (const service of ['GitHub Pages', 'Google Fonts', 'jsDelivr']) assert.match(privacy, new RegExp(service), `privacy policy omits ${service}`);
  assert.match(privacy, /sets no cookies, runs no analytics/);
  assert.match(terms, /GNU General Public License v3\.0/);
  assert.match(read('LICENSE'), /GNU GENERAL PUBLIC LICENSE\s+Version 3/);
});

test('aria references, in-page links and local files resolve on every page', () => {
  for (const [name, page] of Object.entries(PAGES)) {
    const pageIds = idsOf(page);
    for (const [, attr, value] of page.matchAll(/\b(aria-controls|aria-labelledby|aria-describedby|for)="([^"]+)"/g)) {
      for (const id of value.split(/\s+/)) assert.ok(pageIds.includes(id), `${name}: ${attr} -> #${id} does not exist`);
    }
    for (const [, id] of page.matchAll(/\bhref="#([^"]+)"/g)) assert.ok(pageIds.includes(id), `${name}: href="#${id}" does not exist`);
    for (const [, url] of page.matchAll(/\b(?:href|src)="(?!https?:|mailto:|#)([^"?#]+)/g)) {
      assert.ok(fs.existsSync(path.join(root, decodeURIComponent(url))), `${name}: ${url} does not exist`);
    }
  }
});

test('landmarks, skip link and the phone menu', () => {
  for (const [name, page] of Object.entries(PAGES)) {
    assert.match(page, /<a class="skip-link" href="#main"/, `${name} skip link`);
    assert.match(page, /<main id="main"/, `${name} main`);
    assert.match(page, /<header[\s>]/);
    assert.match(page, /<footer[\s>]/);
  }
  assert.match(html, /<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu">Menu<\/button>/);
  assert.match(html, /<div id="menu" class="menu" hidden>/);
  const menuLinks = [...html.match(/<ul class="menu-list">([\s\S]*?)<\/ul>/)[1].matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  const navLinks = [...html.match(/<ul class="nav-list">([\s\S]*?)<\/ul>/)[1].matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(menuLinks.slice(0, navLinks.length), navLinks, 'the phone menu offers every primary link');
});

test('sibling spans are separated by whitespace so names do not run together', () => {
  assert.doesNotMatch(html.replace(/<svg[\s\S]*?<\/svg>/g, ''), /<\/span><span[\s>]/);
});

test('head: import map, fonts, token + page stylesheets, module script', () => {
  const map = html.match(/<script type="importmap">([\s\S]*?)<\/script>/)?.[1];
  assert.deepEqual(JSON.parse(map), {
    imports: {
      three: 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js',
      'three/addons/': 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/',
    },
  });
  assert.ok(html.indexOf('type="importmap"') < html.indexOf('type="module"'), 'import map must precede the module script');
  for (const page of Object.values(PAGES)) {
    assert.match(page, /family=Martian\+Mono:wdth,wght@87\.5,400&family=Schibsted\+Grotesk:wght@400;500;600;700&display=swap/);
    assert.doesNotMatch(page, /family=(Inter|Geist|Space\+Grotesk|Jost|Unbounded)/);
    assert.match(page, /<meta name="theme-color" content="#F5F4F0">/);
  }
  assert.ok(html.indexOf('href="design/tokens.css"') < html.indexOf('href="styles.css"'));
  assert.match(html, /<script type="module" src="script\.js"><\/script>/);
});

test('retired v4 features are gone', () => {
  for (const word of ['shape shape--', 'word--', 'actuator', 'class="lock', 'servo', 'class="strip', 'hero-shapes', 'Unbounded', 'Jost', 'theme toggle', 'nav-clock']) {
    assert.ok(!html.includes(word), `index.html still mentions "${word}"`);
  }
  assert.equal(fs.existsSync(path.join(root, 'lib/servo.js')), false);
  assert.equal(fs.existsSync(path.join(root, 'hero-scene.js')), false);
  assert.doesNotMatch(script, /servo/i);
});
