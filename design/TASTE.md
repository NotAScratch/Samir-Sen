# Taste

## Read this before writing any UI

1. Read `design/tokens.css`. Every value used in `styles.css` comes from it.
2. Read `design/references/vercel-DESIGN.md` and `apple-DESIGN.md` for restraint,
   type-scale discipline, and how few colours a confident system actually needs.
3. This is a personal site for an AI robotics / backend engineer. The visual
   language should read as instrumentation, not marketing: signal, perception,
   precision. Not a SaaS landing page.

## What this project looks like

- Dark canvas by default. One phosphor-green accent, reserved for actions,
  live-status indicators, and the 3D scene's wireframe. Never decoration.
- A real WebGL piece (Three.js wireframe geometry + sparse point cloud) stands
  in for the old CSS "sensor orbit" graphic. It is the one moment of dimension
  on an otherwise flat, editorial page — it should not be repeated elsewhere.
- Type-led. One geometric sans for display and UI, one serif used only in
  italics for a single emphasized word per headline, one mono for labels/data.
- Whitespace is the design. Section gaps are large and consistent with the
  scale in tokens.css. When in doubt, remove an element and add space.
- Hairline borders (1px) do the work shadows would normally do. No drop
  shadows anywhere.

## Banned by default

- Gradient text, gradient backgrounds, gradient buttons
- Emoji as icons
- Drop shadows on cards, buttons, or images
- More than one accent colour doing decorative work
- `border-radius` above 10px on anything that is not a pill or an avatar
- Clip-path novelty shapes (the old hero used one — cut it)
- A blocking full-page loading-screen animation with a fake percentage
  counter. It delays the one thing the visitor came to see. Content fades in
  instead.
- More than two font weights on one screen
- Decorative hand-drawn CSS icon illustrations standing in for real content
  (the old per-project "lidar sweep" / "chart bars" / "robot head" graphics).
  Real project screenshots plus a plain numbered placeholder for the two
  without one.

If a brief genuinely requires one of these, say so and ask first.

## Rule of thumb

If you can't point at a token in `tokens.css` for a value, you invented it.
Go add it to the file first, with a reason, or don't use it.
