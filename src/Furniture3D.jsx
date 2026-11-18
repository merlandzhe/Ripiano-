
import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import './furniture-3d.css';

const FINISH={white:'#f5f2e9',oak:'#c69f72',sand:'#c7bbae',graphite:'#535255'};
const bound=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):fallback;
const meter=n=>n/100;

function buildModel(group,configuration,showDoors){
 const cfg=configuration||{};
 const kind=cfg.kind||'wardrobe';
 const w=meter(bound(cfg.width_cm,40,300,180));
 const h=meter(bound(cfg.height_cm,50,260,220));
 const d=meter(bound(cfg.depth_cm,20,100,55));
 const t=Math.min(.018,d*.065);
 const body=new THREE.MeshStandardMaterial({color:FINISH[cfg.body_color]||FINISH.oak,roughness:.77});
 const facade=new THREE.MeshStandardMaterial({color:FINISH[cfg.facade_color]||FINISH.white,roughness:.72});
 const inner=new THREE.MeshStandardMaterial({color:'#e8dfd2',roughness:.84});
 const metal=new THREE.MeshStandardMaterial({color:cfg.handles==='silver'?'#a5a6a4':'#393838',roughness:.36,metalness:.52});
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
 if(kind==='wardrobe'){
  piece(t,h,d,-w/2+t/2,h/2,0);
  piece(t,h,d,w/2-t/2,h/2,0);
  piece(w,t,d,0,t/2,0);
  piece(w,t,d,0,h-t/2,0);
  piece(w,h,.008,0,h/2,-d/2+.004,inner);
  const sections=Array.isArray(cfg.sections)&&cfg.sections.length?cfg.sections:[{kind:'shelves'},{kind:'rail'}];
  const count=Math.min(4,Math.max(2,sections.length));
  const sw=(w-t*2)/count;
  for(let s=0;s<count;s++){
   const sec=sections[s]||{kind:'shelves'};
   const left=-w/2+t+s*sw;
   if(s<count-1)piece(t,h-t*2,d-t,left+sw-t/2,h/2,0);
   const usable=Math.max(.08,sw-t*1.4);
   const cx=left+sw/2,innerZ=-.013;
   if(sec.kind==='shelves'||sec.kind==='combined'){
    const shelves=sec.kind==='combined'?2:bound(sec.shelves,2,6,4);
    for(let j=1;j<=shelves;j++)piece(usable,t,d-t*1.4,cx,(j/(shelves+1))*(h-t*2)+t,innerZ,body);
   }
   if(sec.kind==='rail'||sec.kind==='combined'){
    const y=h-(sec.kind==='combined'?.12:.18);
    bar(usable*.85,cx,y,d*.17);
    // A few simplified hangers make the rod recognizable in the open interior.
    for(let a=0;a<Math.min(3,Math.floor(usable/.13));a++){
     const hx=cx+(a-1)*Math.min(.1,usable/4);
     bar(.04,hx,y-.065,d*.14,rail);
    }
   }
   if(sec.kind==='drawers'){
    const n=Math.round(bound(sec.drawers,1,4,3));
    const dh=Math.min(.24,Math.max(.10,(h*.55)/n));
    for(let j=0;j<n;j++){
     const cy=t+.04+dh*(j+.5);
     piece(usable,dh-.012,.019,cx,cy,d/2-.015,facade);
     drawerHandle(cx,cy,d/2+.0005,Math.min(.09,usable*.25));
    }
   }
  }
  if(showDoors){
   const doorW=w/count;
   for(let i=0;i<count;i++){
    const x=-w/2+(i+.5)*doorW;
    piece(doorW-.006,h-.013,t,x,h/2,d/2+t/2,facade);
    if(cfg.handles!=='hidden'){
     const handleX=x+doorW*.37;
     piece(.010,Math.min(.17,h*.16),.012,handleX,h*.52,d/2+t+.008,metal);
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
 return {materials,w,h,d};
}
function disposeGroup(group){
 const old=[...group.children];
 for(const node of old){
  group.remove(node);
  if(node.geometry)node.geometry.dispose();
 }
}
export default function Furniture3D({config,showDoors=false,resetKey=0,onFail}){
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
   renderer.setClearColor('#eeebe5',1);
   renderer.shadowMap.enabled=true;
   renderer.shadowMap.type=THREE.PCFShadowMap;
   renderer.outputColorSpace=THREE.SRGBColorSpace;
   scene=new THREE.Scene();
   camera=new THREE.PerspectiveCamera(37,1,.05,90);
   scene.add(group);
   scene.add(new THREE.HemisphereLight('#ffffff','#b1a394',2.1));
   const light=new THREE.DirectionalLight('#ffffff',2.8);
   light.position.set(3.2,6,4.1);
   light.castShadow=true;
   light.shadow.mapSize.set(1024,1024);
   light.shadow.camera.left=-5;light.shadow.camera.right=5;
   light.shadow.camera.top=6;light.shadow.camera.bottom=-6;
   scene.add(light);
   const ground=new THREE.Mesh(new THREE.PlaneGeometry(24,24),new THREE.ShadowMaterial({opacity:.13}));
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
   session.current={group,renderer,camera,controls,schedule,materials:[],lastFit:null,fit:null};
   const fit=(w,h,d)=>{
    const radius=Math.max(w,h,d);
    const factor=Math.max(radius/(2*Math.tan(37*Math.PI/360))*1.85,2);
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
    session.current=null;
    observer?.disconnect();
    controls.removeEventListener('change',schedule);
    controls.dispose();
    holder.removeEventListener('webglcontextlost',handleLoss,false);
    if(frame!==null)cancelAnimationFrame(frame);
    disposeGroup(group);
    ground.geometry.dispose();ground.material.dispose();
    const previous=session.current?.materials||[];
    for(const m of previous)m.dispose();
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
  const result=buildModel(live.group,config,showDoors);
  live.materials=result.materials;
  const fitKey=[config?.kind||'wardrobe',result.w,result.h,result.d].join('|');
  if(live.lastFit!==fitKey){live.lastFit=fitKey;live.fit?.(result.w,result.h,result.d);}
  live.schedule();
 },[config,showDoors]);
 useEffect(()=>{
  const live=session.current;if(!live||resetKey===0)return;
  const cfg=config||{};
  live.fit?.(meter(cfg.width_cm||180),meter(cfg.height_cm||220),meter(cfg.depth_cm||55));
 },[resetKey]);
 return <canvas ref={canvas} className="ripiano-3d-canvas" aria-label="3D-модель мебели. Перемещайте палец для вращения, двумя пальцами приближайте или отдаляйте."/>;
}
