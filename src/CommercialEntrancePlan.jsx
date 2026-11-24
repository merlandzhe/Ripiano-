import React from 'react';
import {entranceInPlan} from './commercial-entrance.js';

// Floor outline has a real gap where the entrance is, plus a glass leaf and opening direction.
export default function CommercialEntrancePlan({room,entrance,pad=34}){
 const e=entranceInPlan(room,entrance);
 const x0=pad,y0=pad,x1=pad+room.width,y1=pad+room.depth;
 const horizontal=e.wall==='front'||e.wall==='back';
 const first=pad+e.first,last=pad+e.last;
 const center=pad+e.offset;
 const edge=(x1,y1,x2,y2,key)=><line key={key} x1={x1} y1={y1} x2={x2} y2={y2}
  stroke="#8e857a" strokeWidth="5" strokeLinecap="square"/>;
 const walls=!e.enabled?
  <>{edge(x0,y0,x1,y0,'back')}{edge(x0,y1,x1,y1,'front')}
   {edge(x0,y0,x0,y1,'left')}{edge(x1,y0,x1,y1,'right')}</>:
  <>
   {e.wall==='back'?<>{edge(x0,y0,first,y0,'b1')}{edge(last,y0,x1,y0,'b2')}</>:edge(x0,y0,x1,y0,'back')}
   {e.wall==='front'?<>{edge(x0,y1,first,y1,'f1')}{edge(last,y1,x1,y1,'f2')}</>:edge(x0,y1,x1,y1,'front')}
   {e.wall==='left'?<>{edge(x0,y0,x0,first,'l1')}{edge(x0,last,x0,y1,'l2')}</>:edge(x0,y0,x0,y1,'left')}
   {e.wall==='right'?<>{edge(x1,y0,x1,first,'r1')}{edge(x1,last,x1,y1,'r2')}</>:edge(x1,y0,x1,y1,'right')}
  </>;
 if(!e.enabled)return <g pointerEvents="none">{walls}</g>;
 const pivotOffset=e.hinge==='left'?-e.width/2:e.width/2;
 const openingLength=e.width*.83;
 const px=horizontal?center+pivotOffset:e.wall==='left'?x0:x1;
 const py=horizontal?e.wall==='back'?y0:y1:center+pivotOffset;
 const tipX=horizontal?px:px+(e.wall==='left'?openingLength:-openingLength);
 const tipY=horizontal?py+(e.wall==='front'?-openingLength:openingLength):py;
 const openingLine=horizontal?
  <line x1={first} y1={py} x2={last} y2={py} stroke="#b78e5e" strokeWidth="8"/>:
  <line x1={px} y1={first} x2={px} y2={last} stroke="#b78e5e" strokeWidth="8"/>;
 return <g pointerEvents="none">
  {walls}
  {openingLine}
  <line x1={px} y1={py} x2={tipX} y2={tipY} stroke="#9b6c45" strokeWidth="5" strokeLinecap="round"/>
  <circle cx={px} cy={py} r="7" stroke="#fff" strokeWidth="2" fill="#946844"/>
  <text x={horizontal?center:e.wall==='left'?pad+24:pad+room.width-24}
   y={horizontal?py+(e.wall==='front'?26:-15):center}
   fill="#845d37" fontSize="14" fontWeight="700" textAnchor="middle">ВХОД</text>
 </g>;
}
