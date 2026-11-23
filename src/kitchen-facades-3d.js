import * as THREE from 'three';

// Render genuinely modeled kitchen facades, using a single front plane for all panels.
// Decorations do not affect the dimensions of the cabinet or drawer mechanisms.
export function createKitchenFacadePainter({group,piece,addRound,facade,materials}){
 const groove=new THREE.MeshStandardMaterial({
  color:facade.color.clone().multiplyScalar(.69),roughness:.85
 });
 const highlight=new THREE.MeshStandardMaterial({
  color:facade.color.clone().multiplyScalar(1.10),roughness:.62
 });
 const glassOptions={
  clear:{color:'#b2cdd2',opacity:.28,roughness:.13},
  frosted:{color:'#d9e0df',opacity:.80,roughness:.86},
  tinted:{color:'#56656e',opacity:.64,roughness:.33}
 };
 const panes={};
 for(const [key,opt] of Object.entries(glassOptions)){
  panes[key]=new THREE.MeshPhysicalMaterial({
   color:opt.color,transparent:true,opacity:opt.opacity,
   metalness:0,roughness:opt.roughness,side:THREE.DoubleSide,
   depthWrite:false,clearcoat:key==='clear'?.55:.10
  });
 }
 materials.push(groove,highlight,...Object.values(panes));

 const decorateLine=(x1,y1,x2,y2,z,mat=groove,thickness=.0026)=>{
  const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy);
  if(len<.006)return;
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(len,thickness,.002),mat);
  mesh.position.set((x1+x2)/2,(y1+y2)/2,z);
  mesh.rotation.z=Math.atan2(dy,dx);
  mesh.castShadow=false;
  group.add(mesh);
 };
 const lattice=(cx,cy,z,fw,fh)=>{
  const xmin=-fw/2,xmax=fw/2,ymin=-fh/2,ymax=fh/2,step=.07;
  for(const slope of [1,-1]){
   const minB=Math.min(ymin-slope*xmin,ymin-slope*xmax);
   const maxB=Math.max(ymax-slope*xmin,ymax-slope*xmax);
   for(let b=Math.ceil(minB/step)*step;b<maxB;b+=step){
    const pts=[];
    for(const x of [xmin,xmax]){
     const y=slope*x+b;
     if(y>=ymin-.00001&&y<=ymax+.00001)pts.push({x,y});
    }
    for(const y of [ymin,ymax]){
     const x=(y-b)/slope;
     if(x>=xmin-.00001&&x<=xmax+.00001)pts.push({x,y});
    }
    if(pts.length<2)continue;
    pts.sort((a,b)=>a.x-b.x);
    const p1=pts[0],p2=pts[pts.length-1];
    decorateLine(cx+p1.x,cy+p1.y,cx+p2.x,cy+p2.y,z,groove,.0028);
   }
  }
 };
 function paint({x,y,z,width,height,style='plain',glass='clear',grid=false,drawer=false}){
  const type=drawer&&style==='glass'?'frame':style;
  const fw=Math.max(.09,width),fh=Math.max(.065,height);
  // The glass door has no opaque panel: a translucent pane fills the opening.
  const glassDoor=type==='glass';
  const outerT=.018;
  const rim=Math.min(.05,Math.max(.015,Math.min(fw,fh)*.105));
  const innerW=Math.max(.03,fw-2*rim),innerH=Math.max(.025,fh-2*rim);
  if(glassDoor){
   addRound(innerW,innerH,.006,x,y,z-.004,panes[panes[glass]?glass:'clear'],.0018);
   const frameZ=z+.002;
   piece(rim,fh,.018,x-fw/2+rim/2,y,frameZ,facade);
   piece(rim,fh,.018,x+fw/2-rim/2,y,frameZ,facade);
   piece(innerW,rim,.018,x,y+fh/2-rim/2,frameZ,facade);
   piece(innerW,rim,.018,x,y-fh/2+rim/2,frameZ,facade);
   if(grid){
    const zGrid=z+.013;
    piece(.012,innerH,.010,x,y,zGrid,facade);
    piece(innerW,.012,.010,x,y,zGrid,facade);
   }
  }else{
   addRound(fw,fh,outerT,x,y,z,facade,.0015);
   if(type==='frame'||type==='diamond'||type==='fluted'){
    const front=z+.0098;
    // Light and dark rebates emphasize the classic inset perimeter.
    for(const sx of [-1,1]){
     const xx=x+sx*(fw/2-rim);
     piece(.003,innerH,.002,xx,y,front,groove);
     piece(.006,innerH,.002,xx+sx*.005,y,front+.001,highlight);
    }
    for(const sy of [-1,1]){
     const yy=y+sy*(fh/2-rim);
     piece(innerW,.003,.002,x,yy,front,groove);
     piece(innerW,.006,.002,x,yy+sy*.005,front+.001,highlight);
    }
    if(type==='fluted'){
     const count=Math.max(2,Math.min(24,Math.floor(innerW/.038)));
     for(let i=1;i<count;i++){
      const xx=x-innerW/2+i*innerW/count;
      piece(.0038,innerH-.004,.002,xx,y,front+.001,groove);
      piece(.0014,innerH-.004,.001,xx+.004,y,front+.0016,highlight);
     }
    }else if(type==='diamond'){
     lattice(x,y,front+.001,innerW-.012,innerH-.012);
    }
   }
  }
 }
 return paint;
}
