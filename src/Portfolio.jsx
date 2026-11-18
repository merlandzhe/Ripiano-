import React,{useEffect,useMemo,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,ChevronLeft,ChevronRight,Edit3,ImagePlus,Images,Plus,Trash2,X} from 'lucide-react';
import './portfolio.css';

const CATEGORIES=['Кухни','Шкафы','Гардеробные','Комоды','Столы','Стеллажи','Комплекты мебели','Другое'];
const emptyWork=()=>({
 title:'',category:'Кухни',description:'',city:'',dimensions:'',materials:'',
 image_url:'',gallery:[],active:true,sort_order:100
});
const workImages=work=>[work?.image_url,...(Array.isArray(work?.gallery)?work.gallery:[])].filter(url=>typeof url==='string'&&url.trim());
const workDetails=work=>[
 work?.city&&['Город',work.city],
 work?.dimensions&&['Размеры',work.dimensions],
 work?.materials&&['Материалы',work.materials]
].filter(Boolean);
const photoAlt=(work,index)=>work.title+(index===0?'':' — фото '+(index+1));

function PortfolioViewer({work,initialIndex=0,onClose}){
 const photos=workImages(work);
 const [index,setIndex]=useState(initialIndex);
 const step=delta=>setIndex(prev=>(prev+delta+photos.length)%photos.length);
 useEffect(()=>{
  const previous=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const onKey=e=>{
   if(e.key==='Escape')onClose();
   if(e.key==='ArrowRight'&&photos.length>1)step(1);
   if(e.key==='ArrowLeft'&&photos.length>1)step(-1);
  };
  window.addEventListener('keydown',onKey);
  return ()=>{document.body.style.overflow=previous;window.removeEventListener('keydown',onKey)};
 },[photos.length,onClose]);
 if(!photos.length)return null;
 return <div className="rp-lightbox" role="dialog" aria-modal="true" aria-label={'Фотографии проекта '+work.title} onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <div className="rp-lightbox-inner">
   <div className="rp-lightbox-top"><div><b>{work.title}</b><span>{index+1} / {photos.length}</span></div><button type="button" onClick={onClose} aria-label="Закрыть фотографии"><X size={24}/></button></div>
   <div className="rp-lightbox-image">
    {photos.length>1&&<button type="button" aria-label="Предыдущее фото" onClick={()=>step(-1)}><ChevronLeft size={26}/></button>}
    <img src={photos[index]} alt={photoAlt(work,index)}/>
    {photos.length>1&&<button type="button" aria-label="Следующее фото" onClick={()=>step(1)}><ChevronRight size={26}/></button>}
   </div>
   {photos.length>1&&<div className="rp-lightbox-thumbs">{photos.map((src,i)=><button key={src+'-'+i} type="button" className={index===i?'active':''} onClick={()=>setIndex(i)} aria-label={'Посмотреть фото '+(i+1)}><img src={src} alt=""/></button>)}</div>}
  </div>
 </div>;
}

export function PortfolioPage({supabase,onNavigate}){
 const [works,setWorks]=useState([]);
 const [loading,setLoading]=useState(true);
 const [loadError,setLoadError]=useState('');
 const [category,setCategory]=useState('Все');
 const [open,setOpen]=useState(null);
 useEffect(()=>{
  let cancelled=false;
  (async()=>{
   const {data,error}=await supabase.from('ripiano_portfolio').select('id,title,category,description,city,dimensions,materials,image_url,gallery,sort_order,created_at').eq('active',true).order('sort_order',{ascending:true}).order('created_at',{ascending:false});
   if(cancelled)return;
   if(error){console.error('RIPIANO portfolio load',error);setLoadError('Не удалось загрузить работы. Попробуйте обновить страницу.')}
   else setWorks(data||[]);
   setLoading(false);
  })();
  return()=>{cancelled=true};
 },[supabase]);
 const categories=useMemo(()=>['Все',...CATEGORIES.filter(c=>works.some(w=>w.category===c))], [works]);
 const visible=category==='Все'?works:works.filter(w=>w.category===category);
 return <main className="rp-portfolio">
  <div className="rp-portfolio-breadcrumb"><button type="button" onClick={()=>onNavigate('/')}>Главная</button><span>/</span><span>Наши работы</span></div>
  <div className="rp-portfolio-intro"><div><span className="rp-eyebrow">RIPIANO / РЕАЛИЗОВАННЫЕ ПРОЕКТЫ</span><h1>НАШИ<br/>РАБОТЫ</h1></div><p>Мебель, которую мы изготовили для наших клиентов. Реальные проекты, детали, материалы и результат.</p></div>
  {loading?<p className="rp-portfolio-state">Загружаем работы…</p>:loadError?<div className="rp-portfolio-state" role="alert">{loadError}</div>:works.length===0?
   <div className="rp-portfolio-empty">
    <Images size={32} strokeWidth={1.2}/>
    <h2>Здесь скоро появятся наши проекты.</h2>
    <p>Мы добавляем фотографии выполненной мебели. Пока вы можете посмотреть каталог или создать собственный проект на заказ.</p>
    <div><button type="button" className="rp-dark-button" onClick={()=>onNavigate('/catalog')}>Перейти в каталог <ArrowRight size={16}/></button><button type="button" className="rp-outline-button" onClick={()=>onNavigate('/constructor')}>Конструктор на заказ</button></div>
   </div>:
   <>
    <div className="rp-portfolio-filters" role="group" aria-label="Типы выполненных проектов">{categories.map(c=><button key={c} type="button" className={category===c?'active':''} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div>
    {visible.length===0?<div className="rp-portfolio-state">В этой категории пока нет работ.</div>:
    <div className="rp-work-grid">{visible.map((work,i)=><article className={'rp-work-card'+(i%5===3?' rp-work-featured':'')} key={work.id}>
     <button type="button" className="rp-work-image" onClick={()=>setOpen({work,index:0})} aria-label={'Посмотреть фотографии проекта '+work.title}>
      <img src={work.image_url} loading={i<3?'eager':'lazy'} alt={work.title}/>
      {workImages(work).length>1&&<span className="rp-work-photo-count"><Images size={14}/>{workImages(work).length} фото</span>}
     </button>
     <div className="rp-work-caption"><div><span className="rp-work-category">{work.category}</span><h2>{work.title}</h2></div><button type="button" onClick={()=>setOpen({work,index:0})} aria-label={'Открыть проект '+work.title}><ArrowRight size={19}/></button></div>
     {work.description&&<p className="rp-work-description">{work.description}</p>}
     {workDetails(work).length>0&&<div className="rp-work-details">{workDetails(work).map(([label,value])=><span key={label}><b>{label}: </b>{value}</span>)}</div>}
     <a className="rp-work-inquiry" href={'https://wa.me/79651003900?text='+encodeURIComponent('Здравствуйте! Хочу заказать похожую мебель: '+work.title)} target="_blank" rel="noopener noreferrer">Заказать похожее <ArrowRight size={14}/></a>
    </article>)}</div>}
   </>
  }
  <section className="rp-portfolio-cta"><div><span className="rp-eyebrow">ИНДИВИДУАЛЬНОЕ ИЗГОТОВЛЕНИЕ</span><h2>Есть идея?<br/>Давайте воплотим её.</h2></div><button type="button" className="rp-dark-button" onClick={()=>onNavigate('/constructor')}>Создать проект мебели <ArrowRight size={18}/></button></section>
  {open&&<PortfolioViewer work={open.work} initialIndex={open.index} onClose={()=>setOpen(null)}/>}
 </main>;
}

export function PortfolioAdmin({supabase}){
 const [works,setWorks]=useState([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [editing,setEditing]=useState(null);
 const [form,setForm]=useState(emptyWork);
 const [busy,setBusy]=useState(false);
 const [uploadStatus,setUploadStatus]=useState('');
 const [confirmDelete,setConfirmDelete]=useState(null);
 async function refresh(){
  const {data,error:loadError}=await supabase.from('ripiano_portfolio').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false});
  if(loadError){setError('Не удалось загрузить работы: '+loadError.message);return}
  setWorks(data||[]);
  setError('');
 }
 useEffect(()=>{let mounted=true;(async()=>{
  const {data,error:loadError}=await supabase.from('ripiano_portfolio').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false});
  if(!mounted)return;
  if(loadError)setError('Не удалось загрузить работы: '+loadError.message);
  else setWorks(data||[]);
  setLoading(false);
 })();return()=>{mounted=false}},[supabase]);
 const startEdit=work=>{
  setEditing(work?.id||'new');
  setForm(work?{
   title:work.title,category:work.category,description:work.description||'',city:work.city||'',
   dimensions:work.dimensions||'',materials:work.materials||'',
   image_url:work.image_url||'',gallery:Array.isArray(work.gallery)?work.gallery:[],
   active:work.active,sort_order:work.sort_order??100
  }:emptyWork());
  setNotice('');setUploadStatus('');setConfirmDelete(null);
 };
 const updatePhotos=photos=>setForm(current=>({...current,image_url:photos[0]||'',gallery:photos.slice(1)}));
 const movePhoto=(from,to)=>{
  if(busy)return;
  const imgs=workImages(form);
  if(from<0||to<0||from>=imgs.length||to>=imgs.length)return;
  const [item]=imgs.splice(from,1);imgs.splice(to,0,item);
  updatePhotos(imgs);
 };
 const removePhoto=index=>{
  if(busy)return;
  updatePhotos(workImages(form).filter((_,i)=>i!==index));
 };
 async function uploadPhotos(e){
  const files=Array.from(e.target.files||[]);
  e.target.value='';
  if(busy||!files.length)return;
  const before=workImages(form);
  if(before.length+files.length>20){setNotice('Максимум 20 фотографий на одну работу.');return}
  const validTypes=['image/jpeg','image/png','image/webp'];
  if(files.some(f=>!validTypes.includes(f.type)||f.size===0||f.size>10*1024*1024)){
   setNotice('Только JPG, PNG или WebP. Каждая фотография должна быть не больше 10 МБ.');
   return;
  }
  setBusy(true);setNotice('');
  const urls=[];
  let problem=null;
  for(let i=0;i<files.length;i++){
   const file=files[i];
   setUploadStatus('Загрузка фото '+(i+1)+' из '+files.length);
   const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
   const path='portfolio/'+crypto.randomUUID()+'.'+ext;
   try{
    const {error:uploadError}=await supabase.storage.from('ripiano-products').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});
    if(uploadError)throw uploadError;
    const {data}=supabase.storage.from('ripiano-products').getPublicUrl(path);
    urls.push(data.publicUrl);
   }catch(uploadError){problem=uploadError;break}
  }
  if(urls.length)setForm(current=>{const all=[...workImages(current),...urls];return {...current,image_url:all[0]||'',gallery:all.slice(1)}});
  setUploadStatus('');setBusy(false);
  setNotice(problem?'Загружено '+urls.length+' из '+files.length+'. Ошибка: '+(problem.message||'попробуйте ещё раз'):'Фотографии добавлены. Нажмите «Сохранить работу» для публикации.');
 }
 async function save(e){
  e.preventDefault();if(busy)return;
  setNotice('');setError('');
  const title=form.title.trim();
  if(title.length<2){setNotice('Введите название работы.');return}
  if(form.active&&!form.image_url){setNotice('Для публикации добавьте хотя бы одно фото.');return}
  setBusy(true);
  const data={
   title,category:form.category,description:form.description.trim(),city:form.city.trim(),
   dimensions:form.dimensions.trim(),materials:form.materials.trim(),
   image_url:form.image_url,gallery:form.gallery,active:form.active,
   sort_order:Number(form.sort_order)||100,updated_at:new Date().toISOString()
  };
  try{
   const result=editing==='new'?await supabase.from('ripiano_portfolio').insert(data).select('id').single():
    await supabase.from('ripiano_portfolio').update(data).eq('id',editing).select('id').single();
   if(result.error)throw result.error;
   setEditing(null);setNotice('Работа сохранена.');await refresh();
  }catch(saveError){setNotice('Не удалось сохранить: '+(saveError.message||'повторите попытку'))}
  finally{setBusy(false)}
 }
 async function deleteWork(id){
  if(busy||confirmDelete!==id)return;
  setBusy(true);setError('');
  try{
   const {data,error:deleteError}=await supabase.from('ripiano_portfolio').delete().eq('id',id).select('id').maybeSingle();
   if(deleteError)throw deleteError;
   if(!data)throw new Error('Работа не найдена или нет прав на удаление');
   setWorks(current=>current.filter(w=>w.id!==id));
   setConfirmDelete(null);setNotice('Работа удалена из портфолио.');
  }catch(e){setError('Не удалось удалить: '+(e.message||'попробуйте ещё раз'))}
  finally{setBusy(false)}
 }
 return <section className="rp-admin">
  {notice&&<p className="admin-notice" role="status">{notice}</p>}
  {error&&<p className="admin-notice" role="alert">{error}</p>}
  {editing?
   <form className="editor rp-work-editor" onSubmit={save}>
    <div className="editor-heading"><h2>{editing==='new'?'Новая работа':'Редактировать работу'}</h2><button type="button" aria-label="Закрыть редактор" onClick={()=>setEditing(null)} disabled={busy}><X size={21}/></button></div>
    <label>Название работы<input required minLength={2} maxLength={180} value={form.title} placeholder="Например, кухня с фасадами под дуб" onChange={e=>setForm({...form,title:e.target.value})}/></label>
    <div className="editor-row">
     <label>Категория<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
     <label>Город (необязательно)<input value={form.city} maxLength={100} placeholder="Например, Грозный" onChange={e=>setForm({...form,city:e.target.value})}/></label>
    </div>
    <div className="editor-row">
     <label>Размеры (необязательно)<input value={form.dimensions} maxLength={180} placeholder="Например, 300 × 60 × 240 см" onChange={e=>setForm({...form,dimensions:e.target.value})}/></label>
     <label>Материалы (необязательно)<input value={form.materials} maxLength={250} placeholder="Например, ЛДСП, МДФ" onChange={e=>setForm({...form,materials:e.target.value})}/></label>
    </div>
    <label>Описание<textarea rows={4} value={form.description} maxLength={3000} placeholder="Опишите выполненный проект…" onChange={e=>setForm({...form,description:e.target.value})}/></label>
    <div className="rp-admin-photos">
     <label>Фотографии работы (до 20)<input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={uploadPhotos}/></label>
     <small>Первое фото будет обложкой. Можно выбрать несколько снимков сразу.</small>
     {uploadStatus&&<p role="status">{uploadStatus}</p>}
     {workImages(form).length>0&&<div className="rp-admin-photos-grid">{workImages(form).map((src,i)=><div className="rp-admin-photo" key={src+'-'+i}>
      <img src={src} alt={'Фотография '+(i+1)} loading="lazy"/>
      <span>{i===0?'Обложка':'Фото '+(i+1)}</span>
      <div className="rp-admin-photo-buttons">
       {i>0&&<button type="button" disabled={busy} title="Сделать обложкой" onClick={()=>movePhoto(i,0)}>Главное</button>}
       <button type="button" disabled={busy||i===0} aria-label="Переместить фото влево" onClick={()=>movePhoto(i,i-1)}><ArrowLeft size={15}/></button>
       <button type="button" disabled={busy||i===workImages(form).length-1} aria-label="Переместить фото вправо" onClick={()=>movePhoto(i,i+1)}><ArrowRight size={15}/></button>
       <button type="button" disabled={busy} aria-label="Удалить фото из галереи" onClick={()=>removePhoto(i)}><X size={15}/></button>
      </div>
     </div>)}</div>}
    </div>
    <div className="editor-row">
     <label>Порядок показа<input type="number" min={0} max={9999} value={form.sort_order} onChange={e=>setForm({...form,sort_order:e.target.value})}/></label>
     <label className="rp-admin-published"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/><span>Опубликовать работу</span></label>
    </div>
    <div className="rp-admin-editor-actions"><button className="btn-dark" type="submit" disabled={busy}>{busy?'Сохраняем…':'Сохранить работу'} <Check size={16}/></button><button className="btn-outline" type="button" disabled={busy} onClick={()=>setEditing(null)}>Отмена</button></div>
   </form>:
   <div>
    <div className="rp-admin-head"><div><h2>Наши работы</h2><p>Фотографии выполненных проектов. Покупателям видны только опубликованные работы.</p></div><button type="button" className="btn-dark" onClick={()=>startEdit(null)}><Plus size={16}/> Добавить работу</button></div>
    {loading?<p className="rp-admin-state">Загружаем работы…</p>:works.length===0?<div className="rp-admin-empty"><ImagePlus size={29}/><p>Пока нет ни одной работы.</p><button type="button" onClick={()=>startEdit(null)}>Добавить первый проект <ArrowRight size={16}/></button></div>:
    <div className="rp-admin-list">{works.map(work=><article key={work.id} className="rp-admin-list-item">
     <div className="rp-admin-list-image">{work.image_url?<img src={work.image_url} alt="" loading="lazy"/>:<Images size={29}/>}</div>
     <div className="rp-admin-list-info"><b>{work.title}</b><span>{work.category} · {workImages(work).length} фото</span><span>{work.active?'Опубликовано':'Черновик'}</span></div>
     <div className="rp-admin-list-actions"><button type="button" onClick={()=>startEdit(work)}><Edit3 size={16}/> Изменить</button><button type="button" className="rp-admin-delete" onClick={()=>{setConfirmDelete(work.id);setNotice('')}}><Trash2 size={16}/> Удалить</button></div>
     {confirmDelete===work.id&&<div className="admin-order-delete-confirm rp-admin-delete-confirm" role="group" aria-label={'Подтверждение удаления '+work.title}>
      <p>Удалить работу «{work.title}» из портфолио? Это действие нельзя отменить.</p>
      <div className="admin-order-delete-buttons"><button type="button" disabled={busy} onClick={()=>setConfirmDelete(null)}>Отмена</button><button type="button" className="admin-order-delete-approve" disabled={busy} onClick={()=>deleteWork(work.id)}>{busy?'Удаляем…':'Да, удалить'}</button></div>
     </div>}
    </article>)}</div>}
   </div>
  }
 </section>;
}
