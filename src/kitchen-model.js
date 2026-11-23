import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {kitchenBaseModules,kitchenSlotIndex} from './kitchen-config.js';

// Parametric straight kitchen: metric measurements, shared cabinet planes and real cut-out for the sink.
// Preliminary customer visualization only: final technical drawings and fit must be verified by a cabinet maker.
export function buildKitchen(group,cfg,{piece,body,facade,inner,metal,materials}){
 const cm=n=>n/100;
 const w=cm(Math.max(180,Math.min(450,Number(cfg.width_cm)||300)));
 const h=cm(Math.max(215,Math.min(280,Number(cfg.height_cm)||240)));
 const d=cm(Math.max(50,Math.min(70,Number(cfg.depth_cm)||60)));
 const n=Math.max(2,Math.min(6,Math.round(Number(cfg.module_count)||4)));
 const upperN=Math.max(2,Math.min(6,Math.round(Number(cfg.upper_count)||n)));
 const sinkChoice=cfg.sink_position||'left';
 const hobChoice=cfg.hob_position||'right';
 const bay=w/n;
 const t=.018, gap=.003;
 const foot=.10, counterTop=.91, counterThickness=.035;
 const counterBottom=counterTop-counterThickness, caseH=counterBottom-foot;
 const sinkI=kitchenSlotIndex(sinkChoice,n);
 let hobI=kitchenSlotIndex(hobChoice,n);
 const baseModules=kitchenBaseModules(cfg);
 if(hobI===sinkI)hobI=(sinkI===n-1?0:n-1);
 const sinkX=-w/2+(sinkI+.5)*bay;
 const hobX=-w/2+(hobI+.5)*bay;
 const stone=new THREE.MeshStandardMaterial({
  color:cfg.countertop==='graphite'?'#4b4b49':cfg.countertop==='oak'?'#c1a079':'#e8e2d8',
  metalness:0,roughness:cfg.countertop==='graphite'?.45:.64
 });
 const wall=new THREE.MeshStandardMaterial({color:'#f1ece3',roughness:.94});
 const tile=new THREE.MeshStandardMaterial({color:cfg.backsplash==='dark'?'#bbb1a3':'#eae6de',roughness:.71});
 const glass=new THREE.MeshPhysicalMaterial({color:'#171e25',roughness:.21,metalness:.03,clearcoat:.5,clearcoatRoughness:.17});
 const steel=new THREE.MeshStandardMaterial({color:'#b3b7b9',metalness:.78,roughness:.23});
 const basin=new THREE.MeshStandardMaterial({color:'#737b7e',metalness:.66,roughness:.34,side:THREE.DoubleSide});
 const hotRing=new THREE.MeshStandardMaterial({color:'#303236',metalness:.28,roughness:.48});
 materials.push(stone,wall,tile,glass,steel,basin,hotRing);
 const addRound=(sx,sy,sz,x,y,z,material,radius=.002)=>{
  const mesh=new THREE.Mesh(new RoundedBoxGeometry(sx,sy,sz,2,radius),material);
  mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
 };
 // A real worktop cut-out instead of placing a black square on a solid slab.
 const workDepth=d+.032;
 const openingW=Math.min(.43,bay*.64);
 const openingD=Math.min(.33,d*.55);
 const openingZ=-.015;
 const xl=sinkX-openingW/2,xr=sinkX+openingW/2;
 const zb=openingZ-openingD/2,zf=openingZ+openingD/2;
 const workLeft=-w/2,workRight=w/2,workBack=-workDepth/2,workFront=workDepth/2;
 const slabY=counterBottom+counterThickness/2;
 const slab=(sx,sz,cx,cz)=>{
  if(sx>.001&&sz>.001)piece(sx,counterThickness,sz,cx,slabY,cz,stone);
 };
 slab(xl-workLeft,workDepth,(xl+workLeft)/2,0);
 slab(workRight-xr,workDepth,(workRight+xr)/2,0);
 slab(openingW,zb-workBack,sinkX,(zb+workBack)/2);
 slab(openingW,workFront-zf,sinkX,(workFront+zf)/2);
 // Wall and tiled backsplash align with the full span of the countertop.
 piece(w+.07,h-.04,.017,0,h/2,-d/2-.052,wall);
 const splashH=Math.max(.24,Math.min(.51,h-1.48));
 piece(w+.007,splashH,.015,0,counterTop+.03+ splashH/2,-d/2-.026,tile);
 if(cfg.backsplash!=='plain'){
  const tileStep=.22;
  for(let yy=counterTop+.03+tileStep;yy<counterTop+.02+splashH;yy+=tileStep)
   piece(w+.005,.002,.002,0,yy,-d/2-.015,inner);
  for(let i=1;i<Math.floor(w/tileStep);i++){
   const x=-w/2+i*tileStep;
   piece(.002,splashH,.002,x,counterTop+.03+splashH/2,-d/2-.015,inner);
  }
 }
 // Base plinth set back 60 mm; a straight cabinet body without overlapping partitions.
 piece(w-.06,foot,.04,0,foot/2,d/2-.065,body);
 piece(w-2*t,t,d-.018,0,foot+t/2,-.007,body);
 piece(w-2*t,t,d-.018,0,foot+caseH-t/2,-.007,body);
 piece(w-2*t,caseH-2*t,.008,0,foot+caseH/2,-d/2+.008,inner);
 for(let i=0;i<n;i++){
  const x=-w/2+(i+.5)*bay;
  if(i===0||i===n-1)
   piece(t,caseH,d-.025,x+(i===0?-bay/2+t/2:bay/2-t/2),foot+caseH/2,-.006,body);
  if(i<n-1)
   piece(t,caseH-2*t,d-.035,-w/2+(i+1)*bay,foot+caseH/2,-.01,body);
  // All closed fronts share the same front plane and exact 3 mm vertical joint.
  // Drawer fronts are independent, with the number of horizontal gaps chosen by the customer.
  const module=baseModules[i];
  if(module.type==='drawers'){
   const drawerCount=module.drawers;
   const rowH=(caseH-.014-(drawerCount-1)*gap)/drawerCount;
   const maxTrayDepth=Math.min(d-.082,.47);
   const openTravel=cfg.drawers_open?Math.min(.30,maxTrayDepth*.61):0;
   const trayW=Math.max(.18,bay-2*t-.045);
   const trayH=Math.min(.12,Math.max(.055,rowH-.065));
   for(let j=0;j<drawerCount;j++){
    const cy=foot+.007+(j+.5)*rowH+j*gap;
    const frontZ=d/2+.012+openTravel;
    // A single face with a rounded edge for each drawer, fixed flush when closed.
    addRound(bay-gap,rowH,.018,x,cy,frontZ,facade,.0014);
    if(cfg.handles!=='hidden'){
     const pullW=Math.min(.155,trayW*.35);
     addRound(pullW,.012,.013,x,cy,frontZ+.018,metal,.0025);
     for(const offset of [-pullW*.34,pullW*.34]){
      addRound(.006,.008,.015,x+offset,cy,frontZ+.012,steel,.001);
     }
    }
    // An actual open-top drawer box with bottom and side walls, sliding in Z with the face.
    // Tray is shorter than cabinet depth to avoid clashing with the rear wall.
    const boxFrontZ=d/2-.022+openTravel;
    const boxBackZ=boxFrontZ-maxTrayDepth;
    const boxZ=(boxFrontZ+boxBackZ)/2;
    const boxY=cy-rowH*.38;
    piece(trayW,.008,maxTrayDepth,x,boxY,boxZ,inner);
    for(const side of [-1,1]){
     piece(.010,trayH,maxTrayDepth,x+side*(trayW/2-.005),boxY+trayH/2,boxZ,body);
    }
    piece(trayW-.010,trayH,.010,x,boxY+trayH/2,boxBackZ+.005,body);
    piece(trayW-.010,trayH,.010,x,boxY+trayH/2,boxFrontZ-.005,body);
    // Fixed metal runners, visible next to the tray when it is extended.
    for(const side of [-1,1]){
     piece(.006,.014,Math.min(maxTrayDepth*.7,d-.13),
      x+side*(bay/2-t-.014),boxY+.038,d/2-Math.min(maxTrayDepth*.7,d-.13)/2-.024,steel);
    }
   }
  }else{
   addRound(bay-gap,caseH-.013,.018,x,foot+caseH/2,d/2+.012,facade,.0015);
   if(cfg.handles!=='hidden'){
    const pullX=x+bay*.39;
    addRound(.013,.15,.013,pullX,foot+caseH*.70,d/2+.03,metal,.003);
    for(const off of [-.047,.047])piece(.006,.007,.018,pullX,foot+caseH*.70+off,d/2+.020,steel);
   }
  }
 }
 // Stainless sink recessed into the opening, with four true inner walls.
 const basinDrop=Math.min(.175,counterTop-foot-.30);
 const basinY=counterTop-basinDrop;
 piece(openingW-.015,.006,openingD-.015,sinkX,basinY,openingZ,basin);
 const cy=(basinY+counterTop)/2;
 for(const side of [-1,1]){
  piece(.008,counterTop-basinY,openingD,sinkX+side*(openingW/2-.005),cy,openingZ,basin);
  piece(openingW,counterTop-basinY,.008,sinkX,cy,openingZ+side*(openingD/2-.005),basin);
 }
 // Light stainless rim and faucet, attached at the rear edge.
 for(const side of [-1,1]){
  piece(.010,.004,openingD+.008,sinkX+side*openingW/2,counterTop+.002,openingZ,steel);
  piece(openingW+.008,.004,.010,sinkX,counterTop+.002,openingZ+side*openingD/2,steel);
 }
 const faucetZ=openingZ-openingD/2-.04;
 const faucetBase=new THREE.Mesh(new THREE.CylinderGeometry(.014,.014,.025,16),steel);
 faucetBase.position.set(sinkX,counterTop+.012,faucetZ);group.add(faucetBase);
 const faucetStem=new THREE.Mesh(new THREE.CylinderGeometry(.008,.009,.21,12),steel);
 faucetStem.position.set(sinkX,counterTop+.12,faucetZ);group.add(faucetStem);
 const faucetArch=new THREE.Mesh(new THREE.TorusGeometry(.083,.007,8,22,Math.PI),steel);
 faucetArch.rotation.y=Math.PI/2;
 faucetArch.position.set(sinkX,counterTop+.225,faucetZ+.082);group.add(faucetArch);
 // Glass hob with 4 low-profile burner rings.
 const hobW=Math.min(.52,bay*.76),hobD=Math.min(.38,d*.64);
 addRound(hobW,.008,hobD,hobX,counterTop+.008,.055,glass,.012);
 const leftX=hobX-hobW*.23,rightX=hobX+hobW*.23;
 for(const cx of [leftX,rightX]){
  for(const cz of [.055-hobD*.23,.055+hobD*.23]){
   const ring=new THREE.Mesh(new THREE.TorusGeometry(Math.min(hobW*.145,.052),.003,8,24),hotRing);
   ring.rotation.x=-Math.PI/2;ring.position.set(cx,counterTop+.013,cz);
   group.add(ring);
   const cap=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.001,24),hotRing);
   cap.position.set(cx,counterTop+.013,cz);group.add(cap);
  }
 }
 // Hanging upper cabinets: a separate set of wall units with shared alignment.
 if(cfg.upper_cabinets!==false){
  const topY=h-.10,upperH=Math.min(.75,Math.max(.60,h-1.55));
  const bottomY=topY-upperH;
  const upperD=Math.min(.36,d*.66);
  const upperBack=-d/2+.013;
  const upperCenter=upperBack+upperD/2;
  const upperFront=upperBack+upperD+.014;
  const uw=w/upperN;
  piece(w-2*t,t,upperD,0,bottomY+t/2,upperCenter,body);
  piece(w-2*t,t,upperD,0,topY-t/2,upperCenter,body);
  piece(w-2*t,upperH-2*t,.008,0,bottomY+upperH/2,upperBack+.006,inner);
  for(let i=0;i<upperN;i++){
   const cx=-w/2+(i+.5)*uw;
   if(i===0||i===upperN-1)
    piece(t,upperH,upperD,cx+(i===0?-uw/2+t/2:uw/2-t/2),bottomY+upperH/2,upperCenter,body);
   if(i<upperN-1)piece(t,upperH-2*t,upperD-.02,-w/2+(i+1)*uw,bottomY+upperH/2,upperCenter,body);
   addRound(uw-gap,upperH-.011,.018,cx,bottomY+upperH/2,upperFront,facade,.0015);
   if(cfg.handles!=='hidden'){
    const px=cx+uw*.39;
    addRound(.012,.11,.012,px,bottomY+.16,upperFront+.018,metal,.0025);
    for(const dy of [-.034,.034])piece(.006,.005,.012,px,bottomY+.16+dy,upperFront+.01,steel);
   }
  }
 }
 return {width:w,height:h,depth:d,lowerCount:n,upperCount:upperN};
}
