import{r,q as t,v as H,af as O,ag as U,Z,w as Y,u as _,d as b,k as J,ah as Q,p}from"./three-OBlk6o1Y.js";import{k as $,A as ee,f,c as te}from"./index-Dy5Ez5Ib.js";function ne(){const[s,a]=r.useState(null);return r.useEffect(()=>{const c=u=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue(u)),i=()=>{const u=c("--name-cx"),e=c("--name-cy"),n=c("--name-w"),d=c("--name-h");[u,e,n,d].some(Number.isNaN)||a(l=>!l||Math.abs(l.w-n)>2||Math.abs(l.cy-e)>2?{cx:u,cy:e,w:n,h:d}:l)};i();const h=setInterval(i,400);return window.addEventListener("resize",i),()=>{clearInterval(h),window.removeEventListener("resize",i)}},[]),s}const re=()=>new Z({transparent:!0,depthWrite:!1,blending:Q,uniforms:{uTime:{value:0},uTint:{value:new J("#6D46B8")},uGain:{value:1},uPointer:{value:new b(9,9)}},vertexShader:`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,fragmentShader:`
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
  `});function se({motion:s,copyHeight:a,name:c}){const i=r.useMemo(re,[]),{size:h,viewport:u}=Y(),e=$(h.width,h.height,-1,a,c),n=u.width/h.width,d=r.useRef(0);r.useEffect(()=>()=>i.dispose(),[i]),_((g,M)=>{const x=Math.min(M,.05);s&&(d.current+=x),i.uniforms.uTime.value=d.current,i.uniforms.uGain.value=p.damp(i.uniforms.uGain.value,1+f.speed*.45,4,x);const y=(e.radiusX+e.fishRadius)*2.6*n,S=(e.radiusY+e.fishRadius)*2.9*n,j=f.pointerSeen?(f.px*u.width/2-e.cx*n)/(y/2)*1.2:9,m=f.pointerSeen?(f.py*u.height/2-e.cy*n)/(S/2)*.8:9;i.uniforms.uPointer.value.set(j,m)});const l=(e.radiusX+e.fishRadius)*2.6*n,o=(e.radiusY+e.fishRadius)*2.9*n;return t.jsx("mesh",{position:[e.cx*n,e.cy*n,-1.2],material:i,children:t.jsx("planeGeometry",{args:[l,o,1,1]})})}function X({side:s,motion:a,copyHeight:c,name:i}){const h=r.useRef(),u=r.useRef(),e=r.useRef(0),n=r.useRef(0),d=r.useRef(1),l=r.useRef(0),o=r.useRef(new b),g=r.useRef(new b),M=r.useRef(!1),{size:x,viewport:y}=Y();return _((S,j)=>{if(!h.current)return;const m=Math.min(j,.05);a&&(e.current+=m);const v=te(e.current,s,x.width,x.height,c,i),w=y.width/x.width,P=v.x*w,T=v.y*w,k=f.px*y.width/2,E=f.py*y.height/2,q=v.fishRadius*w*3.8,A=Math.hypot(k-P,E-T),L=a&&f.pointerSeen&&A<q?1:0;l.current=p.damp(l.current,L,L?3.4:1.1,m);const B=v.fishRadius*w*1.5,C=e.current*1.25+(s>0?Math.PI:0),I=k+Math.cos(C)*B,D=E+Math.sin(C)*B*.72,z=p.lerp(P,I,l.current),G=p.lerp(T,D,l.current);M.current||(o.current.set(z,G),g.current.copy(o.current),M.current=!0),g.current.copy(o.current),o.current.x=p.damp(o.current.x,z,4.2,m),o.current.y=p.damp(o.current.y,G,4.2,m);const R=o.current.x-g.current.x,F=o.current.y-g.current.y,V=Math.hypot(R,F)>1e-5?Math.atan2(F,R):Math.atan2(v.dy,v.dx),N=a?f.velocity:0;n.current=p.damp(n.current,p.clamp(N*.9,-.5,.5),6,m);const K=Math.min(.3,Math.hypot(R,F)*16);d.current=p.damp(d.current,1+Math.min(.26,Math.abs(N)*.3+K),5,m);const W=a?1+Math.sin(e.current*1.3+s)*.02:1;h.current.position.set(o.current.x,o.current.y,s<0?.3:-.3),h.current.rotation.set(-.42+Math.sin(v.angle)*.1+n.current*.45,0,V+Math.PI/2+n.current),h.current.scale.setScalar(v.fishRadius*w*W*(1+l.current*.08)),u.current&&u.current.scale.set(1/d.current,d.current,1)}),t.jsx("group",{ref:h,children:t.jsx("group",{ref:u,children:t.jsx(ee,{id:s<0?"black-koi":"white-koi",reduced:!a})})})}class ie extends r.Component{state={failed:!1};static getDerivedStateFromError(){return{failed:!0}}render(){return this.state.failed?null:this.props.children}}function ae({motion:s}){const a=ne(),c=0;return t.jsx("div",{className:"landing-koi","aria-hidden":"true",children:t.jsx(ie,{children:t.jsxs(H,{resize:{scroll:!1,debounce:{resize:200,scroll:0}},dpr:[1,window.innerWidth>1700?1.35:1.75],camera:{position:[0,0,14],fov:40,near:.1,far:60},gl:{alpha:!0,antialias:!0,powerPreference:"high-performance"},children:[t.jsx("ambientLight",{intensity:.55}),t.jsx("directionalLight",{position:[-2,3,-6],intensity:3.2,color:"#C9A6FF"}),t.jsx("directionalLight",{position:[-3,5,6],intensity:2.1,color:"#FFF3DF"}),t.jsx("directionalLight",{position:[4,1,3],intensity:1.1,color:"#9C7BFF"}),t.jsxs(O,{resolution:64,frames:1,children:[t.jsx(U,{intensity:2.4,position:[0,2,5],scale:[7,7,1]}),t.jsx(U,{intensity:1.6,position:[0,-2,-4],scale:[6,4,1],color:"#B98BFF"})]}),t.jsx(se,{motion:s,copyHeight:c,name:a}),t.jsxs(r.Suspense,{fallback:null,children:[t.jsx(X,{side:-1,motion:s,copyHeight:c,name:a}),t.jsx(X,{side:1,motion:s,copyHeight:c,name:a})]})]})})})}const le=r.memo(ae);export{le as default};
