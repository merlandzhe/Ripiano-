// RIPIANO sketch reader v2. All processing is on the device.
// Detects front elevations and simple perspective line drawings; does not perform OCR.
export function recognizeWardrobeSketch(img){
 const width=Math.round(img?.width||0),height=Math.round(img?.height||0),rgba=img?.data;
 if(width<100||height<100||!rgba||rgba.length<width*height*4)return {ok:false,message:'Не удалось прочитать изображение.'};
 const mono=new Uint8Array(width*height);
 let ink=0;
 for(let i=0;i<mono.length;i++){
  const p=4*i;
  const lum=.299*rgba[p]+.587*rgba[p+1]+.114*rgba[p+2];
  if(lum<184){mono[i]=1;ink++}
 }
 if(ink<Math.max(180,mono.length*.0008))return {ok:false,message:'Не вижу контур шкафа. Попробуйте чёткое фото на светлом фоне.'};
 const hit=(x,y)=>x>=0&&x<width&&y>=0&&y<height&&mono[y*width+x]>0;
 const near=(x,y,dx=2,dy=2)=>{
  for(let yy=y-dy;yy<=y+dy;yy+=2)for(let xx=x-dx;xx<=x+dx;xx+=2)if(hit(xx,yy))return true;
  return false;
 };
 const longVertical=(x,minRun)=>{
  const points=[];
  for(let y=5;y<height-5;y+=2)if(near(x,y,3,1))points.push(y);
  if(points.length<minRun*.20)return null;
  let best=null,start=0;
  for(let j=1;j<=points.length;j++){
   if(j<points.length&&points[j]-points[j-1]<=12)continue;
   const a=points[start],b=points[j-1],span=b-a,coverage=(j-start)*2/Math.max(2,span);
   if(span>=minRun&&coverage>.52&&(!best||span*coverage>best.span*best.coverage))best={x,start:a,end:b,span,coverage};
   start=j;
  }
  return best;
 };
 const getCandidates=minSpan=>{
  const all=[];
  for(let x=10;x<width-10;x+=2){const line=longVertical(x,minSpan);if(line)all.push(line)}
  const groups=[];
  for(const line of all){
   let previous=groups[groups.length-1];
   if(previous&&line.x-previous[previous.length-1].x<=9)previous.push(line);
   else groups.push([line]);
  }
  return groups.map(g=>g.reduce((a,b)=>a.span*a.coverage>=b.span*b.coverage?a:b))
   .filter(v=>v.span>=minSpan)
   .sort((a,b)=>a.x-b.x);
 };
 let candidates=getCandidates(height*.57);
 if(candidates.length<3)candidates=getCandidates(height*.35);
 if(candidates.length<3)return {ok:false,message:'Не удалось выделить боковины и перегородку. Попробуйте крупное фото с целиком видимым шкафом.'};
 // Best horizontal support for a shelf line; evaluates mild perspective tilt.
 const slopes=[-.06,-.025,0,.035,.065,.095,.14];
 const shelfStrength=(left,right,y)=>{
  const span=right-left;
  const pad=Math.max(5,Math.round(span*.06)),step=Math.max(3,Math.round(span/48));
  let best=0;
  for(const slope of slopes){
   let n=0,hits=0;
   for(let x=left+pad;x<right-pad;x+=step){
    const yy=Math.round(y+slope*(x-left));
    if(yy<4||yy>=height-4)continue;
    n++;
    if(near(x,yy,2,3))hits++;
   }
   if(n>0)best=Math.max(best,hits/n);
  }
  return best;
 };
 const peaksFor=(left,right,top=height*.18,bottom=height*.86)=>{
  const data=[];
  for(let y=Math.round(top);y<=bottom;y+=5){const score=shelfStrength(left,right,y);if(score>=.70)data.push({pos:y,strength:score})}
  const separation=Math.max(24,Math.round(height*.087));
  // Non-maximum suppression removes the two visible edges of each board.
  const peaks=[];
  for(const point of data.sort((a,b)=>b.strength-a.strength)){
   if(peaks.every(v=>Math.abs(v.pos-point.pos)>separation))peaks.push(point);
  }
  return peaks.sort((a,b)=>a.pos-b.pos);
 };
 const minGap=Math.max(42,Math.round(width*.10));
 let bestTriplet=null;
 const limited=candidates.length>14?[...candidates].sort((a,b)=>b.span-a.span).slice(0,14).sort((a,b)=>a.x-b.x):candidates;
 const scoreCache=new Map();
 const scorePair=(a,b)=>{
  const key=a+'-'+b;
  if(scoreCache.has(key))return scoreCache.get(key);
  const peaks=peaksFor(a,b).filter(p=>p.strength>=.78);
  // Very thin side planes and annotation lines get lower scores than full-width shelves.
  const weighted=peaks.slice().sort((a,b)=>b.strength-a.strength).slice(0,7).reduce((v,p)=>v+p.strength,0);
  scoreCache.set(key,{weighted,peaks});return {weighted,peaks};
 };
 for(let i=0;i<limited.length-2;i++)for(let j=i+1;j<limited.length-1;j++)for(let k=j+1;k<limited.length;k++){
  const a=limited[i],b=limited[j],c=limited[k],left=b.x-a.x,right=c.x-b.x;
  if(left<minGap||right<minGap||left+right<width*.26)continue;
  const l=scorePair(a.x,b.x),r=scorePair(b.x,c.x);
  const shape=Math.min(left,right)/Math.max(left,right);
  const score=l.weighted+r.weighted+.65*shape - .0015*(c.x-a.x);
  if(!bestTriplet||score>bestTriplet.score)bestTriplet={a,b,c,score,source:[l,r]};
 }
 if(!bestTriplet)return {ok:false,message:'Нашёл несколько линий, но не могу отделить корпус от размерных стрелок. Нарисуйте контур и секции поверх фото.'};
 const {a,b,c}=bestTriplet;
 // The internal long dividers are likely fronts; ignore thin backboard perspective lines.
 const boundaries=[a,b,c];
 for(const line of candidates){
  if(line.x<=a.x||line.x>=c.x||boundaries.some(x=>Math.abs(x.x-line.x)<minGap*.82))continue;
  if(line.span<Math.min(a.span,b.span,c.span)*.7)continue;
  boundaries.push(line);
 }
 // The best triple may be the three most detailed walls of a four-bay cabinet.
 // Extend the perimeter only when an additional long wall aligns with the same
 // top and bottom. Small perspective side-depth lines are rejected by minGap.
 const expectedTop=[a.start,b.start,c.start].sort((u,v)=>u-v)[1];
 const expectedBottom=[a.end,b.end,c.end].sort((u,v)=>u-v)[1];
 for(const line of candidates){
  if(line.x>a.x&&line.x<c.x)continue;
  const edge=line.x<a.x?boundaries[0]:boundaries[boundaries.length-1];
  if(Math.abs(line.x-edge.x)<minGap||boundaries.some(v=>v.x===line.x))continue;
  if(Math.abs(line.start-expectedTop)>height*.11||Math.abs(line.end-expectedBottom)>height*.13)continue;
  if(line.span<height*.56)continue;
  boundaries.push(line);
 }
 boundaries.sort((u,v)=>u.x-v.x);
 if(boundaries.length>7){
  // preserve the perimeter and strongest long internal dividers
  const inner=boundaries.slice(1,-1).sort((u,v)=>v.span*v.coverage-u.span*u.coverage).slice(0,5).sort((u,v)=>u.x-v.x);
  boundaries.splice(0,boundaries.length,a,...inner,c);
 }
 const x0=boundaries[0].x,x1=boundaries[boundaries.length-1].x;
 const starts=[a.start,b.start,c.start].sort((x,y)=>x-y);
 const ends=[a.end,b.end,c.end].sort((x,y)=>x-y);
 const top=starts[1],bottom=ends[1],contentHeight=bottom-top;
 const sections=[],horizontalLines=[];
 const bayLeftToRight=boundaries.map(p=>p.x);
 for(let i=0;i<bayLeftToRight.length-1;i++){
  const left=bayLeftToRight[i],right=bayLeftToRight[i+1];
  const lines=peaksFor(left,right,top+contentHeight*.085,bottom-contentHeight*.10)
   .filter(v=>v.strength>=.78)
   .filter(v=>v.pos>top+contentHeight*.10&&v.pos<bottom-contentHeight*.10)
   .slice(0,8);
  // Ignore the cabinet floor; it should not count as a removable shelf.
  const selected=lines.filter(v=>v.pos<bottom-contentHeight*.18);
  const n=Math.min(6,selected.length);
  const shelfPositions=selected.slice(0,n).map(v=>Math.max(.05,Math.min(.95,(v.pos-top)/contentHeight)));
  const kind=n>=1?'shelves':'rail';
  sections.push({kind,shelves:Math.max(2,n||4),drawers:3,shelfPositions:n>=2?shelfPositions:undefined});
  horizontalLines.push(selected.map(p=>p.pos));
 }
 if(sections.length<2||sections.length>6)return {ok:false,message:'Не получилось надёжно выделить секции. Попробуйте снимок рисунка спереди.'};
 return {ok:true,confidence:'review',sections,
  bounds:{left:x0,top,right:x1,bottom},
  guides:{verticals:boundaries.slice(1,-1).map(v=>v.x),horizontals:horizontalLines},
  message:'Найден корпус в перспективе. Проверьте количество секций и полок перед переносом в 3D. Подписи и числовые размеры пока не распознаются.'};
}
