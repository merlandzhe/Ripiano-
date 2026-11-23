import React,{useId} from 'react';

// Scale-independent SVG elevation of the same kitchen front styles shown in 3D.
export default function KitchenFacadeDrawing({
 x,y,width,height,style='plain',glassType='clear',glassGrid=false,color='#f5f2e9',
 handles='black',drawer=false
}){
 const id='fd'+useId().replaceAll(':','');
 const w=Math.max(4,width),h=Math.max(4,height);
 const type=drawer&&style==='glass'?'frame':style;
 const rim=Math.min(11,Math.max(2.5,Math.min(w,h)*.115));
 const ix=x+rim,iy=y+rim,iw=Math.max(1,w-2*rim),ih=Math.max(1,h-2*rim);
 const handleColor=handles==='gold'?'#b59a55':handles==='silver'?'#a0a3a6':'#42403e';
 const border='#9f9589';
 const isGlass=type==='glass';
 const glassFill={clear:'#b4cbd0',frosted:'#e0e5e5',tinted:'#64747a'}[glassType]||'#b4cbd0';
 const fluteCount=Math.min(26,Math.max(2,Math.floor(iw/7)));
 return <g>
  <defs>
   <pattern id={id+'-r'} width="14" height="14" patternUnits="userSpaceOnUse">
    <path d="M0 7 L7 0 L14 7 L7 14 Z" stroke="#8d857b" strokeWidth=".9" opacity=".68" fill="none"/>
   </pattern>
  </defs>
  {isGlass?<>
   <rect x={ix} y={iy} width={iw} height={ih} fill={glassFill} opacity={glassType==='clear'?.63:.92}/>
   <path d={`M${ix+3} ${iy+2} l${Math.min(8,iw*.16)} 0 l${-Math.min(5,iw*.1)} ${Math.max(3,ih*.54)} Z`} fill="#fff" opacity={glassType==='tinted'?.10:.30}/>
   <path d={`M${x} ${y} h${w} v${h} h${-w} Z M${ix} ${iy} v${ih} h${iw} v${-ih} Z`}
    fill={color} fillRule="evenodd" stroke={border} strokeWidth=".7"/>
   {glassGrid&&<>
    <line x1={x+w/2} y1={iy} x2={x+w/2} y2={iy+ih} stroke={color} strokeWidth={Math.max(2,rim*.34)}/>
    <line x1={ix} y1={y+h/2} x2={ix+iw} y2={y+h/2} stroke={color} strokeWidth={Math.max(2,rim*.34)}/>
   </>}
  </>:<>
   <rect x={x} y={y} width={w} height={h} fill={color} stroke={border} strokeWidth=".8"/>
   {type!=='plain'&&<>
    <rect x={ix} y={iy} width={iw} height={ih} fill="none" stroke="#cfc3b6" strokeWidth="1.1"/>
    <rect x={ix+1.5} y={iy+1.5} width={Math.max(.5,iw-3)} height={Math.max(.5,ih-3)} fill="none" stroke="#9c9182" strokeWidth=".55"/>
    {type==='diamond'&&<rect x={ix+3} y={iy+3} width={Math.max(.5,iw-6)} height={Math.max(.5,ih-6)} fill={'url(#'+id+'-r)'} />}
    {type==='fluted'&&Array.from({length:fluteCount-1},(_,i)=>{
     const xx=ix+(i+1)*iw/fluteCount;
     return <g key={i}><line x1={xx} y1={iy+2} x2={xx} y2={iy+ih-2} stroke="#988c80" strokeWidth="1.05"/>
      <line x1={xx+1.9} y1={iy+2} x2={xx+1.9} y2={iy+ih-2} stroke="#fff" strokeWidth=".65" opacity=".6"/></g>;
    })}
   </>}
  </>}
  {handles!=='hidden'&&(drawer?
   <rect x={x+w*.33} y={y+h*.52-1.3} width={w*.34} height="2.6" rx="1.3" fill={handleColor}/>
   :<rect x={x+w-6} y={y+(h*.59)-Math.min(12,h*.2)/2} width="2.9" height={Math.min(12,h*.2)} rx="1.4" fill={handleColor}/>)}
 </g>;
}
