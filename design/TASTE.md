# Taste: v5, "Quiet instrument"

## Read this before writing any UI

1. Read `design/tokens.css`. Every value in `styles.css` comes from it.
2. The Figma file (https://www.figma.com/design/1H3FimcUCNMbv5AZWmbG47) still
   shows an older version until it is synced; until then the repo is the
   source of truth. If code and this file disagree, fix the token, not the
   component.
3. This is the personal site of Samir Sen, an AI robotics engineer in
   Kathmandu. Its readers are recruiters and curious visitors. They should
   understand what he builds within one screen, see the work next, and be
   able to download the CV or write to him from anywhere.

## The idea

Restraint, with the product doing the talking. The page is a calm, warm
near-white ground with graphite type. The live robots and the project figures
are the visuals; everything else steps back. Hierarchy comes from type size,
weight, space and alignment, never from decoration.

## Colour

- **Ground** `--bg` is the page. `--surface` is the plate behind figures and
  robots and the one alternate band. `--field` is for form fields and the
  dialog sheet. Pure white is never the page.
- **One accent**, `--accent` (signal blue). It marks what you can act on:
  links, the primary button, focus rings, the selected state. It is also the
  robots' status light, so the product and the interface share one signal.
  Nothing decorative is accent-coloured.
- `--error` appears only in form validation, beside text that explains it.
- Body copy is `--ink-muted`; captions and metadata `--ink-faint`. Nothing
  lighter carries text.

## Type

- **Schibsted Grotesk** for all reading text and headings: a readable
  grotesque with enough character to be recognisable at display sizes.
  (Inter, Geist, Space Grotesk and the other overused defaults are out.)
- **Martian Mono** (semi-condensed, uppercase, tracked) only for data:
  dates, specs, figure labels, the local clock. Never for prose.
- Headlines are short and sentence case. `--text-display` is used once, for
  the hero headline. Section headlines are `--text-h2`.
- No eyebrow labels above headings, except where they carry data (a figure
  number, a date).

## Layout

- One container (`--container`), generous side margins (`--margin`) and
  section padding (`--section-y`). One media breakpoint, 48rem.
- Vary each section's composition to fit what it explains: the hero is a
  split of words and robot; current work is a spec sheet; selected work
  alternates figure and text; skills put a robot beside a list; experience is
  a dated list; contact is a form beside the direct details.
- Hairlines (`--line`) separate list rows. No boxes around content, no card
  grids, no bento layouts, no three-up feature cards.
- Corners are square. Only buttons and the menu trigger are pills.
- No shadows. The dialog is separated by its backdrop.

## Robots (live 3D)

Unchanged cast: humanoid in the hero, perception head in About, quadruped in
the interlude, arm beside Skills, hand in Contact, waving robot in the footer.

1. **One robot per section, never two live at once.**
2. **One material language**: `--robot-shell` (warm matte white),
   `--robot-joint` (graphite), `--robot-signal` (the accent). Downloaded
   models get their materials replaced.
3. **Robots stand on the page**, on a plain `--surface` plate at most, never
   in decorated boxes.
4. **Annotate, don't decorate.** Hero callouts map robot parts to real
   skills from the CV. Never invent specs for the robot itself.
5. **Posters first.** Every robot has a transparent WebP still rendered from
   the same scene (`tools/posters.html`). The poster is also the loading
   state, so robots need no skeleton. Re-render posters whenever robot tokens
   change.
6. **Honest labels.** The hero caption says whether the robot is live 3D or a
   still. The models are illustrations; the credits name their authors.

## Project media

- Real captures replace the diagrams as soon as they exist.
- Until then, figures are SVG diagrams in the page's palette, and every one
  is captioned **Illustration**, never "live" or "feed". Labels name what the
  system outputs (class, distance, bearing) without made-up numbers.

## Copy

- Specific and direct. Name the hardware, the method and the result.
- Facts come from the CV (`Samir Sen CV.pdf`) and Samir's own earlier copy.
  No invented numbers, testimonials, logos or claims.
- No em dashes or en dashes. Use commas, colons, full stops, or "to" in
  ranges ("2021 to 2022").
- Never reject one description before stating another ("not X, it's Y");
  state the benefit directly.

## Motion

- Content fades up `--reveal-distance` over `--dur-reveal` when it enters,
  once. Robots idle, look toward the pointer, and the quadruped walks while
  it is on screen. That is all.
- Hovers change colour at most; nothing moves on hover. No animated arrows.
- Everything respects `prefers-reduced-motion`; normal scrolling is never
  hijacked.

## Interaction

- Every control works with a keyboard and shows `--focus-ring`.
- Hit targets are at least `--control-h`.
- Forms: visible labels, inline errors in `--error` tied to their field with
  `aria-describedby`, and a status message that says what happened.
- Empty states say what will appear and where to look meanwhile.

## Banned

- Pure white page background; gradients; glass, blur and grain; radial orbs;
  dot grids; decorative coloured stripes or bars
- Neon, rainbow, generic pastel, or purple-and-black palettes
- Shadows on everything; rounded containers; card grids; bento grids;
  three feature cards; decorative terminal windows; checkmark bullets
- Sparkle icons, emoji, Lucide icons, animated arrows; icons that don't
  clarify an action
- Inter, Geist, Space Grotesk
- Invented testimonials, logos, statistics, customers or claims
- Em dashes, en dashes, and the "not X, it's Y" formula
- Motion that ignores `prefers-reduced-motion` or hijacks scrolling

## Rule of thumb

If something doesn't help a reader understand the work or act on it, remove
it. What stays should feel calm, exact and easy to read.
