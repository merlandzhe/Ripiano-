
import React, {useEffect,useMemo,useRef,useState} from 'react';
import {createClient} from '@supabase/supabase-js';
import FurnitureConstructor,{FurniturePreview,FurnitureDetails} from './FurnitureConstructor.jsx';
import {PortfolioPage,PortfolioAdmin} from './Portfolio.jsx';
import {PrivacyConsent,PrivacyPage,CONSENT_VERSION} from './Privacy.jsx';
import {Search, Heart, ShoppingBag, Menu, X, ArrowLeft, ArrowRight, SlidersHorizontal, ChevronDown, Plus, Minus, Trash2, Edit3, LogOut, Package, ClipboardList, Upload, Sparkles, Check, Mail, UserRound, LayoutGrid, ArrowUp, ArrowDown, GripVertical, MapPin, MessageCircle, Instagram, Layers, Images} from 'lucide-react';

const supabase=createClient('https://wydiooorgnigobqscnmz.supabase.co','sb_publishable_bSNTmCCrrKMU2Em_02WszQ_DB-tXTHj',{auth:{persistSession:true,autoRefreshToken:true}});
const money=n=>n==null?'По запросу':new Intl.NumberFormat('ru-RU').format(Number(n))+' ₽';

/** Generate a URL-safe product slug from a Russian or Latin product name. */
function makeProductSlug(name){
 const latin={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'};
 const value=Array.from(String(name||'').trim().toLowerCase()).map(char=>latin[char]??char).join('')
  .normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
 return value.slice(0,72).replace(/-+$/,'')||'tovar';
}

const categories=['Все','Комплекты мебели','Кухни','Комоды','Прикроватные тумбы','Шкафы','Гардеробные','Столы','Стеллажи','Журнальные столики','Настенные полки','Вешалки'];
const ripianoContacts={
 whatsapp:'https://wa.me/79651003900',
 instagram:'https://www.instagram.com/ripiano_shop/',
 phone:'+7 (965) 100-39-00',
 address:'Чеченская Республика, с. Толстой-Юрт, посёлок №2, 41'
};
function Photo({product,className='',style={}}){
 return <div className={'photo '+className} style={style}><img src={product.image_url||'/images/no-photo.svg'} alt={product.name} loading="lazy" onError={e=>{if(!e.currentTarget.src.endsWith('no-photo.svg'))e.currentTarget.src='/images/no-photo.svg'}}/></div>;
}
function ProductGallery({product}){
 const images=[product.image_url,...(Array.isArray(product.gallery)?product.gallery:[])].filter(Boolean);
 const [current,setCurrent]=useState(images[0]||'');
 useEffect(()=>setCurrent(images[0]||''),[product.id,product.image_url]);
 return <div className="detail-gallery"><Photo product={{...product,image_url:current}} className="detail-photo"/>{images.length>1&&<div className="detail-thumbnails">{images.map((src,i)=><button type="button" key={src+i} className={src===current?'selected':''} onClick={()=>setCurrent(src)} aria-label={'Фото '+(i+1)}><img src={src} loading="lazy" alt={product.name+' — фото '+(i+1)}/></button>)}</div>}</div>;
}

function FeaturedCarousel({products}){
 const trackRef=useRef(null);
 const [position,setPosition]=useState({index:0,canPrev:false,canNext:false});
 useEffect(()=>{
  const track=trackRef.current;
  if(!track)return;
  const sync=()=>{
   const first=track.querySelector('.featured-card');
   const gap=parseFloat(window.getComputedStyle(track).columnGap)||0;
   const step=first?first.getBoundingClientRect().width+gap:1;
   const max=Math.max(0,track.scrollWidth-track.clientWidth);
   const index=Math.min(products.length-1,Math.max(0,Math.round(track.scrollLeft/step)));
   setPosition(prev=>prev.index===index&&prev.canPrev===(track.scrollLeft>2)&&prev.canNext===(track.scrollLeft<max-2)?prev:{index,canPrev:track.scrollLeft>2,canNext:track.scrollLeft<max-2});
  };
  track.scrollLeft=0;
  sync();
  track.addEventListener('scroll',sync,{passive:true});
  window.addEventListener('resize',sync);
  const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(sync);
  observer?.observe(track);
  return ()=>{track.removeEventListener('scroll',sync);window.removeEventListener('resize',sync);observer?.disconnect()};
 },[products.length]);
 const slide=direction=>{
  const track=trackRef.current;
  const card=track?.querySelector('.featured-card');
  if(!track||!card)return;
  const gap=parseFloat(window.getComputedStyle(track).columnGap)||0;
  const step=card.getBoundingClientRect().width+gap;
  track.scrollBy({left:direction*step,behavior:'smooth'});
 };
 if(!products.length)return null;
 return <section className="gallery-top catalog-carousel" aria-label="Подборка мебели RIPIANO">
  <div className="gallery-caption carousel-heading">
   <span>RIPIANO / КАТАЛОГ</span>
   <div className="carousel-navigation">
    <span className="carousel-counter">{String(position.index+1).padStart(2,'0')} / {String(products.length).padStart(2,'0')}</span>
    <button type="button" aria-label="Предыдущий товар" disabled={!position.canPrev} onClick={()=>slide(-1)}><ArrowLeft size={17}/></button>
    <button type="button" aria-label="Следующий товар" disabled={!position.canNext} onClick={()=>slide(1)}><ArrowRight size={17}/></button>
   </div>
  </div>
  <div className="featured-scroll" ref={trackRef} role="region" tabIndex={0} aria-label="Все товары, листайте горизонтально" onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();slide(1)}else if(e.key==='ArrowLeft'){e.preventDefault();slide(-1)}}}>
   {products.map(p=><button type="button" className="featured-card" key={p.id} onClick={()=>toRoute('/product/'+p.slug)} aria-label={p.name+', '+money(p.price)}>
    <Photo product={p} className="featured-photo"/>
    <span className="featured-info"><span className="featured-name">{p.name}</span><span className="featured-price">{money(p.price)}</span></span>
   </button>)}
  </div>
 </section>;
}

function toRoute(path){history.pushState({},'',path);window.dispatchEvent(new PopStateEvent('popstate'));window.scrollTo({top:0,behavior:'instant'});}
function App(){
 const [products,setProducts]=useState([]),[loading,setLoading]=useState(true),[category,setCategory]=useState('Все'),[query,setQuery]=useState(''),[sort,setSort]=useState('featured');
 const [route,setRoute]=useState(location.pathname),[menu,setMenu]=useState(false),[search,setSearch]=useState(false);
 const [cart,setCart]=useState(()=>{try{return JSON.parse(localStorage.getItem('ripiano_cart')||'{}')}catch{return {}}});
 const [cartOpen,setCartOpen]=useState(false),[favorites,setFavorites]=useState(()=>{try{return JSON.parse(localStorage.getItem('ripiano_favorites')||'[]')}catch{return []}});
 const [session,setSession]=useState(null);
 async function fetchProducts(){const {data,error}=await supabase.from('ripiano_products').select('*').order('sort_order',{ascending:true});if(!error)setProducts(data||[]);else console.error(error);setLoading(false)}
 useEffect(()=>{fetchProducts();supabase.auth.getSession().then(({data})=>setSession(data.session));const {data:sub}=supabase.auth.onAuthStateChange((_event,s)=>setSession(s));const onPop=()=>setRoute(location.pathname);addEventListener('popstate',onPop);return ()=>{sub.subscription.unsubscribe();removeEventListener('popstate',onPop)}},[]);
 useEffect(()=>localStorage.setItem('ripiano_cart',JSON.stringify(cart)),[cart]);
 useEffect(()=>localStorage.setItem('ripiano_favorites',JSON.stringify(favorites)),[favorites]);
 function addCart(id){setCart(c=>({...c,[id]:(c[id]||0)+1}));setCartOpen(true)}
 function adjust(id,d){setCart(c=>{const n={...c};n[id]=Math.max(0,(n[id]||0)+d);if(!n[id])delete n[id];return n})}
 function toggleFavorite(id){setFavorites(f=>f.includes(id)?f.filter(x=>x!==id):[...f,id])}
 const visible=useMemo(()=>{let list=products.filter(p=>p.active);if(category!=='Все')list=list.filter(p=>p.category===category);if(query.trim())list=list.filter(p=>(p.name+' '+p.category).toLowerCase().includes(query.trim().toLowerCase()));if(sort==='price-asc')list.sort((a,b)=>(a.price??Infinity)-(b.price??Infinity));if(sort==='price-desc')list.sort((a,b)=>(b.price??-1)-(a.price??-1));return list},[products,category,query,sort]);
 const entries=Object.entries(cart).map(([id,quantity])=>({product:products.find(p=>p.id===id),quantity})).filter(x=>x.product?.active);
 const count=entries.reduce((v,x)=>v+x.quantity,0);
 const total=entries.reduce((v,x)=>v+(Number(x.product.price)||0)*x.quantity,0);
 const showCatalog=route==='/'||route==='/catalog'||route==='/favorites';
 const selected=route.startsWith('/product/')?products.find(p=>p.slug===route.split('/')[2]&&p.active):null;
 return <div className="site">
 <header className="header"><div className="header-inner">
   <nav className="desktop-nav"><button onClick={()=>{setCategory('Все');toRoute('/catalog')}}>Каталог</button><button onClick={()=>{setCategory('Кухни');toRoute('/catalog')}}>Коллекции</button><button onClick={()=>toRoute('/constructor')}>На заказ</button><button onClick={()=>toRoute('/works')}>Наши работы</button><button onClick={()=>toRoute('/about')}>О нас</button></nav>
   <button className="mobile-menu" aria-label="Меню" onClick={()=>setMenu(!menu)}>{menu?<X size={21}/>:<Menu size={21}/>}</button>
   <button className="logo" onClick={()=>{setCategory('Все');toRoute('/')}}>RIPIANO<span className="logo-dot">.</span></button>
   <div className="header-actions">
    <button title="Поиск" onClick={()=>{toRoute('/catalog');setSearch(!search)}}><Search size={19}/></button>
    <button title="Избранное" onClick={()=>toRoute('/favorites')}><Heart size={19} fill={route==='/favorites'?'currentColor':'none'}/></button>
    <button title="Корзина" className="bag-button" onClick={()=>setCartOpen(true)}><ShoppingBag size={19}/>{count>0&&<span className="bag-counter">{count}</span>}</button>
   </div>
 </div>{menu&&<nav className="mobile-nav">{['Все',...categories.slice(1)].map(c=><button key={c} onClick={()=>{setCategory(c);setMenu(false);toRoute('/catalog')}}>{c}</button>)}<button onClick={()=>{setMenu(false);toRoute('/works')}}>Наши работы</button><button onClick={()=>{setMenu(false);toRoute('/constructor')}}>Конструктор на заказ</button><button onClick={()=>{setMenu(false);toRoute('/admin')}}>Кабинет владельца</button></nav>}
 {search&&showCatalog&&<div className="searchbar"><Search size={18}/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск по каталогу"/><button onClick={()=>{setQuery('');setSearch(false)}}><X size={18}/></button></div>}
 </header>
 {showCatalog?<main>
  <FeaturedCarousel products={products.filter(p=>p.active)}/>
  <section className="catalog-shell" id="catalog">
   <div className="catalog-entry-row">
    <div className="breadcrumbs"><button onClick={()=>toRoute('/')}>Главная</button> / Каталог</div>
    <button type="button" className="catalog-constructor-link" onClick={()=>toRoute('/constructor')}>Конструктор на заказ</button>
   </div>
   <div className="catalog-intro"><h1>{route==='/favorites'?'ИЗБРАННОЕ':'КАТАЛОГ'}</h1><p>Современная мебель для<br/>пространства, в котором хочется жить.</p></div>
   <div className="filters">
    <div className="category-nav"><select aria-label="Категория" value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(x=><option key={x}>{x}</option>)}</select><span> / КОЛЛЕКЦИЯ</span></div>
    <div className="filter-right"><button onClick={()=>setSearch(!search)}><SlidersHorizontal size={14}/> ФИЛЬТР</button><select aria-label="Сортировка" value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">ПО УМОЛЧАНИЮ</option><option value="price-asc">СНАЧАЛА ДЕШЕВЛЕ</option><option value="price-desc">СНАЧАЛА ДОРОЖЕ</option></select></div>
   </div>
   {loading?<div className="empty-state">Загружаем каталог…</div>:<div className="products-grid mosaic-grid">{visible.filter(p=>route!=='/favorites'||favorites.includes(p.id)).map((p,i)=><article key={p.id} className={'product-tile mosaic-tile-'+(i%8)} style={{gridRow:Math.floor(i/8)*6+[1,1,2,3,4,4,5,6][i%8]}}>
    <button className="product-image-btn" onClick={()=>toRoute('/product/'+p.slug)}><Photo product={p}/></button>
    <div className="product-meta"><button onClick={()=>toRoute('/product/'+p.slug)}>{p.name}</button><span>{money(p.price)}</span></div>
    <div className="tile-actions"><button aria-label="Добавить в избранное" onClick={()=>toggleFavorite(p.id)}><Heart size={16} fill={favorites.includes(p.id)?'currentColor':'none'}/></button><button aria-label="В корзину" onClick={()=>addCart(p.id)}><Plus size={18}/></button></div>
   </article>)}</div>}
   {!loading&&(!visible.length||route==='/favorites'&&!favorites.length)&&<div className="empty-state">В этой категории пока нет товаров.</div>}
   <p className="catalog-count">ПОКАЗАНО {route==='/favorites'?favorites.length:visible.length} ИЗ {products.filter(p=>p.active).length} ТОВАРОВ</p>
   <div className="catalog-bespoke">
    <div><span className="eyebrow">RIPIANO / МЕБЕЛЬ НА ЗАКАЗ</span><h2>Мебель по вашим размерам.</h2><p>Создайте шкаф, комод, стеллаж или письменный стол по своим размерам. Покажем эскиз и рассчитаем изготовление.</p></div>
    <button className="btn-dark" onClick={()=>toRoute('/constructor')}>Открыть конструктор <ArrowRight size={17}/></button>
   </div>
  </section>
 </main>:selected?<main className="detail-main"><button className="back-link" onClick={()=>toRoute('/catalog')}><ArrowLeft size={17}/> Вернуться в каталог</button><div className="detail-grid"><ProductGallery product={selected}/><div className="detail-info"><span className="eyebrow">RIPIANO / {selected.category}</span><h1>{selected.name}</h1><div className="detail-price">{money(selected.price)}</div><p>{selected.description}</p>{selected.specifications?.dimensions&&<div className="spec-row"><span>Размеры</span><span>{selected.specifications.dimensions}</span></div>}<div className="detail-actions"><button className="btn-dark" onClick={()=>addCart(selected.id)}>В корзину <ShoppingBag size={17}/></button><button className="btn-icon" title="В избранное" onClick={()=>toggleFavorite(selected.id)}><Heart size={20} fill={favorites.includes(selected.id)?'currentColor':'none'}/></button></div><p className="tiny-note">Стоимость и наличие уточняются при оформлении заказа.</p>{selected.category==='Шкафы'&&<button type="button" className="detail-custom-link" onClick={()=>toRoute('/constructor')}>Нужен другой размер? Создать на заказ <ArrowRight size={15}/></button>}</div></div></main>
 :route==='/admin'?<Admin session={session} refresh={fetchProducts}/>
 :route==='/constructor'?<FurnitureConstructor supabase={supabase}/>
 :route==='/works'?<PortfolioPage supabase={supabase} onNavigate={toRoute}/>
 :route==='/privacy-policy'?<PrivacyPage type="policy" onNavigate={toRoute}/>
 :route==='/personal-data-consent'?<PrivacyPage type="consent" onNavigate={toRoute}/>
 :route==='/about'?<main className="about-main ripiano-about">
  <span className="eyebrow">RIPIANO / О НАС</span>
  <h1>Мебель для вашего пространства.</h1>
  <p>RIPIANO — корпусная мебель от производителя. Готовые изделия в наличии и мебель под заказ для дома и бизнеса.</p>
  <button className="btn-dark" onClick={()=>toRoute('/catalog')}>Смотреть каталог <ArrowRight size={16}/></button>
  <section className="ripiano-contact-section" aria-label="Контакты RIPIANO">
    <div className="ripiano-contact-intro"><span className="eyebrow">RIPIANO / КОНТАКТЫ</span><h2>Приходите в магазин<br/>или напишите нам.</h2></div>
    <div className="ripiano-contact-info">
      <div className="ripiano-contact-detail"><MapPin size={21}/><div><b>Адрес магазина</b><span>{ripianoContacts.address}</span></div></div>
      <div className="ripiano-contact-detail"><MessageCircle size={21}/><div><b>WhatsApp</b><a href={ripianoContacts.whatsapp} target="_blank" rel="noopener noreferrer">{ripianoContacts.phone}</a><small>Напишите — отправим каталог</small></div></div>
      <div className="ripiano-contact-detail"><Instagram size={21}/><div><b>Instagram</b><a href={ripianoContacts.instagram} target="_blank" rel="noopener noreferrer">@ripiano_shop</a></div></div>
      <div className="ripiano-contact-links"><a className="btn-dark" href={ripianoContacts.whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={17}/> Написать в WhatsApp <ArrowRight size={16}/></a><a className="btn-outline" href={ripianoContacts.instagram} target="_blank" rel="noopener noreferrer"><Instagram size={17}/> Наш Instagram</a></div>
    </div>
  </section>
 </main>
 :<main className="empty-state"><button onClick={()=>toRoute('/')}>На главную</button></main>}
 <footer className="footer ripiano-footer">
  <div className="ripiano-footer-brand">
   <div className="footer-brand">RIPIANO</div>
   <small>Корпусная мебель от производителя.<br/>В наличии и под заказ.</small>
  </div>
  <nav className="ripiano-footer-nav" aria-label="Навигация внизу сайта">
   <button onClick={()=>toRoute('/catalog')}>Каталог</button>
   <button onClick={()=>toRoute('/about')}>О нас</button>
   <button onClick={()=>toRoute('/works')}>Наши работы</button>
   <button onClick={()=>toRoute('/constructor')}>На заказ</button>
   <button onClick={()=>toRoute('/admin')}>Владельцу</button>
   <button onClick={()=>toRoute('/privacy-policy')}>Политика обработки данных</button>
   <button onClick={()=>toRoute('/personal-data-consent')}>Согласие на обработку данных</button>
  </nav>
  <div className="ripiano-footer-contacts">
   <b>Контакты</b>
   <span className="ripiano-footer-address">{ripianoContacts.address}</span>
   <a href={ripianoContacts.whatsapp} target="_blank" rel="noopener noreferrer"><span>WhatsApp</span><span>{ripianoContacts.phone}</span></a>
   <a href={ripianoContacts.instagram} target="_blank" rel="noopener noreferrer"><span>Instagram</span><span>@ripiano_shop</span></a>
  </div>
  <span className="ripiano-footer-copyright">© RIPIANO 2026</span>
 </footer>
 {cartOpen&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setCartOpen(false)}}><CartPanel entries={entries} count={count} total={total} adjust={adjust} onClose={()=>setCartOpen(false)} onDone={()=>{setCart({});setCartOpen(false)}}/></div>}
 </div>
}
function CartPanel({entries,count,total,adjust,onClose,onDone}){
 const [step,setStep]=useState('items');
 const scroller=useRef(null);
 useEffect(()=>{
  const previous=document.body.style.overflow;
  document.body.style.overflow='hidden';
  return ()=>{document.body.style.overflow=previous};
 },[]);
 useEffect(()=>{if(scroller.current)scroller.current.scrollTop=0},[step]);
 return <aside className="cart-drawer cart-panel" role="dialog" aria-modal="true" aria-label={step==='items'?'Корзина':'Оформление заказа'}>
  <header className="cart-panel-header">
   <div className="cart-panel-title">
    {step==='checkout'&&<button type="button" className="cart-back" onClick={()=>setStep('items')} aria-label="Назад к товарам"><ArrowLeft size={21}/></button>}
    <h2>{step==='items'?'КОРЗИНА':'ОФОРМЛЕНИЕ'} <span>({count})</span></h2>
   </div>
   <button type="button" onClick={onClose} aria-label="Закрыть корзину"><X size={23}/></button>
  </header>
  {step==='items'?<>
   <div className="cart-lines cart-panel-lines" ref={scroller}>
    {entries.length?entries.map(({product:p,quantity})=><div className="cart-line" key={p.id}>
     <Photo product={p}/>
     <div className="cart-line-data">
      <b>{p.name}</b>
      <span>{money(p.price)}</span>
      <div className="quantity">
       <button type="button" aria-label={'Уменьшить количество '+p.name} onClick={()=>adjust(p.id,-1)}><Minus size={14}/></button>
       <span>{quantity}</span>
       <button type="button" aria-label={'Увеличить количество '+p.name} onClick={()=>adjust(p.id,1)}><Plus size={14}/></button>
      </div>
     </div>
     <button type="button" className="remove" aria-label={'Удалить '+p.name+' из корзины'} title="Удалить" onClick={()=>adjust(p.id,-quantity)}><Trash2 size={18}/></button>
    </div>):<div className="empty-cart">Корзина пока пуста.<br/>Добавьте мебель из каталога.</div>}
   </div>
   {entries.length>0&&<div className="cart-panel-summary">
    <div className="checkout-total"><span>Итого</span><strong>{money(total)}</strong></div>
    {entries.some(x=>x.product.price===null)&&<p className="quote-warning">Есть товары с ценой по запросу. Окончательную стоимость подтвердит менеджер.</p>}
    <button className="btn-dark cart-panel-next" type="button" onClick={()=>setStep('checkout')}>Оформить заказ <ArrowRight size={18}/></button>
    <small>Оплата не списывается. Менеджер свяжется с вами.</small>
   </div>}
  </>:<div className="cart-panel-checkout" ref={scroller}>
   {entries.length>0?<Checkout entries={entries} total={total} onDone={onDone}/>:<div className="empty-cart">Корзина пуста. <button type="button" onClick={()=>setStep('items')}>Вернуться к товарам</button></div>}
  </div>}
 </aside>;
}
function Checkout({entries,total,onDone}){
 const [name,setName]=useState(''),[phone,setPhone]=useState(''),[address,setAddress]=useState(''),[note,setNote]=useState(''),[consent,setConsent]=useState(false),[sending,setSending]=useState(false),[done,setDone]=useState(''),[error,setError]=useState('');
 async function submit(e){
  e.preventDefault();
  if(sending)return;
  if(!consent){setError('Подтвердите согласие на обработку персональных данных.');return;}
  setSending(true);setError('');
  try{
   const {data,error:err}=await supabase.rpc('ripiano_place_order_with_consent',{
    p_name:name,p_phone:phone,p_address:address,p_note:note,
    p_items:entries.map(x=>({product_id:x.product.id,quantity:x.quantity})),
    p_consent_version:CONSENT_VERSION
   });
   if(err)throw err;
   setDone(data);
  }catch(err){setError('Не удалось отправить заявку. Проверьте данные и попробуйте ещё раз.');console.error(err)}
  finally{setSending(false)}
 }
 return <div className="checkout"><div className="checkout-total"><span>Итого</span><strong>{money(total)}</strong></div>{entries.some(x=>x.product.price===null)&&<p className="quote-warning">Часть товаров — по запросу. Финальную сумму подтвердит менеджер.</p>}{done?<div className="checkout-success"><Check size={28}/><b>Заявка отправлена</b><span>Мы свяжемся с вами для подтверждения.</span><button className="btn-dark" onClick={onDone}>Готово</button></div>:<form onSubmit={submit}><h3>Оформить заказ</h3><input required maxLength={120} minLength={2} placeholder="Ваше имя" value={name} onChange={e=>setName(e.target.value)}/><input required type="tel" minLength={7} maxLength={35} placeholder="Телефон" value={phone} onChange={e=>setPhone(e.target.value)}/><input maxLength={400} placeholder="Город / адрес (по желанию)" value={address} onChange={e=>setAddress(e.target.value)}/><textarea maxLength={1500} placeholder="Комментарий к заказу" rows={2} value={note} onChange={e=>setNote(e.target.value)}/><PrivacyConsent checked={consent} onChange={setConsent} disabled={sending} scope="моего заказа"/>{error&&<p className="error">{error}</p>}<button className="btn-dark" disabled={sending}>{sending?'Отправляем…':'Отправить заявку'} <ArrowRight size={17}/></button><small>Оплата не списывается. Заказ подтвердит менеджер.</small></form>}</div>;
}

function CustomProjects({projects,onStatus,onDelete,error}){
 const statusLabels={new:'Новый',contacted:'Связались',quoted:'Рассчитано',completed:'Завершён',cancelled:'Отменён'};
 const [pending,setPending]=useState(null);
 const [confirmDeleteId,setConfirmDeleteId]=useState(null);
 const [deletingId,setDeletingId]=useState(null);
 const update=async(id,status)=>{
  setPending(id);
  try{await onStatus(id,status)}finally{setPending(null)}
 };
 const remove=async(id)=>{
  if(deletingId||confirmDeleteId!==id)return;
  setDeletingId(id);
  try{
   const deleted=await onDelete(id);
   if(deleted)setConfirmDeleteId(null);
  }finally{setDeletingId(null)}
 };
 return <div className="wc-admin-projects">
  <p className="wc-admin-info">Сюда поступают проекты шкафов, комодов, стеллажей и столов. Цены рассчитывает производитель после проверки эскиза и материалов.</p>
  {error&&<p className="admin-notice">{error}</p>}
  {projects.length===0?<div className="empty-state">Заявок на изготовление мебели пока нет.</div>
  :projects.map(item=><article className="admin-order wc-admin-item" key={item.id}>
    <div className="order-top"><b>{({wardrobe:'Шкаф',dresser:'Комод',shelf:'Стеллаж',desk:'Стол'})[item.configuration?.kind]||'Шкаф'} · проект №{item.id.slice(0,8).toUpperCase()}</b><span>{new Date(item.created_at).toLocaleString('ru-RU')}</span></div>
    <div className="wc-admin-customer"><b>{item.customer_name}</b><a href={'tel:'+item.phone}>{item.phone}</a></div>
    {item.note&&<p>Пожелания: {item.note}</p>}{item.consent_at&&<p className="rp-admin-consent-status">Согласие на обработку данных: {new Date(item.consent_at).toLocaleString('ru-RU')} · {item.consent_version}</p>}
    <div className="wc-admin-project-body"><FurniturePreview config={item.configuration}/><FurnitureDetails config={item.configuration}/></div>
    <div className="wc-admin-project-bottom"><b>Стоимость: по запросу</b>
      <label>Статус <select value={item.status} disabled={pending===item.id||!!deletingId} onChange={e=>update(item.id,e.target.value)}>
        {Object.entries(statusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}
      </select></label>
    </div>
    {confirmDeleteId!==item.id?
      <div className="wc-admin-project-actions">
       <button type="button" className="admin-order-delete-trigger" disabled={!!deletingId} onClick={()=>setConfirmDeleteId(item.id)}><Trash2 size={16}/> Удалить проект</button>
      </div>
    :<div className="admin-order-delete-confirm" role="group" aria-label={'Подтвердить удаление проекта '+item.id.slice(0,8)}>
      <p>Удалить проект №{item.id.slice(0,8).toUpperCase()}? Заявка, размеры и контакты клиента будут удалены без возможности восстановления.</p>
      <div className="admin-order-delete-buttons">
       <button type="button" className="admin-order-delete-cancel" disabled={!!deletingId} onClick={()=>setConfirmDeleteId(null)}>Отмена</button>
       <button type="button" className="admin-order-delete-approve" disabled={!!deletingId} onClick={()=>remove(item.id)}>{deletingId===item.id?'Удаляем…':'Да, удалить'}</button>
      </div>
     </div>}
  </article>)}
 </div>;
}

function Admin({session,refresh}){
 const [authorized,setAuthorized]=useState(false),[checking,setChecking]=useState(true),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[authMessage,setAuthMessage]=useState(''),[busy,setBusy]=useState(false);
 const [tab,setTab]=useState('products'),[products,setProducts]=useState([]),[orders,setOrders]=useState([]),[projects,setProjects]=useState([]),[projectsError,setProjectsError]=useState(''),[editing,setEditing]=useState(null),[form,setForm]=useState(emptyForm()),[notice,setNotice]=useState(''),[uploadProgress,setUploadProgress]=useState('');
 const [ordering,setOrdering]=useState(false),[orderIds,setOrderIds]=useState([]),[orderSaving,setOrderSaving]=useState(false),[draggingId,setDraggingId]=useState(null);
 const [deleteConfirmId,setDeleteConfirmId]=useState(null),[deletingOrderId,setDeletingOrderId]=useState(null);
 const arrangedProducts=ordering?orderIds.map(id=>products.find(p=>p.id===id)).filter(Boolean):products;
 useEffect(()=>{let cancelled=false;async function check(){setChecking(true);if(!session){setAuthorized(false);setChecking(false);return}const {data}=await supabase.from('ripiano_admins').select('user_id').eq('user_id',session.user.id).maybeSingle();if(cancelled)return;setAuthorized(!!data);setChecking(false)}check();return()=>{cancelled=true}},[session?.user?.id]);
 useEffect(()=>{if(authorized){loadProducts();loadOrders();loadProjects()}},[authorized]);
 async function loadProducts(){const {data,error}=await supabase.from('ripiano_products').select('*').order('sort_order').order('id');if(!error)setProducts(data||[]);return !error}
 async function loadOrders(){const {data,error}=await supabase.from('ripiano_orders').select('*,ripiano_order_items(*)').order('created_at',{ascending:false});if(!error)setOrders(data||[])}

 async function loadProjects(){
  const {data,error}=await supabase.from('ripiano_custom_orders').select('*').order('created_at',{ascending:false});
  if(error){console.error('RIPIANO projects load',error);setProjectsError('Не удалось загрузить заявки конструктора.');}
  else{setProjects(data||[]);setProjectsError('');}
 }
 async function changeProjectStatus(id,status){
  const {data,error}=await supabase.from('ripiano_custom_orders').update({status}).eq('id',id).select('id,status').maybeSingle();
  if(error||!data){setProjectsError('Не получилось изменить статус заявки.');return;}
  setProjects(previous=>previous.map(p=>p.id===id?{...p,status:data.status}:p));
  setProjectsError('');
 }
 async function deleteCustomProject(id){
  setProjectsError('');
  try{
   const {data,error}=await supabase.from('ripiano_custom_orders').delete().eq('id',id).select('id').maybeSingle();
   if(error)throw error;
   if(!data)throw new Error('Проект не найден или нет прав на удаление');
   setProjects(current=>current.filter(p=>p.id!==id));
   return true;
  }catch(error){
   console.error('RIPIANO delete custom project',error);
   setProjectsError('Не удалось удалить проект: '+(error.message||'попробуйте ещё раз'));
   return false;
  }
 }
 async function authenticate(e){e.preventDefault();setAuthMessage('');setBusy(true);try{const {error}=await supabase.auth.signInWithPassword({email,password});setAuthMessage(error?error.message:'Вход выполнен.')}catch(error){setAuthMessage(error.message||'Не удалось войти. Попробуйте ещё раз.')}finally{setBusy(false)}}
 function startEdit(p){
 setEditing(p?.id||'new');
 setForm(p?{name:p.name,category:p.category,price:p.price??'',description:p.description||'',
 image_url:p.image_url||'',gallery:Array.isArray(p.gallery)?p.gallery.filter(x=>typeof x==='string'&&x.trim()):[],
 dimensions:p.specifications?.dimensions||'',active:p.active,sort_order:p.sort_order??100,specifications:p.specifications||{}}:emptyForm());
 setNotice('');setUploadProgress('');window.scrollTo({top:0,behavior:'smooth'});
}
 async function saveProduct(e){
  e.preventDefault();
  if(busy)return;
  setBusy(true);
  setNotice('');
  const payload={name:form.name.trim(),category:form.category,price:form.price===''?null:Number(form.price),description:form.description,image_url:form.image_url,gallery:form.gallery,active:form.active,sort_order:Number(form.sort_order??100),specifications:{...form.specifications,dimensions:form.dimensions}};
  try{
   if(!payload.name){setNotice('Укажите название товара.');return;}
   let error=null;
   if(editing==='new'){
    const base=makeProductSlug(payload.name);
    const existing=new Set(products.map(p=>p.slug));
    let suffix=1;
    for(let attempt=0;attempt<30;attempt++){
     let candidate=suffix===1?base:base+'-'+suffix;
     while(existing.has(candidate)){suffix++;candidate=base+'-'+suffix;}
     const result=await supabase.from('ripiano_products').insert({...payload,slug:candidate});
     if(!result.error){error=null;break;}
     error=result.error;
     if(error.code!=='23505')break;
     existing.add(candidate);
     suffix++;
    }
   }else{
    // Keep the original URL of existing products, even if their name changes.
    const result=await supabase.from('ripiano_products').update(payload).eq('id',editing);
    error=result.error;
   }
   if(error){setNotice('Ошибка сохранения: '+error.message);return;}
   setEditing(null);
   setNotice('Товар сохранён');
   await Promise.all([loadProducts(),refresh()]);
  }catch(error){
   console.error('Product save failed',error);
   setNotice('Не удалось сохранить товар. Попробуйте ещё раз.');
  }finally{setBusy(false);}
 }

 function beginOrdering(){
  setOrderIds(products.map(p=>p.id));
  setOrdering(true);
  setDraggingId(null);
  setNotice('');
 }
 function cancelOrdering(){
  setOrdering(false);
  setOrderIds([]);
  setDraggingId(null);
 }
 function shiftProduct(id,offset){
  if(orderSaving)return;
  setOrderIds(current=>{
   const from=current.indexOf(id),to=from+offset;
   if(from<0||to<0||to>=current.length)return current;
   const next=[...current];
   [next[from],next[to]]=[next[to],next[from]];
   return next;
  });
 }
 function dropProduct(sourceId,targetId){
  if(orderSaving)return;
  setOrderIds(current=>{
   const from=current.indexOf(sourceId),to=current.indexOf(targetId);
   if(from<0||to<0||from===to)return current;
   const next=[...current];
   next.splice(from,1);
   next.splice(to,0,sourceId);
   return next;
  });
 }
 async function saveProductOrdering(){
  if(orderSaving||!ordering)return;
  if(orderIds.length!==products.length){
   setNotice('Список товаров изменился. Отмените сортировку и откройте её заново.');
   return;
  }
  if(orderIds.every((id,i)=>id===products[i].id)){
   cancelOrdering();
   setNotice('Порядок товаров не изменился.');
   return;
  }
  setOrderSaving(true);
  setNotice('');
  try{
   const {error}=await supabase.rpc('ripiano_set_product_order',{p_product_ids:orderIds});
   if(error)throw error;
   const [loaded]=await Promise.all([loadProducts(),refresh()]);
   cancelOrdering();
   setNotice(loaded?'Порядок товаров сохранён. Изменения отображаются в каталоге.':'Порядок сохранён. Обновите страницу, чтобы увидеть изменения.');
  }catch(error){
   console.error('Не удалось сохранить порядок товаров',error);
   setNotice('Не удалось сохранить порядок: '+(error.message||'попробуйте снова'));
  }finally{
   setOrderSaving(false);
  }
 }

 function photoUrls(f){return [f.image_url,...(Array.isArray(f.gallery)?f.gallery:[])].filter(x=>typeof x==='string'&&x.trim());}
 function setPhotoUrls(arr){setForm(f=>({...f,image_url:arr[0]||'',gallery:arr.slice(1)}))}
 function movePhoto(from,to){
  if(busy)return;
  const arr=photoUrls(form);
  if(to<0||to>=arr.length)return;
  const [url]=arr.splice(from,1);
  arr.splice(to,0,url);
  setPhotoUrls(arr);
 }
 function removePhoto(index){if(!busy)setPhotoUrls(photoUrls(form).filter((_,i)=>i!==index))}
 async function uploadImages(e){
  const files=Array.from(e.target.files||[]);
  e.target.value='';
  if(!files.length||busy)return;
  setNotice('');
  if(files.length+photoUrls(form).length>20){setNotice('Не более 20 фотографий на товар');return}
  if(files.some(f=>!['image/png','image/webp','image/jpeg'].includes(f.type)||f.size===0||f.size>10*1024*1024)){setNotice('Только JPG, PNG, WebP до 10 МБ каждое');return}
  setBusy(true);
  let uploaded=[],failure=null;
  for(let i=0;i<files.length;i++){
   const f=files[i];
   setUploadProgress('Загрузка '+(i+1)+' из '+files.length);
   try{
    const ext=f.type==='image/png'?'png':f.type==='image/webp'?'webp':'jpg';
    const key=crypto.randomUUID()+'.'+ext;
    const {error}=await supabase.storage.from('ripiano-products').upload(key,f,{cacheControl:'3600',contentType:f.type,upsert:false});
    if(error)throw error;
    const {data}=supabase.storage.from('ripiano-products').getPublicUrl(key);
    uploaded.push(data.publicUrl);
   }catch(err){failure=err;break}
  }
  if(uploaded.length)setForm(f=>{const all=photoUrls(f).concat(uploaded);return {...f,image_url:all[0]||'',gallery:all.slice(1)}});
  setBusy(false);setUploadProgress('');
  setNotice(failure?'Загружено '+uploaded.length+' из '+files.length+': '+(failure.message||'ошибка'):'Загружено '+uploaded.length+' фото. Нажмите «Сохранить товар» для публикации.');
 }
 async function setOrder(id,status){const {error}=await supabase.from('ripiano_orders').update({status}).eq('id',id);if(!error)loadOrders()}
 async function deleteOrder(id){
  if(deletingOrderId||deleteConfirmId!==id)return;
  setDeletingOrderId(id);
  setNotice('');
  try{
   const {data,error}=await supabase.from('ripiano_orders').delete().eq('id',id).select('id').maybeSingle();
   if(error)throw error;
   if(!data)throw new Error('Заказ не найден или нет прав на его удаление');
   setOrders(current=>current.filter(order=>order.id!==id));
   setDeleteConfirmId(null);
   setNotice('Заказ №'+id.slice(0,8).toUpperCase()+' удалён.');
   await loadOrders();
  }catch(error){
   console.error('Ошибка удаления заказа',error);
   setNotice('Не удалось удалить заказ: '+(error.message||'попробуйте ещё раз'));
  }finally{
   setDeletingOrderId(null);
  }
 }
 if(checking)return <main className="admin-main"><p>Проверка доступа…</p></main>;
 if(!session)return <main className="admin-main admin-login"><span className="eyebrow">RIPIANO / УПРАВЛЕНИЕ</span><h1>Личный кабинет</h1><p>Только для владельца магазина.</p><form onSubmit={authenticate}><input type="email" value={email} placeholder="Email" onChange={e=>setEmail(e.target.value)} required/><input type="password" minLength={6} value={password} placeholder="Пароль" onChange={e=>setPassword(e.target.value)} required/><button className="btn-dark" disabled={busy}>{busy?'Входим…':'Войти'} <ArrowRight size={16}/></button></form>{authMessage&&<p className="admin-notice">{authMessage}</p>}</main>;
 if(!authorized)return <main className="admin-main admin-login"><span className="eyebrow">RIPIANO / УПРАВЛЕНИЕ</span><h1>Доступ не назначен</h1><p>Вы вошли как {session.user.email}. Для безопасного доступа к товарам и заказам владельца нужно отдельно добавить в список администраторов в Supabase.</p><button className="btn-outline" onClick={()=>supabase.auth.signOut()}>Выйти</button></main>;
 return <main className="admin-main"><div className="admin-heading"><div><span className="eyebrow">RIPIANO / ПАНЕЛЬ ВЛАДЕЛЬЦА</span><h1>Управление магазином</h1></div><button onClick={()=>supabase.auth.signOut()} className="btn-outline"><LogOut size={16}/> Выйти</button></div><div className="admin-tabs"><button className={tab==='products'?'active':''} onClick={()=>{setTab('products');setEditing(null)}}><Package size={17}/> Товары</button><button className={tab==='orders'?'active':''} onClick={()=>{setTab('orders');setEditing(null)}}><ClipboardList size={17}/> Заказы {orders.filter(o=>o.status==='new').length>0?'('+orders.filter(o=>o.status==='new').length+')':''}</button><button className={tab==='projects'?'active':''} onClick={()=>{setTab('projects');setEditing(null);loadProjects()}}><Layers size={17}/> Проекты {projects.filter(p=>p.status==='new').length>0?'('+projects.filter(p=>p.status==='new').length+')':''}</button><button className={tab==='portfolio'?'active':''} onClick={()=>{setTab('portfolio');setEditing(null)}}><Images size={17}/> Наши работы</button></div>
 {notice&&<p className="admin-notice">{notice}</p>}
 {tab==='products'&&(editing?<form className="editor" onSubmit={saveProduct}><div className="editor-heading"><h2>{editing==='new'?'Новый товар':'Редактировать товар'}</h2><button type="button" onClick={()=>setEditing(null)}><X size={22}/></button></div><label>Название<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><div className="editor-row"><label>Категория<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.slice(1).concat('Другое').map(c=><option key={c}>{c}</option>)}</select></label><label>Цена в ₽ (пусто — по запросу)<input type="number" min="0" step="1" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label></div><label>Описание<textarea rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><label>Размеры<input value={form.dimensions} onChange={e=>setForm({...form,dimensions:e.target.value})}/></label><div className="admin-gallery-editor">
  <label>Фотографии товара (до 20)<input type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={busy} onChange={uploadImages}/></label>
  <p className="admin-gallery-help">Выберите несколько фото сразу или добавляйте постепенно. Первое фото — обложка, остальные — галерея.</p>
  {uploadProgress&&<p className="admin-gallery-progress" role="status">{uploadProgress}</p>}
  {photoUrls(form).length>0&&<div className="admin-gallery-grid">
   {photoUrls(form).map((src,i)=><div className="admin-gallery-item" key={src+'-'+i}>
    <img src={src} alt={'Фото '+(i+1)} loading="lazy"/>
    <b>{i===0?'Главное фото':'Фото '+(i+1)}</b>
    <div className="admin-gallery-actions">
     {i!==0&&<button type="button" onClick={()=>movePhoto(i,0)} disabled={busy}>На обложку</button>}
     <span className="admin-gallery-move">
      <button type="button" onClick={()=>movePhoto(i,i-1)} disabled={busy||i===0} title="Раньше" aria-label={'Раньше фото '+(i+1)}><ArrowLeft size={15}/></button>
      <button type="button" onClick={()=>movePhoto(i,i+1)} disabled={busy||i===photoUrls(form).length-1} title="Позже" aria-label={'Позже фото '+(i+1)}><ArrowRight size={15}/></button>
      <button type="button" onClick={()=>removePhoto(i)} disabled={busy} title="Удалить" aria-label={'Убрать фото '+(i+1)}><X size={15}/></button>
     </span>
    </div>
   </div>)}
  </div>}
 </div><div className="editor-row"><label>Порядок<input type="number" value={form.sort_order} onChange={e=>setForm({...form,sort_order:e.target.value})}/></label><label className="checkbox"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/> Показывать в магазине</label></div><button type="submit" className="btn-dark" disabled={busy}>{busy?'Сохраняем…':'Сохранить товар'} <Check size={18}/></button></form>:<><div className="admin-tools">
  <p>{products.length} товаров в каталоге</p>
  <div className="admin-tool-buttons">
   {ordering?<>
    <button type="button" className="btn-outline" onClick={cancelOrdering} disabled={orderSaving}>Отмена</button>
    <button type="button" className="btn-dark" onClick={saveProductOrdering} disabled={orderSaving}><Check size={17}/>{orderSaving?'Сохраняем…':'Сохранить порядок'}</button>
   </>:<>
    <button type="button" className="btn-outline" onClick={beginOrdering}><GripVertical size={17}/> Изменить порядок</button>
    <button type="button" className="btn-dark" onClick={()=>startEdit()}><Plus size={17}/> Добавить товар</button>
   </>}
  </div>
 </div>
 {ordering&&<p className="admin-reorder-hint">Меняйте порядок кнопками ↑ ↓ или перетаскивайте карточки на компьютере. Нажмите «Сохранить порядок», чтобы обновить сайт. Скрытые товары тоже присутствуют в списке.</p>}
 <div className={'admin-products'+(ordering?' admin-products-ordering':'')}>
 {arrangedProducts.map((p,i)=><div className={'admin-product'+(ordering?' admin-product-reorder':'')+(draggingId===p.id?' is-dragging':'')} key={p.id}
  draggable={ordering&&!orderSaving}
  onDragStart={e=>{if(!ordering||orderSaving)return;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',p.id);setDraggingId(p.id)}}
  onDragOver={e=>{if(ordering&&!orderSaving){e.preventDefault();e.dataTransfer.dropEffect='move'}}}
  onDrop={e=>{if(!ordering||orderSaving)return;e.preventDefault();const id=e.dataTransfer.getData('text/plain')||draggingId;if(id)dropProduct(id,p.id);setDraggingId(null)}}
  onDragEnd={()=>setDraggingId(null)}
  >
  <Photo product={p}/>
  {ordering&&<span className="admin-rank">{i+1}</span>}
  <div className="admin-product-details"><b>{p.name}</b><span>{p.category} · {p.active?'На сайте':'Скрыт'}</span></div>
  <strong>{money(p.price)}</strong>
  {ordering?<div className="admin-reorder-controls">
   <button type="button" aria-label={'Поднять '+p.name+' выше'} title="Вверх" disabled={orderSaving||i===0} onClick={()=>shiftProduct(p.id,-1)}><ArrowUp size={17}/></button>
   <button type="button" aria-label={'Опустить '+p.name+' ниже'} title="Вниз" disabled={orderSaving||i===arrangedProducts.length-1} onClick={()=>shiftProduct(p.id,1)}><ArrowDown size={17}/></button>
  </div>:<button type="button" className="admin-edit-product" aria-label={'Редактировать '+p.name} onClick={()=>startEdit(p)}><Edit3 size={18}/></button>}
 </div>)}
 </div></>)}
 {tab==='projects'&&<CustomProjects projects={projects} error={projectsError} onStatus={changeProjectStatus} onDelete={deleteCustomProject}/>}
 {tab==='portfolio'&&<PortfolioAdmin supabase={supabase}/>}
 {tab==='orders'&&<div className="admin-orders">{orders.length===0?<div className="empty-state">Заказов пока нет.</div>:orders.map(o=><div className="admin-order" key={o.id}><div className="order-top"><b>Заказ №{o.id.slice(0,8).toUpperCase()}</b><span>{new Date(o.created_at).toLocaleString('ru-RU')}</span></div><div className="order-info"><span>{o.customer_name} · <a href={'tel:'+o.phone}>{o.phone}</a></span><strong>{money(o.total)}</strong></div>{o.address&&<p>{o.address}</p>}{o.note&&<p>{o.note}</p>}{o.consent_at&&<p className="rp-admin-consent-status">Согласие на обработку данных: {new Date(o.consent_at).toLocaleString('ru-RU')} · {o.consent_version}</p>}<ul>{(o.ripiano_order_items||[]).map(it=><li key={it.id}>{it.product_name} × {it.quantity} — {money(it.unit_price)}</li>)}</ul><div className="admin-order-actions">
 <select aria-label={'Статус заказа №'+o.id.slice(0,8)} value={o.status} disabled={!!deletingOrderId} onChange={e=>setOrder(o.id,e.target.value)}><option value="new">Новый</option><option value="confirmed">Подтверждён</option><option value="completed">Выполнен</option><option value="cancelled">Отменён</option></select>
 {deleteConfirmId!==o.id&&<button type="button" className="admin-order-delete-trigger" disabled={!!deletingOrderId} onClick={()=>{setDeleteConfirmId(o.id);setNotice('')}}><Trash2 size={16}/> Удалить заказ</button>}
 </div>
 {deleteConfirmId===o.id&&<div className="admin-order-delete-confirm" role="group" aria-label={'Подтверждение удаления заказа №'+o.id.slice(0,8)}>
  <p>Удалить заказ №{o.id.slice(0,8).toUpperCase()}? Все позиции заказа тоже будут удалены. Восстановить данные нельзя.</p>
  <div className="admin-order-delete-buttons">
   <button type="button" className="admin-order-delete-cancel" disabled={!!deletingOrderId} onClick={()=>setDeleteConfirmId(null)}>Отмена</button>
   <button type="button" className="admin-order-delete-approve" disabled={!!deletingOrderId} onClick={()=>deleteOrder(o.id)}>{deletingOrderId===o.id?'Удаляем…':'Да, удалить'}</button>
  </div>
 </div>}</div>)}</div>}
 </main>;
}
function emptyForm(){return {name:'',category:'Стеллажи',price:'',description:'',image_url:'',gallery:[],dimensions:'',active:true,sort_order:100,specifications:{spriteIndex:-1}}}
export default App;
