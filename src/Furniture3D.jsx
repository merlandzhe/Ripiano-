
import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {buildKitchen} from './kitchen-model.js';
import './furniture-3d.css';

const FINISH={white:'#f5f2e9',oak:'#c69f72',sand:'#c7bbae',graphite:'#535255'};
const bound=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):fallback;
const meter=n=>n/100;

function woodGrain(hex){
 const canvas=document.createElement('canvas');
 canvas.width=256;canvas.height=512;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle=hex;ctx.fillRect(0,0,256,512);
 let seed=217;
 const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
 for(let i=0;i<360;i++){
  const x=random()*256,shift=(random()-.5)*24,alpha=.018+random()*.085;
  ctx.strokeStyle=random()>.5?'rgba(60,35,15,'+alpha+')':'rgba(255,246,226,'+alpha+')';
  ctx.lineWidth=.35+random()*2.6;
  ctx.beginPath();ctx.moveTo(x,0);
  ctx.bezierCurveTo(x+shift,140,x-shift,330,x+shift*.3,512);
  ctx.stroke();
 }
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
 return tex;
}

function buildModel(group,configuration,showDoors,doorView){
 const cfg=configuration||{};
 const kind=cfg.kind||'wardrobe';
 const w=meter(bound(cfg.width_cm,40,kind==='kitchen'?450:300,kind==='kitchen'?300:180));
 const h=meter(bound(cfg.height_cm,50,kind==='kitchen'?280:260,kind==='kitchen'?240:220));
 const d=meter(bound(cfg.depth_cm,20,100,kind==='kitchen'?60:55));
 const t=Math.min(.018,d*.065);
 const textures=[];
 const finish=id=>{
  const color=FINISH[id]||FINISH.oak;
  if(id==='oak'||id==='sand'){
   const tex=woodGrain(color);textures.push(tex);
   return new THREE.MeshStandardMaterial({color:'#ffffff',map:tex,roughness:.75});
  }
  return new THREE.MeshStandardMaterial({color,roughness:.68});
 };
 const body=finish(cfg.body_color||'oak');
 const facade=finish(cfg.facade_color||'white');
 const inner=new THREE.MeshStandardMaterial({color:'#ded7cb',roughness:.85});
 const metal=new THREE.MeshStandardMaterial({color:cfg.handles==='gold'?'#b59857':cfg.handles==='silver'?'#a5a6a4':'#393838',roughness:cfg.handles==='gold'?.27:.36,metalness:cfg.handles==='gold'?.76:.52});
 const rail=new THREE.MeshStandardMaterial({color:'#aaa7a2',roughness:.39,metalness:.54});
 const materials=[body,facade,inner,metal,rail];
 const piece=(ww,hh,dd,x,y,z,mat=body)=>{
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.001,ww),Math.max(.001,hh),Math.max(.001,dd)),mat);
  mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
 };
 const bar=(length,x,y,z,mat=rail)=>{
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.007,.007,Math.max(.01,length),9),mat);
  mesh.rotation.z=Math.PI/2;mesh.position.set(x,y,z);mesh.castShadow=true;group.add(mesh);
 };
 const drawerHandle=(x,y,z,length)=>{if(cfg.handles!=='hidden')piece(Math.max(.025,length),.008,.009,x,y,z,metal)};
 if(kind==='kitchen'){
  buildKitchen(group,cfg,{piece,body,facade,inner,metal,materials});
 }else if(kind==='wardrobe'){
  // Shared coordinate system: every door is flush with the same front plane.
  const plinth=.075,gap=.0025,margin=.002,frontZ=d/2+.002,faceDepth=.018;
  const usableWidth=w-2*t,innerHeight=h-plinth-2*t;
  const sections=Array.isArray(cfg.sections)&&cfg.sections.length?cfg.sections:[{kind:'shelves',shelves:4},{kind:'rail'}];
  const count=Math.min(6,Math.max(2,sections.length));
  const bay=usableWidth/count;
  const faceWidth=w-2*margin;
  const doorWidth=(faceWidth-(count-1)*gap)/count;
  const faceHeight=h-plinth-.006;
  // Recessed plinth and one continuous rectangular carcass.
  piece(w-.05,plinth,.04,0,plinth/2,d/2-.055);
  piece(t,h-plinth,d,-w/2+t/2,plinth+(h-plinth)/2,0);
  piece(t,h-plinth,d,w/2-t/2,plinth+(h-plinth)/2,0);
  piece(w-2*t,t,d,0,plinth+t/2,0);
  piece(w-2*t,t,d,0,h-t/2,0);
  piece(w-2*t,innerHeight,.006,0,plinth+t+innerHeight/2,-d/2+.008,inner);
  for(let i=0;i<count;i++){
   const sec=sections[i]||{kind:'shelves',shelves:4};
   const x0=-w/2+t+i*bay,cx=x0+bay/2;
   const shelfWidth=Math.max(.09,bay-t-.004);
   if(i<count-1)piece(t,innerHeight,d-.045,x0+bay,plinth+t+innerHeight/2,-.012);
   if(sec.kind==='shelves'||sec.kind==='combined'){
    const n=sec.kind==='combined'?2:Math.round(bound(sec.shelves,2,6,4));
    const layout=Array.isArray(sec.shelfPositions)&&sec.shelfPositions.length===n
     ?sec.shelfPositions.filter(v=>Number.isFinite(Number(v))).map(v=>Math.max(.05,Math.min(.95,Number(v)))):null;
    for(let j=1;j<=n;j++){
     const position=layout&&layout.length===n?1-layout[j-1]:j/(n+1);
     piece(shelfWidth,t,d-.065,cx,plinth+t+innerHeight*position,-.012);
    }
   }
   if(sec.kind==='rail'||sec.kind==='combined'){
    const rod=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,Math.max(.05,shelfWidth-.05),12),rail);
    rod.rotation.z=Math.PI/2;
    rod.position.set(cx,h-(sec.kind==='combined'?.32:.20),-.035);
    rod.castShadow=true;group.add(rod);
   }
   if(sec.kind==='drawers'){
    const n=Math.round(bound(sec.drawers,1,4,3)),rowH=Math.min(.22,innerHeight*.53/n);
    for(let j=0;j<n;j++){
     const y=plinth+t+.045+rowH*(j+.5);
     piece(shelfWidth-.012,rowH-.01,.018,cx,y,d/2-.045,facade);
     if(cfg.handles!=='hidden')piece(Math.min(.13,shelfWidth*.24),.008,.008,cx,y,d/2-.031,metal);
    }
   }
  }
  // Three reliable views: closed, fully swung open, or interior with fronts hidden.
  // On the outside edges, hinges face outward (leftmost -> left, rightmost -> right).
  // Interior bays alternate so the closing edges and handles face correctly.
  const view=doorView|| (showDoors?'closed':'interior');
  if(view!=='interior')for(let i=0;i<count;i++){
   const x=-w/2+margin+i*(doorWidth+gap)+doorWidth/2;
   const left=i===0||(i!==count-1&&i%2===0);
   const pivot=new THREE.Group();
   pivot.position.set(x+(left?-doorWidth/2:doorWidth/2),0,frontZ+faceDepth/2);
   // A 112-degree outward swing reveals the shelves; no partially closed doors.
   pivot.rotation.y=view==='open'?(left?-1:1)*Math.PI*112/180:0;
   group.add(pivot);
   const face=new THREE.Mesh(new RoundedBoxGeometry(doorWidth,faceHeight,faceDepth,2,.0011),facade);
   face.position.set(left?doorWidth/2:-doorWidth/2,plinth+.003+faceHeight/2,0);
   face.castShadow=true;face.receiveShadow=true;pivot.add(face);
   if(cfg.handles!=='hidden'){
    const hx=left?doorWidth-.045:-doorWidth+.045;
    const hy=plinth+faceHeight*.54;
    const pull=new THREE.Mesh(new RoundedBoxGeometry(.012,Math.min(.22,faceHeight*.17),.012,2,.002),metal);
    pull.position.set(hx,hy,faceDepth/2+.012);pull.castShadow=true;pivot.add(pull);
    for(const dy of [-.062,.062]){
     const mount=new THREE.Mesh(new THREE.BoxGeometry(.006,.008,.013),metal);
     mount.position.set(hx,hy+dy,faceDepth/2+.005);pivot.add(mount);
    }
   }
  }
 }else if(kind==='dresser'){
  const leg=cfg.leg_style==='legs';
  const base=leg?.12:.06,caseH=h-base;
  piece(t,caseH,d,-w/2+t/2,base+caseH/2,0);
  piece(t,caseH,d,w/2-t/2,base+caseH/2,0);
  piece(w,t,d,0,base+caseH-t/2,0);
  piece(w,t,d,0,base+t/2,0);
  piece(w,caseH,.008,0,base+caseH/2,-d/2+.004,inner);
  if(leg){
   for(const x of [-w/2+.05,w/2-.05])for(const z of [-d/2+.05,d/2-.05])piece(.042,base,.044,x,base/2,z,body);
  }else piece(w-.02,base,.025,0,base/2,d/2-.028,body);
  const n=Math.round(bound(cfg.drawer_count,2,8,4));
  const drawerH=(caseH-2*t)/n;
  for(let i=0;i<n;i++){
   const cy=base+t+(i+.5)*drawerH;
   piece(w-2*t-.008,Math.max(.022,drawerH-.009),t,0,cy,d/2+t*.1,facade);
   drawerHandle(0,cy,d/2+t*.65,Math.min(.11,w*.17));
  }
 }else if(kind==='shelf'){
  piece(t,h,d,-w/2+t/2,h/2,0);
  piece(t,h,d,w/2-t/2,h/2,0);
  piece(w,t,d,0,t/2,0);
  piece(w,t,d,0,h-t/2,0);
  if(cfg.back_panel!==false)piece(w,h,.007,0,h/2,-d/2+.004,inner);
  const bays=Math.round(bound(cfg.bay_count,1,4,2));
  for(let i=1;i<bays;i++)piece(t,h-2*t,d, -w/2+i*w/bays,h/2,0);
  const n=Math.round(bound(cfg.shelf_count,2,8,4));
  for(let i=1;i<=n;i++)piece(w-2*t,t,d,0,t+(h-2*t)*i/(n+1),0);
 }else if(kind==='desk'){
  const top=.035;
  piece(w,top,d,0,h-top/2,0,body);
  if(cfg.leg_style==='metal'){
   for(const x of [-w/2+.045,w/2-.045])for(const z of [-d/2+.052,d/2-.052])piece(.035,h-top,.036,x,(h-top)/2,z,metal);
   piece(w-.1,.025,.025,0,.19,-d/2+.065,metal);
  }else{
   for(const x of [-w/2+.022,w/2-.022])piece(.04,h-top,d-.025,x,(h-top)/2,0,body);
   piece(w-.08,.22,t,0,h-top-.13,-d/2+.045,body);
  }
  const count=Math.round(bound(cfg.drawer_count,0,4,0));
  if(count>0&&cfg.drawer_side!=='none'){
   const ww=Math.min(w*.30,.46);
   const cx=cfg.drawer_side==='left'?-w/2+ww/2+.045:w/2-ww/2-.045;
   const bottom=.08,topY=h-top-.014,hh=topY-bottom;
   piece(t,hh,d*.75,cx-ww/2+t/2,bottom+hh/2,d*.05,body);
   piece(t,hh,d*.75,cx+ww/2-t/2,bottom+hh/2,d*.05,body);
   piece(ww,t,d*.75,cx,bottom+t/2,d*.05,body);
   const rowH=hh/count;
   for(let i=0;i<count;i++){
    const cy=topY-(i+.5)*rowH;
    piece(ww-2*t-.008,rowH-.009,.018,cx,cy,d*.42,facade);
    drawerHandle(cx,cy,d*.42+.016,Math.min(.08,ww*.25));
   }
  }
 }
 return {materials,textures,w,h,d};
}
function disposeGroup(group){
 group.traverse(node=>{if(node.geometry)node.geometry.dispose()});
 group.clear();
}
export default function Furniture3D({config,showDoors=false,doorView,resetKey=0,onFail}){
 const canvas=useRef(null),session=useRef(null),fallback=useRef(onFail);
 fallback.current=onFail;
 useEffect(()=>{
  if(!canvas.current)return;
  let renderer,scene,camera,controls,observer,frame=null;
  const holder=canvas.current;
  const group=new THREE.Group();
  const schedule=()=>{
   if(frame!==null)return;
   frame=requestAnimationFrame(()=>{
    frame=null;
    if(renderer&&scene&&camera)renderer.render(scene,camera);
   });
  };
  try{
   renderer=new THREE.WebGLRenderer({canvas:holder,alpha:true,antialias:true,powerPreference:'low-power'});
   renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));
   renderer.setClearColor('#ebe8e1',1);
   renderer.shadowMap.enabled=true;
   renderer.shadowMap.type=THREE.PCFShadowMap;
   renderer.outputColorSpace=THREE.SRGBColorSpace;
   scene=new THREE.Scene();
   camera=new THREE.PerspectiveCamera(37,1,.05,90);
   scene.add(group);
   scene.add(new THREE.HemisphereLight('#ffffff','#a7a09a',1.5));
   const light=new THREE.DirectionalLight('#ffffff',3.0);
   light.position.set(3.2,6,4.1);
   light.castShadow=true;
   light.shadow.mapSize.set(window.innerWidth<720?1024:2048,window.innerWidth<720?1024:2048);
   light.shadow.camera.left=-5;light.shadow.camera.right=5;
   light.shadow.camera.top=6;light.shadow.camera.bottom=-6;
   scene.add(light);
   const ground=new THREE.Mesh(new THREE.PlaneGeometry(24,24),new THREE.ShadowMaterial({opacity:.20}));
   ground.rotation.x=-Math.PI/2;
   ground.position.y=-.015;
   ground.receiveShadow=true;
   scene.add(ground);
   controls=new OrbitControls(camera,holder);
   controls.enableDamping=false;
   controls.enablePan=false;
   controls.enableRotate=true;
   controls.enableZoom=true;
   controls.minPolarAngle=.10;
   controls.maxPolarAngle=Math.PI/2+.20;
   controls.rotateSpeed=.65;
   controls.zoomSpeed=.85;
   controls.addEventListener('change',schedule);
   const size=()=>{
    const rect=holder.getBoundingClientRect();
    if(rect.width<2||rect.height<2)return;
    camera.aspect=rect.width/rect.height;
    camera.updateProjectionMatrix();
    renderer.setSize(Math.round(rect.width),Math.round(rect.height),false);
    schedule();
   };
   observer=new ResizeObserver(size);
   observer.observe(holder);
   const handleLoss=e=>{e.preventDefault();fallback.current?.()};
   holder.addEventListener('webglcontextlost',handleLoss,false);
   session.current={group,renderer,camera,controls,schedule,materials:[],textures:[],lastFit:null,fit:null};
   const fit=(w,h,d)=>{
    const radius=Math.max(w,h,d);
    const factor=Math.max(radius/(2*Math.tan(37*Math.PI/360))*1.28,1.8);
    camera.position.set(factor*.82,h*.52+factor*.48,factor*.95);
    controls.target.set(0,h*.50,0);
    controls.minDistance=Math.max(.5,radius*.78);
    controls.maxDistance=Math.max(10,radius*5);
    controls.update();
    schedule();
   };
   session.current.fit=fit;
   size();
   return ()=>{
    const last=session.current;
    session.current=null;
    observer?.disconnect();
    controls.removeEventListener('change',schedule);
    controls.dispose();
    holder.removeEventListener('webglcontextlost',handleLoss,false);
    if(frame!==null)cancelAnimationFrame(frame);
    disposeGroup(group);
    ground.geometry.dispose();ground.material.dispose();
    const previous=last?.materials||[];
    for(const m of previous)m.dispose();
    for(const texture of last?.textures||[])texture.dispose();
    renderer.dispose();
   };
  }catch(e){
   console.warn('RIPIANO 3D unavailable',e);
   observer?.disconnect();controls?.dispose();
   if(renderer)renderer.dispose();
   fallback.current?.();
  }
 },[]);
 useEffect(()=>{
  const live=session.current;
  if(!live)return;
  disposeGroup(live.group);
  for(const m of live.materials)m.dispose();
  for(const texture of live.textures||[])texture.dispose();
  const result=buildModel(live.group,config,showDoors,doorView);
  live.materials=result.materials;
  live.textures=result.textures;
  const fitKey=[config?.kind||'wardrobe',result.w,result.h,result.d].join('|');
  if(live.lastFit!==fitKey){live.lastFit=fitKey;live.fit?.(result.w,result.h,result.d);}
  // Center the camera on the front in the interior mode so every shelf is visible.
  if((config?.kind||'wardrobe')==='wardrobe' && doorView==='interior' && live.lastDoorView!=='interior'){
   const size=Math.max(result.w,result.h);
   live.camera.position.set(0,result.h*.62,size*1.65+result.d);
   live.controls.target.set(0,result.h*.52,0);
   live.controls.update();
  }
  live.lastDoorView=doorView;
  live.schedule();
 },[config,showDoors,doorView]);
 useEffect(()=>{
  const live=session.current;if(!live||resetKey===0)return;
  const cfg=config||{};
  live.fit?.(meter(cfg.width_cm||180),meter(cfg.height_cm||220),meter(cfg.depth_cm||55));
 },[resetKey]);
 return <canvas ref={canvas} className="ripiano-3d-canvas" aria-label="3D-модель мебели. Перемещайте палец для вращения, двумя пальцами приближайте или отдаляйте."/>;
}
