import {useState,useRef,useEffect,useMemo,Suspense,Component} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {Line} from '@react-three/drei';
import {ArrowRight,RotateCcw} from 'lucide-react';
import {Basketball} from './Models.jsx';
import {shotPoint,stepBall,INITIAL_BALL} from './physics.js';
import {notePlayed} from './visit.js';

class Safe3D extends Component { state={failed:false}; static getDerivedStateFromError(){return {failed:true}} render(){return this.state.failed?<span className="webgl-note">{this.props.message||'A little yin and yang.'}</span>:this.props.children} }

// The perspective exercise that used to live here became the site-wide axis. See Perspective.jsx.

function Court({shot,angle,power,onResult,onFinish,motion}){
  const {camera,size}=useThree();
  useEffect(()=>{camera.zoom=Math.min(size.width/7.8,size.height/5.5);camera.updateProjectionMatrix()},[camera,size]);
  const ref=useRef(),body=useRef({...INITIAL_BALL}),counted=useRef(false),running=useRef(false),elapsed=useRef(0),last=useRef(shot);
  const aim=useMemo(()=>Array.from({length:36},(_,i)=>shotPoint(angle,power,i/35*1.35)).filter(p=>p[1]>=.2),[angle,power]);
  useEffect(()=>{if(shot!==last.current){last.current=shot;const rad=angle*Math.PI/180;body.current={...INITIAL_BALL,vx:Math.cos(rad)*power,vy:Math.sin(rad)*power};running.current=true;counted.current=false;elapsed.current=0;}},[shot,angle,power]);
  useFrame((_,dt)=>{
    if(!ref.current)return;
    if(running.current){const prev=body.current;const next=stepBall(prev,Math.min(dt,.03));body.current=next;elapsed.current+=dt;
      if(!counted.current&&prev.y>2.75&&next.y<=2.75&&next.vy<0){counted.current=true;onResult(Math.abs(next.x-2)<.38)}
      if(next.y<.23){body.current.y=.23;body.current.vy=Math.abs(next.vy)*.52;body.current.vx*=.7;}
      if(next.x>2.56&&next.x<2.85&&next.y>2.65&&next.y<4.0&&next.vx>0)body.current.vx*=-.65;
      ref.current.rotation.z-=dt*body.current.vx;
      if(elapsed.current>3.5||Math.abs(next.x)>6){if(!counted.current)onResult(false);running.current=false;body.current={...INITIAL_BALL};onFinish();}
    }
    ref.current.position.set(body.current.x,body.current.y,0);
  });
  return <>
    <ambientLight intensity={1.4}/><directionalLight position={[-4,7,5]} intensity={3} castShadow/>
    <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[15,8]}/><meshStandardMaterial color="#c99d6b" roughness={.9}/></mesh>
    {Array.from({length:18},(_,i)=><Line key={i} points={[[-7+i*.8,.01,-4],[-7+i*.8,.01,4]]} color="#b68957" lineWidth={.5}/>)}
    <Line points={[[-4,.018,-2],[3,.018,-2],[3,.018,2],[-4,.018,2],[-4,.018,-2]]} color="#f6e9d2" lineWidth={1.6}/>
    <mesh position={[2.65,3.3,0]}><boxGeometry args={[.09,1.6,2]}/><meshPhysicalMaterial color="#fcf0dc" transparent opacity={.75} roughness={.35}/></mesh>
    <mesh position={[2,2.75,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.48,.04,12,48]}/><meshStandardMaterial color="#783eb3" roughness={.4}/></mesh>
    {Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return <Line key={i} points={[[2+Math.cos(a)*.46,2.74,Math.sin(a)*.46],[2+Math.cos(a+.22)*.28,2.15,Math.sin(a+.22)*.28]]} color="#fbf2dc" lineWidth={1.2}/>})}
    <mesh position={[2.75,1.2,0]}><boxGeometry args={[.12,2.4,.12]}/><meshStandardMaterial color="#5d3c72"/></mesh>
    {!running.current&&<Line points={aim} color="#61432e" dashed dashSize={.07} gapSize={.16} lineWidth={1} transparent opacity={.5}/>}
    <group ref={ref} position={[INITIAL_BALL.x,INITIAL_BALL.y,0]}><Basketball radius={.23}/></group>
  </>
}
export function HoopGame({motion}){const [angle,setAngle]=useState(54),[power,setPower]=useState(8.6),[shot,setShot]=useState(0),[busy,setBusy]=useState(false),[score,setScore]=useState(0),[attempts,setAttempts]=useState(0),[message,setMessage]=useState('A little break from the existential questions.');
  const shoot=()=>{if(!busy){notePlayed('hoop');setBusy(true);setShot(v=>v+1);setAttempts(v=>v+1);setMessage('Eyes on the rim.')}};
  return <Safe3D message="The court needs a browser with WebGL enabled. The rest of the world is still yours to explore."><section className="hoop-game"><div className="game-score"><span><strong>{score}</strong> buckets</span><span>{attempts} attempts</span><button className="icon-button" aria-label="Reset score" disabled={busy} onClick={()=>{setScore(0);setAttempts(0);setMessage('Fresh start. We all need one.')}}><RotateCcw size={17}/></button></div><div className="court"><Canvas shadows orthographic dpr={[1,1.5]} camera={{position:[0,5.3,12],zoom:48}} onCreated={({camera})=>camera.lookAt(0,1.6,0)}><Suspense fallback={null}><Court angle={angle} power={power} shot={shot} motion={motion} onResult={hit=>{if(hit)setScore(s=>s+1);setMessage(hit?'Bucket. Dostoevsky can wait.':'A little adjustment. Another shot.')}} onFinish={()=>setBusy(false)}/></Suspense></Canvas></div><div className="game-controls"><label>Angle <span>{angle}°</span><input aria-label="Shot angle" type="range" min="35" max="72" step="1" value={angle} disabled={busy} onChange={e=>setAngle(Number(e.target.value))}/></label><label>Power <span>{power.toFixed(1)}</span><input aria-label="Shot power" type="range" min="6" max="11" step=".1" value={power} disabled={busy} onChange={e=>setPower(Number(e.target.value))}/></label><button className="solid-button" disabled={busy} onClick={shoot}>{busy?'In the air…':'Take the shot'}<ArrowRight size={17}/></button></div><p aria-live="polite" className="game-message">{message}</p><small>Adjust angle and power. Follow the dotted arc, then shoot.</small></section></Safe3D>}
