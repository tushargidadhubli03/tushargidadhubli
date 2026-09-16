import fs from 'node:fs';
import path from 'node:path';
import * as T from 'three';
import {buildArtifact} from '../src/artifacts/factory.js';
const output=path.resolve('.openai/artifacts/model-previews');fs.mkdirSync(output,{recursive:true});
const tex={};for(const name of fs.readdirSync('public/artifacts')){const t=new T.Texture();t.userData.file=path.resolve('public/artifacts',name);tex[name]=t}
for(const id of ['music','mind','india','play','work','koi','statement','future']){
 const obj=buildArtifact(id,tex);obj.userData.animate?.(id==='mind'?2.5:2,{active:true});obj.updateMatrixWorld(true);
 const data=[],items=[];let offset=0;
 obj.traverse(m=>{if(!m.isMesh)return;const geo=m.geometry.clone().applyMatrix4(m.matrixWorld),g=geo.index?geo.toNonIndexed():geo;const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,c=g.attributes.color;const arr=new Float32Array(p.count*11);for(let i=0;i<p.count;i++){arr.set([p.getX(i),p.getY(i),p.getZ(i),n.getX(i),n.getY(i),n.getZ(i),uv?.getX(i)||0,uv?.getY(i)||0,c?.getX(i)??1,c?.getY(i)??1,c?.getZ(i)??1],i*11)}const mat=m.material;items.push({offset,count:p.count,color:mat.color.toArray(),roughness:mat.roughness,metalness:mat.metalness,alpha:mat.opacity,side:mat.side,map:mat.map?.userData.file||null,normalMap:mat.normalMap?.userData.file||null,bumpMap:mat.bumpMap?.userData.file||null,vertexColors:!!mat.vertexColors});data.push(Buffer.from(arr.buffer));offset+=arr.byteLength;});
 fs.writeFileSync(path.join(output,id+'.bin'),Buffer.concat(data));fs.writeFileSync(path.join(output,id+'.json'),JSON.stringify(items));console.log(id,items.length,'draw groups',offset,'bytes');
}
