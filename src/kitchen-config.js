// Shared, closed-only kitchen base cabinet layout for the 2D and 3D previews.
export function kitchenBaseModules(config={}){
 const n=Math.max(2,Math.min(6,Math.round(Number(config.module_count)||4)));
 const selected=Math.round(Number(config.sink_cabinet));
 const sink=Number.isFinite(selected)&&selected>=1&&selected<=n
  ?selected-1
  :config.sink_position==='right'?n-1:config.sink_position==='center'?Math.floor((n-1)/2):0;
 const source=Array.isArray(config.base_modules)?config.base_modules:[];
 const preferredDefault=i=>i===(sink===1?Math.min(n-1,2):1)?'drawers':'door';
 return Array.from({length:n},(_,i)=>{
  if(i===sink)return {type:'door',drawers:3};
  const stored=source[i];
  const kind=stored?.type==='door'||stored?.type==='drawers'?stored.type:preferredDefault(i);
  return {
   type:kind,
   drawers:Math.max(2,Math.min(4,Math.round(Number(stored?.drawers)||3)))
  };
 });
}


// Group presets inspired by mixed cabinet fronts: outer doors match each other.
export function kitchenDoorStyle(selected,index,count){
 const style=selected||'plain';
 if(style==='mixed')return index===0||index===count-1?'fluted':'diamond';
 if(style==='glass_frame')return index===0||index===count-1?'frame':'glass';
 return style;
}
