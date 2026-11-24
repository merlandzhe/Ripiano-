// Shared entrance coordinates for the browser 2D plan, 3D view, and local project draft.
// offset is the doorway CENTER measured from the LEFT end of horizontal walls,
// or from the FAR end of vertical walls (in centimetres).
export const ENTRANCE_WALLS=[
 {id:'front',label:'У входа / ближняя'},
 {id:'back',label:'Дальняя'},
 {id:'left',label:'Левая'},
 {id:'right',label:'Правая'}
];
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number.isFinite(Number(n))?Number(n):min));
export const wallLength=(room,wall)=>wall==='left'||wall==='right'?room.depth:room.width;
export const defaultEntrance=room=>({
 enabled:true,wall:'front',width:90,offset:Math.round(room.width/2/5)*5,hinge:'left'
});
export function normalizeEntrance(value,room){
 const defaults=defaultEntrance(room);
 const data=value&&typeof value==='object'?value:defaults;
 const wall=ENTRANCE_WALLS.some(w=>w.id===data.wall)?data.wall:defaults.wall;
 const length=wallLength(room,wall);
 const width=Math.round(clamp(data.width,70,Math.min(160,length-30))/5)*5;
 const min=width/2+10,max=length-width/2-10;
 return {
  enabled:data.enabled!==false,wall,width,
  offset:Math.round(clamp(data.offset, min,max)/5)*5,
  hinge:data.hinge==='right'?'right':'left'
 };
}
export function entranceInPlan(room,door){
 const e=normalizeEntrance(door,room);
 const wallLengthCm=wallLength(room,e.wall);
 const first=e.offset-e.width/2,last=e.offset+e.width/2;
 return {...e,wallLength:wallLengthCm,first,last};
}
export function entranceBlocked(room,door,items=[]){
 const e=normalizeEntrance(door,room);
 if(!e.enabled)return [];
 const pad=42; // preliminary clearance zone inside the doorway
 const result=[];
 for(let i=0;i<items.length;i++){
  const m=items[i];
  const rotated=Number(m.rotation)%180===90;
  const halfW=(rotated?m.depth:m.width)/2;
  const halfD=(rotated?m.width:m.depth)/2;
  const left=m.x-halfW,right=m.x+halfW,far=m.z-halfD,near=m.z+halfD;
  let obstructs=false;
  if(e.wall==='front')obstructs=right>e.first&&left<e.last&&near>room.depth-pad;
  else if(e.wall==='back')obstructs=right>e.first&&left<e.last&&far<pad;
  else if(e.wall==='left')obstructs=near>e.first&&far<e.last&&left<pad;
  else obstructs=near>e.first&&far<e.last&&right>room.width-pad;
  if(obstructs)result.push(i+1);
 }
 return result;
}
