// One mutable frame store, shared by the DOM and the WebGL scene.
//
// The rule this file exists to enforce: nothing that changes every frame is allowed to
// become React state. Scroll progress, scroll velocity and the perspective axis are written
// here by a single rAF loop, read directly by useFrame, and published to CSS as custom
// properties. React only re-renders when something genuinely discrete changes — the active
// chapter, and nothing else. That is what keeps the koi from stuttering mid-scroll.

export const frame = {
  progress: 0,      // 0..1 through the active chapter
  page: 0,          // 0..1 through the whole document, straight off the scrollbar
  ease: 0,          // damped follower of page — this is what the rail is actually drawn at
  velocity: 0,      // signed, normalised, smoothed — drives streak and lens response
  speed: 0,         // absolute velocity, eased down; 0 at rest
  axis: -1,         // -1 black koi (conviction) .. +1 white koi (doubt). Opens as he tells it.
  axisEased: -1,    // damped follower, what the scene actually renders
  chapter: 0,       // continuous index across chapters, for the camera path
  active: 'home',
  reduced: false,
  px: 0,            // pointer, normalised -1..1 across the viewport
  py: 0,
  pointerSeen: false,
};

// --- perspective axis -------------------------------------------------------------------

let axisTarget = -1;
const axisListeners = new Set();

export function setAxis(v, {immediate = false} = {}) {
  axisTarget = Math.max(-1, Math.min(1, v));
  if (immediate) { frame.axis = axisTarget; frame.axisEased = axisTarget; }
  for (const fn of axisListeners) fn(axisTarget);
}
export function getAxisTarget() { return axisTarget; }
export function subscribeAxis(fn) { axisListeners.add(fn); return () => axisListeners.delete(fn); }

// --- the single writer ------------------------------------------------------------------

const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt));
const root = typeof document === 'undefined' ? null : document.documentElement;

// Sentinels, not NaN: `Math.abs(v - NaN) > threshold` is false, so a NaN seed would have
// suppressed the very first publish and the custom properties would never be written.
let published = {axis: -999, speed: -999, page: -999};

// Targets for the values that change every frame. Writing a custom property on the root
// element invalidates style for the ENTIRE document, because custom properties inherit — so
// a per-frame write to :root makes the browser recalculate every node on the page on every
// frame. Only --axis lives there, and it only moves when someone drags the slider.
export const targets = {bar: null, hero: null, cinema: null};
export function setTargets(next) { Object.assign(targets, next); }

export function advance(dt) {
  frame.axis = damp(frame.axis, axisTarget, 7, dt);
  frame.axisEased = damp(frame.axisEased, frame.axis, 5, dt);
  frame.speed = damp(frame.speed, Math.min(1, Math.abs(frame.velocity)), 6, dt);
  frame.velocity = damp(frame.velocity, 0, 4, dt);
  if (!root) return;
  // Publish to CSS only when the value has visibly moved. Custom property writes on the
  // root element invalidate style for the whole document, so they are not free.
  const axis01 = (frame.axis + 1) / 2;
  if (Math.abs(axis01 - published.axis) > 0.002) {
    published.axis = axis01;
    root.style.setProperty('--axis', axis01.toFixed(4));
    root.style.setProperty('--axis-signed', frame.axis.toFixed(4));
  }
  // --speed drives a variable font's width axis, and changing a variation axis re-rasterises
  // every glyph it touches — on the largest type on the page, every frame. Quantising to
  // eighths turns roughly 170 possible re-rasters across the speed range into 8. The
  // narrowing still reads as continuous because the type is enormous and the steps are not.
  const speedStep = Math.round(frame.speed * 8) / 8;
  if (speedStep !== published.speed) {
    published.speed = speedStep;
    targets.hero?.style.setProperty('--speed', speedStep.toFixed(3));
  }
  syncSide();
  // The bar reports where the rail is, not where the scrollbar is, so it never runs ahead
  // of the thing the reader is actually looking at.
  if (Math.abs(frame.ease - published.page) > 0.002) {
    published.page = frame.ease;
    targets.bar?.style.setProperty('transform', `scaleX(${frame.ease.toFixed(4)})`);
  }
}

// --- chapter change, the one thing React is told about ----------------------------------

const chapterListeners = new Set();
export function subscribeChapter(fn) { chapterListeners.add(fn); return () => chapterListeners.delete(fn); }
export function setActiveChapter(id) {
  if (id === frame.active) return;
  frame.active = id;
  for (const fn of chapterListeners) fn(id);
}

// --- side, the one discrete fact derived from a continuous value ------------------------
// Crossing the midpoint flips pointer targets and screen-reader visibility. That is a real
// state change, so React is allowed to hear about it — once per crossing, never per frame.

const sideListeners = new Set();
let side = 'conviction';
export function subscribeSide(fn) { sideListeners.add(fn); return () => sideListeners.delete(fn); }
export function currentSide() { return side; }
export function syncSide() {
  const next = frame.axis > 0 ? 'doubt' : 'conviction';
  if (next === side) return;
  side = next;
  if (root) root.dataset.side = side;
  for (const fn of sideListeners) fn(side);
}
