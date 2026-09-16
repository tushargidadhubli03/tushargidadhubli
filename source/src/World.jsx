import {Suspense, useRef, Component, useState, useSyncExternalStore} from 'react';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {Environment, Lightformer, Html, ContactShadows, AdaptiveDpr} from '@react-three/drei';
import {EffectComposer, Vignette, Noise, ToneMapping} from '@react-three/postprocessing';
import {BlendFunction} from 'postprocessing';
import * as THREE from 'three';
import {Artifact} from './Models.jsx';
import {focusLayout, focusModel} from './scene-layout.js';
import {frame, subscribeChapter} from './state.js';


function useActive() {
  return useSyncExternalStore(subscribeChapter, () => frame.active, () => 'home');
}

// --- rendering ---------------------------------------------------------------------------

// Light that answers the perspective axis. Conviction is warm and directional; doubt is
// cooler, flatter and less certain of itself. Same scene, different conditions.
function AxisLight() {
  const key = useRef(), fill = useRef(), amb = useRef();
  const warm = new THREE.Color('#fff1db'), cool = new THREE.Color('#d9e2ff');
  const c = new THREE.Color();
  useFrame((_, dt) => {
    const t = (frame.axisEased + 1) / 2;
    const d = Math.min(dt, .05);
    if (key.current) {
      key.current.color.copy(c.copy(warm).lerp(cool, t));
      key.current.intensity = THREE.MathUtils.damp(key.current.intensity, 3.1 - t * 1.15, 4, d);
      key.current.position.x = THREE.MathUtils.damp(key.current.position.x, -4 + t * 8, 3, d);
    }
    if (fill.current) fill.current.intensity = THREE.MathUtils.damp(fill.current.intensity, 1.05 + t * .75, 4, d);
    if (amb.current) amb.current.intensity = THREE.MathUtils.damp(amb.current.intensity, .48 + t * .3, 4, d);
  });
  return <>
    <ambientLight ref={amb} intensity={.48} />
    <directionalLight ref={key} position={[-4, 6, 7]} intensity={3.1} color="#fff1db" castShadow shadow-mapSize={[1024, 1024]} shadow-normalBias={.025} />
    <directionalLight ref={fill} position={[5, 1, 2]} intensity={1.05} color="#e2d7ff" />
    <Environment resolution={256} frames={1}>
      <Lightformer form="rect" intensity={2.6} position={[-4, 4, 5]} scale={[4, 7, 1]} />
      <Lightformer form="rect" intensity={1.9} position={[4, 1, 4]} scale={[2, 6, 1]} />
      <Lightformer form="rect" intensity={1.35} position={[0, -1, 7]} scale={[7, 4, 1]} />
      <Lightformer form="rect" intensity={3} position={[0, 6, -3]} rotation={[Math.PI / 3, 0, 0]} scale={[7, 2, 1]} />
    </Environment>
  </>;
}

// Grain, vignette and filmic tone mapping only. A chromatic split was in here and it
// fringed every edge in red and blue even at rest, which looked like a cheap filter rather
// than a lens. Removed rather than tuned.
function Post() {
  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <Noise opacity={.02} blendFunction={BlendFunction.OVERLAY} />
      <Vignette eskil={false} offset={.3} darkness={.5} />
      <ToneMapping />
    </EffectComposer>
  );
}

// --- objects -----------------------------------------------------------------------------

function Sculpture({id, active, motion, build, meditating}) {
  const root = useRef(), form = useRef(), drag = useRef(null);
  const state = useRef({x: 0, y: 0, vx: 0, vy: 0, hover: false});
  const pulse = useRef(0);        // click envelope, read by the artifact's own animation
  const punch = useRef(0);        // scale spring, decays back to 1
  const spin = useRef(0);         // rotational impulse from a click
  const {viewport, size, pointer} = useThree();
  const home = active === 'home';
  const placement = focusLayout(id, active, viewport.width, viewport.height, size.width < 760);

  useFrame(({clock}, dt) => {
    if (!root.current || !form.current) return;
    const d = Math.min(dt, .04), s = state.current;
    root.current.position.set(placement.x, placement.y, placement.z || 0);

    if (!drag.current) {s.x += s.vx * d; s.y += s.vy * d; s.vx *= Math.exp(-d * 4); s.vy *= Math.exp(-d * 4);}
    spin.current *= Math.exp(-d * 2.6);
    punch.current = THREE.MathUtils.damp(punch.current, 0, 7, d);

    // Hover lifts, a click punches the scale, and the object keeps a little momentum.
    const hover = motion && s.hover ? 1.05 : 1;
    form.current.scale.setScalar(placement.scale * hover * (1 + punch.current * .16));

    const floatAmount = .018;
    form.current.position.y = motion ? Math.sin(clock.elapsedTime * .72) * placement.scale * floatAmount : 0;

    // The object tracks the cursor. This is the single cheapest thing that makes a scene
    // feel alive rather than like a prop sitting in front of a camera.
    const track = motion && !drag.current ? .34 : 0;
    const lean = motion ? THREE.MathUtils.clamp(frame.velocity * .35, -.28, .28) : 0;
    form.current.rotation.set(
      s.y + (motion ? Math.sin(clock.elapsedTime * .25) * .035 : 0) + lean * .5 - pointer.y * track * .5,
      s.x + (motion ? Math.sin(clock.elapsedTime * .28) * .075 : 0) + frame.progress * .55 + pointer.x * track + spin.current,
      motion ? (id === 'play' ? clock.elapsedTime * .12 : Math.sin(clock.elapsedTime * .22) * .018) - lean * .35 : 0
    );
  });

  const strike = () => {pulse.current = 1; punch.current = 1; spin.current = 1.15;};
  const handlers = {
    onPointerOver: e => {e.stopPropagation(); state.current.hover = true; document.documentElement.dataset.artifactHover = 'true';},
    onPointerOut: () => {state.current.hover = false; document.documentElement.dataset.artifactHover = 'false';},
    onPointerDown: e => {e.stopPropagation(); drag.current = {x: e.clientX, y: e.clientY, distance: 0}; e.target.setPointerCapture?.(e.pointerId);},
    onPointerMove: e => {
      if (!drag.current) return;
      const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
      drag.current = {x: e.clientX, y: e.clientY, distance: drag.current.distance + Math.abs(dx) + Math.abs(dy)};
      state.current.x += dx * .009; state.current.y += dy * .005;
      state.current.vx = dx * .12; state.current.vy = dy * .07;
    },
    onPointerUp: e => {
      e.stopPropagation();
      if (drag.current && drag.current.distance < 7) strike();
      drag.current = null; e.target.releasePointerCapture?.(e.pointerId);
    },
    onPointerCancel: () => {drag.current = null;},
  };

  return <group ref={root} position={[placement.x, placement.y, placement.z || 0]}>
    <group ref={form} {...handlers}>
      <Artifact id={id === 'work' && !home ? 'statement' : id} reduced={!motion} active={!home} meditating={meditating} build={build} pulseRef={pulse} />
    </group>
  </group>;
}

function Scene(props) {
  const frames = useRef(0), {size} = useThree();
  useFrame(() => {if (frames.current < 2 && ++frames.current === 2) props.onReady();});
  // Home belongs to the koi now. Five small objects in a row read as 3D clip art;
  // one large object per chapter reads as a scene.
  const ids = props.active === 'home' ? [] : [focusModel[props.active]];
  return <>
    <AxisLight />
    {ids.map(id => <Sculpture key={id} id={id} {...props} />)}
    {<ContactShadows position={[0, -Math.min(size.height, 520) / 190, 0]} opacity={.34} scale={14} blur={2.6} far={5} resolution={320} color="#3a1d55" frames={props.motion ? Infinity : 1} />}
  </>;
}

class SceneBoundary extends Component {
  state = {error: false};
  static getDerivedStateFromError() {return {error: true};}
  componentDidCatch(error) {this.props.onFail?.(error?.message || '3D unavailable');}
  render() {return this.state.error ? null : this.props.children;}
}

function Stats({on}) {
  const {gl, scene} = useThree();
  const [s, setS] = useState({tris: 0, verts: 0, meshes: 0, materials: 0, programs: 0});
  const last = useRef(0);
  useFrame(({clock}) => {
    if (!on || clock.elapsedTime - last.current < .5) return;
    last.current = clock.elapsedTime;
    let tris = 0, verts = 0, meshes = 0;
    const mats = new Set();
    scene.traverse(o => {
      if (!o.isMesh || !o.geometry) return;
      meshes++;
      // In build mode the meshes share one wireframe material, so count the originals.
      mats.add((o.userData._mat || o.material)?.uuid);
      const pos = o.geometry.attributes?.position;
      if (!pos) return;
      verts += pos.count;
      tris += (o.geometry.index ? o.geometry.index.count : pos.count) / 3;
    });
    setS({tris: Math.round(tris), verts, meshes, materials: mats.size, programs: gl.info.programs?.length ?? 0});
  });
  if (!on) return null;
  return <Html position={[0, 0, 0]} fullscreen zIndexRange={[6, 5]}>
    <div className="render-stats">
      <strong>Built in the browser</strong>
      <dl>
        <div><dt>triangles</dt><dd>{s.tris.toLocaleString()}</dd></div>
        <div><dt>vertices</dt><dd>{s.verts.toLocaleString()}</dd></div>
        <div><dt>meshes</dt><dd>{s.meshes}</dd></div>
        <div><dt>materials</dt><dd>{s.materials}</dd></div>
        <div><dt>shaders</dt><dd>{s.programs}</dd></div>
      </dl>
      <small>Every object here is generated from primitives at runtime — parametric surfaces, extrusions, swept tubes. Nothing was downloaded.</small>
    </div>
  </Html>;
}

/* --------------------------------------------------------------------------------------
   RESOLUTION UNDER LOAD
   The scene renders every frame whether or not anything is moving, and on a high-density
   display a full-resolution redraw during a scroll is the single most expensive thing on
   the page. R3F already has the machinery for this: regress() tells the renderer the user
   is busy, and AdaptiveDpr drops the buffer resolution while that is true and restores it
   the moment the scroll settles. Nobody can resolve a pixel on a surface that is moving.
   -------------------------------------------------------------------------------------- */
function Regressor() {
  const regress = useThree(s => s.performance.regress);
  useFrame(() => { if (frame.speed > 0.012) regress(); });
  return null;
}

export default function World(props) {
  const active = useActive();
  return <div className={`cinema ${active === 'home' ? 'cinema-home' : 'cinema-chapter'}`} aria-label="Interactive 3D objects">
    <SceneBoundary onFail={props.onFail}>
      <Canvas
        resize={{scroll: false, debounce: {resize: 200, scroll: 0}}}
        performance={{min: 0.4, max: 1, debounce: 160}}
        shadows dpr={[1, Math.min(1.6, window.innerWidth > 1700 ? 1.25 : 1.6)]}
        camera={{position: [0, 0, 14], fov: 40, near: .1, far: 80}}
        gl={{antialias: false, alpha: true, powerPreference: 'high-performance'}}
        onCreated={({gl}) => gl.setClearColor(0x000000, 0)}>
        <Suspense fallback={null}>
          <Scene {...props} active={active} />
          <Stats on={props.build} />
        </Suspense>
        <Post />
        <Regressor />
        <AdaptiveDpr pixelated={false} />
      </Canvas>
    </SceneBoundary>
  </div>;
}
