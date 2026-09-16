import {useMemo,useEffect,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {useTexture} from '@react-three/drei';
import * as THREE from 'three';
import {buildArtifact,disposeArtifact} from './artifacts/factory.js';
const files=['cassette-label.jpg','page-left.jpg','page-right.jpg','leather-color.jpg','leather-normal.jpg','stone-grain.jpg','cloth-grain.jpg'];
const urls=files.map(f=>`${import.meta.env.BASE_URL}artifacts/${f}`);
function useMaterials(){const maps=useTexture(urls);return useMemo(()=>Object.fromEntries(maps.map((tex,i)=>{tex.colorSpace=files[i].includes('normal')||files[i].includes('grain')?THREE.NoColorSpace:THREE.SRGBColorSpace;tex.anisotropy=8;if(files[i].includes('leather')){tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(3,2)}if(files[i].includes('grain')){tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(4,4)}return [files[i],tex]})),[maps])}
// Build mode. The geometry on this site is generated at runtime, which is invisible in a
// finished render — so this strips the materials back to the mesh that produced it.
const wireMat=new THREE.MeshBasicMaterial({color:'#7c46bd',wireframe:true,transparent:true,opacity:.62,depthWrite:false});
function applyBuild(object,on){
 object.traverse(o=>{
  if(!o.isMesh)return;
  if(on){if(!o.userData._mat)o.userData._mat=o.material;o.material=wireMat;o.castShadow=false}
  else if(o.userData._mat){o.material=o.userData._mat;delete o.userData._mat;o.castShadow=true}
 });
}

export function Artifact({id,reduced=false,active=false,meditating=false,build=false,pulseRef=null,...props}){
 const textures=useMaterials();const object=useMemo(()=>buildArtifact(id,textures),[id,textures]);
 const elapsed=useRef(0);
 useEffect(()=>()=>disposeArtifact(object),[object]);
 useEffect(()=>{applyBuild(object,build);return()=>applyBuild(object,false)},[object,build]);
 useFrame((_,dt)=>{
  const step=Math.min(dt,.05);
  // One-shot click envelope, decaying. Each artifact reads it differently.
  if(pulseRef){pulseRef.current=Math.max(0,pulseRef.current-step*1.7)}
  const pulse=pulseRef?pulseRef.current:0;
  if(!reduced){elapsed.current+=step;object.userData.animate?.(elapsed.current,{active,pulse})}const u=object.userData.waterUniforms;if(u){if(!reduced)u.uArtifactTime.value=elapsed.current;u.uArtifactCalm.value=THREE.MathUtils.damp(u.uArtifactCalm.value,meditating?1:0,2,Math.min(dt,.05))}});
 return <primitive object={object} {...props}/>;
}
export const Cassette=props=><Artifact id="music" {...props}/>;
export const Book=props=><Artifact id="mind" {...props}/>;
export const Stepwell=props=><Artifact id="india" {...props}/>;
export const Pointer=props=><Artifact id="work" {...props}/>;
export const Koi=props=><Artifact id="koi" {...props}/>;
// The court uses a physical radius. The world uses normalized bounds.
export function Basketball({radius, ...props}){return <Artifact id="play" {...(radius?{scale:radius}:{})} {...props}/>}
export const ObjectModel=({id,...props})=><Artifact id={id} {...props}/>;
