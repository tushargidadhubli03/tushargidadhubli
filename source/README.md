# Tushar Gidadhubli: a little world of my own

A static React website built around a complete personal story, every professional role, and an original animated 3D world. No application server, database, API key, or paid asset service is required.

## Put the folder on GitHub

The download has two folders:

- **ready-to-publish/**: the finished website. Upload its contents, including `index.html` and `assets/`, to a GitHub repository. Under **Settings → Pages**, choose **Deploy from a branch**, your branch, and **/ (root)**. GitHub provides the address after publication.
- **source/**: the editable project. Upload its contents, preserving `.github/workflows/deploy.yml`. Under **Settings → Pages**, select **GitHub Actions**. Pushing to `main` installs dependencies, runs checks, builds, and publishes the website. If the file picker hides `.github`, create the workflow using GitHub’s file editor.

Use one route. Never upload `node_modules`. No secrets are required for the supplied workflow. Keep the finished assets together. Double-clicking `index.html` does not run JavaScript modules correctly; use hosting or the local preview commands below.

Relative asset paths support GitHub project URLs as well as root domains. Hash links such as `#work` and `#music` work without server rewrites.

## Run or edit locally

Install Node.js 22.12 or newer. Inside the source folder:

```sh
npm ci
npm run dev
```

To build and inspect the production output:

```sh
npm run build
npm run check
npm run preview
```

The production website is written to `dist/`. Upload its contents to any static host.

## Where to edit

| File | Contents |
| --- | --- |
| `src/content.js` | Public contact links, name, and book reflections |
| `src/narrative.js` | Full personal story, all 11 professional roles, and capabilities |
| `src/App.jsx` | Page content, the single frame loop, navigation, reading mode, Spotify and breathing interactions |
| `src/state.js` | The shared frame store — scroll progress, velocity and the perspective axis |
| `src/Perspective.jsx` | The perspective axis control and the two-reading crossfade |
| `src/Urbanysis.jsx` | The Urbanysis depth level and its claim-state markers |
| `src/Career.jsx` | Career narrative and experience overview |
| `src/Interactions.jsx` | Perspective exercises and playable basketball |
| `src/World.jsx` | Scene transitions, camera, lighting, object interaction |
| `src/Models.jsx` | Shared texture loading, model lifecycle, and animation |
| `src/artifacts/factory.js` | Detailed geometry, articulated mechanisms, materials, and water shaders |
| `src/LandingKoi.jsx` | Independent black and white koi on the landing page |
| `src/scene-layout.js` | Reserved artifact cells, label spacing, and koi paths |
| `src/styles.css` | Typography and responsive layouts |

The contact section links to `tushar@directive17.com` and includes an email-copy button. The LinkedIn link opens `https://www.linkedin.com/in/tushargidadhubli/`. Edit these links in `src/content.js`. Empty fields produce no placeholder contact buttons. Rebuild after editing source.

## The experience

Purple is the primary color, with lilac surfaces, warm ivory, and muted gold accents across the interface and 3D materials.

The opening pairs large typography with a separate interactive stage. Its text height is measured after fonts load to reserve space for every line. Scroll continuously through the story, professional journey, music, books, India, play, possible futures, and a conversation invitation. Navigation also supports direct chapter selection, browser back/forward, and an unexplored-chapter shuffle.

The professional section leads with Chief Administrative Officer at Directive 17. All 11 roles remain available as both a narrative and a compact experience ledger. Dates that were not supplied remain broad rather than invented.

The full personal story includes values, learning, mediation, the family connection to India, the aarti memory, music, literature, the twin sister as a supporting detail, and the Thanos retirement joke. The former destination list is removed.

**The perspective axis.** Every chapter carries two honest readings: the conviction, as Tushar tells it, and the doubt — the same facts argued against him. One value from -1 to +1 drives the crossfade, the type, the colour grade and the scene lighting at once. It is published as a CSS custom property and read directly by the WebGL loop, so the DOM and the canvas move as one system. Deep links carry it: `#work@0.6` opens that chapter part-way toward the counter-reading.

**One frame loop.** Scroll position, velocity and the axis are held in `src/state.js` and advanced by a single requestAnimationFrame loop that writes custom properties. React re-renders only when the active chapter changes. Nothing re-renders per frame, which is what keeps the landing koi smooth while the page scrolls.

**The build view.** The toggle in the world controls strips every artifact back to the geometry that produced it, with live triangle, vertex, mesh, material and shader counts measured from the scene graph. All of it is generated at runtime; no model was downloaded.

**The career, plotted.** The work chapter offers the narrative, a real month axis from 2022 to the present with concurrent roles visible, and the complete record as a list. Roles carry a tier: the ones that carry the story are emphasised, the rest are present because they happened.

The artifacts are original Three.js geometry with independently animated parts. The cassette has a molded casing, cut-out window, tape windings, reel hubs, screws, and a printed label. The bound book has curved paper signatures, cloth texture, gold tooling, and a turning leaf with separate front and back printing. The stepwell has carved columns, arches, fluted domes, solid masonry, and reflective water. The basketball uses pebble-grain color and normal maps with embedded channels. The retirement island includes a framed fabric chair and individual palm leaflets.

One black koi and one white koi swim in mirrored circular paths along the landing page’s outside margins. Their bodies, tails, and fins move together, and each complete orbit remains inside the screen. The story and contact chapters use the paired koi. Each main artifact has a reserved area that includes its full animated bounds, rotation, hover enlargement, and a separate label lane. The opening uses five columns on large screens and three on tablets. On phones, it becomes a 3D orbit carousel with one large artifact in focus, neighboring objects receding in depth, swipe navigation, automatic progression, and a separate caption card. The artifacts link to their chapters.

Other interactions include two reading reflections, three perspective exercises, a ten-second breathing moment, and a basketball mini-game with adjustable aim, trajectory preview, scoring, and reset. Spotify loads only after the visitor chooses to open the listening room; playback depends on Spotify and the visitor’s region.

Rendering runs through a small post-processing pass: a chromatic split that only appears while the page is moving, fine overlay grain, a vignette and ACES tone mapping, plus contact shadows so objects sit in space. Chapter entrances use native scroll-driven animation where the browser supports it, with a visible resting state everywhere else. Motion respects the device’s reduced-motion setting and has an explicit toggle. The desktop has a “Just the words” mode. Navigation and content remain accessible when WebGL fails. Browser printing removes the 3D canvas and navigation. Fonts are bundled locally. There are no analytics, server-side visitor tracking, AI API calls, or visitor accounts.

## Verification and remaining details

The production build and automated checks cover all roles and personal-story content, corrected facts, navigation targets, basketball physics, and portable asset references. Artifact checks sample real mesh vertices across animation poses, project their motion and rotation bounds through the camera, check desktop artifact and label areas for overlap, and verify the mobile carousel’s focus and caption zones at eight viewport sizes from 320 to 1920 pixels wide. Koi paths are checked for constant circular radius, tangent heading, safe margins, and full-body edge clearance. Standalone native renders were inspected for model quality. These checks do not establish browser rendering or frame rate on actual devices. Browser visual testing remains blocked by the available browser environment’s URL policy.

Email contact, LinkedIn, and the music link are active. Exact date ranges remain unspecified for Left Middle Right, Sigur Center, Urbanysis, and Equinox’s end date.

## Assets and licenses

3D geometry is generated by the app. Original label, page, and material textures are bundled in `public/artifacts/`; their optional generator is `scripts/generate-artifact-textures.py` (Python, Pillow, NumPy). The website requires no Python runtime. No external model hosting is required. Fontsource fonts use the SIL Open Font License; Lucide icons use the ISC license. See `THIRD_PARTY_NOTICES.md` for dependency notices. The earlier concept illustration was a visual reference, not a background image.
