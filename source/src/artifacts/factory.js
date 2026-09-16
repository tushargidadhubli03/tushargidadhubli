import * as T from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const TAU=Math.PI*2;
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
function material(color,roughness=.5,metalness=0,extra={}){return new T.MeshPhysicalMaterial({color,roughness,metalness,...extra})}
function mesh(g,mat,parent,pos=[0,0,0],rot=[0,0,0],name=''){const m=new T.Mesh(g,mat);m.position.set(...pos);m.rotation.set(...rot);m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function box(parent,dims,pos,mat,bevel=.02,rot){return mesh(new RoundedBoxGeometry(...dims,3,Math.min(bevel,...dims.map(x=>x*.4))),mat,parent,pos,rot)}
function cyl(parent,r1,r2,h,pos,mat,n=48,rot=[Math.PI/2,0,0]){return mesh(new T.CylinderGeometry(r1,r2,h,n),mat,parent,pos,rot)}
function tube(parent,points,r,mat,closed=false){const curve=new T.CatmullRomCurve3(points.map(p=>V(...p)),closed,'centripetal');return mesh(new T.TubeGeometry(curve,Math.max(24,points.length*2),r,6,closed),mat,parent)}
function ring(parent,r,t,pos,mat,rot=[0,0,0]){return mesh(new T.TorusGeometry(r,t,8,72),mat,parent,pos,rot)}
function roundRect(w,h,r=.1){const s=new T.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s}
function extrude(shape,depth=.1,bevel=.02){return new T.ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:4,curveSegments:32,steps:1})}
function surface(nu,nv,fn){const pos=[],uv=[],index=[];for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){pos.push(...fn(i/nu,j/nv));uv.push(i/nu,1-j/nv)}for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i;index.push(a,a+nu+1,a+1,a+1,a+nu+1,a+nu+2)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();return g}
function updateSurface(g,nu,nv,fn){const a=g.attributes.position;let n=0;for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const p=fn(i/nu,j/nv);a.setXYZ(n++,...p)}a.needsUpdate=true;g.computeVertexNormals()}
function lathe(parent,points,mat,pos=[0,0,0],segments=64){return mesh(new T.LatheGeometry(points.map(([r,y])=>new T.Vector2(r,y)),segments),mat,parent,pos)}
function mergeParts(group){group.updateMatrixWorld(true);const sets=new Map();group.traverse(m=>{if(m.isMesh&&!Array.isArray(m.material)){const g=m.geometry.clone().applyMatrix4(m.matrixWorld);for(const attr of Object.keys(g.attributes))if(!['position','normal','uv'].includes(attr))g.deleteAttribute(attr);const key=m.material.uuid;if(!sets.has(key))sets.set(key,{mat:m.material,geos:[]});sets.get(key).geos.push(g.index?g.toNonIndexed():g)}});const result=new T.Group();for(const {mat,geos} of sets.values()){const g=mergeGeometries(geos,false);mesh(g,mat,result);geos.forEach(g=>g.dispose())}return result}
function flipGeometry(g){const a=g.index.array;for(let i=0;i<a.length;i+=3){const t=a[i];a[i]=a[i+2];a[i+2]=t}g.index.needsUpdate=true;g.computeVertexNormals();return g}
function optimize(group){
 const keep=[],statics=new T.Group();
 for(const child of [...group.children]){
  if(child.isGroup)optimize(child);
  if(child.userData.dynamic||child.userData.hasDynamic){keep.push(child);group.userData.hasDynamic=true}else statics.add(child);
 }
 group.clear();const merged=mergeParts(statics);for(const m of [...merged.children])group.add(m);for(const c of keep)group.add(c);return group;
}
function textureMat(tex,color,roughness=.8,extra={}){return material(color,roughness,0,{map:tex||null,...extra})}

function cassette(tex){
 const root=new T.Group(),body=new T.Group();root.add(body);body.rotation.set(-.10,-.24,-.10);
 const violet=material('#592980',.25,.18,{clearcoat:.9,clearcoatRoughness:.16});const edge=material('#9b69ba',.27,.55);const black=material('#211b22',.44,.03);const silver=material('#cac6bf',.24,.85);const gold=material('#bca17a',.31,.8);const ivory=material('#e9dfcd',.48,.04);
 box(body,[3.15,1.99,.27],[0,0,-.18],violet,.10);
 const shell=roundRect(3.13,1.97,.12),hole=roundRect(2.34,.81,.19);shell.holes.push(hole);mesh(extrude(shell,.10,.025),violet,body,[0,0,.02]);
 // Separate molded perimeter and the seam between shell halves.
 tube(body,[[-1.47,-.88,.05],[1.47,-.88,.05],[1.50,-.82,.05],[1.50,.84,.05],[1.44,.91,.05],[-1.44,.91,.05],[-1.5,.84,.05],[-1.5,-.82,.05],[-1.47,-.88,.05]],.008,edge);
 box(body,[2.47,.96,.025],[0,0,-.023],black,.16);
 const reels=[],woundDark=material('#302824',.52,.1),woundLight=material('#463834',.52,.1);
 for(const x of [-.73,.73]){
  const spool=new T.Group();spool.position.set(x,0,.025);body.add(spool);reels.push(spool);spool.userData.dynamic=true;
  cyl(spool,.365,.365,.043,[0,0,-.005],black,80);
  for(let j=0;j<10;j++)ring(spool,.231+j*.014,.0021,[0,0,.020],j%2?woundDark:woundLight);
  cyl(spool,.226,.226,.055,[0,0,.014],ivory,64);
  cyl(spool,.101,.101,.060,[0,0,.032],black,48);
  ring(spool,.208,.009,[0,0,.056],silver);
  for(let j=0;j<6;j++){const a=j*TAU/6;box(spool,[.038,.106,.025],[Math.cos(a)*.13,Math.sin(a)*.13,.059],ivory,.006,[0,0,a-Math.PI/2])}
  for(let j=0;j<3;j++){const a=j*TAU/3+.25;cyl(spool,.016,.016,.014,[Math.cos(a)*.171,Math.sin(a)*.171,.06],black,16)}
 }
 // The tape runs behind the hubs instead of becoming a round decorative cord.
 box(body,[1.57,.027,.012],[0,-.317,.035],material('#4b312c',.45,.25),.003);
 const glazing=material('#a68bc7',.10,.12,{transparent:true,opacity:.19,depthWrite:false,clearcoat:1});mesh(new T.ShapeGeometry(roundRect(2.27,.73,.16)),glazing,body,[0,0,.115]);
 const label=textureMat(tex['cassette-label.jpg'],'#ffffff',.85);mesh(new T.PlaneGeometry(2.72,.70),label,body,[0,.589,.156]);
 box(body,[2.82,.105,.17],[0,-.852,.08],violet,.035);
 for(const x of [-1.12,1.12]){cyl(body,.092,.092,.035,[x,-.68,.157],black,40);ring(body,.094,.012,[x,-.68,.18],edge)}
 for(const x of [-.53,.53])cyl(body,.045,.045,.037,[x,-.77,.18],silver,32);
 for(let i=0;i<15;i++)box(body,[.01,.135,.01],[-.34+i*.049,-.86,.178],edge,.002);
 for(const [x,y] of [[-1.38,.8],[1.38,.8],[-1.38,-.80],[1.38,-.80],[0,-.66]]){
  cyl(body,.044,.044,.035,[x,y,.151],silver,32);box(body,[.052,.006,.003],[x,y,.171],black,.001,[0,0,.30]);box(body,[.006,.040,.003],[x,y,.1715],black,.001,[0,0,.30]);
 }
 for(let j=0;j<5;j++)box(body,[.012,.39,.04],[-1.52+j*.042,0,.15],edge,.002);
 for(let j=0;j<5;j++)box(body,[.012,.39,.04],[1.52-j*.042,0,.15],edge,.002);
 let spin=0;
 root.userData.animate=(t,{active=false,pulse=0}={})=>{spin+=pulse*.55;const rate=(active?1.2:.48)+spin;reels[0].rotation.z=-t*rate;reels[1].rotation.z=-t*(rate*.88);spin*=.94};
 return root;
}
function book(tex){
 const root=new T.Group(),body=new T.Group();root.add(body);body.rotation.set(-.12,-.15,-.09);
 const leather=material('#402445',.75,.02,{bumpMap:tex['cloth-grain.jpg']||null,bumpScale:.009});const gilt=material('#bd9b5c',.39,.65);const paper=material('#e4d7b7',.87);const dark=material('#8e754e',.84);
 for(const side of [-1,1]){
  const cover=box(body,[1.44,2.06,.092],[side*.718,0,-.135],leather,.025);cover.rotation.y=side*.065;
  const g=surface(26,1,(u,v)=>[side*(.04+u*1.315),1.0-v*2,.016+Math.sin(u*Math.PI)*.065]);mesh(g,paper,body,[0,0,-.025]);
  // Layered paper signatures follow the curved block at both ends.
  for(const y of [-.942,.942])for(let k=0;k<29;k++)tube(body,Array.from({length:17},(_,i)=>{const u=i/16;return[side*(.035+u*1.302),y+(k%3)*.0006,-.078+k*.0034+Math.sin(u*Math.PI)*.059]}),.0019,k%5===0?dark:paper);
  for(let k=0;k<32;k++)box(body,[.008,1.87,.002],[side*1.343,0,-.084+k*.0031],k%6===0?dark:paper,.0007);
  const pageMat=textureMat(tex[side<0?'page-left.jpg':'page-right.jpg'],'#ffffff',.9,{side:T.DoubleSide});
  const topPage=surface(40,2,(u,v)=>[side*(.025+u*1.302),.94-v*1.88,.047+Math.sin(u*Math.PI)*.08]);if(side<0){for(let i=0;i<topPage.attributes.uv.count;i++)topPage.attributes.uv.setX(i,1-topPage.attributes.uv.getX(i))}mesh(topPage,pageMat,body);
  // Bound cloth, gold tooling and small corner protectors are separate materials.
  for(const y of [-1,1])box(body,[1.32,.009,.003],[side*.72,y,-.083],gilt,.001);
 }
 box(body,[.06,2.085,.17],[0,0,-.16],leather,.025);
 for(const y of [-.96,.96])for(let k=0;k<12;k++)cyl(body,.012,.012,.075,[-.067+k*.012,y,-.02],k%2?paper:gilt,12,[0,0,Math.PI/2]);
 const turnGeo=surface(44,5,(u,v)=>[u*1.32,.938-v*1.876,.075]);const turn=mesh(turnGeo,textureMat(tex['page-right.jpg'],'#fff8e8',.88,{side:T.FrontSide}),body);turn.userData.dynamic=true;const backGeo=turnGeo.clone();backGeo.setAttribute('position',turnGeo.attributes.position);backGeo.setAttribute('normal',turnGeo.attributes.normal);for(let i=0;i<backGeo.attributes.uv.count;i++)backGeo.attributes.uv.setX(i,1-backGeo.attributes.uv.getX(i));const back=mesh(backGeo,textureMat(tex['page-left.jpg'],'#fff8e8',.88,{side:T.BackSide}),body);back.userData.dynamic=true;
 const bookmark=mesh(surface(28,3,(u,v)=>[.08+(v-.5)*.075,-.50-u*.83,.08-Math.sin(u*Math.PI)*.02-u*.12]),material('#895394',.51,.15,{side:T.DoubleSide}),body);
 const ribbonEdge=material('#cca979',.52,.4);tube(body,[[.04,-.65,.07],[.06,-1.15,-.02],[.09,-1.34,-.03]],.002,ribbonEdge);
 root.userData.animate=(t,{active=false,pulse=0}={})=>{const p=Math.min(1,(.5-.5*Math.cos(t*(active?.68:.35)))+pulse*1.6);const angle=p*Math.PI;updateSurface(turnGeo,44,5,(u,v)=>{const curl=Math.sin(angle)*Math.sin(u*Math.PI)*.28;return[u*1.32*Math.cos(angle),.938-v*1.876,.075+u*1.32*Math.sin(angle)+curl]});};
 return root;
}
function arch(w,h,thick){const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(-w/2,h);s.lineTo(w/2,h);s.lineTo(w/2,0);s.closePath();const a=new T.Path();const ri=w/2-thick,y=h-ri-thick;a.moveTo(-ri,0);a.lineTo(-ri,y);a.absarc(0,y,ri,Math.PI,0,true);a.lineTo(ri,0);a.closePath();s.holes.push(a);return s}
function stepwell(tex){
 const root=new T.Group(),stonework=new T.Group();
 const stone=material('#c0a27f',.88,0,{bumpMap:tex['stone-grain.jpg']||null,bumpScale:.024});const light=material('#d6bc98',.87);const carved=material('#a18a70',.9);const dark=material('#827465',.98);const gold=material('#c9ab74',.53,.2);
 box(stonework,[3.70,.20,3.20],[0,-.12,0],carved,.036);
 const n=11;
 for(let i=0;i<n;i++){
  const y=.015+i*.076,w=1.03+i*.225,d=.70+i*.201;
  for(const s of [-1,1]){box(stonework,[w,y+.14,.118],[0,(y-.14)/2,s*d/2],i%3?stone:light,.009);box(stonework,[.118,y+.14,d],[s*w/2,(y-.14)/2,0],stone,.009)}
  for(let j=0;j<7;j++){const x=(j-3)*w/7;box(stonework,[.003,.057,.109],[x,y+.008,d/2],carved,.0007)}
 }
 const floor=.86;
 for(const s of [-1,1]){box(stonework,[3.64,.07,.27],[0,floor,s*1.46],stone,.01);box(stonework,[.24,.07,2.79],[s*1.70,floor,0],stone,.01)}
 function pillar(parent,x,y,z,k=1){
  const p=new T.Group();p.position.set(x,y,z);p.scale.setScalar(k);parent.add(p);
  lathe(p,[[.10,0],[.10,.055],[.073,.065],[.073,.10],[.045,.12],[.046,.35],[.061,.37],[.079,.39],[.080,.43],[.105,.44],[.105,.485]],stone,[0,0,0],12);
  for(const v of [.058,.10,.385,.432])ring(p,.082,.008,[0,v,0],light,[Math.PI/2,0,0]);
 }
 function dome(parent,x,y,z,k=1){
  const p=new T.Group();p.position.set(x,y,z);p.scale.setScalar(k);parent.add(p);
  for(const a of [0,1,2,3]){const r=a*Math.PI/2;const g=new T.Group();g.rotation.y=r;p.add(g);mesh(extrude(arch(.67,.54,.077),.075,.006),stone,g,[0,0,.29]);}
  box(p,[.88,.067,.88],[0,.555,0],light,.015);
  const domeGeo=surface(80,28,(u,v)=>{const a=u*TAU,t=v*Math.PI/2,r=.43*Math.cos(t)*(1+.035*Math.sin(a*16)*Math.sin(t*2));return[Math.cos(a)*r,.61+.39*Math.sin(t),Math.sin(a)*r]});mesh(domeGeo,stone,p);
  for(let i=0;i<16;i++){const a=i*TAU/16;tube(p,Array.from({length:16},(_,j)=>{const t=j/15*Math.PI/2;return[Math.cos(a)*.434*Math.cos(t),.612+.395*Math.sin(t),Math.sin(a)*.434*Math.cos(t)]}),.0055,light)}
  lathe(p,[[.07,0],[.084,.045],[.035,.085],[.024,.17],[.04,.184],[0,.22]],gold,[0,1.0,0],32);
 }
 // An arched gallery, carved capitals, layered eaves and three fluted chhatris.
 for(let i=-2;i<=2;i++){const x=i*.63;mesh(extrude(arch(.64,.62,.073),.18,.007),stone,stonework,[x,floor,-1.40]);pillar(stonework,x-.29,floor,-1.17,1.14)}
 pillar(stonework,1.55,floor,-1.17,1.14);
 box(stonework,[3.46,.07,.49],[0,1.51,-1.26],light,.015);box(stonework,[3.30,.055,.38],[0,1.57,-1.26],stone,.009);
 dome(stonework,0,1.60,-1.24,.90);dome(stonework,-1.33,floor,-1.19,.55);dome(stonework,1.33,floor,-1.19,.55);
 for(const s of [-1,1]){
  for(let i=0;i<9;i++){const z=-.78+i*.245;pillar(stonework,s*1.71,floor,z,.37)}
  box(stonework,[.12,.046,2.20],[s*1.71,1.085,.23],light,.012);
  for(let i=0;i<6;i++){const z=-.70+i*.345;const g=new T.Group();g.position.set(s*1.705,floor+.10,z);g.rotation.y=Math.PI/2;stonework.add(g);mesh(extrude(arch(.27,.20,.030),.030,.003),carved,g)}
 }
 box(stonework,[.97,.025,.67],[0,-.012,0],dark,.02);
 root.add(mergeParts(stonework));root.rotation.set(.47,-.46,.015);root.userData.water={width:.95,height:.64,position:[0,.062,0]};return root;
}
function basketball(tex){
 const root=new T.Group();const leather=textureMat(tex['leather-color.jpg'],'#ffffff',.83,{normalMap:tex['leather-normal.jpg']||null,normalScale:new T.Vector2(.68,.68)});mesh(new T.SphereGeometry(1,112,80),leather,root);
 const channel=material('#2b211c',.82);const edge=material('#985121',.78);
 const paths=[];
 for(let k=0;k<3;k++)paths.push(Array.from({length:145},(_,i)=>{const a=i/144*TAU;return k===0?[Math.cos(a),Math.sin(a),0]:k===1?[Math.cos(a),0,Math.sin(a)]:[0,Math.cos(a),Math.sin(a)]}));
 paths.push(Array.from({length:145},(_,i)=>{const a=i/144*TAU,b=.58*Math.sin(a*2);return[Math.cos(a)*Math.cos(b),Math.sin(b),Math.sin(a)*Math.cos(b)]}));
 for(const points of paths){tube(root,points.map(p=>p.map(x=>x*.988)),.018,channel,true)}
 root.rotation.set(.21,.28,.23);return root;
}
function pointer(){const root=new T.Group(),shape=new T.Shape();shape.moveTo(-.69,1.12);shape.lineTo(.85,-.15);shape.lineTo(.26,-.19);shape.lineTo(.57,-.96);shape.lineTo(.17,-1.12);shape.lineTo(-.16,-.35);shape.lineTo(-.66,.11);shape.closePath();const metal=material('#c8c4cb',.16,.96,{clearcoat:1});mesh(extrude(shape,.30,.058),metal,root,[0,0,-.15]);const purple=material('#744292',.23,.55);const inset=shape.clone();mesh(extrude(inset,.007,.020),purple,root,[.012,.006,.20]).scale.set(.83,.83,1);root.rotation.set(.10,-.28,.10);return root}

function finGeometry(length=.4,width=.22){return surface(28,14,(u,v)=>{const fan=(v-.5)*2;return[fan*width*Math.sin(u*Math.PI*.72),.018*Math.sin(u*Math.PI)*Math.cos(fan*3),-u*length]})}
function koi(_tex,solo=null){
 const root=new T.Group(),pond=new T.Group();root.add(pond);pond.rotation.x=solo?Math.PI/2:.92;
 const swimmers=[];
 function fish(light){
  const f=new T.Group(),bodyGeo=surface(70,48,(u,v)=>{
   const z=.52-u*1.12;const r=.012+.05*Math.exp(-u*15)+Math.pow(Math.sin(Math.PI*u),.90)*(.16-.104*u);const a=v*TAU;return[Math.cos(a)*r,Math.sin(a)*r*.74,z];
  });
  const c=[];const base=new T.Color(light?'#f4f0e6':'#17161b'),patch=new T.Color(light?'#e0dacf':'#302d34');
  for(let j=0;j<=48;j++)for(let i=0;i<=70;i++){const u=i/70,v=j/48;const d=Math.sin(u*21+v*8)*Math.sin(v*15-u*3);const color=base.clone().lerp(patch,d>.18&&u<.84?.82:0);c.push(color.r,color.g,color.b)}bodyGeo.setAttribute('color',new T.Float32BufferAttribute(c,3));
  const bodyMat=material('#ffffff',.29,.18,{vertexColors:true,clearcoat:.95,clearcoatRoughness:.25});flipGeometry(bodyGeo);const body=mesh(bodyGeo,bodyMat,f);body.userData.dynamic=true;
  const membrane=material(light?'#ede8dc':'#39353c',.44,.10,{side:T.DoubleSide,transparent:true,opacity:.86});const rays=material(light?'#bdb6a7':'#1c1a20',.48,.15);
  const tail=new T.Group();tail.position.set(0,0,-.57);f.add(tail);tail.userData.dynamic=true;
  mesh(surface(24,18,(u,v)=>{const a=(v-.5)*2;return[a*(.025+u*.25),Math.sin(u*Math.PI)*.04,-u*(.32+.15*Math.abs(a))]}),membrane,tail);
  for(let i=0;i<13;i++){const a=i/12*2-1;tube(tail,Array.from({length:9},(_,j)=>{const u=j/8;return[a*(.025+u*.25),Math.sin(u*Math.PI)*.04+.001,-u*(.32+.15*Math.abs(a))]}),.0018,rays)}
  const fins=[];
  for(const s of [-1,1]){const fin=new T.Group();fin.position.set(s*.105,-.015,.20);fin.rotation.y=-s*.72;fin.rotation.z=s*.13;f.add(fin);fin.userData.dynamic=true;mesh(finGeometry(.33,.17),membrane,fin);fins.push(fin);for(let i=0;i<8;i++){const a=i/7*2-1;tube(fin,Array.from({length:9},(_,j)=>{const u=j/8;return[a*.17*Math.sin(u*Math.PI*.72),.018*Math.sin(u*Math.PI)*Math.cos(a*3)+.002,-u*.33]}),.0015,rays)}}
  const dorsal=mesh(surface(20,10,(u,v)=>[(v-.5)*.012,.09+Math.sin(u*Math.PI)*.15*v,.13-u*.46]),membrane,f);
  for(const s of [-1,1]){const eye=mesh(new T.SphereGeometry(.017,20,12),material('#d0ad6d',.19,.45),f,[s*.066,.026,.404]);mesh(new T.SphereGeometry(.010,20,12),material('#171218',.11,.1,{clearcoat:1}),f,[s*.078,.028,.409]);tube(f,[[s*.033,-.026,.507],[s*.068,-.050,.52],[s*.094,-.07,.481]],.004,membrane)}
  ring(f,.023,.004,[0,-.005,.523],rays,[0,0,0]);
  const original=bodyGeo.attributes.position.array.slice();
  f.userData={bodyGeo,original,tail,fins,light};return f;
 }
 for(let i=0;i<(solo?1:2);i++){const f=fish(solo?solo==='white':i===1);pond.add(f);swimmers.push(f);f.userData.dynamic=true}
 const animate=(t,{pulse=0}={})=>{swimmers.forEach((f,i)=>{const a=t*.27+i*Math.PI;f.position.set(solo?0:Math.cos(a)*.43,solo?0:Math.sin(t*.7+i)*.025,solo?0:Math.sin(a)*.43);f.rotation.y=solo?0:-a;const d=f.userData;d.tail.rotation.y=Math.sin(t*(3.8+pulse*9)+i*Math.PI)*(.38+pulse*.3);d.fins.forEach((fin,j)=>fin.rotation.z=(j?1:-1)*(.16+Math.sin(t*(3.8+pulse*9)+i)*(.18+pulse*.2)));const attr=d.bodyGeo.attributes.position;for(let k=0;k<attr.count;k++){const z=d.original[k*3+2],tail=Math.max(0,.28-z);attr.setX(k,d.original[k*3]+Math.sin(t*3.8-z*4+i*Math.PI)*tail*tail*.10)}attr.needsUpdate=true;d.bodyGeo.computeVertexNormals()})};root.userData.animate=animate;animate(1);return root;
}
function directive(){
 const root=new T.Group(),purple=material('#6f3a97',.20,.35,{clearcoat:1,clearcoatRoughness:.12}),gold=material('#c6a77b',.25,.85);
 const one=new T.Shape();one.moveTo(-1.01,.49);one.lineTo(-.62,.91);one.lineTo(-.29,.91);one.lineTo(-.29,-.72);one.lineTo(-.08,-.72);one.lineTo(-.08,-.91);one.lineTo(-.94,-.91);one.lineTo(-.94,-.72);one.lineTo(-.70,-.72);one.lineTo(-.70,.49);one.lineTo(-.91,.31);one.closePath();
 const seven=new T.Shape();seven.moveTo(.09,.91);seven.lineTo(1.25,.91);seven.lineTo(1.25,.58);seven.lineTo(.60,-.91);seven.lineTo(.15,-.91);seven.lineTo(.89,.51);seven.lineTo(.09,.51);seven.closePath();
 for(const shape of [one,seven]){mesh(extrude(shape,.37,.043),gold,root,[0,0,-.22]);mesh(extrude(shape,.30,.025),purple,root,[0,0,-.13])}
 root.rotation.set(.03,-.32,-.04);return root;
}
function retreat(tex){
 const root=new T.Group(),wood=material('#906648',.56,.02),woodLight=material('#bd9770',.60),canvas=material('#e8dccb',.87,0,{bumpMap:tex['cloth-grain.jpg']||null,bumpScale:.015,side:T.DoubleSide}),bronze=material('#b99866',.31,.7),sand=material('#d7c2a0',.96,0,{bumpMap:tex['stone-grain.jpg']||null,bumpScale:.025});
 mesh(flipGeometry(surface(96,22,(u,v)=>{const a=u*TAU,r=v*1.78*(1+.065*Math.sin(a*3)+.04*Math.cos(a*5));return[Math.cos(a)*r,.045*(1-v*v),Math.sin(a)*r*.78]})),sand,root);
 mesh(surface(96,2,(u,v)=>{const a=u*TAU,r=1.78*(1+.065*Math.sin(a*3)+.04*Math.cos(a*5));return[Math.cos(a)*r,-v*.15,Math.sin(a)*r*.78]}),sand,root);
 const chair=new T.Group();chair.position.set(-.23,.10,.1);chair.rotation.y=-.24;root.add(chair);
 for(const x of [-.39,.39]){
  tube(chair,[[x,.04,.66],[x,.55,.33],[x,.50,-.27],[x,.05,-.63]],.031,wood);
  tube(chair,[[x,.52,.36],[x,.44,-.15],[x,.73,-.66],[x,1.03,-.96]],.034,wood);
  tube(chair,[[x,.72,.37],[x,.75,-.48]],.033,wood);
  for(const z of [-.39,.30])cyl(chair,.028,.028,.045,[x,.52,z],bronze,20,[0,0,Math.PI/2]);
 }
 for(const z of [.36,-.23,-.94])tube(chair,[[-.4,z===-.94?1.01:.50,z],[.4,z===-.94?1.01:.50,z]],.027,wood);
 mesh(surface(24,20,(u,v)=>{const y=.49+Math.max(0,v-.43)*.95;return[(u-.5)*.72,y-Math.sin(u*Math.PI)*.045,.35-v*1.28]}),canvas,chair);
 const openBook=book(tex);openBook.scale.setScalar(.18);openBook.rotation.set(-Math.PI/2+.20,0,.13);openBook.position.set(0,.59,.02);chair.add(openBook);
 const palm=new T.Group();palm.position.set(1.02,.0,-.41);root.add(palm);
 const trunkpts=Array.from({length:13},(_,i)=>[Math.sin(i/12*.7)*.35,i/12*2.25,0]);tube(palm,trunkpts,.065,wood);
 for(let i=0;i<30;i++){const y=i/29*2.18;ring(palm,.064,.006,[Math.sin(y/2.25*.7)*.35,y,0],woodLight,[Math.PI/2,0,0])}
 const top=V(Math.sin(.7)*.35,2.25,0),fronds=[];
 for(let i=0;i<9;i++){
  const frond=new T.Group();frond.position.copy(top);frond.rotation.y=i*TAU/9;frond.rotation.z=.1*(i%3-1);palm.add(frond);fronds.push(frond);frond.userData.dynamic=true;
  const green=material(i%2?'#696e4a':'#85835a',.61,.03,{side:T.DoubleSide});
  tube(frond,Array.from({length:13},(_,j)=>{const u=j/12;return[u*1.02,Math.sin(u*Math.PI)*.26-u*u*.44,0]}),.010,green);
  for(let j=1;j<17;j++){const u=j/17,l=.22*Math.sin(u*Math.PI)**.7;for(const s of [-1,1])mesh(surface(9,3,(v,w)=>{const baseY=Math.sin(u*Math.PI)*.26-u*u*.44;return[u*1.02-v*.15,baseY-v*v*.10+(w-.5)*.015,s*(v*l)+(w-.5)*.032*Math.sin(v*Math.PI)]}),green,frond)}
 }
 root.rotation.set(.30,-.24,0);root.userData.animate=(t,{pulse=0}={})=>fronds.forEach((f,i)=>f.rotation.z=Math.sin(t*(.62+pulse*5)+i*.8)*(.035+pulse*.12));
 root.userData.water={width:4.0,height:3.5,position:[0,-.033,0],circular:true};return root;
}
function addWater(model){
 const desc=model.userData.water;if(!desc)return;
 const uniforms={uArtifactTime:{value:0},uArtifactCalm:{value:0}};
 const mat=material(desc.circular?'#78958f':'#415e59',.14,.28,{transparent:true,opacity:.91,clearcoat:1,clearcoatRoughness:.13,envMapIntensity:.9,side:T.DoubleSide});
 mat.userData.uniforms=uniforms;
 mat.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.vertexShader='uniform float uArtifactTime;uniform float uArtifactCalm;varying vec2 vWaterUv;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWaterUv=uv;float t=uArtifactTime*mix(1.0,.22,uArtifactCalm);transformed.z+=sin(position.x*9.0+t)*cos(position.y*8.0-t*.7)*.008;');
  shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nfloat nt=uArtifactTime*mix(1.0,.22,uArtifactCalm);objectNormal=normalize(vec3(-cos(position.x*9.0+nt)*cos(position.y*8.0-nt*.7)*.072,sin(position.x*9.0+nt)*sin(position.y*8.0-nt*.7)*.064,1.0));');
  if(desc.circular){shader.fragmentShader='varying vec2 vWaterUv;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <alphamap_fragment>','#include <alphamap_fragment>\ndiffuseColor.a*=1.0-smoothstep(.80,1.0,length(vWaterUv-.5)*2.0);')}
 };
 const geo=desc.circular?new T.CircleGeometry(desc.width/2,96):new T.PlaneGeometry(desc.width,desc.height,50,40);
 const water=mesh(geo,mat,model,desc.position,[-Math.PI/2,0,0]);water.userData.dynamic=true;water.castShadow=false;model.userData.waterUniforms=uniforms;
}
export function buildArtifact(id,textures={}){
 const makers={music:cassette,mind:book,india:stepwell,play:basketball,work:pointer,koi,statement:directive,future:retreat,'black-koi':tex=>koi(tex,'black'),'white-koi':tex=>koi(tex,'white')};const model=(makers[id]||koi)(textures),outer=new T.Group();addWater(model);optimize(model);outer.add(model);model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model),center=bounds.getCenter(V());const radius=bounds.getSize(V()).length()*.5;
 model.position.sub(center);outer.scale.setScalar(1/(radius*(id==='mind'?1.20:id==='koi'?1.12:1.04)));outer.userData.model=model;outer.userData.animate=model.userData.animate;outer.userData.water=model.userData.water;outer.userData.waterUniforms=model.userData.waterUniforms;return outer;
}
export function disposeArtifact(obj){const geometries=new Set(),materials=new Set();obj.traverse(x=>{if(x.isMesh){geometries.add(x.geometry);if(Array.isArray(x.material))x.material.forEach(m=>materials.add(m));else materials.add(x.material)}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose())}
