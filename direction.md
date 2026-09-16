# The Duality Axis — direction memo

Reviewed 14 Sep 2026 against source rev `dc3fe4f` (version 6).
Live doc: https://claude.ai/code/artifact/1430e692-5dda-4cf7-af81-950b99250610

## Verified state

`npm ci` → `npm run check` → `npm run build` all pass. Rebuild produces byte-identical
bundle hashes to the shipped `ready-to-publish/`, so source and published build match.
Browser QA at 1440x900 and 390x844: zero page errors, zero console errors. This was the
first real browser check the project has had.

Two collisions `check.mjs` cannot catch:
- Mobile: black koi swims across the word "A" in the hero subline.
- Desktop: white koi passes through the "My work" cursor artifact.

## Diagnosis — why it doesn't read as advanced

1. **All the hard work is invisible.** `factory.js` is 24KB of real procedural geometry
   (CatmullRom tubes, extrusions, parametric surfaces, geometry merging, an
   `onBeforeCompile` water shader). A visitor just sees "a cassette."
2. **The visible layer is conservative.** 34KB of CSS: 7 transitions, 2 keyframes,
   6 custom properties, 0 scroll-driven animation, 0 View Transitions, 0 post-processing.
3. **Scroll is measured and discarded.** `App.jsx:23` computes `frame.current.progress`
   and `.velocity` every frame. `progress` is used once (×0.13, on a rotation).
   `velocity` is never read.
4. **GSAP ships to do two fade-ins.** Plus 1.15MB of Three.js before first paint and a
   577KB leather normal map tiled 3x2.

## The idea

Build the site around **duality**. The through-line in Tushar's own material — mediator,
Left Middle Right and echo chambers, yin/yang and the twin's koi tattoos, "I used to die
on every hill, now I choose," Timshel, The Fountainhead, and a career of walking away on
conviction — is *two sides, and the decision to pick one*.

A single global perspective axis (−1 to +1, black koi to white koi) that re-renders
content rather than toggling a theme. Every chapter carries two honest readings — the
conviction and the doubt. One value drives type, colour grade, WebGL lighting and the koi
together: a CSS custom property piped into shader uniforms, so DOM and canvas are one
system.

## Supporting moves, ranked

1. Make scroll the engine — continuous camera path, `animation-timeline: view()` with
   ScrollTrigger fallback, velocity-driven koi streak.
2. Prove the geometry is procedural — build/wireframe toggle with live tri/draw-call readout.
3. The career as a decision graph, not a timeline — branches, forks, roads not taken.
4. Variable typography driven by the axis.
5. Real rendering — custom post pass, tone mapping, dithering, contact shadows.
6. Generate the printable resume from `narrative.js` — one source, two outputs.
7. Performance as a skill signal — defer 3D past FCP, compress/replace heavy textures.

## Keep

The writing in `narrative.js` — voice unchanged. The India, work and play chapter
compositions. The problem is concept and motion, not prose or page design.

## Recommendation

Commit to three: **the duality axis**, **the scroll engine**, **the procedural reveal**.
Everything else is finish work that can land incrementally once the spine is right.

## Constraint: no AI tells

Applies to the site and to every deliverable in this project. Avoid the current
generated-design cluster:

- warm cream (#F4F1EA) grounds with a serif display and terracotta accent
- near-black with a single acid-green or vermilion pop
- purple-to-blue gradient heroes
- Inter or Space Grotesk as the default face
- emoji as section markers; everything centred; uniform rounded corners
- coloured accent bars or rails clipped to the left edge of cards
- uppercase letterspaced mono eyebrows stacked on every section
- 01/02/03 numbering applied to content that is not actually a sequence

Rule of thumb: every structural device must encode something true about the content.
If a rule, a number or a label could be deleted without losing information, delete it.
