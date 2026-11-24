import React,{lazy,Suspense,useEffect,useMemo,useRef,useState} from 'react';
import {ArrowRight,Check,Copy,Download,Grid2x2,Layers,Move,Plus,RotateCcw,Trash2,Box,Printer,Info,RotateCw,CornerDownLeft} from 'lucide-react';
import './commercial-furniture.css';

const CommercialRoom3D=lazy(()=>import('./CommercialRoom3D.jsx'));
const TYPES=[
 {id:'shelf',name:'Стеллаж',note:'Открытые полки',w:120,h:220,d:40,shelves:5},
 {id:'showcase',name:'Стеклянная витрина',note:'Стекло и полки',w:100,h:200,d:45,shelves:4},
 {id:'counter',name:'Прилавок',note:'Торговая стойка',w:140,h:105,d:70,shelves:2},
 {id:'storage',name:'Шкаф хранения',note:'Закрытые дверцы',w:100,h:220,d:50,shelves:4},
 {id:'island',name:'Островная витрина',note:'Доступ с двух сторон',w:140,h:130,d:75,shelves:3},
 {id:'cash',name:'Кассовая стойка',note:'Место для расчётов',w:130,h:105,d:65,shelves:2}
];
const FINISH=[{id:'white',label:'Белый'},{id:'oak',label:'Дуб'},{id:'sand',label:'Кашемир'},{id:'graphite',label:'Графит'}];
const lookup=type=>TYPES.find(x=>x.id===type)||TYPES[0];
const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number.isFinite(Number(value))?Number(value):min));
const round5=n=>Math.round(n/5)*5;
const angle=value=>[0,90,180,270].includes(Number(value))?Number(value):0;
const footprint=m=>m.rotation%180===90?{w:m.depth,d:m.width}:{w:m.width,d:m.depth};
const WALLS=[
 {id:'back',label:'К дальней стене',short:'Дальняя',rotation:0},
 {id:'left',label:'К левой стене',short:'Левая',rotation:270},
 {id:'right',label:'К правой стене',short:'Правая',rotation:90},
 {id:'front',label:'К стене у входа',short:'У входа',rotation:180}
];
// The display/front of furniture is the local +Z face.
// In the plan, positive rotation is clockwise; in Three.js the same stored
// positive angle is applied with a negative Y rotation to preserve orientation.
function nearestWall(item,room){
 const footprintCm=footprint(item);
 const distances=[
  {id:'back',gap:item.z-footprintCm.d/2},
  {id:'left',gap:item.x-footprintCm.w/2},
  {id:'right',gap:room.width-item.x-footprintCm.w/2},
  {id:'front',gap:room.depth-item.z-footprintCm.d/2}
 ];
 return distances.sort((a,b)=>a.gap-b.gap)[0].id;
}
function placeAtWall(item,room,side){
 const wall=WALLS.find(w=>w.id===side)||WALLS[0];
 const rotated={...item,rotation:wall.rotation};
 const fp=footprint(rotated);
 const inset=5;
 if(side==='left')rotated.x=fp.w/2+inset;
 else if(side==='right')rotated.x=room.width-fp.w/2-inset;
 else if(side==='front')rotated.z=room.depth-fp.d/2-inset;
 else rotated.z=fp.d/2+inset;
 return normalized(rotated,room);
}
const normalized=(item,room)=>{
 const type=lookup(item.type);
 const w=clamp(item.width,40,Math.min(250,room.width-20));
 const h=clamp(item.height,65,Math.min(310,room.height-10));
 const d=clamp(item.depth,25,Math.min(120,room.depth-20));
 const m={...item,type:type.id,width:Math.round(w),height:Math.round(h),depth:Math.round(d),
  shelves:Math.round(clamp(item.shelves,2,8)),
  finish:FINISH.some(c=>c.id===item.finish)?item.finish:'oak',
  glass:['clear','frosted','tinted'].includes(item.glass)?item.glass:'clear',
  lighting:Boolean(item.lighting),rotation:angle(item.rotation)};
 const fp=footprint(m);
 return {...m,x:Math.round(clamp(item.x,fp.w/2+5,room.width-fp.w/2-5)),
  z:Math.round(clamp(item.z,fp.d/2+5,room.depth-fp.d/2-5))};
};
const createItem=(type,index,room)=>{
 const base=lookup(type);
 return normalized({id:'m-'+index,type:base.id,width:base.w,height:base.h,depth:base.d,shelves:base.shelves,
  x:75+index*100,z:70,rotation:0,finish:'oak',glass:'clear',lighting:type==='showcase'||type==='shelf'},room);
};
const initial=()=>{
 const room={width:600,depth:450,height:300};
 return {name:'Новый проект коммерческой мебели',room,items:[
  normalized({...createItem('shelf',1,room),x:90,z:50},room),
  normalized({...createItem('showcase',2,room),x:245,z:55,finish:'white'},room),
  normalized({...createItem('counter',3,room),x:265,z:330,finish:'sand'},room)
 ]};
};
const KEY='ripiano-commercial-draft-v1';
function restore(){
 const fallback=initial();
 try{
  const data=JSON.parse(window.localStorage.getItem(KEY)||'null');
  if(!data||!Array.isArray(data.items)||!data.room)return fallback;
  const room={width:round5(clamp(data.room.width,300,1200)),
   depth:round5(clamp(data.room.depth,300,1200)),
   height:round5(clamp(data.room.height,240,360))};
  const seen=new Set();
  const items=data.items.slice(0,12).filter(m=>{
   if(!m||!TYPES.some(t=>t.id===m.type)||typeof m.id!=='string'||seen.has(m.id))return false;
   seen.add(m.id);return true;
  }).map(m=>normalized(m,room));
  return {name:typeof data.name==='string'?data.name.slice(0,90):fallback.name,room,items};
 }catch{return fallback}
}
function NumberField({title,value,min,max,step=5,onChange}){
 const [draft,setDraft]=useState(String(value));
 useEffect(()=>setDraft(String(value)),[value]);
 const commit=()=>{const next=clamp(draft,min,max);onChange(Math.round(next/step)*step);};
 return <label className="cp-number">{title}
  <div className="cp-number-main">
   <input inputMode="numeric" type="number" min={min} max={max} step={step} value={draft}
    onChange={e=>setDraft(e.target.value)} onBlur={commit}
    onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur()}}/>
   <span>см</span>
  </div>
  <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/>
 </label>;
}
const labelFor=m=>lookup(m.type).name;
function conflicts(items){
 const overlaps=[];
 for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
  const a=items[i],b=items[j],f=footprint(a),g=footprint(b);
  if(Math.abs(a.x-b.x)<(f.w+g.w)/2+6&&Math.abs(a.z-b.z)<(f.d+g.d)/2+6)
   overlaps.push([i+1,j+1]);
 }
 return overlaps;
}
function FloorPlan({room,items,selectedId,onSelect,onMove}){
 const svg=useRef(null),drag=useRef(null);
 const pad=34,sw=room.width+pad*2,sh=room.depth+pad*2;
 const position=e=>{
  const point=svg.current?.createSVGPoint(),mat=svg.current?.getScreenCTM();
  if(!point||!mat)return null;
  point.x=e.clientX;point.y=e.clientY;
  const pos=point.matrixTransform(mat.inverse());
  return {x:pos.x-pad,z:pos.y-pad};
 };
 const start=(e,id)=>{
  e.preventDefault();
  onSelect(id);drag.current=id;e.currentTarget.setPointerCapture(e.pointerId);
 };
 const move=e=>{
  if(!drag.current)return;
  const p=position(e);if(p)onMove(drag.current,round5(p.x),round5(p.z));
 };
 const end=e=>{
  drag.current=null;
  if(e.currentTarget.hasPointerCapture?.(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
 };
 const names={shelf:'Полки',showcase:'Стекло',counter:'Прилавок',storage:'Шкаф',island:'Остров',cash:'Касса'};
 return <div className="cp-plan-shell">
  <svg ref={svg} className="cp-plan" viewBox={'0 0 '+sw+' '+sh} preserveAspectRatio="xMidYMid meet"
   role="img" aria-label="План помещения сверху. Выберите и перетащите мебель для изменения расположения."
   onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
   <rect x={pad} y={pad} width={room.width} height={room.depth} fill="#eae5dc" stroke="#8e857a" strokeWidth="5"/>
   {Array.from({length:Math.ceil(room.width/50)},(_,i)=><line key={'v'+i} x1={pad+i*50} x2={pad+i*50}
    y1={pad} y2={pad+room.depth} stroke="#d6cfc5" strokeWidth="1"/>)}
   {Array.from({length:Math.ceil(room.depth/50)},(_,i)=><line key={'h'+i} y1={pad+i*50} y2={pad+i*50}
    x1={pad} x2={pad+room.width} stroke="#d6cfc5" strokeWidth="1"/>)}
   <text x={pad+room.width/2} y="18" fontSize="14" textAnchor="middle" fill="#70665a">{room.width} см</text>
   <text x="12" y={pad+room.depth/2} fontSize="14" textAnchor="middle" fill="#70665a"
    transform={'rotate(-90 12 '+(pad+room.depth/2)+')'}>{room.depth} см</text>
   {items.map((m,i)=>{
    const selected=m.id===selectedId;
    const fill={white:'#faf8f4',oak:'#c8aa88',sand:'#d1c5b7',graphite:'#767677'}[m.finish]||'#c8aa88';
    return <g key={m.id} data-module={m.id}
      transform={'translate('+(pad+m.x)+' '+(pad+m.z)+') rotate('+m.rotation+')'}
      onPointerDown={e=>start(e,m.id)} style={{cursor:'grab'}}>
     <rect x={-m.width/2} y={-m.depth/2} width={m.width} height={m.depth}
      rx="3" fill={fill} stroke={selected?'#8a5c36':'#685b4d'} strokeWidth={selected?5:2}/>
     {m.type==='showcase'||m.type==='island'?<rect x={-m.width/2+8} y={-m.depth/2+7}
      width={Math.max(1,m.width-16)} height={Math.max(1,m.depth-14)}
      fill="#d3e0df" fillOpacity=".67" stroke="#a1aaa7" strokeDasharray="6 4"/>:null}
     {m.type==='shelf'?Array.from({length:Math.min(6,m.shelves)},(_,j)=><line key={j}
      x1={-m.width/2+7} x2={m.width/2-7}
      y1={-m.depth/2+j*m.depth/Math.min(6,m.shelves)}
      y2={-m.depth/2+j*m.depth/Math.min(6,m.shelves)}
      stroke="#8c7b68" strokeWidth="1"/>):null}
     <text x="0" y="-5" textAnchor="middle" fontSize="16" fontWeight="700"
      fill={m.finish==='graphite'?'#fff':'#352b23'}>{i+1}</text>
     <text x="0" y="13" textAnchor="middle" fontSize="10"
      fill={m.finish==='graphite'?'#fff':'#352b23'}>{names[m.type]}</text>
     {/* This arrow is placed on the real FRONT face (+depth), not on the back. */}
     <path d={'M '+(-m.width*.22)+' '+(m.depth/2+3)+' h '+(m.width*.44)}
      stroke={selected?'#9a623a':'#6c7d68'} strokeWidth={selected?5:3} strokeLinecap="round"/>
     <path d={'M -10 '+(m.depth/2+9)+' L 0 '+(m.depth/2+25)+' L 10 '+(m.depth/2+9)+' Z'}
      fill={selected?'#9a623a':'#6c7d68'} stroke="white" strokeWidth="1.6"/>
     {selected&&<text x="0" y={m.depth/2+38} textAnchor="middle" fontSize="12" fontWeight="700" fill="#79502f">ЛИЦО</text>}
    </g>;
   })}
   <text x={pad+room.width/2} y={pad+room.depth+26} fontSize="12" textAnchor="middle" fill="#796d5e">Вход / фронтальная сторона</text>
  </svg>
  <p>Стрелка «ЛИЦО» показывает, куда направлена открытая часть стеллажа или дверцы. Для установки спинкой к стене выберите её в настройках или нажмите «К ближайшей стене».</p>
 </div>;
}
export default function CommercialFurniture(){
 const [project,setProject]=useState(restore);
 const [selectedId,setSelectedId]=useState('m-1');
 const [view,setView]=useState('3d');
 const [notice,setNotice]=useState('');
 const nextId=useRef(Math.max(3,...project.items.map(m=>Number(String(m.id).replace(/^m-/,''))||0))+1);
 useEffect(()=>{
  const job=window.setTimeout(()=>{try{window.localStorage.setItem(KEY,JSON.stringify(project))}catch{}},300);
  return ()=>window.clearTimeout(job);
 },[project]);
 const {room,items}=project;
 const selected=items.find(m=>m.id===selectedId)||items[0]||null;
 const overlaps=useMemo(()=>conflicts(items),[items]);
 const choose=id=>{setSelectedId(id);setNotice('')};
 const updateRoom=(key,value)=>setProject(prev=>{
  const next={...prev.room,[key]:Math.round(clamp(value,key==='height'?240:300,key==='height'?360:1200))};
  return {...prev,room:next,items:prev.items.map(m=>normalized(m,next))};
 });
 const updateModule=(id,changes)=>setProject(prev=>({...prev,items:prev.items.map(m=>m.id===id?normalized({...m,...changes},prev.room):m)}));
 const spinSelected=degrees=>{
  if(!selected)return;
  updateModule(selected.id,{rotation:(selected.rotation+degrees+360)%360});
  setNotice('');
 };
 const alignSelected=wallId=>{
  if(!selected)return;
  const side=wallId==='nearest'?nearestWall(selected,room):wallId;
  const aligned=placeAtWall(selected,room,side);
  updateModule(selected.id,aligned);
  setNotice('Мебель установлена спинкой к стене, лицевой стороной в помещение.');
 };
 const add=type=>{
  if(items.length>=12){setNotice('Максимум 12 предметов в одном проекте.');return;}
  const current=nextId.current++;
  const raw=createItem(type,current,room);
  let placed=raw,found=false;
  for(let z=35;z<room.depth-20&&!found;z+=25)for(let x=35;x<room.width-20&&!found;x+=25){
   const tentative=normalized({...raw,x,z},room);
   const candidate=['shelf','showcase','storage'].includes(type)?
    placeAtWall(tentative,room,nearestWall(tentative,room)):tentative;
   if(!conflicts([...items,candidate]).length){placed=candidate;found=true;}
  }
  if(!found)setNotice('Предмет добавлен, но свободного места не найдено. Проверьте пересечения на плане.');
  else setNotice('');
  setProject(prev=>({...prev,items:[...prev.items,placed]}));setSelectedId(placed.id);
 };
 const duplicate=()=>{
  if(!selected||items.length>=12){setNotice('Можно добавить не более 12 предметов.');return;}
  const item=normalized({...selected,id:'m-'+nextId.current++,x:selected.x+50,z:selected.z+50},room);
  setProject(prev=>({...prev,items:[...prev.items,item]}));setSelectedId(item.id);
 };
 const remove=()=>{
  if(!selected)return;
  setProject(prev=>({...prev,items:prev.items.filter(m=>m.id!==selected.id)}));
  setSelectedId(items.find(m=>m.id!==selected.id)?.id||'');
 };
 const download=()=>{
  const output={schema:'ripiano-commercial-v1',exported_at:new Date().toISOString(),...project,
   note:'Предварительное проектирование. Перед производством необходимы точные замеры и согласование конструкций.'};
  const blob=new Blob([JSON.stringify(output,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='ripiano-commercial-project.json';
  document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 const newProject=()=>{
  if(!window.confirm('Начать новый проект? Текущий черновик в браузере будет заменён.'))return;
  const fresh=initial();setProject({...fresh,items:[]});setSelectedId('');setNotice('');
 };
 return <div className="cp-content">
  <header className="cp-heading">
   <span className="wc-eyebrow">RIPIANO / КОММЕРЧЕСКАЯ МЕБЕЛЬ</span>
   <h1>ОБОРУДОВАНИЕ ДЛЯ БИЗНЕСА</h1>
   <p>Соберите комплект витрин, стеллажей, прилавков и шкафов для любого помещения — без выбора направления бизнеса.</p>
  </header>
  <section className="cp-room">
   <div className="cp-section-title"><span>01</span><h2>Помещение</h2></div>
   <label className="cp-project-name">Название проекта
    <input maxLength="90" value={project.name} onChange={e=>setProject(p=>({...p,name:e.target.value}))} placeholder="Например: торговый зал 6 × 4,5 м"/>
   </label>
   <div className="cp-number-grid">
    <NumberField title="Ширина" value={room.width} min={300} max={1200} step={5} onChange={v=>updateRoom('width',v)}/>
    <NumberField title="Глубина" value={room.depth} min={300} max={1200} step={5} onChange={v=>updateRoom('depth',v)}/>
    <NumberField title="Высота" value={room.height} min={240} max={360} step={5} onChange={v=>updateRoom('height',v)}/>
   </div>
  </section>
  <div className="cp-workspace">
   <div className="cp-stage">
    <div className="cp-stage-head">
     <div className="cp-section-title"><span>02</span><h2>Проект целиком</h2></div>
     <div className="cp-view-tabs" role="group" aria-label="Вид проекта">
      <button type="button" className={view==='3d'?'active':''} onClick={()=>setView('3d')} aria-pressed={view==='3d'}><Box size={15}/> 3D</button>
      <button type="button" className={view==='plan'?'active':''} onClick={()=>setView('plan')} aria-pressed={view==='plan'}><Grid2x2 size={15}/> План</button>
     </div>
    </div>
    {view==='3d'?<Suspense fallback={<div className="cp-stage-fallback">Загружаем помещение…</div>}>
     <CommercialRoom3D room={room} items={items} selectedId={selected?.id}/>
    </Suspense>:<FloorPlan room={room} items={items} selectedId={selected?.id} onSelect={choose}
     onMove={(id,x,z)=>updateModule(id,{x,z})}/>}
    {selected&&<div className="cp-fast-orient">
     <div className="cp-orient-label"><strong>{labelFor(selected)}</strong>
      <span>Лицевая сторона — внутрь помещения</span>
     </div>
     <div className="cp-fast-orient-actions">
      <button type="button" onClick={()=>spinSelected(270)} title="Повернуть налево на 90 градусов"><RotateCcw size={17}/> 90°</button>
      <button type="button" onClick={()=>spinSelected(90)} title="Повернуть направо на 90 градусов"><RotateCw size={17}/> 90°</button>
      <button type="button" className="cp-nearest-wall" onClick={()=>alignSelected('nearest')}><CornerDownLeft size={16}/> К ближайшей стене</button>
     </div>
    </div>}
    <div className="cp-stage-status">
     <span><Layers size={16}/> Предметов: <b>{items.length}</b></span>
     <span>Площадь: <b>{(room.width*room.depth/10000).toLocaleString('ru-RU',{maximumFractionDigits:2})} м²</b></span>
    </div>
    {overlaps.length>0&&<p className="cp-overlap" role="status">
      <Info size={17}/> Возможные пересечения: {overlaps.map(([a,b])=>a+' и '+b).join(', ')}. Перед изготовлением проверьте расстановку.
    </p>}
   </div>
   <div className="cp-editor">
    <div className="cp-section-title"><span>03</span><h2>Добавить мебель</h2></div>
    <div className="cp-type-grid">{TYPES.map(t=><button key={t.id} type="button" onClick={()=>add(t.id)} disabled={items.length>=12}>
      <span className="cp-type-icon"><Plus size={16}/></span>
      <strong>{t.name}</strong><small>{t.note}</small>
     </button>)}</div>
    <div className="cp-section-title cp-divider-title"><span>04</span><h2>Настроить предмет</h2></div>
    {items.length?<div className="cp-selected">
     <label className="cp-field">Выберите предмет
      <select value={selected?.id||''} onChange={e=>choose(e.target.value)}>
       {items.map((m,i)=><option key={m.id} value={m.id}>{i+1}. {labelFor(m)}</option>)}
      </select>
     </label>
     {selected&&<>
      <div className="cp-selected-toolbar">
       <button type="button" onClick={duplicate}><Copy size={15}/> Дублировать</button>
       <button type="button" onClick={remove}><Trash2 size={15}/> Удалить</button>
      </div>
      <label className="cp-field">Тип мебели
       <select value={selected.type} onChange={e=>{
        const t=lookup(e.target.value);updateModule(selected.id,{type:t.id,width:t.w,height:t.h,depth:t.d,shelves:t.shelves});
       }}>{TYPES.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
      </label>
      <div className="cp-module-dims">
       <NumberField title="Ширина" value={selected.width} min={40} max={Math.min(250,room.width-20)} onChange={v=>updateModule(selected.id,{width:v})}/>
       <NumberField title="Высота" value={selected.height} min={65} max={Math.min(310,room.height-10)} onChange={v=>updateModule(selected.id,{height:v})}/>
       <NumberField title="Глубина" value={selected.depth} min={25} max={Math.min(120,room.depth-20)} onChange={v=>updateModule(selected.id,{depth:v})}/>
      </div>
      <div className="cp-pair">
       <label className="cp-field">Отделка
        <select value={selected.finish} onChange={e=>updateModule(selected.id,{finish:e.target.value})}>
         {FINISH.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
       </label>
       <label className="cp-field">Поворот
        <select value={selected.rotation} onChange={e=>updateModule(selected.id,{rotation:Number(e.target.value)})}>
         {[0,90,180,270].map(v=><option key={v} value={v}>{v}°</option>)}
        </select>
       </label>
      </div>
      <div className="cp-wall-controls">
       <strong>К какой стене повернуть спинкой?</strong>
       <div className="cp-wall-grid">
        {WALLS.map(w=><button type="button" key={w.id} onClick={()=>alignSelected(w.id)}
         className={selected.rotation===w.rotation?'active':''}
         aria-label={w.label}>{w.short}</button>)}
       </div>
       <small>Выберите стену: конструктор сам развернёт фасад внутрь зала и придвинет мебель к стене.</small>
      </div>
      {['shelf','showcase','island'].includes(selected.type)&&<NumberField title="Количество полок"
       value={selected.shelves} min={2} max={8} step={1} onChange={v=>updateModule(selected.id,{shelves:v})}/>}
      {selected.type==='showcase'&&<label className="cp-field">Стекло витрины
       <select value={selected.glass} onChange={e=>updateModule(selected.id,{glass:e.target.value})}>
        <option value="clear">Прозрачное</option><option value="frosted">Матовое</option><option value="tinted">Тонированное</option>
       </select>
      </label>}
      {['shelf','showcase','island'].includes(selected.type)&&<label className="cp-checkbox">
       <input type="checkbox" checked={selected.lighting} onChange={e=>updateModule(selected.id,{lighting:e.target.checked})}/>
       <span>Подсветка полок (визуализация)</span>
      </label>}
      <div className="cp-pair">
       <NumberField title="Центр от левой стены" value={selected.x} min={0} max={room.width} onChange={v=>updateModule(selected.id,{x:v})}/>
       <NumberField title="Центр от дальней стены" value={selected.z} min={0} max={room.depth} onChange={v=>updateModule(selected.id,{z:v})}/>
      </div>
      <p className="cp-note"><Move size={15}/> Чтобы переставить предмет пальцем, переключитесь на вкладку «План».</p>
     </>}
    </div>:<p className="cp-empty">В проекте пока нет мебели. Добавьте первый предмет выше.</p>}
   </div>
  </div>
  <section className="cp-summary">
   <div className="cp-section-title"><span>05</span><h2>Комплектация проекта</h2></div>
   <p>Предварительная спецификация для обсуждения с производством. Измерения — в сантиметрах.</p>
   {items.length?<div className="cp-summary-list">{items.map((m,i)=><button type="button" key={m.id}
     className={selected?.id===m.id?'active':''} onClick={()=>choose(m.id)}>
     <b>{i+1}. {labelFor(m)}</b>
     <span>{m.width} × {m.height} × {m.depth} см</span>
     <small>{FINISH.find(f=>f.id===m.finish)?.label} · {m.rotation}°{['shelf','showcase','island'].includes(m.type)?' · '+m.shelves+' полок':''}</small>
    </button>)}</div>:<div className="cp-empty">Добавьте мебель, чтобы сформировать комплект.</div>}
   <p className="cp-disclaimer">Проект хранится в браузере этого устройства. Это предварительная схема: монтаж, безопасность стекла и электрики, нагрузка на полки и точная стоимость определяются после замеров и технического согласования.</p>
   {notice&&<p className="cp-overlap" role="status">{notice}</p>}
   <div className="cp-actions">
    <button className="cp-primary" type="button" onClick={download}><Download size={17}/> Скачать проект JSON <ArrowRight size={16}/></button>
    <button className="cp-secondary" type="button" onClick={()=>window.print()}><Printer size={16}/> Печать / PDF</button>
    <button className="cp-secondary" type="button" onClick={newProject}><RotateCcw size={16}/> Новый проект</button>
   </div>
   <p className="cp-small">Заявки на сайте пока отключены. Готовый файл проекта можно передать мебельщику для расчёта.</p>
  </section>
 </div>;
}
