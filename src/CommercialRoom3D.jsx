import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const palette={white:0xf2eee8,oak:0xb99572,sand:0xc7b9a6,graphite:0x55565a};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function clearGroup(group){
 group.traverse(obj=>{
  if(obj.geometry)obj.geometry.dispose();
  if(obj.material){
   for(const m of (Array.isArray(obj.material)?obj.material:[obj.material]))m.dispose();
  }
 });
 group.clear();
}
function createRoom(scene,room,items,selectedId){
 const W=room.width/100,D=room.depth/100,H=room.height/100;
 // Skip expensive per-shelf shadow passes in larger layouts on mobile GPUs.
 const lightweight=items.length>28;
 const root=new THREE.Group();scene.add(root);
 const mat=(hex,opts={})=>new THREE.MeshStandardMaterial({color:hex,roughness:.71,...opts});
 const floorMat=mat(0xdfd8cc);
 const box=(owner,w,h,d,x,y,z,material,shadow=true)=>{
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  mesh.position.set(x,y,z);mesh.castShadow=shadow&&!lightweight;mesh.receiveShadow=!lightweight;owner.add(mesh);
  return mesh;
 };
 box(root,W,.05,D,0,-.045,0,floorMat,false);
 const grout=mat(0xc8c2b8);
 for(let x=-W/2+.5;x<W/2;x+=.5)box(root,.002,.001,D,x,-.018,0,grout,false);
 for(let z=-D/2+.5;z<D/2;z+=.5)box(root,W,.001,.002,0,-.018,z,grout,false);
 const wallMat=mat(0xf1ede6,{side:THREE.DoubleSide});
 box(root,W,H,.05,0,H/2,-D/2-.035,wallMat,false);
 const transparentWall=new THREE.MeshStandardMaterial({color:0xf3f0eb,transparent:true,opacity:.19,depthWrite:false,side:THREE.DoubleSide});
 box(root,.04,H,D,-W/2-.035,H/2,0,transparentWall,false);
 const beam=mat(0xbbb2a5);
 box(root,W,.025,.035,0,.04,-D/2-.005,beam,false);
 const bronze=mat(0xb1935e,{metalness:.62,roughness:.35});
 const glass=new THREE.MeshPhysicalMaterial({color:0xc6dadd,transparent:true,opacity:.34,side:THREE.DoubleSide,metalness:0,roughness:.12,depthWrite:false});
 const darkGlass=new THREE.MeshPhysicalMaterial({color:0x8da5a8,transparent:true,opacity:.55,side:THREE.DoubleSide,roughness:.28,depthWrite:false});
 const brass=mat(0xbba16c,{metalness:.48,roughness:.27});
 const light=mat(0xfff1ce,{emissive:0xffe2a4,emissiveIntensity:1.0,roughness:.28});
 for(const item of items){
  const w=item.width/100,h=item.height/100,d=item.depth/100;
  const count=clamp(Math.round(item.shelves||4),2,8);
  const color=palette[item.finish]||palette.oak;
  const body=mat(color);
  const pale=mat(0xe6dfd2);
  const inside=mat(color===palette.graphite?0x76716c:0xd9cbb9);
  const g=new THREE.Group();
  g.position.set(item.x/100-W/2,0,item.z/100-D/2);
  g.rotation.y=-(item.rotation||0)*Math.PI/180;
  root.add(g);
  const t=.018;
  const base=(height=.09)=>box(g,w,height,d,0,height/2,0,body);
  const back=()=>box(g,w-.015,h-.06,.009,0,h/2,-d/2+.007,inside);
  const sides=()=>{for(const side of [-1,1])box(g,t,h-.03,d,side*(w/2-t/2),h/2,0,body)};
  const shelves=(z=0,material=body)=>{
   for(let j=1;j<=count;j++){
    const y=.14+(h-.23)*j/(count+1);
    box(g,w-2*t-.012,.021,d-.055,0,y,z,material);
   }
  };
  const led=()=>{
   if(!item.lighting)return;
   for(let j=1;j<=count;j++){
    const y=.14+(h-.23)*j/(count+1)+.016;
    box(g,w-.075,.008,.009,0,y,d/2-.046,light,false);
   }
  };
  if(item.type==='shelf'){
   base();sides();back();box(g,w,.025,d,0,h-.015,0,body);shelves();led();
  }else if(item.type==='showcase'){
   base(.28);box(g,w,.045,d,0,h-.025,0,body);
   for(const x of [-w/2+.012,w/2-.012])for(const z of [-d/2+.012,d/2-.012])
    box(g,.018,h-.30,.018,x,(h+.28)/2,z,bronze);
   for(let j=1;j<=count;j++){
    const y=.29+(h-.39)*j/(count+1);
    box(g,w-.06,.012,d-.045,0,y,0,pale);
   }
   box(g,w-.04,h-.32,.008,0,(h+.28)/2,d/2-.01,item.glass==='tinted'?darkGlass:glass,false);
   for(const side of [-1,1])box(g,.008,h-.31,d-.035,side*(w/2-.01),(h+.28)/2,0,glass,false);
   led();
  }else if(item.type==='counter'||item.type==='cash'){
   base(.10);
   const top=mat(item.finish==='graphite'?0xaaa9a7:0xe7dfd3,{roughness:.42});
   box(g,w,.05,d+.045,0,h-.025,0,top);
   box(g,w-.035,h-.15,d-.06,0,(h-.05)/2,0,body);
   if(item.type==='cash'){
    box(g,w*.48,.016,d*.38,w*.15,h+.011,-d*.11,bronze,false);
    box(g,w*.42,.035,d*.34,-w*.19,h+.013,-d*.06,inside,false);
   }
   for(let i=-1;i<=1;i+=2)box(g,.005,h-.25,.003,i*w*.26,h*.5,d/2+.002,inside,false);
  }else if(item.type==='storage'){
   base();sides();back();box(g,w,.025,d,0,h-.014,0,body);
   for(const side of [-1,1]){
    box(g,w/2-.009,h-.13,.021,side*(w/4),h/2,d/2+.013,body);
    box(g,.011,.18,.02,side*.035,h*.52,d/2+.03,brass);
   }
  }else if(item.type==='island'){
   base(.25);
   box(g,w,.035,d,0,h-.018,0,body);
   for(const x of [-w/2+.016,w/2-.016])
    for(const z of [-d/2+.016,d/2-.016])
     box(g,.025,h-.28,.025,x,(h+.25)/2,z,brass);
   for(let j=1;j<=Math.min(count,5);j++){
    const y=.26+(h-.34)*j/(Math.min(count,5)+1);
    box(g,w-.07,.016,d-.07,0,y,0,pale);
   }
   if(item.lighting)box(g,w-.12,.01,.012,0,h-.05,d/2-.04,light,false);
  }
  // Accent footings make each object legible against the floor.
  if(selectedId===item.id){
   const bounds=new THREE.Box3().setFromObject(g);
   const outline=new THREE.Box3Helper(bounds,0x8e6241);
   outline.material.depthTest=false;outline.material.transparent=true;outline.material.opacity=.85;
   root.add(outline);
  }
 }
 // Shared models and each preview refresh are disposed together.
 return root;
}
export default function CommercialRoom3D({room,items,selectedId}){
 const canvas=useRef(null),session=useRef(null);
 const [failed,setFailed]=useState(false);
 useEffect(()=>{
  const target=canvas.current;
  if(!target)return;
  let renderer,controls,observer,raf=0;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xf1eee9);
  const camera=new THREE.PerspectiveCamera(47,1,.06,80);
  const root=new THREE.Group();scene.add(root);
  const hemi=new THREE.HemisphereLight(0xffffff,0xa89b88,2.25);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffffff,2.25);
  sun.position.set(5,9,7);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);
  sun.shadow.camera.left=-10;sun.shadow.camera.right=10;
  sun.shadow.camera.top=10;sun.shadow.camera.bottom=-10;
  sun.shadow.normalBias=.05;scene.add(sun);
  const render=()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;renderer?.render(scene,camera)})};
  try{
   renderer=new THREE.WebGLRenderer({canvas:target,antialias:true,powerPreference:'default'});
   renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));
   renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
   renderer.outputColorSpace=THREE.SRGBColorSpace;
   renderer.toneMapping=THREE.ACESFilmicToneMapping;
   renderer.toneMappingExposure=1.28;
   controls=new OrbitControls(camera,target);
   controls.enableDamping=false;controls.enablePan=false;
   controls.minPolarAngle=.15;controls.maxPolarAngle=Math.PI/2-.04;
   controls.minDistance=1.6;controls.maxDistance=35;
   controls.addEventListener('change',render);
   const resize=()=>{const rect=target.getBoundingClientRect();if(rect.width<3||rect.height<3)return;
    camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();
    renderer.setSize(Math.round(rect.width),Math.round(rect.height),false);render();
   };
   observer=new ResizeObserver(resize);observer.observe(target);
   target.addEventListener('webglcontextlost',handleContextLoss);
   session.current={scene,root,camera,controls,renderer,render,fitKey:null};
   resize();
  }catch(e){console.warn('Commercial WebGL fallback',e);setFailed(true)}
  function handleContextLoss(e){e.preventDefault();setFailed(true)}
  return ()=>{
   observer?.disconnect();
   controls?.removeEventListener('change',render);controls?.dispose();
   target?.removeEventListener('webglcontextlost',handleContextLoss);
   if(raf)cancelAnimationFrame(raf);
   session.current=null;
   for(const child of [...root.children]){root.remove(child);clearGroup(child)}
   renderer?.dispose();
  };
 },[]);
 useEffect(()=>{
  const app=session.current;if(!app)return;
  const ratio=items.length>28?1.1:1.7;
  app.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,ratio));
  for(const child of [...app.root.children]){app.root.remove(child);clearGroup(child)}
  const next=createRoom(app.scene,room,items,selectedId);
  app.root.add(next);app.scene.remove(next);
  const fitKey=room.width+'|'+room.depth;
  if(app.fitKey!==fitKey){
   app.fitKey=fitKey;
   const radius=Math.max(room.width,room.depth)/100;
   app.camera.position.set(radius*.95,Math.max(3,room.height/100+1.9),radius*1.45);
   app.controls.target.set(0,Math.min(room.height/100*.46,1.35),0);
   app.controls.minDistance=Math.max(1.6,radius*.58);
   app.controls.maxDistance=Math.max(18,radius*4);
   app.controls.update();
  }
  app.render();
 },[room,items,selectedId]);
 return <div className="cp-3d-wrap">
  <canvas ref={canvas} className="cp-3d" aria-label="3D-помещение с выбранными коммерческими витринами, прилавками и стеллажами. Поверните пальцем, приблизьте двумя пальцами."/>
  {failed&&<p className="cp-3d-failure" role="alert">3D на устройстве недоступно. Используйте план помещения 2D.</p>}
  <p className="cp-view-caption">Пальцем — вращение, двумя пальцами — масштаб. Выбранный предмет выделен контуром.</p>
 </div>;
}
