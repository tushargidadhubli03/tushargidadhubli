export const homeIds=['music','mind','india','play','work'];
export const focusModel={home:'all',story:'koi',work:'work',music:'music',mind:'mind',india:'india',play:'play',future:'future',contact:'koi'};
export function stageHeight(width,viewportHeight,copyHeight){
 if(width<680)return Math.max(410,Math.min(490,viewportHeight*.56));
 const columns=width>=1100?5:3,rows=Math.ceil(5/columns);
 return Math.max(viewportHeight-copyHeight-90,rows*(width>=1100?280:225)+24);
}
export function homeLayout(id,width,height,pixelWidth=1440,pixelHeight=400){
 const index=homeIds.indexOf(id);if(index<0)return{x:0,y:0,z:-20,scale:0,labelOffset:0};
 const columns=pixelWidth>=1100?5:pixelWidth>=680?3:2,rows=Math.ceil(5/columns),row=Math.floor(index/columns),col=index%columns;
 const count=Math.min(columns,5-row*columns),cellWidth=width*.84/columns,cellHeight=height/rows,labelSpace=44*height/pixelHeight;
 const scale=Math.min(cellWidth*.425,(cellHeight-labelSpace)*.425);
 return{x:(col-(count-1)/2)*cellWidth,y:height*.5-(row+.5)*cellHeight+labelSpace*.38,z:0,scale,labelOffset:scale*1.08+labelSpace*.35,cellWidth,cellHeight};
}
export function wrappedDelta(index,selected,count=homeIds.length){let d=(index-selected+count)%count;if(d>count/2)d-=count;return d}
export function mobileOrbitLayout(id,selected,width,height){
 const index=homeIds.indexOf(id),delta=wrappedDelta(index,selected),distance=Math.abs(delta),focusScale=Math.min(width*.285,height*.245);
 if(index<0||distance>1)return{x:Math.sign(delta||1)*width*.78,y:-height*.08,z:-5,scale:.001,labelOffset:0,featured:false,delta};
 return{x:delta*width*.455,y:height*(distance?.005:.075),z:distance*-2.15,scale:focusScale*(distance?.48:1),labelOffset:0,featured:distance===0,delta};
}
export function focusLayout(id,active,width,height,mobile){return focusModel[active]===id?{x:mobile?0:-width*.265,y:mobile?height*.025:height*.035,z:0,scale:Math.min(width*(mobile?.38:.165),height*.34),labelOffset:0}:{x:0,y:-height,z:-8,scale:0,labelOffset:0}}

// The two koi share one orbit at opposite phase — the tattoo, not two separate circles —
// and that orbit is the hero name itself. The name's real bounding box is measured in the DOM
// and published as custom properties, so the ring tracks the type at any width instead of
// being guessed at. The canvas sits behind the copy, so the fish pass behind the letters.
const FISH_SHARE=.30, EDGE=18;
export function koiMetrics(width,height,side,copyHeight=0,name=null){
 const mobile=width<680;
 // Fall back to an approximation of the name box when one has not been measured yet.
 const n=name||{cx:width/2,cy:(copyHeight||height*.5)*.45,w:width*.62,h:(copyHeight||height*.5)*.42};
 const cx=n.cx-width/2;                 // canvas-centred coordinates
 const cy=height/2-n.cy;
 const pad=Math.max(26,Math.min(90,n.h*.42));
 let radiusX=n.w/2+pad;
 let radiusY=n.h/2+pad*(mobile?.85:1.15);
 let fishRadius=Math.max(26,Math.min(radiusY*1.25,Math.min(width,height)*FISH_SHARE*.5));
 // Keep the whole ring, fish included, inside the frame.
 const maxX=width/2-EDGE-fishRadius-Math.abs(cx);
 const maxY=height/2-EDGE-fishRadius-Math.abs(cy);
 radiusX=Math.max(40,Math.min(radiusX,maxX));
 radiusY=Math.max(28,Math.min(radiusY,Math.max(28,maxY)));
 return{fishRadius,orbitRadius:radiusX,radiusX,radiusY,edgeGap:EDGE,cx,cy,
        reach:radiusX+fishRadius,direction:1,mobile,
        copyBottom:height*.5-(copyHeight||height*.5),squash:radiusY/Math.max(1,radiusX)};
}
// Opposite phase on the shared ellipse, circling the name.
export function koiRoute(t,side,width,height,copyHeight=0,name=null){
 const m=koiMetrics(width,height,side,copyHeight,name),speed=.30;
 const phase=t*speed+(side>0?Math.PI:0);
 const c=Math.cos(phase),s2=Math.sin(phase);
 return{...m,x:m.cx+m.radiusX*c,y:m.cy+m.radiusY*s2,
  dx:-m.radiusX*s2*speed,dy:m.radiusY*c*speed,angle:phase};
}
