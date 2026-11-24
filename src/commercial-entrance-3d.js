import * as THREE from 'three';
import {normalizeEntrance} from './commercial-entrance.js';

// Real wall opening and a partly opened glazed entrance for the preview.
// Four walls are deliberately not made opaque: the camera must still see inside the shop.
export function renderCommercialEntrance(root,room,entrance,{box,mat}){
 const W=room.width/100,D=room.depth/100,H=room.height/100;
 const e=normalizeEntrance(entrance,room);
 const w=e.width/100,offset=e.offset/100;
 const doorHeight=Math.min(2.13,H-.22),post=.034;
 const opaque=mat(0xf1ede6,{side:THREE.DoubleSide});
 const lightWall=new THREE.MeshStandardMaterial({color:0xf3f0eb,transparent:true,opacity:.18,depthWrite:false,side:THREE.DoubleSide});
 const markedWall=new THREE.MeshStandardMaterial({color:0xe9e4dd,transparent:true,opacity:.09,depthWrite:false,side:THREE.DoubleSide});
 const edge=mat(0xbeb4a6);
 const metal=mat(0x9b886d,{metalness:.62,roughness:.34});
 const glass=new THREE.MeshPhysicalMaterial({
  color:0xc4dbe0,transparent:true,opacity:.43,metalness:0,roughness:.13,
  side:THREE.DoubleSide,depthWrite:false
 });
 const parts=(length,centre,wall)=>{
  const begin=centre-w/2,finish=centre+w/2;
  const leftLen=Math.max(0,begin+length/2);
  const rightLen=Math.max(0,length/2-finish);
  const sideMaterial=wall==='back'?opaque:wall==='left'?lightWall:markedWall;
  const position=wall==='back'?-D/2-.035:wall==='front'?D/2+.028:wall==='left'?-W/2-.035:W/2+.028;
  const isSide=wall==='left'||wall==='right';
  if(isSide){
   if(leftLen>.02)box(root,.04,H,leftLen,position,H/2,-D/2+leftLen/2,sideMaterial,false);
   if(rightLen>.02)box(root,.04,H,rightLen,position,H/2,D/2-rightLen/2,sideMaterial,false);
   if(H>doorHeight)box(root,.04,H-doorHeight,w,position,(H+doorHeight)/2,centre,sideMaterial,false);
  }else{
   if(leftLen>.02)box(root,leftLen,H,.04,-W/2+leftLen/2,H/2,position,sideMaterial,false);
   if(rightLen>.02)box(root,rightLen,H,.04,W/2-rightLen/2,H/2,position,sideMaterial,false);
   if(H>doorHeight)box(root,w,H-doorHeight,.04,centre,(H+doorHeight)/2,position,sideMaterial,false);
  }
 };
 if(!e.enabled){
  box(root,W,H,.05,0,H/2,-D/2-.035,opaque,false);
  box(root,.04,H,D,-W/2-.035,H/2,0,lightWall,false);
  return;
 }
 // Existing opaque back and translucent left wall remain intact unless pierced by the door.
 if(e.wall!=='back')box(root,W,H,.05,0,H/2,-D/2-.035,opaque,false);
 else parts(W,offset-W/2,'back');
 if(e.wall!=='left')box(root,.04,H,D,-W/2-.035,H/2,0,lightWall,false);
 else parts(D,offset-D/2,'left');
 if(e.wall==='right')parts(D,offset-D/2,'right');
 if(e.wall==='front')parts(W,offset-W/2,'front');

 const horizontal=e.wall==='front'||e.wall==='back';
 const place=offset-(horizontal?W:D)/2;
 const px=horizontal?place:e.wall==='left'?-W/2-.015:W/2+.015;
 const pz=horizontal?e.wall==='front'?D/2+.015:-D/2-.015:place;
 // Two posts, a lintel, and a clearly visible floor threshold.
 for(const side of [-1,1]){
  if(horizontal)box(root,post,doorHeight+.02,post,px+side*w/2,doorHeight/2,pz,metal,false);
  else box(root,post,doorHeight+.02,post,px,doorHeight/2,pz+side*w/2,metal,false);
 }
 if(horizontal){
  box(root,w+.04,post,post,px,doorHeight+.02,pz,metal,false);
  box(root,w,.007,.14,px,.005,pz,edge,false);
 }else{
  box(root,post,post,w+.04,px,doorHeight+.02,pz,metal,false);
  box(root,.14,.007,w,px,.005,pz,edge,false);
 }
 const leafW=w-.095,leafH=doorHeight-.105;
 const sign=e.hinge==='left'?1:-1;
 const pivot=new THREE.Group();
 const hingeOffset=sign===1?-w/2+.045:w/2-.045;
 if(horizontal){
  pivot.position.set(px+hingeOffset,0,pz);
  pivot.rotation.y=(e.wall==='front'?1:-1)*sign*.58;
 }else{
  pivot.position.set(px,0,pz+hingeOffset);
  pivot.rotation.y=(e.wall==='left'?1:-1)*sign*.58;
 }
 root.add(pivot);
 const center=sign*leafW/2;
 const makeFrame=(owner,isHorizontal)=>{
  const thickness=.028;
  const hw=leafW/2;
  if(isHorizontal){
   box(owner,leafW-.026,leafH-.075,.012,center,leafH/2+.045,0,glass,false);
   for(const side of [-1,1])box(owner,.029,leafH,.026,center+side*(hw-.014),leafH/2+.045,0,metal,false);
   for(const sy of [-1,1])box(owner,leafW,.029,.026,center,leafH/2+.045+sy*(leafH/2-.015),0,metal,false);
   box(owner,.015,.11,.032,center-sign*.045,1.02,.04,edge,false);
  }else{
   box(owner,.012,leafH-.075,leafW-.026,0,leafH/2+.045,center,glass,false);
   for(const side of [-1,1])box(owner,.026,leafH,.029,0,leafH/2+.045,center+side*(hw-.014),metal,false);
   for(const sy of [-1,1])box(owner,.026,.029,leafW,0,leafH/2+.045+sy*(leafH/2-.015),center,metal,false);
   box(owner,.036,.11,.016,.045,1.02,center-sign*.045,edge,false);
  }
 };
 makeFrame(pivot,horizontal);
}
