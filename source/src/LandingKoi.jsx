import {Suspense, useRef, Component, memo, useEffect, useState, useMemo} from 'react';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {Environment, Lightformer} from '@react-three/drei';
import * as THREE from 'three';
import {Artifact} from './Models.jsx';
import {koiMetrics, koiRoute} from './scene-layout.js';
import {frame} from './state.js';

// The hero name's real bounding box, measured in the DOM by App and published as custom
// properties. The koi ring the type itself rather than a guessed rectangle.
function useNameBox() {
  const [box, setBox] = useState(null);
  useEffect(() => {
    const num = n => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(n));
    const read = () => {
      const cx = num('--name-cx'), cy = num('--name-cy'), w = num('--name-w'), h = num('--name-h');
      if ([cx, cy, w, h].some(Number.isNaN)) return;
      setBox(prev => (!prev || Math.abs(prev.w - w) > 2 || Math.abs(prev.cy - cy) > 2 ? {cx, cy, w, h} : prev));
    };
    read();
    const t = setInterval(read, 400);
    window.addEventListener('resize', read);
    return () => {clearInterval(t); window.removeEventListener('resize', read);};
  }, []);
  return box;
}

/* --------------------------------------------------------------------------------------
   THE POOL
   A black koi on a near-black page is invisible, so the fish need water to read against:
   three layers of warped noise ridged into filaments, falling off radially so it reads as a
   pool of light rather than a rectangle. It also brightens under the cursor, so the water
   answers the pointer even before a fish does.
   -------------------------------------------------------------------------------------- */
const causticsMaterial = () => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: {
    uTime: {value: 0}, uTint: {value: new THREE.Color('#6D46B8')},
    uGain: {value: 1}, uPointer: {value: new THREE.Vector2(9, 9)},
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `
    precision highp float;
    uniform float uTime; uniform vec3 uTint; uniform float uGain; uniform vec2 uPointer;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      vec2 u = f*f*(3.0-2.0*f);
      return mix(mix(hash(i), hash(i+vec2(1,0)), u.x),
                 mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
    }
    float caustic(vec2 p, float t){
      vec2 q = p;
      q += 0.26 * vec2(noise(p*1.5 + t*0.09), noise(p*1.7 - t*0.08));
      float n = noise(q*2.0 + t*0.13);
      n = 1.0 - abs(n*2.0 - 1.0);
      return pow(n, 2.4);
    }
    void main(){
      vec2 p = (vUv - 0.5) * vec2(2.4, 1.6);
      float pool = smoothstep(1.2, 0.05, length(p));
      float c = caustic(p, uTime) * 0.80
              + caustic(p * 1.5 + 4.0, uTime * 0.71) * 0.42
              + caustic(p * 0.55 - 2.0, uTime * 1.13) * 0.32;
      // a soft swell of light under the pointer
      float touch = smoothstep(0.62, 0.0, distance(p, uPointer));
      c *= pool * uGain;
      c += touch * pool * 0.34;
      vec3 col = mix(uTint, vec3(0.93, 0.90, 1.0), clamp(c * 0.55, 0.0, 1.0));
      float depth = pool * 0.12;
      gl_FragColor = vec4(col * (c * 0.72 + depth), clamp(c * 0.6 + depth, 0.0, 1.0));
    }
  `,
});

function Pool({motion, copyHeight, name}) {
  const mat = useMemo(causticsMaterial, []);
  const {size, viewport} = useThree();
  const m = koiMetrics(size.width, size.height, -1, copyHeight, name);
  const unit = viewport.width / size.width;
  const t = useRef(0);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame((_, dt) => {
    const d = Math.min(dt, .05);
    if (motion) t.current += d;
    mat.uniforms.uTime.value = t.current;
    mat.uniforms.uGain.value = THREE.MathUtils.damp(mat.uniforms.uGain.value, 1 + frame.speed * .45, 4, d);
    // pointer in the plane's own UV-ish space
    const w = (m.radiusX + m.fishRadius) * 2.6 * unit, h = (m.radiusY + m.fishRadius) * 2.9 * unit;
    const px = frame.pointerSeen ? (frame.px * viewport.width / 2 - m.cx * unit) / (w / 2) * 1.2 : 9;
    const py = frame.pointerSeen ? (frame.py * viewport.height / 2 - m.cy * unit) / (h / 2) * 0.8 : 9;
    mat.uniforms.uPointer.value.set(px, py);
  });
  const w = (m.radiusX + m.fishRadius) * 2.6 * unit;
  const h = (m.radiusY + m.fishRadius) * 2.9 * unit;
  return (
    <mesh position={[m.cx * unit, m.cy * unit, -1.2]} material={mat}>
      <planeGeometry args={[w, h, 1, 1]} />
    </mesh>
  );
}

/* --------------------------------------------------------------------------------------
   ONE KOI
   Two behaviours blended by proximity. Left alone, it swims its share of the ring around the
   name. Bring the cursor close and it breaks orbit to circle the pointer instead, then eases
   back to the ring when you leave. Everything per-frame is read from refs and the shared frame
   store, never from React state, so nothing here can cause a render mid-scroll.
   -------------------------------------------------------------------------------------- */
function Swimmer({side, motion, copyHeight, name}) {
  const ref = useRef(), body = useRef();
  const elapsed = useRef(0), lean = useRef(0), stretch = useRef(1);
  const lure = useRef(0);                       // 0 = on the ring, 1 = circling the cursor
  const pos = useRef(new THREE.Vector2());
  const prev = useRef(new THREE.Vector2());
  const started = useRef(false);
  const {size, viewport} = useThree();

  useFrame((_, dt) => {
    if (!ref.current) return;
    const d = Math.min(dt, .05);
    if (motion) elapsed.current += d;

    const p = koiRoute(elapsed.current, side, size.width, size.height, copyHeight, name);
    const unit = viewport.width / size.width;

    // where the ring wants this fish to be, in world units
    const ringX = p.x * unit, ringY = p.y * unit;

    // where the cursor is, in the same units
    const cx = frame.px * viewport.width / 2;
    const cy = frame.py * viewport.height / 2;
    const reach = p.fishRadius * unit * 3.8;
    const dist = Math.hypot(cx - ringX, cy - ringY);
    const want = motion && frame.pointerSeen && dist < reach ? 1 : 0;
    // approach quickly, let go slowly — that asymmetry is what makes it feel curious
    lure.current = THREE.MathUtils.damp(lure.current, want, want ? 3.4 : 1.1, d);

    // a small orbit around the pointer so they circle it rather than stick to it
    const orbitR = p.fishRadius * unit * 1.5;
    const a = elapsed.current * 1.25 + (side > 0 ? Math.PI : 0);
    const lureX = cx + Math.cos(a) * orbitR;
    const lureY = cy + Math.sin(a) * orbitR * .72;

    const targetX = THREE.MathUtils.lerp(ringX, lureX, lure.current);
    const targetY = THREE.MathUtils.lerp(ringY, lureY, lure.current);

    if (!started.current) {pos.current.set(targetX, targetY); prev.current.copy(pos.current); started.current = true;}
    prev.current.copy(pos.current);
    pos.current.x = THREE.MathUtils.damp(pos.current.x, targetX, 4.2, d);
    pos.current.y = THREE.MathUtils.damp(pos.current.y, targetY, 4.2, d);

    // heading comes from actual travel, so a fish always faces where it is going
    const vx = pos.current.x - prev.current.x, vy = pos.current.y - prev.current.y;
    const moving = Math.hypot(vx, vy) > 1e-5;
    const heading = moving ? Math.atan2(vy, vx) : Math.atan2(p.dy, p.dx);

    const v = motion ? frame.velocity : 0;
    lean.current = THREE.MathUtils.damp(lean.current, THREE.MathUtils.clamp(v * .9, -.5, .5), 6, d);
    // tail-stretch from its own speed as well as the page's
    const own = Math.min(.3, Math.hypot(vx, vy) * 16);
    stretch.current = THREE.MathUtils.damp(stretch.current, 1 + Math.min(.26, Math.abs(v) * .3 + own), 5, d);

    const pulse = motion ? 1 + Math.sin(elapsed.current * 1.3 + side) * .02 : 1;
    ref.current.position.set(pos.current.x, pos.current.y, side < 0 ? .3 : -.3);
    ref.current.rotation.set(
      -0.42 + Math.sin(p.angle) * .1 + lean.current * .45,
      0,
      heading + Math.PI / 2 + lean.current
    );
    ref.current.scale.setScalar(p.fishRadius * unit * pulse * (1 + lure.current * .08));
    if (body.current) body.current.scale.set(1 / stretch.current, stretch.current, 1);
  });

  return (
    <group ref={ref}>
      <group ref={body}>
        <Artifact id={side < 0 ? 'black-koi' : 'white-koi'} reduced={!motion} />
      </group>
    </group>
  );
}

class OptionalScene extends Component {
  state = {failed: false};
  static getDerivedStateFromError() {return {failed: true};}
  render() {return this.state.failed ? null : this.props.children;}
}

function LandingKoi({motion}) {
  const name = useNameBox();
  const copyHeight = 0;
  return (
    <div className="landing-koi" aria-hidden="true">
      <OptionalScene>
        <Canvas
          resize={{scroll: false, debounce: {resize: 200, scroll: 0}}}
          dpr={[1, window.innerWidth > 1700 ? 1.35 : 1.75]}
          camera={{position: [0, 0, 14], fov: 40, near: .1, far: 60}}
          gl={{alpha: true, antialias: true, powerPreference: 'high-performance'}}>
          <ambientLight intensity={.55} />
          <directionalLight position={[-2, 3, -6]} intensity={3.2} color="#C9A6FF" />
          <directionalLight position={[-3, 5, 6]} intensity={2.1} color="#FFF3DF" />
          <directionalLight position={[4, 1, 3]} intensity={1.1} color="#9C7BFF" />
          <Environment resolution={64} frames={1}>
            <Lightformer intensity={2.4} position={[0, 2, 5]} scale={[7, 7, 1]} />
            <Lightformer intensity={1.6} position={[0, -2, -4]} scale={[6, 4, 1]} color="#B98BFF" />
          </Environment>
          <Pool motion={motion} copyHeight={copyHeight} name={name} />
          <Suspense fallback={null}>
            <Swimmer side={-1} motion={motion} copyHeight={copyHeight} name={name} />
            <Swimmer side={1} motion={motion} copyHeight={copyHeight} name={name} />
          </Suspense>
        </Canvas>
      </OptionalScene>
    </div>
  );
}

export default memo(LandingKoi);
