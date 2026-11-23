
import React,{useEffect,useState} from 'react';
import {ArrowRight,ArrowLeft,Check,RotateCcw,Ruler,Layers,Send} from 'lucide-react';
import './wardrobe-configurator.css';
import {PrivacyConsent,CONSENT_VERSION} from './Privacy.jsx';
import {REQUESTS_ENABLED,OnlineRequestsPaused} from './ComplianceStatus.jsx';
import FurniturePreviewSwitch from './FurniturePreviewSwitch.jsx';

const COLOR_OPTIONS=[
 {id:'white',name:'Белый',hex:'#f6f3ed'},
 {id:'oak',name:'Дуб',hex:'#d0aa7c'},
 {id:'sand',name:'Кашемир',hex:'#c9beb0'},
 {id:'graphite',name:'Графит',hex:'#515153'}
];
const HANDLE_OPTIONS=[
 {id:'black',name:'Чёрные'},
 {id:'silver',name:'Серебристые'},
 {id:'hidden',name:'Без ручек'}
];
const FILL_OPTIONS=[
 {id:'shelves',name:'Полки'},
 {id:'rail',name:'Штанга'},
 {id:'combined',name:'Полки + штанга'},
 {id:'drawers',name:'Ящики'}
];
const LABELS={shelves:'Полки',rail:'Штанга',combined:'Полки + штанга',drawers:'Ящики'};
const INITIAL_SECTIONS=[
 {kind:'shelves',shelves:4,drawers:3},
 {kind:'rail',shelves:4,drawers:3},
 {kind:'drawers',shelves:4,drawers:3}
];
const clamp=(value,min,max)=>{
 const number=Number(value);
 return Number.isFinite(number)?Math.max(min,Math.min(max,Math.round(number))):min;
};
function initialConfig(){
 return {version:1,width_cm:180,height_cm:220,depth_cm:55,body_color:'oak',facade_color:'white',handles:'black',sections:INITIAL_SECTIONS.map(x=>({...x}))};
}
const DRAFT_KEY='ripiano:wardrobe-draft:2026';
function restoreDraft(){
 const fallback=initialConfig();
 try{
  const saved=JSON.parse(window.localStorage.getItem(DRAFT_KEY)||'null');
  if(!saved||!Array.isArray(saved.sections)||saved.sections.length<2||saved.sections.length>6)return fallback;
  const safeSections=saved.sections.map(v=>({
   kind:FILL_OPTIONS.some(x=>x.id===v?.kind)?v.kind:'shelves',
   shelves:clamp(v?.shelves??4,2,6),
   drawers:clamp(v?.drawers??3,1,4)
  }));
  return {...fallback,width_cm:clamp(saved.width_cm,80,300),height_cm:clamp(saved.height_cm,180,260),
   depth_cm:clamp(saved.depth_cm,40,70),body_color:COLOR_OPTIONS.some(x=>x.id===saved.body_color)?saved.body_color:fallback.body_color,
   facade_color:COLOR_OPTIONS.some(x=>x.id===saved.facade_color)?saved.facade_color:fallback.facade_color,
   handles:HANDLE_OPTIONS.some(x=>x.id===saved.handles)?saved.handles:fallback.handles,sections:safeSections};
 }catch{return fallback}
}
const colorHex=id=>COLOR_OPTIONS.find(c=>c.id===id)?.hex||'#f6f3ed';
export const wardrobeKindLabel=kind=>LABELS[kind]||'Полки';

export function WardrobePreview({config,doors=false}){
 const wCm=clamp(config?.width_cm??180,80,300);
 const hCm=clamp(config?.height_cm??220,180,260);
 const dCm=clamp(config?.depth_cm??55,40,70);
 const sections=Array.isArray(config?.sections)&&config.sections.length?config.sections:INITIAL_SECTIONS;
 const n=Math.min(6,Math.max(2,sections.length));
 const scale=Math.min(352/wCm,290/hCm);
 const w=wCm*scale,h=hCm*scale,x=(438-w)/2,y=27+(293-h)/2;
 const side=7,sectionW=(w-2*side)/n;
 const wood=colorHex(config?.body_color),face=colorHex(config?.facade_color);
 const handle=config?.handles||'black';
 const front=doors;
 return <div className="wc-diagram">
  <svg viewBox="0 0 438 378" role="img" aria-label={'Эскиз шкафа: ширина '+wCm+' см, высота '+hCm+' см, глубина '+dCm+' см, '+n+' секции'} preserveAspectRatio="xMidYMid meet">
   <defs><linearGradient id="wc-shadow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".4"/><stop offset="1" stopColor="#111" stopOpacity=".06"/></linearGradient></defs>
   <ellipse cx={x+w/2} cy={y+h+13} rx={w*.53} ry="8" fill="#b9b0a4" opacity=".19"/>
   <rect x={x} y={y} width={w} height={h} rx="1.3" fill={wood} stroke="#a59a8a" strokeWidth="1.2"/>
   {!front&&<rect x={x+side} y={y+side} width={w-2*side} height={h-2*side} fill="#f4f0e9"/>}
   {!front&&Array.from({length:n},(_,i)=>{
     const sec=sections[i]||{kind:'shelves',shelves:4};
     const bx=x+side+i*sectionW,top=y+side,bottom=y+h-side;
     const kind=sec.kind||'shelves';
     const shelves=clamp(sec.shelves??4,2,6),drawers=clamp(sec.drawers??3,1,4);
     const len=sectionW-8;
     return <g key={i}>
       {i>0&&<rect x={bx-3} y={top} width="6" height={h-2*side} fill={wood} stroke="#a99e8f" strokeWidth=".5"/>}
       {kind==='shelves'&&Array.from({length:shelves},(_,j)=><rect key={j} x={bx+4} y={top+(j+1)*(h-2*side)/(shelves+1)} width={len} height="3.5" fill={wood} stroke="#aea190" strokeWidth=".5"/>)}
       {kind==='rail'&&<><line x1={bx+9} y1={top+25} x2={bx+sectionW-9} y2={top+25} stroke="#9c9b99" strokeWidth="3" strokeLinecap="round"/><path d={'M '+(bx+sectionW/2)+' '+(top+30)+' l -13 15 v '+Math.min(66,h*.31)+' h 26 v -'+Math.min(66,h*.31)+' l -13 -15'} fill="#ddd7ce" stroke="#a9a49c" strokeWidth="1.3"/></>}
       {kind==='combined'&&<><line x1={bx+9} y1={top+26} x2={bx+sectionW-9} y2={top+26} stroke="#999" strokeWidth="2.7"/><path d={'M '+(bx+sectionW/2)+' '+(top+30)+' l -11 14 v '+Math.min(51,h*.23)+' h 22 v -'+Math.min(51,h*.23)+' l -11 -14'} fill="#e0d8cd" stroke="#aaa29b"/>{[.68,.84].map(p=><rect key={p} x={bx+4} y={top+(h-2*side)*p} width={len} height="3.5" fill={wood} stroke="#aca18e" strokeWidth=".5"/>)}</>}
       {kind==='drawers'&&Array.from({length:drawers},(_,j)=>{
         const available=Math.min(h*.64,160),dh=available/drawers;
         return <g key={j}><rect x={bx+3} y={bottom-available+j*dh} width={sectionW-6} height={dh-2} fill={wood} stroke="#a99f91" strokeWidth="1"/><line x1={bx+sectionW*.37} x2={bx+sectionW*.63} y1={bottom-available+j*dh+dh*.5} y2={bottom-available+j*dh+dh*.5} stroke="#85817c" strokeWidth="2" strokeLinecap="round"/></g>
       })}
     </g>;
   })}
   {front&&Array.from({length:n},(_,i)=>{
    const bx=x+i*w/n;const dw=w/n;
    return <g key={i}>
      <rect x={bx+1.2} y={y+2} width={dw-2.4} height={h-4} fill={face} stroke="#b5aa9d" strokeWidth=".95"/>
      <rect x={bx+1.2} y={y+2} width={dw-2.4} height={h-4} fill="url(#wc-shadow)"/>
      {handle!=='hidden'&&<rect x={bx+dw-13} y={y+h*.43} width="3.5" height={Math.min(30,h*.15)} rx="1.5" fill={handle==='black'?'#252523':'#929493'}/>}
    </g>;
   })}
   {!front&&<><rect x={x} y={y} width={side} height={h} fill={wood}/><rect x={x+w-side} y={y} width={side} height={h} fill={wood}/><rect x={x} y={y} width={w} height={side} fill={wood}/><rect x={x} y={y+h-side} width={w} height={side} fill={wood}/></>}
   <line x1={x} y1={y+h+24} x2={x+w} y2={y+h+24} stroke="#817b72" strokeWidth="1"/>
   <line x1={x} y1={y+h+19} x2={x} y2={y+h+29} stroke="#817b72"/>
   <line x1={x+w} y1={y+h+19} x2={x+w} y2={y+h+29} stroke="#817b72"/>
   <text x={x+w/2} y={y+h+39} fill="#4c4740" fontSize="12" textAnchor="middle" fontWeight="600">{wCm} см</text>
   <line x1={x-15} y1={y} x2={x-15} y2={y+h} stroke="#817b72" strokeWidth="1"/>
   <path d={'M '+(x-20)+' '+y+' h 10 M '+(x-20)+' '+(y+h)+' h 10'} stroke="#817b72" strokeWidth="1"/>
   <text x={x-22} y={y+h/2} textAnchor="middle" transform={'rotate(-90 '+(x-22)+' '+(y+h/2)+')'} fontSize="12" fontWeight="600" fill="#4c4740">{hCm} см</text>
   <text x="219" y="373" textAnchor="middle" fontSize="10" fill="#918b82">Глубина: {dCm} см · Эскиз, не производственный чертёж</text>
  </svg>
 </div>;
}

export function WardrobeDetails({config}){
 const c=config||initialConfig();
 const sections=Array.isArray(c.sections)?c.sections:[];
 return <div className="wc-details">
  <div><b>Габариты</b><span>{c.width_cm} × {c.height_cm} × {c.depth_cm} см (Ш × В × Г)</span></div>
  <div><b>Корпус</b><span>{COLOR_OPTIONS.find(t=>t.id===c.body_color)?.name||'Белый'}</span></div>
  <div><b>Фасады</b><span>{COLOR_OPTIONS.find(t=>t.id===c.facade_color)?.name||'Белый'}</span></div>
  <div><b>Ручки</b><span>{HANDLE_OPTIONS.find(t=>t.id===c.handles)?.name||'Чёрные'}</span></div>
  <div><b>Секции</b><span>{sections.length} шт.</span></div>
  {sections.map((section,i)=><div key={i}><b>Секция {i+1}</b><span>{wardrobeKindLabel(section?.kind)}{section?.kind==='shelves'?' — '+section.shelves+' полки':section?.kind==='drawers'?' — '+section.drawers+' ящика':''}</span></div>)}
 </div>;
}

function ConfigNumber({label,value,min,max,onChange}){
 const [draft,setDraft]=useState(String(value));
 useEffect(()=>setDraft(String(value)),[value]);
 const commit=()=>{const n=clamp(draft,min,max);setDraft(String(n));onChange(n)};
 return <label className="wc-number"><span>{label}</span><div>
  <input type="number" inputMode="numeric" min={min} max={max} value={draft}
   onChange={e=>setDraft(e.target.value)} onBlur={commit}
   onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur()}}}/>
  <em>см</em></div></label>;
}

function ColorPicker({label,value,onChange}){
 return <fieldset className="wc-choice-field"><legend>{label}</legend><div className="wc-color-grid">{COLOR_OPTIONS.map(item=><button type="button" key={item.id} className={'wc-color-choice'+(value===item.id?' active':'')} aria-pressed={value===item.id} onClick={()=>onChange(item.id)}><span className="wc-swatch" style={{background:item.hex}}/>{item.name}{value===item.id&&<Check size={14}/>}</button>)}</div></fieldset>;
}

export default function WardrobeConfigurator({supabase}){
 const [config,setConfig]=useState(restoreDraft);
 useEffect(()=>{
  const timer=window.setTimeout(()=>{try{window.localStorage.setItem(DRAFT_KEY,JSON.stringify(config))}catch{}},300);
  return ()=>window.clearTimeout(timer);
 },[config]);
 const [active,setActive]=useState(0);
 const [doors,setDoors]=useState(true);
 const [name,setName]=useState('');
 const [phone,setPhone]=useState('');
 const [note,setNote]=useState('');
 const [website,setWebsite]=useState('');
 const [consent,setConsent]=useState(false);
 const [sending,setSending]=useState(false);
 const [submitted,setSubmitted]=useState(false);
 const [error,setError]=useState('');
 const edit=(key,value)=>setConfig(c=>({...c,[key]:value}));
 const sectionCount=count=>{
  const n=clamp(count,2,6);
  setConfig(c=>({...c,sections:Array.from({length:n},(_,i)=>c.sections[i]||{kind:'shelves',shelves:4,drawers:3})}));
  setActive(a=>Math.min(a,n-1));
 };
 const editSection=(key,value)=>setConfig(c=>({...c,sections:c.sections.map((sec,i)=>i===active?{...sec,[key]:value}:sec)}));
 const section=config.sections[active]||config.sections[0];
 async function submit(e){
  e.preventDefault();
  if(sending||submitted)return;
  if(website){setSubmitted(true);return;}
  if(name.trim().length<2||phone.trim().length<7){setError('Укажите имя и номер телефона.');return;}
  if(!consent){setError('Подтвердите согласие на обработку персональных данных.');return;}
  setSending(true);setError('');
  try{
   const {error:err}=await supabase.from('ripiano_custom_orders').insert({
    customer_name:name.trim(),
    phone:phone.trim(),
    note:note.trim(),
    configuration:config,
    consent_version:CONSENT_VERSION
   });
   if(err)throw err;
   setSubmitted(true);
  }catch(err){
   console.error('RIPIANO custom project submission',err);
   setError('Не удалось отправить проект. Проверьте подключение к интернету и попробуйте снова.');
  }finally{setSending(false);}
 }
 return <main className="wc-page">
  <div className="wc-breadcrumb"><button type="button" onClick={()=>window.history.back()}><ArrowLeft size={16}/> Назад</button><span>RIPIANO / МЕБЕЛЬ НА ЗАКАЗ</span></div>
  <div className="wc-page-heading"><div><div className="wc-eyebrow">RIPIANO / КОНСТРУКТОР 01</div><h1>СОЗДАЙТЕ<br/>СВОЙ ШКАФ</h1></div><p>Выберите размеры, наполнение и отделку. Мы получим эскиз вашего проекта и рассчитаем стоимость изготовления.</p></div>
  <div className="wc-workspace">
   <div className="wc-preview-column">
    <div className="wc-preview-card">
     <div className="wc-preview-header"><div><span className="wc-eyebrow">ЭСКИЗ ПРОЕКТА</span><b>Шкаф на заказ</b></div><button className="wc-reset" type="button" onClick={()=>{setConfig(initialConfig());setActive(0);setDoors(true)}}><RotateCcw size={15}/> Сбросить</button></div>
     <FurniturePreviewSwitch config={config} doors={doors} twoD={<WardrobePreview config={config} doors={doors}/>}/>
     <div className="wc-preview-toggle" role="group" aria-label="Положение дверей">
       <button type="button" className={doors?'active':''} aria-pressed={doors} onClick={()=>setDoors(true)}>Двери закрыты</button>
       <button type="button" className={!doors?'active':''} aria-pressed={!doors} onClick={()=>setDoors(false)}>Открыть двери</button>
      </div>
      <p className="wc-draft-hint" role="status">Размеры и материалы автоматически сохраняются на этом устройстве.</p>
     <div className="wc-preview-note"><Ruler size={16}/><span>Схема для предварительного расчёта. Точные размеры деталей и конструкцию согласует мебельщик.</span></div>
    </div>
   </div>
   <div className="wc-controls">
    <section className="wc-control-card"><div className="wc-section-title"><span>01</span><h2>Габариты шкафа</h2></div>
     <div className="wc-numbers">
      <ConfigNumber label="Ширина" value={config.width_cm} min={80} max={300} onChange={v=>edit('width_cm',v)}/>
      <ConfigNumber label="Высота" value={config.height_cm} min={180} max={260} onChange={v=>edit('height_cm',v)}/>
      <ConfigNumber label="Глубина" value={config.depth_cm} min={40} max={70} onChange={v=>edit('depth_cm',v)}/>
     </div>
     <p className="wc-hint">Размеры в сантиметрах. Ограничения предварительные — окончательно подтвердим после замера.</p>
    </section>
    <section className="wc-control-card"><div className="wc-section-title"><span>02</span><h2>Наполнение</h2></div>
     <label className="wc-select-label">Количество секций<select value={config.sections.length} onChange={e=>sectionCount(e.target.value)}><option value="2">2 секции</option><option value="3">3 секции</option><option value="4">4 секции</option><option value="5">5 секций</option><option value="6">6 секций</option></select></label>
     <div className="wc-section-tabs" role="group" aria-label="Выберите секцию">{config.sections.map((s,i)=><button type="button" key={i} aria-pressed={active===i} className={active===i?'active':''} onClick={()=>{setActive(i);setDoors(false)}}>Секция {i+1}</button>)}</div>
     <div className="wc-fills">{FILL_OPTIONS.map(t=><button type="button" key={t.id} className={section.kind===t.id?'active':''} aria-pressed={section.kind===t.id} onClick={()=>{editSection('kind',t.id);setDoors(false)}}>{t.name}</button>)}</div>
     {section.kind==='shelves'&&<label className="wc-select-label">Количество полок<select value={section.shelves} onChange={e=>editSection('shelves',Number(e.target.value))}>{[2,3,4,5,6].map(n=><option key={n} value={n}>{n}</option>)}</select></label>}
     {section.kind==='drawers'&&<label className="wc-select-label">Количество ящиков<select value={section.drawers} onChange={e=>editSection('drawers',Number(e.target.value))}>{[1,2,3,4].map(n=><option key={n} value={n}>{n}</option>)}</select></label>}
    </section>
    <section className="wc-control-card"><div className="wc-section-title"><span>03</span><h2>Цвет и фурнитура</h2></div>
     <ColorPicker label="Цвет корпуса" value={config.body_color} onChange={v=>edit('body_color',v)}/>
     <ColorPicker label="Цвет фасадов" value={config.facade_color} onChange={v=>{edit('facade_color',v);setDoors(true)}}/>
     <label className="wc-select-label">Ручки<select value={config.handles} onChange={e=>{edit('handles',e.target.value);setDoors(true)}}>{HANDLE_OPTIONS.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
    </section>
   </div>
  </div>
  <section className="wc-quote" id="request">
   <div className="wc-quote-heading"><div><span className="wc-eyebrow">04 / ВАШ ПРОЕКТ</span><h2>ПОЛУЧИТЬ РАСЧЁТ</h2><p>Оставьте телефон — менеджер RIPIANO проверит эскиз, уточнит материалы и назовёт стоимость. Никакой предоплаты.</p></div><div className="wc-quote-price"><span>Стоимость</span><b>По запросу</b></div></div>
   <div className="wc-quote-grid"><div className="wc-quote-drawing"><WardrobePreview config={config} doors={false}/><WardrobeDetails config={config}/></div>
    {!REQUESTS_ENABLED?<OnlineRequestsPaused/>:submitted?<div className="wc-success" role="status"><Check size={34}/><h3>Проект отправлен</h3><p>Спасибо! Менеджер свяжется с вами для расчёта. Ваши размеры и наполнение сохранены в заявке.</p><button className="wc-primary" type="button" onClick={()=>{setSubmitted(false);setName('');setPhone('');setNote('')}}>Отправить ещё один проект</button></div>
    :<form className="wc-quote-form" onSubmit={submit}>
      <label>Как к вам обращаться<input type="text" required maxLength={120} minLength={2} placeholder="Ваше имя" value={name} onChange={e=>setName(e.target.value)}/></label>
      <label>Телефон для связи<input type="tel" required inputMode="tel" minLength={7} maxLength={35} placeholder="+7 999 000-00-00" value={phone} onChange={e=>setPhone(e.target.value)}/></label>
      <label>Пожелания по проекту<textarea rows={3} maxLength={1500} placeholder="Например, для спальни, нужна доставка…" value={note} onChange={e=>setNote(e.target.value)}/></label>
      <label className="wc-honeypot" aria-hidden="true">Ваш сайт<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label>
      <PrivacyConsent checked={consent} onChange={setConsent} disabled={sending} scope="моего проекта"/>
      {error&&<p className="wc-error" role="alert">{error}</p>}
      <button className="wc-primary" disabled={sending} type="submit">{sending?'Отправляем…':'Отправить проект на расчёт'} <ArrowRight size={19}/></button>
      <small>Оплата на сайте не списывается. Менеджер свяжется с вами для расчёта.</small>
    </form>}
   </div>
  </section>
 </main>;
}
