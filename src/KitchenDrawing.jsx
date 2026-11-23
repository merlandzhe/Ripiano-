import React from 'react';

// Customer-facing elevation, not a fabrication drawing.
export default function KitchenDrawing({config={}}){
 const width=Math.max(180,Math.min(450,Number(config.width_cm)||300));
 const height=Math.max(215,Math.min(280,Number(config.height_cm)||240));
 const depth=Math.max(50,Math.min(70,Number(config.depth_cm)||60));
 const baseCount=Math.max(2,Math.min(6,Math.round(Number(config.module_count)||4)));
 const upperCount=Math.max(2,Math.min(6,Math.round(Number(config.upper_count)||baseCount)));
 const upper=config.upper_cabinets!==false;
 const scale=Math.min(365/width,267/height);
 const w=width*scale,h=height*scale,x=(440-w)/2,y=23+(287-h)/2;
 const lowerTop=y+(height-91)*scale;
 const baseY=y+(height-87.5)*scale,plinthY=y+(height-10)*scale;
 const topHeight=Math.min(75,Math.max(60,height-155));
 const upperY=y+10*scale,upperBottom=upperY+topHeight*scale;
 const body={white:'#f5f2e9',oak:'#c69f72',sand:'#c7bbae',graphite:'#535255'}[config.body_color]||'#c69f72';
 const face={white:'#f5f2e9',oak:'#c69f72',sand:'#c7bbae',graphite:'#535255'}[config.facade_color]||'#f5f2e9';
 const topColor={stone:'#e4ded4',graphite:'#4b4b49',oak:'#c1a079'}[config.countertop]||'#e4ded4';
 const handle=config.handles!=='hidden';
 const pick=v=>v==='right'?baseCount-1:v==='center'?Math.floor((baseCount-1)/2):0;
 const sink=pick(config.sink_position),hobRaw=pick(config.hob_position);
 const hob=hobRaw===sink?(sink===baseCount-1?0:baseCount-1):hobRaw;
 const labels=(name,location)=>x+(location+.5)*w/baseCount;
 return <div className="wc-diagram fc-drawing fc-kitchen-drawing">
  <svg viewBox="0 0 440 380" role="img" aria-label={'Схема прямой кухни: '+width+' см ширина, '+height+' см высота, '+depth+' см глубина, '+baseCount+' нижних модулей'}>
   <rect x={x-4} y={y} width={w+8} height={h} fill="#efece7" stroke="#d2c8ba" strokeWidth=".8"/>
   <rect x={x} y={lowerTop-51*scale} width={w} height={51*scale} fill={config.backsplash==='dark'?'#c1b8af':'#e5e0d9'}/>
   {Array.from({length:7},(_,i)=><line key={'tile'+i} x1={x} x2={x+w} y1={lowerTop-i*8*scale} y2={lowerTop-i*8*scale} stroke="#c7bdb1" strokeWidth=".45" opacity=".7"/>)}
   <rect x={x} y={baseY} width={w} height={h-(baseY-y)-10*scale} fill={body} stroke="#9a8e7f" strokeWidth="1"/>
   {Array.from({length:baseCount},(_,i)=>{
    const bx=x+i*w/baseCount,bw=w/baseCount;
    return <g key={'base'+i}>
     <rect x={bx+1.5} y={baseY+2} width={bw-3} height={plinthY-baseY-3} fill={face} stroke="#ab9d8d" strokeWidth=".75"/>
     {handle&&<rect x={bx+bw-7} y={baseY+6} width="2.5" height={Math.max(8,14*scale)} fill="#77736d" rx="1"/>}
    </g>;
   })}
   <rect x={x+4} y={plinthY} width={w-8} height={10*scale} fill={body} stroke="#b0a395" strokeWidth=".7"/>
   <rect x={x-2} y={lowerTop-2.5} width={w+4} height={Math.max(3,3.5*scale)} fill={topColor} stroke="#979187" strokeWidth=".85"/>
   <text x={labels('sink',sink)} y={lowerTop-7} textAnchor="middle" fontSize="9" fill="#494d50">мойка</text>
   <path d={'M '+(labels('sink',sink)-9)+' '+(lowerTop-15)+' h 18 v 5 h -18 z'} fill="none" stroke="#85898c" strokeWidth=".9"/>
   <text x={labels('hob',hob)} y={lowerTop-7} textAnchor="middle" fontSize="9" fill="#33383d">плита</text>
   <rect x={labels('hob',hob)-11} y={lowerTop-16} width="22" height="9" rx="1" fill="#414344" opacity=".65"/>
   {upper&&<g>
    <rect x={x} y={upperY} width={w} height={upperBottom-upperY} fill={body} stroke="#968a7c" strokeWidth="1"/>
    {Array.from({length:upperCount},(_,i)=>{
     const bx=x+i*w/upperCount,bw=w/upperCount;
     return <g key={'upper'+i}>
      <rect x={bx+1.2} y={upperY+1.8} width={bw-2.4} height={upperBottom-upperY-3.6} fill={face} stroke="#ac9f90" strokeWidth=".75"/>
      {handle&&<rect x={bx+bw-7} y={upperBottom-14} width="2.5" height="9" fill="#77736d" rx="1"/>}
     </g>;
    })}
   </g>}
   <line x1={x} y1={y+h+18} x2={x+w} y2={y+h+18} stroke="#77746c" strokeWidth="1"/>
   <path d={'M '+x+' '+(y+h+12)+' v 12 M '+(x+w)+' '+(y+h+12)+' v 12'} stroke="#77746c" strokeWidth="1"/>
   <text x="220" y={y+h+34} fill="#4b4640" textAnchor="middle" fontWeight="600" fontSize="12">{width} см</text>
   <line x1={x-16} y1={y} x2={x-16} y2={y+h} stroke="#77746c" strokeWidth="1"/>
   <path d={'M '+(x-21)+' '+y+' h 11 M '+(x-21)+' '+(y+h)+' h 11'} stroke="#77746c" strokeWidth="1"/>
   <text x={x-26} y={y+h/2} transform={'rotate(-90 '+(x-26)+' '+(y+h/2)+')'} fontSize="12" fontWeight="600" fill="#4b4640" textAnchor="middle">{height} см</text>
   <text x="220" y="372" fontSize="11" textAnchor="middle" fill="#918b82">Глубина {depth} см · Схема, не производственный чертёж</text>
  </svg>
 </div>;
}
