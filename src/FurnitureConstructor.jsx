
import React,{useEffect,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,RotateCcw,Ruler} from 'lucide-react';
import WardrobeConfigurator,{WardrobePreview,WardrobeDetails} from './WardrobeConfigurator.jsx';
import FurniturePreviewSwitch from './FurniturePreviewSwitch.jsx';
import KitchenDrawing from './KitchenDrawing.jsx';
import './furniture-constructor.css';
import {PrivacyConsent,CONSENT_VERSION} from './Privacy.jsx';
import {REQUESTS_ENABLED,OnlineRequestsPaused} from './ComplianceStatus.jsx';

const TYPES=[
 {id:'kitchen',name:'Кухня',title:'СВОЮ КУХНЮ',label:'Прямая кухня на заказ'},
 {id:'wardrobe',name:'Шкаф',title:'СВОЙ ШКАФ',label:'Шкаф на заказ'},
 {id:'dresser',name:'Комод',title:'СВОЙ КОМОД',label:'Комод на заказ'},
 {id:'shelf',name:'Стеллаж',title:'СВОЙ СТЕЛЛАЖ',label:'Стеллаж на заказ'},
 {id:'desk',name:'Стол',title:'СВОЙ СТОЛ',label:'Письменный стол на заказ'}
];
const COLORS=[
 {id:'white',name:'Белый',hex:'#f6f3ed'},
 {id:'oak',name:'Дуб',hex:'#caa77d'},
 {id:'sand',name:'Кашемир',hex:'#c8bcb0'},
 {id:'graphite',name:'Графит',hex:'#545456'}
];
const HANDLE_OPTIONS=[{id:'black',name:'Чёрные'},{id:'silver',name:'Серебристые'},{id:'hidden',name:'Без ручек'}];
const SPEC={
 kitchen:{limits:{width_cm:[180,450],height_cm:[215,280],depth_cm:[50,70]},defaults:{width_cm:300,height_cm:240,depth_cm:60,module_count:4,upper_count:4,upper_cabinets:true,countertop:'stone',backsplash:'tile',sink_position:'left',hob_position:'right'}},
 dresser:{limits:{width_cm:[40,180],height_cm:[50,140],depth_cm:[30,65]},defaults:{width_cm:90,height_cm:85,depth_cm:45,drawer_count:4,leg_style:'plinth'}},
 shelf:{limits:{width_cm:[40,240],height_cm:[80,260],depth_cm:[20,60]},defaults:{width_cm:110,height_cm:190,depth_cm:35,bay_count:2,shelf_count:4,back_panel:true}},
 desk:{limits:{width_cm:[80,240],height_cm:[70,85],depth_cm:[45,100]},defaults:{width_cm:140,height_cm:75,depth_cm:60,drawer_count:3,drawer_side:'right',leg_style:'panel'}}
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Math.round(Number(v)||a)));
const material=id=>COLORS.find(c=>c.id===id)?.hex||COLORS[0].hex;
const nameFor=id=>TYPES.find(t=>t.id===id)?.name||'Шкаф';
const labelFor=(list,id)=>list.find(t=>t.id===id)?.name||'—';
const initialConfig=kind=>({version:2,kind,...SPEC[kind].defaults,body_color:kind==='kitchen'?'sand':'oak',facade_color:'white',handles:'black'});

function DimensionField({label,value,min,max,onChange}){
 const [draft,setDraft]=useState(String(value));
 useEffect(()=>setDraft(String(value)),[value]);
 const commit=()=>{const n=clamp(draft,min,max);setDraft(String(n));onChange(n)};
 return <label className="fc-dimension">
  <span>{label}</span>
  <div className="fc-dimension-value"><input type="number" inputMode="numeric" min={min} max={max} value={draft}
    onChange={e=>setDraft(e.target.value)} onBlur={commit}
    onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur()}}} /><span>см</span></div>
  <input type="range" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))} aria-label={label+' в сантиметрах'}/>
 </label>;
}
function MaterialPicker({title,value,onChange}){
 return <fieldset className="wc-choice-field">
  <legend>{title}</legend>
  <div className="wc-color-grid">{COLORS.map(c=><button type="button" key={c.id} className={'wc-color-choice'+(value===c.id?' active':'')} aria-pressed={value===c.id} onClick={()=>onChange(c.id)}><span className="wc-swatch" style={{background:c.hex}}/>{c.name}{value===c.id&&<Check size={14}/>}</button>)}</div>
 </fieldset>;
}
function OptionSelect({label,value,values,onChange}){
 return <label className="wc-select-label">{label}<select value={value} onChange={e=>onChange(e.target.value)}>{values.map(opt=><option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></label>;
}
const numberOptions=(from,to,unit)=>Array.from({length:to-from+1},(_,i)=>({value:String(from+i),label:String(from+i)+' '+unit}));

function FurnitureDrawing({config}){
 const kind=config?.kind||'wardrobe';
 if(kind==='wardrobe')return <WardrobePreview config={config}/>;
 if(kind==='kitchen')return <KitchenDrawing config={config}/>;
 const c=SPEC[kind]?config:initialConfig('dresser');
 const body=material(c.body_color),face=material(c.facade_color);
 const wi=clamp(c.width_cm,40,240),hi=clamp(c.height_cm,50,260),dep=clamp(c.depth_cm,20,100);
 const sc=Math.min(330/wi,264/hi);
 const w=wi*sc,h=hi*sc,x=(440-w)/2,y=27+(285-h)/2;
 const handle=c.handles==='hidden'?null:c.handles==='silver'?'#9b9d9e':'#3d3c3b';
 const dcount=clamp(c.drawer_count||0,0,8), bays=clamp(c.bay_count||2,1,4),shelves=clamp(c.shelf_count||4,2,8);
 const shelfBack=c.back_panel!==false;
 const hmark=(yy,left,right)=><line x1={left} y1={yy} x2={right} y2={yy} stroke={handle||'#b6a99a'} strokeWidth="2.4" strokeLinecap="round"/>;
 return <div className="wc-diagram fc-drawing">
  <svg viewBox="0 0 440 380" role="img" aria-label={'Эскиз: '+nameFor(kind)+', ширина '+wi+' см, высота '+hi+' см, глубина '+dep+' см'}>
   <ellipse cx="220" cy={y+h+11} rx={Math.max(w*.49,48)} ry="8" fill="#aaa294" opacity=".2"/>
   {kind==='dresser'&&<>
     <rect x={x} y={y} width={w} height={h} fill={body} stroke="#988b7d" strokeWidth="1.4"/>
     <rect x={x+4} y={y+5} width={w-8} height={h-(c.leg_style==='legs'?16:9)} fill={face} stroke="#b2a79b" strokeWidth="1"/>
     {Array.from({length:dcount},(_,i)=>{
       const inner=h-(c.leg_style==='legs'?25:17), dh=inner/dcount;
       return <g key={i}><rect x={x+7} y={y+8+i*dh} width={w-14} height={dh-3.5} fill={face} stroke="#ada196" strokeWidth="1"/>
        {handle&&hmark(y+8+i*dh+dh*.5,x+w*.44,x+w*.56)}</g>;
     })}
     {c.leg_style==='legs'&&<><rect x={x+13} y={y+h-11} width="6" height="11" fill={body}/><rect x={x+w-19} y={y+h-11} width="6" height="11" fill={body}/></>}
   </>}
   {kind==='shelf'&&<>
     <rect x={x} y={y} width={w} height={h} fill={body} stroke="#988b7d" strokeWidth="1.5"/>
     <rect x={x+7} y={y+7} width={w-14} height={h-14} fill={shelfBack?face:'#eeebe5'}/>
     {Array.from({length:bays-1},(_,i)=><rect key={'v'+i} x={x+(i+1)*w/bays-3} y={y+5} width="6" height={h-10} fill={body} stroke="#ac9d8d" strokeWidth=".6"/>)}
     {Array.from({length:shelves},(_,i)=><rect key={'h'+i} x={x+5} y={y+(i+1)*h/(shelves+1)-2.5} width={w-10} height="5" fill={body} stroke="#ac9d8d" strokeWidth=".6"/>)}
   </>}
   {kind==='desk'&&<>
     <rect x={x-4} y={y+3} width={w+8} height="10" fill={body} stroke="#988b7d" strokeWidth="1.3"/>
     {c.leg_style==='metal'?
       <><rect x={x+12} y={y+13} width="5" height={h-13} fill="#464544"/><rect x={x+w-17} y={y+13} width="5" height={h-13} fill="#464544"/><rect x={x+13} y={y+h-8} width={w-26} height="4" fill="#464544"/></>
     :<><rect x={x+9} y={y+13} width="8" height={h-13} fill={body} stroke="#a89a8c"/><rect x={x+w-17} y={y+13} width="8" height={h-13} fill={body} stroke="#a89a8c"/></>}
     {dcount>0&&c.drawer_side!=='none'&&(()=>{
       const bw=Math.min(w*.32,86),bx=c.drawer_side==='left'?x+18:x+w-18-bw,by=y+17,dh=(h-27)/dcount;
       return <g>
        <rect x={bx} y={by} width={bw} height={h-22} fill={body} stroke="#988b7d" strokeWidth="1"/>
        {Array.from({length:dcount},(_,i)=><g key={i}><rect x={bx+3} y={by+3+i*dh} width={bw-6} height={dh-4} fill={face} stroke="#aaa093" strokeWidth=".9"/>{handle&&hmark(by+3+i*dh+dh*.5,bx+bw*.39,bx+bw*.61)}</g>)}
       </g>;
     })()}
   </>}
   <line x1={x} y1={y+h+24} x2={x+w} y2={y+h+24} stroke="#817b72" strokeWidth="1"/>
   <line x1={x} y1={y+h+19} x2={x} y2={y+h+29} stroke="#817b72"/>
   <line x1={x+w} y1={y+h+19} x2={x+w} y2={y+h+29} stroke="#817b72"/>
   <text x="220" y={y+h+39} textAnchor="middle" fill="#4c4740" fontSize="12" fontWeight="600">{wi} см</text>
   <line x1={x-15} y1={y} x2={x-15} y2={y+h} stroke="#817b72"/>
   <path d={'M '+(x-20)+' '+y+' h 10 M '+(x-20)+' '+(y+h)+' h 10'} stroke="#817b72"/>
   <text x={x-23} y={y+h/2} textAnchor="middle" transform={'rotate(-90 '+(x-23)+' '+(y+h/2)+')'} fontSize="12" fill="#4c4740" fontWeight="600">{hi} см</text>
   <text x="220" y="374" textAnchor="middle" fontSize="11" fill="#918b82">Глубина {dep} см · Схематичный вид спереди</text>
  </svg>
 </div>;
}
export function FurniturePreview({config,doors=false}){
 if(!config||!SPEC[config.kind])return <WardrobePreview config={config} doors={doors}/>;
 return <FurnitureDrawing config={config}/>;
}
export function FurnitureDetails({config}){
 if(!config||!SPEC[config.kind])return <WardrobeDetails config={config}/>;
 const c=config;
 const rows=[
 ['Тип мебели',nameFor(c.kind)],
 ['Размеры',c.width_cm+' × '+c.height_cm+' × '+c.depth_cm+' см (Ш × В × Г)'],
 ['Материал корпуса',labelFor(COLORS,c.body_color)],
 ...(c.kind==='shelf'?[]:[['Цвет фасадов',labelFor(COLORS,c.facade_color)]]),
 ...(c.kind==='shelf'?[]:[['Ручки',labelFor(HANDLE_OPTIONS,c.handles)]]),
 ...(c.kind==='dresser'?[['Количество ящиков',String(c.drawer_count)],['Основание',c.leg_style==='legs'?'На ножках':'Цоколь']]:[]),
 ...(c.kind==='shelf'?[['Количество секций',String(c.bay_count)],['Полки',String(c.shelf_count)],['Задняя стенка',c.back_panel?'Есть':'Открытый стеллаж']]:[]),
 ...(c.kind==='desk'?[['Основание',c.leg_style==='metal'?'Металлические опоры':'Боковины ЛДСП'],['Ящики',String(c.drawer_count)],['Расположение ящиков',c.drawer_count===0?'Без ящиков':({left:'Слева',right:'Справа',none:'Без тумбы'}[c.drawer_side]||'Справа')]]:[]),
 ...(c.kind==='kitchen'?[['Планировка','Прямая'],['Нижние модули',c.module_count+' шт.'],['Верхние шкафы',c.upper_cabinets===false?'Нет':c.upper_count+' шт.'],['Столешница',({stone:'Камень светлый',graphite:'Камень тёмный',oak:'Под дерево'}[c.countertop]||'Камень светлый')],['Фартук',({tile:'Плитка светлая',dark:'Плитка тёмная',plain:'Гладкий'}[c.backsplash]||'Плитка светлая')],['Мойка',({left:'Слева',center:'По центру',right:'Справа'}[c.sink_position]||'Слева')],['Варочная панель',({left:'Слева',center:'По центру',right:'Справа'}[c.hob_position]||'Справа')]]:[])
 ];
 return <div className="wc-details">{rows.map(([key,val],i)=><div key={i}><b>{key}</b><span>{val}</span></div>)}</div>;
}

function CustomFurniture({kind,supabase}){
 const [config,setConfig]=useState(()=>initialConfig(kind));
 const [name,setName]=useState(''),[phone,setPhone]=useState(''),[note,setNote]=useState('');
 const [website,setWebsite]=useState('');
 const [consent,setConsent]=useState(false);
 const [sending,setSending]=useState(false),[submitted,setSubmitted]=useState(false),[error,setError]=useState('');
 const meta=TYPES.find(x=>x.id===kind);
 const limits=SPEC[kind].limits;
 const maxKitchenModules=kind==='kitchen'?Math.min(6,Math.max(2,Math.floor(config.width_cm/45))):6;
 const kitchenPositions=[{value:'left',label:'Слева'},...(config.module_count>=3?[{value:'center',label:'По центру'}]:[]),{value:'right',label:'Справа'}];
 const edit=(key,value)=>setConfig(c=>{
  const next={...c,[key]:value};
  if(kind==='kitchen'){
   const max=Math.min(6,Math.max(2,Math.floor(next.width_cm/45)));
   next.module_count=Math.min(next.module_count,max);
   next.upper_count=Math.min(next.upper_count,max);
   if(next.module_count===2){
    if(next.sink_position==='center')next.sink_position='left';
    if(next.hob_position==='center')next.hob_position='right';
   }
   if(next.sink_position===next.hob_position)next.hob_position=next.sink_position==='right'?'left':'right';
  }
  return next;
 });
 const reset=()=>{setConfig(initialConfig(kind));setSubmitted(false);setError('')};
 const changeDrawerSide=v=>setConfig(c=>({...c,drawer_side:v,drawer_count:v==='none'?0:(c.drawer_count||3)}));
 const changeDrawerCount=v=>setConfig(c=>({...c,drawer_count:v,drawer_side:v===0?'none':c.drawer_side==='none'?'right':c.drawer_side}));
 async function submit(e){
  e.preventDefault();
  if(sending||submitted)return;
  if(website){setSubmitted(true);return;}
  if(name.trim().length<2||phone.trim().length<7){setError('Укажите имя и телефон.');return}
  if(!consent){setError('Подтвердите согласие на обработку персональных данных.');return;}
  setSending(true);setError('');
  try{
   const {error:submitError}=await supabase.from('ripiano_custom_orders').insert({
    customer_name:name.trim(),phone:phone.trim(),note:note.trim(),configuration:config,consent_version:CONSENT_VERSION
   });
   if(submitError)throw submitError;
   setSubmitted(true);
  }catch(e){console.error('RIPIANO project request',e);setError('Не удалось отправить заявку. Проверьте интернет и попробуйте снова.')}
  finally{setSending(false)}
 }
 return <div className="fc-content">
  <div className="wc-page-heading fc-heading"><div><span className="wc-eyebrow">RIPIANO / КОНСТРУКТОР</span><h1>СОЗДАЙТЕ<br/>{meta.title}</h1></div><p>{kind==='kitchen'?'Соберите прямую кухню: задайте размеры, нижние и верхние шкафы, мойку, плиту и отделку. Получите предварительный эскиз для расчёта.':'Подберите размеры, конструкцию и отделку. Мы получим ваш проект и рассчитаем стоимость изготовления.'}</p></div>
  <div className="wc-workspace">
   <div className="wc-preview-column">
    <div className="wc-preview-card">
     <div className="wc-preview-header"><div><span className="wc-eyebrow">ПРЕДВАРИТЕЛЬНЫЙ ЭСКИЗ</span><b>{meta.label}</b></div><button type="button" className="wc-reset" onClick={reset}><RotateCcw size={16}/> Сбросить</button></div>
     <FurniturePreviewSwitch config={config} twoD={<FurnitureDrawing config={config}/>}/>
     <div className="wc-preview-note"><Ruler size={17}/><span>Схема для расчёта, не производственный чертёж. Детали конструкции согласуем с мебельщиком.</span></div>
    </div>
   </div>
   <div className="wc-controls">
    <section className="wc-control-card">
     <div className="wc-section-title"><span>01</span><h2>Размеры {kind==='kitchen'?'кухни':kind==='desk'?'стола':kind==='dresser'?'комода':'стеллажа'}</h2></div>
     <div className="fc-dimensions">
      <DimensionField label="Ширина" value={config.width_cm} min={limits.width_cm[0]} max={limits.width_cm[1]} onChange={v=>edit('width_cm',v)}/>
      <DimensionField label="Высота" value={config.height_cm} min={limits.height_cm[0]} max={limits.height_cm[1]} onChange={v=>edit('height_cm',v)}/>
      <DimensionField label="Глубина" value={config.depth_cm} min={limits.depth_cm[0]} max={limits.depth_cm[1]} onChange={v=>edit('depth_cm',v)}/>
     </div>
     <p className="wc-hint">{kind==='kitchen'?'Ширина — длина прямой кухни. Высота — до верха гарнитура. Глубина — нижних шкафов. Реальные зазоры для техники и коммуникаций уточнит мастер.':'Размеры в сантиметрах. Окончательные допустимые габариты подтвердим после проверки проекта.'}</p>
    </section>
    <section className="wc-control-card">
     <div className="wc-section-title"><span>02</span><h2>{kind==='kitchen'?'Модули и техника':kind==='shelf'?'Секции и полки':kind==='desk'?'Опоры и тумба':'Ящики и основание'}</h2></div>
     {kind==='kitchen'&&<div className="fc-kitchen-fields">
      <div className="fc-kitchen-hint">Прямая кухня · напольные и навесные модули</div>
      <OptionSelect label="Нижние шкафы" value={String(config.module_count)} values={numberOptions(2,maxKitchenModules,'шт.')} onChange={v=>edit('module_count',Number(v))}/>
      <label className="fc-check"><input type="checkbox" checked={config.upper_cabinets!==false} onChange={e=>edit('upper_cabinets',e.target.checked)}/><span>Верхние шкафы</span></label>
      {config.upper_cabinets!==false&&<OptionSelect label="Верхние модули" value={String(config.upper_count)} values={numberOptions(2,maxKitchenModules,'шт.')} onChange={v=>edit('upper_count',Number(v))}/>}
      <div className="fc-kitchen-pair">
       <OptionSelect label="Мойка" value={config.sink_position} values={kitchenPositions.filter(p=>p.value!==config.hob_position)} onChange={v=>edit('sink_position',v)}/>
       <OptionSelect label="Варочная панель" value={config.hob_position} values={kitchenPositions.filter(p=>p.value!==config.sink_position)} onChange={v=>edit('hob_position',v)}/>
      </div>
      <p className="wc-hint">Положение техники предварительное. Воду, электричество, вентиляцию и реальные размеры приборов уточняют перед производством.</p>
     </div>}
     {kind==='dresser'&&<>
      <OptionSelect label="Количество ящиков" value={String(config.drawer_count)} values={numberOptions(2,8,'шт.')} onChange={v=>edit('drawer_count',Number(v))}/>
      <OptionSelect label="Основание" value={config.leg_style} values={[{value:'plinth',label:'Цоколь'},{value:'legs',label:'На ножках'}]} onChange={v=>edit('leg_style',v)}/>
     </>}
     {kind==='shelf'&&<>
      <OptionSelect label="Вертикальные секции" value={String(config.bay_count)} values={numberOptions(1,4,'шт.')} onChange={v=>edit('bay_count',Number(v))}/>
      <OptionSelect label="Горизонтальные полки" value={String(config.shelf_count)} values={numberOptions(2,8,'шт.')} onChange={v=>edit('shelf_count',Number(v))}/>
      <label className="fc-check"><input type="checkbox" checked={config.back_panel} onChange={e=>edit('back_panel',e.target.checked)}/><span>Задняя стенка</span></label>
     </>}
     {kind==='desk'&&<>
      <OptionSelect label="Тип основания" value={config.leg_style} values={[{value:'panel',label:'Боковины ЛДСП'},{value:'metal',label:'Металлические опоры'}]} onChange={v=>edit('leg_style',v)}/>
      <OptionSelect label="Ящики" value={String(config.drawer_count)} values={numberOptions(0,4,'шт.')} onChange={v=>changeDrawerCount(Number(v))}/>
      {config.drawer_count>0&&<OptionSelect label="Расположение тумбы" value={config.drawer_side} values={[{value:'left',label:'Слева'},{value:'right',label:'Справа'},{value:'none',label:'Без тумбы'}]} onChange={changeDrawerSide}/>}
     </>}
    </section>
    <section className="wc-control-card">
     <div className="wc-section-title"><span>03</span><h2>Цвет и отделка</h2></div>
     <MaterialPicker title={kind==='kitchen'?'Корпус шкафов':'Корпус / основа'} value={config.body_color} onChange={v=>edit('body_color',v)}/>
     {kind!=='shelf'&&<MaterialPicker title={kind==='kitchen'?'Фасады кухни':'Фасады / ящики'} value={config.facade_color} onChange={v=>edit('facade_color',v)}/>}
     {kind!=='shelf'&&<OptionSelect label="Ручки" value={config.handles} values={HANDLE_OPTIONS.map(t=>({value:t.id,label:t.name}))} onChange={v=>edit('handles',v)}/>}
     {kind==='kitchen'&&<>
      <OptionSelect label="Столешница" value={config.countertop} values={[{value:'stone',label:'Камень светлый'},{value:'graphite',label:'Камень тёмный'},{value:'oak',label:'Под дерево'}]} onChange={v=>edit('countertop',v)}/>
      <OptionSelect label="Кухонный фартук" value={config.backsplash} values={[{value:'tile',label:'Плитка светлая'},{value:'dark',label:'Плитка тёмная'},{value:'plain',label:'Гладкий'}]} onChange={v=>edit('backsplash',v)}/>
     </>}
    </section>
   </div>
  </div>
  <section className="wc-quote" id="request">
   <div className="wc-quote-heading"><div><span className="wc-eyebrow">04 / ЗАЯВКА НА ИЗГОТОВЛЕНИЕ</span><h2>ПОЛУЧИТЬ РАСЧЁТ</h2><p>Выбираете мебель и параметры, мы согласуем конструкцию и стоимость. Оплата на сайте не списывается.</p></div><div className="wc-quote-price"><span>Стоимость</span><b>По запросу</b></div></div>
   <div className="wc-quote-grid">
    <div className="wc-quote-drawing"><FurnitureDrawing config={config}/><FurnitureDetails config={config}/></div>
    {!REQUESTS_ENABLED?<OnlineRequestsPaused/>:submitted?<div className="wc-success" role="status"><Check size={34}/><h3>Проект отправлен</h3><p>Спасибо! Менеджер RIPIANO свяжется с вами, уточнит изготовление и рассчитает стоимость.</p><button type="button" className="wc-primary" onClick={()=>{setSubmitted(false);setName('');setPhone('');setNote('')}}>Создать ещё одну заявку</button></div>
    :<form className="wc-quote-form" onSubmit={submit}>
      <label>Ваше имя<input required minLength={2} maxLength={120} placeholder="Как к вам обращаться" value={name} onChange={e=>setName(e.target.value)}/></label>
      <label>Телефон<input required type="tel" inputMode="tel" minLength={7} maxLength={35} placeholder="+7 999 000-00-00" value={phone} onChange={e=>setPhone(e.target.value)}/></label>
      <label>Пожелания<textarea rows={3} maxLength={1500} placeholder="Особенности помещения, доставка, пожелания…" value={note} onChange={e=>setNote(e.target.value)}/></label>
      <label className="wc-honeypot" aria-hidden="true">Сайт<input tabIndex={-1} value={website} onChange={e=>setWebsite(e.target.value)} autoComplete="off"/></label>
      <PrivacyConsent checked={consent} onChange={setConsent} disabled={sending} scope="моего проекта"/>
      {error&&<p className="wc-error" role="alert">{error}</p>}
      <button type="submit" className="wc-primary" disabled={sending}>{sending?'Отправляем…':'Отправить проект на расчёт'} <ArrowRight size={18}/></button>
      <small>Расчёт предварительный до согласования с мастером. Оплата не списывается.</small>
    </form>}
   </div>
  </section>
 </div>;
}

export default function FurnitureConstructor({supabase}){
 const [type,setType]=useState('wardrobe');
 return <main className="fc-main">
  <div className="fc-top"><span>RIPIANO / МЕБЕЛЬ НА ЗАКАЗ</span><a href="/catalog"><ArrowLeft size={16}/> Каталог</a></div>
  <div className="fc-selector"><div className="fc-selector-head"><span className="wc-eyebrow">ВЫБЕРИТЕ МЕБЕЛЬ</span><h2>Что будем создавать?</h2></div>
   <div className="fc-types" role="group" aria-label="Тип мебели">
    {TYPES.map(t=><button type="button" key={t.id} className={type===t.id?'active':''} aria-pressed={type===t.id} onClick={()=>setType(t.id)}>
      <span className="fc-type-icon">{t.id==='kitchen'?'▤':t.id==='wardrobe'?'▥':t.id==='dresser'?'▤':t.id==='shelf'?'▦':'▱'}</span>
      <span>{t.name}</span>{type===t.id&&<Check size={16}/>}
    </button>)}
   </div>
  </div>
  <div className="fc-inner" key={type}>
   {type==='wardrobe'?<WardrobeConfigurator supabase={supabase}/>:<CustomFurniture kind={type} supabase={supabase}/>}
  </div>
 </main>;
}
