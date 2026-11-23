// Shared configuration rules for the straight kitchen used by UI, 2D and 3D.
export function kitchenSlotIndex(position,count){
 const n=Math.max(2,Math.min(6,Math.round(Number(count)||4)));
 return position==='right'?n-1:position==='center'?Math.floor((n-1)/2):0;
}
export function kitchenBaseModules(config={}){
 const n=Math.max(2,Math.min(6,Math.round(Number(config.module_count)||4)));
 const sink=kitchenSlotIndex(config.sink_position||'left',n);
 const source=Array.isArray(config.base_modules)?config.base_modules:[];
 return Array.from({length:n},(_,i)=>{
  if(i===sink)return {type:'door',drawers:3};
  const current=source[i]||{type:i===1?'drawers':'door',drawers:3};
  return {
   type:current.type==='drawers'?'drawers':'door',
   drawers:Math.max(2,Math.min(4,Math.round(Number(current.drawers)||3)))
  };
 });
}
