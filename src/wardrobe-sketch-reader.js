// Browser-only recognition for simple, hand-drawn FRONT elevation wardrobe sketches.
// No uploads, image requests, paid APIs, OCR or exact manufacturing dimensions.
export function recognizeWardrobeSketch(img) {
  const width=Math.round(img?.width||0),height=Math.round(img?.height||0),rgba=img?.data;
  if(width<100||height<100||!rgba||rgba.length<width*height*4) return {ok:false,message:"Не удалось прочитать изображение."};
  const mono=new Uint8Array(width*height);
  let ink=0;
  for(let i=0;i<width*height;i++){
    const p=i*4,lum=.299*rgba[p]+.587*rgba[p+1]+.114*rgba[p+2];
    const dark=lum<187 && (Math.max(rgba[p],rgba[p+1],rgba[p+2])-Math.min(rgba[p],rgba[p+1],rgba[p+2])<115 || lum<118);
    if(dark){mono[i]=1;ink++;}
  }
  if(ink<Math.max(300,width*height*.0015))return {ok:false,message:"На изображении слишком мало линий. Нарисуйте контур шкафа и перегородки тёмным цветом."};
  const hit=(x,y)=>x>=0&&x<width&&y>=0&&y<height&&mono[y*width+x]===1;
  const vertical=(x)=>{
    let hits=0,total=0;
    for(let y=Math.round(height*.06);y<height*.94;y+=4){
      total++;let found=false;
      for(let dx=-5;dx<=5&&!found;dx+=2){
        if(hit(x+dx,y)||hit(x+dx,y+1)||hit(x+dx,y-1))found=true;
      }
      if(found)hits++;
    }
    return hits/Math.max(1,total);
  };
  const horizontal=(y,x0=0,x1=width-1)=>{
    let hits=0,total=0;
    const range=Math.max(1,x1-x0);
    const step=Math.max(2,Math.round(range/125));
    for(let x=x0;x<=x1;x+=step){
      total++;let found=false;
      for(let dy=-4;dy<=4&&!found;dy+=2){
        if(hit(x,y+dy)||hit(x+1,y+dy)||hit(x-1,y+dy))found=true;
      }
      if(found)hits++;
    }
    return hits/Math.max(1,total);
  };
  const peaks=(from,to,step,score,minScore,minGap)=>{
    const raw=[];
    for(let pos=from;pos<=to;pos+=step){
      const strength=score(pos);
      if(strength>=minScore)raw.push({pos,strength});
    }
    if(!raw.length)return [];
    const groups=[];let current=[raw[0]];
    for(let i=1;i<raw.length;i++){
      if(raw[i].pos-current[current.length-1].pos<=minGap){current.push(raw[i]);}
      else{groups.push(current);current=[raw[i]];}
    }
    groups.push(current);
    return groups.map(g=>{
      const best=g.reduce((a,b)=>a.strength>b.strength?a:b);
      return {pos:best.pos,strength:best.strength};
    });
  };
  const xPeaks=peaks(Math.round(width*.025),Math.round(width*.975),3,vertical,.36,Math.max(9,Math.round(width*.02)));
  const yPeaks=peaks(Math.round(height*.025),Math.round(height*.975),3,y=>horizontal(y),.43,Math.max(9,Math.round(height*.025)));
  if(xPeaks.length<3||yPeaks.length<2)return {ok:false,message:"Не удалось определить контур и перегородки. Лучше всего подходит рисунок шкафа спереди: прямоугольник с вертикальными линиями секций.",detected:{verticals:xPeaks.length,horizontals:yPeaks.length}};
  const x0=xPeaks[0].pos,x1=xPeaks[xPeaks.length-1].pos,y0=yPeaks[0].pos,y1=yPeaks[yPeaks.length-1].pos;
  if(x1-x0<width*.25||y1-y0<height*.3)return {ok:false,message:"Контур слишком маленький. Сфотографируйте эскиз крупнее или нарисуйте схему по центру."};
  const inner=xPeaks.slice(1,-1).filter(v=>v.pos>x0+(x1-x0)*.12&&v.pos<x1-(x1-x0)*.12);
  const selected=[];
  for(const v of inner.sort((a,b)=>b.strength-a.strength)){
    if(selected.every(p=>Math.abs(v.pos-p.pos)>(x1-x0)*.115))selected.push(v);
  }
  selected.sort((a,b)=>a.pos-b.pos);
  if(selected.length===0)return {ok:false,message:"Нашёл внешний контур, но не увидел внутренних перегородок. Проведите хотя бы одну вертикальную линию — получится шкаф из двух секций."};
  const lines=selected.slice(0,5);
  const boundaries=[x0,...lines.map(p=>p.pos),x1];
  const sections=[];
  const horizontalLines=[];
  for(let i=0;i<boundaries.length-1;i++){
    const left=Math.round(boundaries[i]+(boundaries[i+1]-boundaries[i])*.13);
    const right=Math.round(boundaries[i+1]-(boundaries[i+1]-boundaries[i])*.13);
    const candidates=peaks(Math.round(y0+(y1-y0)*.12),Math.round(y1-(y1-y0)*.1),3,y=>horizontal(y,left,right),.57,Math.max(8,Math.round((y1-y0)*.06)));
    const rows=candidates.filter(v=>v.pos>y0+(y1-y0)*.12&&v.pos<y1-(y1-y0)*.1);
    horizontalLines.push(rows.map(p=>p.pos));
    const lowOnly=rows.length>=2&&rows.every(v=>v.pos>y0+(y1-y0)*.51);
    const kind=lowOnly?'drawers':rows.length>=2?'shelves':'rail';
    sections.push({
      kind,
      shelves:Math.max(2,Math.min(6,rows.length||4)),
      drawers:Math.max(1,Math.min(4,rows.length||3))
    });
  }
  const mean=[xPeaks[0],xPeaks[xPeaks.length-1],...lines,yPeaks[0],yPeaks[yPeaks.length-1]].reduce((sum,p)=>sum+p.strength,0)/(lines.length+4);
  return {
    ok:true,
    confidence:mean>.72?'good':'review',
    sections,
    bounds:{left:x0,top:y0,right:x1,bottom:y1},
    guides:{verticals:lines.map(p=>p.pos),horizontals:horizontalLines},
    message:"Определены вертикальные секции. Полки и ящики распознаны предварительно — проверьте результат в 3D."
  };
}
