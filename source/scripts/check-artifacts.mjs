import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildArtifact,disposeArtifact} from '../src/artifacts/factory.js';
import {homeIds,homeLayout,mobileOrbitLayout,wrappedDelta,stageHeight,koiMetrics,koiRoute} from '../src/scene-layout.js';
const radii={};
for(const id of [...homeIds,'koi','statement','future','black-koi','white-koi']){
 const obj=buildArtifact(id);let radius=0;
 for(const time of [0,2,7,14,31]){
  obj.userData.animate?.(time,{active:true});obj.updateMatrixWorld(true);
  obj.traverse(m=>{if(!m.isMesh)return;const p=m.geometry.attributes.position,a=m.matrixWorld.elements;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const wx=a[0]*x+a[4]*y+a[8]*z+a[12],wy=a[1]*x+a[5]*y+a[9]*z+a[13],wz=a[2]*x+a[6]*y+a[10]*z+a[14];assert.ok(Number.isFinite(wx+wy+wz),`${id}: invalid moving geometry`);radius=Math.max(radius,Math.hypot(wx,wy,wz))}});
 }
 radii[id]=radius;disposeArtifact(obj);
}
function extent(center,r,d=14){const k=Math.sqrt(d*d+center*center-r*r);return[d*(center*d-r*k)/(d*d-r*r),d*(center*d+r*k)/(d*d-r*r)]}
const intersects=(a,b)=>a.x0<b.x1&&a.x1>b.x0&&a.y0<b.y1&&a.y1>b.y0;
let layouts=0;
for(const [pw,ph,copy] of [[320,568,350],[390,844,360],[600,800,390],[768,1024,400],[1024,768,410],[1100,700,420],[1440,900,440],[1920,1080,480]]){
 const stage=stageHeight(pw,ph,copy),h=2*14*Math.tan(20*Math.PI/180),w=h*pw/stage,rects=[];
 if(pw<680){
  for(let selected=0;selected<homeIds.length;selected++){
   const visible=homeIds.map((id,index)=>({id,index,delta:wrappedDelta(index,selected)})).filter(x=>Math.abs(x.delta)<=1);
   const projected=visible.map(({id})=>{const p=mobileOrbitLayout(id,selected,w,h),r=p.scale*(radii[id]*1.03+.042),d=14-(p.z||0),[x0,x1]=extent(p.x,r,d),[y0,y1]=extent(p.y,r,d);return{id,p,x0,x1,y0,y1}});
   const focus=projected.find(x=>x.p.featured);assert.ok(focus,`${pw}: mobile carousel has no focused artifact`);
   assert.ok(focus.x0>-w*.48&&focus.x1<w*.48&&focus.y1<h*.49,`${pw}: focused ${focus.id} exceeds its presentation area`);
   const captionTop=-h/2+108*h/stage;assert.ok(focus.y0>captionTop,`${pw}: focused ${focus.id} overlaps its caption lane`);
   for(const neighbor of projected.filter(x=>!x.p.featured))assert.ok(Math.abs(neighbor.p.x)>w*.38&&neighbor.p.z<0,`${pw}: neighboring ${neighbor.id} must peek from depth`);
  }
 }else{
  for(const id of homeIds){
   const p=homeLayout(id,w,h,pw,stage),r=p.scale*(radii[id]*1.03+.018),[x0,x1]=extent(p.x,r),[y0,y1]=extent(p.y,r);
   const item={id,x0,x1,y0,y1};assert.ok(x0>=-w/2&&x1<=w/2&&y0>=-h/2&&y1<=h/2,`${pw}: ${id} exceeds its canvas`);rects.push(item);
   const labelWidth=112*w/pw,labelHeight=40*h/stage;rects.push({id:id+' label',x0:p.x-labelWidth/2,x1:p.x+labelWidth/2,y0:p.y-p.labelOffset-labelHeight/2,y1:p.y-p.labelOffset+labelHeight/2});
  }
  for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++)assert.ok(!intersects(rects[i],rects[j]),`${pw}px overlap: ${rects[i].id} and ${rects[j].id}`);
 }
 // Koi. They now ring the hero name rather than sitting under it, so the rule that matters
 // is that the whole ellipse — fish included — stays inside the frame at every width.
 const koiHeight=copy+stage+90;
 for(const side of [-1,1]){
  const m=koiMetrics(pw,koiHeight,side,copy);
  for(let sample=0;sample<48;sample++){
   const p=koiRoute(sample/48*(Math.PI*2/.30),side,pw,koiHeight,copy),rx=p.x-m.cx,ry=p.y-m.cy;
   assert.ok(Math.abs(Math.hypot(rx/m.radiusX,ry/m.radiusY)-1)<1e-6,'Koi path must stay on its shared ellipse');
   assert.ok(Math.abs(p.x)+p.fishRadius<=pw/2+1e-6,`${pw}: koi clips the frame horizontally`);
   assert.ok(Math.abs(p.y)+p.fishRadius<=koiHeight/2+1e-6,`${pw}: koi clips the frame vertically`);
   assert.ok(p.fishRadius>=20,`${pw}: koi shrank to nothing`);
  }
 }
 layouts++;
}
console.log(`Passed ${layouts} responsive layouts: desktop models stay separated, the mobile orbit preserves its caption lane, and both koi ring the hero name without clipping the frame.`);
