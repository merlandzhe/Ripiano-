import React,{useEffect,useRef,useState} from 'react';
import {Camera,Pencil,Undo2,Trash2,Sparkles,Check,Info,ImagePlus,AlertCircle} from 'lucide-react';
import {recognizeWardrobeSketch} from './wardrobe-sketch-reader.js';
import './wardrobe-sketch.css';

const WIDTH=720,HEIGHT=520;
const formatSections={
 shelves:'Полки',
 rail:'Штанга / свободная секция',
 drawers:'Ящики (предположительно)',
 combined:'Полки и штанга'
};

export default function SketchToWardrobe({onApply}){
 const [mode,setMode]=useState('photo');
 const [photo,setPhoto]=useState('');
 const [imageName,setImageName]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [result,setResult]=useState(null);
 const [strokeCount,setStrokeCount]=useState(0);
 const drawing=useRef(null),photoCanvas=useRef(null),paths=useRef([]),current=useRef(null),loadToken=useRef(0);
 const inputId=React.useId();

 const renderDrawing=()=>{
  const el=drawing.current;
  if(!el)return;
  const ctx=el.getContext('2d',{willReadFrequently:true});
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,WIDTH,HEIGHT);
  ctx.lineWidth=5;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#252525';
  paths.current.forEach(points=>{
   if(!points.length)return;
   ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);
   if(points.length===1){ctx.lineTo(points[0].x+.1,points[0].y+.1);}
   else points.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));
   ctx.stroke();
  });
 };
 useEffect(()=>{if(mode==='draw')renderDrawing()},[mode]);
 useEffect(()=>()=>{loadToken.current++},[]);

 const pos=e=>{
  const rect=e.currentTarget.getBoundingClientRect();
  return {
   x:Math.min(WIDTH,Math.max(0,(e.clientX-rect.left)*WIDTH/rect.width)),
   y:Math.min(HEIGHT,Math.max(0,(e.clientY-rect.top)*HEIGHT/rect.height))
  };
 };
 const start=e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  e.preventDefault();
  e.currentTarget.setPointerCapture?.(e.pointerId);
  const line=[pos(e)];paths.current.push(line);current.current=line;
  setResult(null);setError('');renderDrawing();
 };
 const move=e=>{
  if(!current.current)return;
  e.preventDefault();current.current.push(pos(e));renderDrawing();
 };
 const end=e=>{
  if(!current.current)return;
  if(e.currentTarget.hasPointerCapture?.(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  current.current=null;setStrokeCount(paths.current.length);
 };
 const undo=()=>{paths.current.pop();current.current=null;setStrokeCount(paths.current.length);setResult(null);renderDrawing()};
 const clear=()=>{paths.current=[];current.current=null;setStrokeCount(0);setResult(null);setError('');renderDrawing()};

 const loadPhoto=async(e)=>{
  const file=e.target.files?.[0];
  e.target.value='';
  if(!file)return;
  setError('');setResult(null);
  if(file.size>12*1024*1024){setError('Файл слишком большой. Выберите фотографию до 12 МБ.');return;}
  if(!file.type.startsWith('image/')){setError('Нужен файл изображения.');return;}
  const token=++loadToken.current;
  setBusy(true);
  const url=URL.createObjectURL(file);
  try{
   const image=new window.Image();
   await new Promise((resolve,reject)=>{
    image.onload=resolve;image.onerror=()=>reject(new Error('decode'));image.src=url;
   });
   if(token!==loadToken.current)return;
   const canvas=document.createElement('canvas');
   canvas.width=WIDTH;canvas.height=HEIGHT;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   if(!ctx)throw new Error('canvas');
   ctx.fillStyle='#fff';ctx.fillRect(0,0,WIDTH,HEIGHT);
   const iw=image.naturalWidth,ih=image.naturalHeight;
   if(!iw||!ih)throw new Error('empty');
   const size=Math.min((WIDTH-22)/iw,(HEIGHT-22)/ih);
   const dw=iw*size,dh=ih*size;
   ctx.drawImage(image,(WIDTH-dw)/2,(HEIGHT-dh)/2,dw,dh);
   photoCanvas.current=canvas;
   setPhoto(canvas.toDataURL('image/jpeg',.88));
   setImageName(file.name);
  }catch{
   if(token===loadToken.current)setError('Не удалось открыть фото. Попробуйте JPG или PNG либо сделайте скриншот рисунка.');
  }finally{
   URL.revokeObjectURL(url);
   if(token===loadToken.current)setBusy(false);
  }
 };
 const run=()=>{
  setError('');
  const canvas=mode==='draw'?drawing.current:photoCanvas.current;
  if(!canvas){setError('Сначала загрузите фотографию или нарисуйте схему.');return;}
  try{
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   const response=recognizeWardrobeSketch(ctx.getImageData(0,0,WIDTH,HEIGHT));
   setResult(response);
  }catch(e){
   console.warn('Sketch analysis failed',e);
   setResult(null);setError('Не удалось разобрать рисунок. Попробуйте более чёткий эскиз.');
  }
 };
 const apply=()=>{
  if(!result?.ok)return;
  onApply(result.sections);
  setResult(null);
  document.getElementById('ripiano-wardrobe-view')?.scrollIntoView({behavior:'smooth',block:'start'});
 };
 return <section className="sketch-panel" id="ripiano-sketch" aria-labelledby="sketch-title">
  <div className="sketch-heading">
   <div>
    <span className="wc-eyebrow">НОВЫЙ СПОСОБ ПРОЕКТИРОВАНИЯ</span>
    <h2 id="sketch-title">По рисунку от руки</h2>
    <p>Сфотографируйте схему шкафа или нарисуйте её пальцем. Попробуем перенести секции и полки в 3D.</p>
   </div>
   <div className="sketch-heading-icon"><Pencil size={24}/></div>
  </div>
  <div className="sketch-mode-tabs" role="group" aria-label="Способ добавления рисунка">
   <button type="button" className={mode==='photo'?'active':''} aria-pressed={mode==='photo'} onClick={()=>{setMode('photo');setResult(null);setError('')}}><Camera size={17}/> Фото рисунка</button>
   <button type="button" className={mode==='draw'?'active':''} aria-pressed={mode==='draw'} onClick={()=>{setMode('draw');setResult(null);setError('')}}><Pencil size={17}/> Нарисовать</button>
  </div>
  {mode==='photo'?<>
   <input id={inputId} className="sketch-file-input" type="file" accept="image/*" onChange={loadPhoto}/>
   <label htmlFor={inputId} className="sketch-upload-zone">
    <span className="sketch-upload-icon"><ImagePlus size={26}/></span>
    <strong>{photo?'Заменить рисунок':'Выбрать фото или сфотографировать'}</strong>
    <span>{photo?imageName:'Чёткий рисунок спереди · JPG, PNG или фото с телефона'}</span>
   </label>
   {photo&&<div className="sketch-image-stage">
     <img src={photo} alt="Загруженный рисунок шкафа" />
     {result?.ok&&<svg className="sketch-guide" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
       <rect x={result.bounds.left} y={result.bounds.top} width={result.bounds.right-result.bounds.left} height={result.bounds.bottom-result.bounds.top} fill="none" stroke="#b07942" strokeWidth="3" strokeDasharray="8 7"/>
       {result.guides.verticals.map((x,i)=><line key={i} x1={x} x2={x} y1={result.bounds.top} y2={result.bounds.bottom} stroke="#b07942" strokeWidth="3" strokeDasharray="7 6"/>)}
      </svg>}
    </div>}
  </>:<div className="sketch-draw-wrap">
   <canvas ref={drawing} width={WIDTH} height={HEIGHT}
    className="sketch-draw-canvas" aria-label="Поле для рисования шкафа спереди. Нарисуйте прямоугольный корпус, перегородки и полки."
    onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}/>
   <div className="sketch-draw-actions">
    <span>Нарисуйте контур, перегородки и полки</span>
    <button type="button" onClick={undo} disabled={!strokeCount}><Undo2 size={15}/> Отменить</button>
    <button type="button" onClick={clear} disabled={!strokeCount}><Trash2 size={15}/> Очистить</button>
   </div>
  </div>}
  <div className="sketch-tip"><Info size={16}/><p>Лучше всего работает <b>вид спереди</b>: внешний прямоугольник, вертикальные секции и горизонтальные полки. Числа на рисунке автоматически не считываются — размеры задаются в настройках ниже.</p></div>
  {error&&<p className="sketch-error" role="alert"><AlertCircle size={16}/>{error}</p>}
  <button type="button" className="sketch-recognize" disabled={busy||mode==='photo'&&!photo||mode==='draw'&&!strokeCount} onClick={run}>
   <Sparkles size={18}/>{busy?'Обрабатываем фото…':'Распознать эскиз'}
  </button>
  {result&&<div className={'sketch-outcome '+(result.ok?'success':'warning')} role="status" aria-live="polite">
   {result.ok?<><h3><Check size={18}/> Найдено: {result.sections.length} секц.</h3>
    <p>{result.message}</p>
    <div className="sketch-section-results">{result.sections.map((section,i)=><span key={i}>{i+1}. {formatSections[section.kind]||section.kind}{section.kind==='shelves'?` · ${section.shelves} полки`:section.kind==='drawers'?` · ${section.drawers} ящика`:''}</span>)}</div>
    <button type="button" className="sketch-apply" onClick={apply}>Построить 3D по рисунку <Check size={17}/></button>
   </>:<><h3><AlertCircle size={18}/> Нужна более простая схема</h3><p>{result.message}</p></>}
  </div>}
  <p className="sketch-footnote">Это предварительная реконструкция, не готовый чертёж для производства. Фото остаётся в браузере и не отправляется на сервер.</p>
 </section>;
}
