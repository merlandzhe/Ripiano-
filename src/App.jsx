
import React, {useEffect,useMemo,useState} from 'react';
import {createClient} from '@supabase/supabase-js';
import {Search, Heart, ShoppingBag, Menu, X, ArrowLeft, ArrowRight, SlidersHorizontal, ChevronDown, Plus, Minus, Trash2, Edit3, LogOut, Package, ClipboardList, Upload, Sparkles, Check, Mail, UserRound, LayoutGrid} from 'lucide-react';

const supabase=createClient('https://wydiooorgnigobqscnmz.supabase.co','sb_publishable_bSNTmCCrrKMU2Em_02WszQ_DB-tXTHj',{auth:{persistSession:true,autoRefreshToken:true}});
const money=n=>n==null?'По запросу':new Intl.NumberFormat('ru-RU').format(Number(n))+' ₽';
const categories=['Все','Комплекты мебели','Кухни','Комоды','Прикроватные тумбы','Шкафы','Гардеробные','Столы','Стеллажи','Журнальные столики','Настенные полки','Вешалки'];
function Photo({product,className='',style={}}){
 return <div className={'photo '+className} style={style}><img src={product.image_url||'/images/no-photo.svg'} alt={product.name} loading="lazy" onError={e=>{if(!e.currentTarget.src.endsWith('no-photo.svg'))e.currentTarget.src='/images/no-photo.svg'}}/></div>;
}
function ProductGallery({product}){
 const images=[product.image_url,...(Array.isArray(product.gallery)?product.gallery:[])].filter(Boolean);
 const [current,setCurrent]=useState(images[0]||'');
 useEffect(()=>setCurrent(images[0]||''),[product.id,product.image_url]);
 return <div className="detail-gallery"><Photo product={{...product,image_url:current}} className="detail-photo"/>{images.length>1&&<div className="detail-thumbnails">{images.map((src,i)=><button type="button" key={src+i} className={src===current?'selected':''} onClick={()=>setCurrent(src)} aria-label={'Фото '+(i+1)}><img src={src} loading="lazy" alt={product.name+' — фото '+(i+1)}/></button>)}</div>}</div>;
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
   <nav className="desktop-nav"><button onClick={()=>{setCategory('Все');toRoute('/catalog')}}>Каталог</button><button onClick={()=>{setCategory('Кухни');toRoute('/catalog')}}>Коллекции</button><button onClick={()=>toRoute('/about')}>О нас</button></nav>
   <button className="mobile-menu" aria-label="Меню" onClick={()=>setMenu(!menu)}>{menu?<X size={21}/>:<Menu size={21}/>}</button>
   <button className="logo" onClick={()=>{setCategory('Все');toRoute('/')}}>RIPIANO<span className="logo-dot">.</span></button>
   <div className="header-actions">
    <button title="Поиск" onClick={()=>{toRoute('/catalog');setSearch(!search)}}><Search size={19}/></button>
    <button title="Избранное" onClick={()=>toRoute('/favorites')}><Heart size={19} fill={route==='/favorites'?'currentColor':'none'}/></button>
    <button title="Корзина" className="bag-button" onClick={()=>setCartOpen(true)}><ShoppingBag size={19}/>{count>0&&<span className="bag-counter">{count}</span>}</button>
   </div>
 </div>{menu&&<nav className="mobile-nav">{['Все',...categories.slice(1)].map(c=><button key={c} onClick={()=>{setCategory(c);setMenu(false);toRoute('/catalog')}}>{c}</button>)}<button onClick={()=>{setMenu(false);toRoute('/admin')}}>Кабинет владельца</button></nav>}
 {search&&showCatalog&&<div className="searchbar"><Search size={18}/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск по каталогу"/><button onClick={()=>{setQuery('');setSearch(false)}}><X size={18}/></button></div>}
 </header>
 {showCatalog?<main>
  <section className="gallery-top">
   <div className="gallery-caption"><span>RIPIANO / CATALOG</span><span>01 — 04</span></div>
   <div className="gallery-featured">{products.filter(p=>p.active).slice(0,4).map(p=><button key={p.id} onClick={()=>toRoute('/product/'+p.slug)} className="featured-product"><Photo product={p}/><div className="featured-details"><span>{p.name}</span><span>{money(p.price)}</span></div></button>)}</div>
  </section>
  <section className="catalog-shell" id="catalog">
   <div className="breadcrumbs"><button onClick={()=>toRoute('/')}>Главная</button> / Каталог</div>
   <div className="catalog-intro"><h1>{route==='/favorites'?'ИЗБРАННОЕ':'КАТАЛОГ'}</h1><p>Современная мебель для<br/>пространства, в котором хочется жить.</p></div>
   <div className="filters">
    <div className="category-nav"><select aria-label="Категория" value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(x=><option key={x}>{x}</option>)}</select><span> / КОЛЛЕКЦИЯ</span></div>
    <div className="filter-right"><button onClick={()=>setSearch(!search)}><SlidersHorizontal size={14}/> ФИЛЬТР</button><select aria-label="Сортировка" value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">ПО УМОЛЧАНИЮ</option><option value="price-asc">СНАЧАЛА ДЕШЕВЛЕ</option><option value="price-desc">СНАЧАЛА ДОРОЖЕ</option></select></div>
   </div>
   {loading?<div className="empty-state">Загружаем каталог…</div>:<div className="products-grid">{visible.filter(p=>route!=='/favorites'||favorites.includes(p.id)).map((p,i)=><article key={p.id} className={'product-tile tile-'+(i%11)}>
    <button className="product-image-btn" onClick={()=>toRoute('/product/'+p.slug)}><Photo product={p}/></button>
    <div className="product-meta"><button onClick={()=>toRoute('/product/'+p.slug)}>{p.name}</button><span>{money(p.price)}</span></div>
    <div className="tile-actions"><button aria-label="Добавить в избранное" onClick={()=>toggleFavorite(p.id)}><Heart size={16} fill={favorites.includes(p.id)?'currentColor':'none'}/></button><button aria-label="В корзину" onClick={()=>addCart(p.id)}><Plus size={18}/></button></div>
   </article>)}</div>}
   {!loading&&(!visible.length||route==='/favorites'&&!favorites.length)&&<div className="empty-state">В этой категории пока нет товаров.</div>}
   <p className="catalog-count">ПОКАЗАНО {route==='/favorites'?favorites.length:visible.length} ИЗ {products.filter(p=>p.active).length} ТОВАРОВ</p>
  </section>
 </main>:selected?<main className="detail-main"><button className="back-link" onClick={()=>toRoute('/catalog')}><ArrowLeft size={17}/> Вернуться в каталог</button><div className="detail-grid"><ProductGallery product={selected}/><div className="detail-info"><span className="eyebrow">RIPIANO / {selected.category}</span><h1>{selected.name}</h1><div className="detail-price">{money(selected.price)}</div><p>{selected.description}</p>{selected.specifications?.dimensions&&<div className="spec-row"><span>Размеры</span><span>{selected.specifications.dimensions}</span></div>}<div className="detail-actions"><button className="btn-dark" onClick={()=>addCart(selected.id)}>В корзину <ShoppingBag size={17}/></button><button className="btn-icon" title="В избранное" onClick={()=>toggleFavorite(selected.id)}><Heart size={20} fill={favorites.includes(selected.id)?'currentColor':'none'}/></button></div><p className="tiny-note">Стоимость и наличие уточняются при оформлении заказа.</p></div></div></main>
 :route==='/admin'?<Admin session={session} refresh={fetchProducts}/>
 :route==='/about'?<main className="about-main"><span className="eyebrow">RIPIANO / О НАС</span><h1>Мебель для вашего пространства.</h1><p>Корпусная мебель, созданная с вниманием к деталям. Каталог готовых изделий и индивидуальные заказы.</p><button className="btn-dark" onClick={()=>toRoute('/catalog')}>Смотреть каталог <ArrowRight size={16}/></button></main>
 :<main className="empty-state"><button onClick={()=>toRoute('/')}>На главную</button></main>}
 <footer className="footer"><div><div className="footer-brand">RIPIANO</div><small>Мебель для жизни.</small></div><div><button onClick={()=>toRoute('/catalog')}>Каталог</button><button onClick={()=>toRoute('/about')}>О бренде</button><button onClick={()=>toRoute('/admin')}>Владельцу</button></div><span>© RIPIANO 2026</span></footer>
 {cartOpen&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setCartOpen(false)}}><aside className="cart-drawer"><header><h2>КОРЗИНА <span>({count})</span></h2><button onClick={()=>setCartOpen(false)} aria-label="Закрыть"><X/></button></header><div className="cart-lines">{entries.length?entries.map(({product:p,quantity})=><div className="cart-line" key={p.id}><Photo product={p}/><div className="cart-line-data"><b>{p.name}</b><span>{money(p.price)}</span><div className="quantity"><button onClick={()=>adjust(p.id,-1)}><Minus size={14}/></button>{quantity}<button onClick={()=>adjust(p.id,1)}><Plus size={14}/></button></div></div><button className="remove" title="Удалить" onClick={()=>adjust(p.id,-quantity)}><Trash2 size={17}/></button></div>):<div className="empty-cart">Корзина пока пуста.<br/>Добавьте мебель из каталога.</div>}</div>{entries.length>0&&<Checkout entries={entries} total={total} onDone={()=>{setCart({});setCartOpen(false)}}/>}</aside></div>}
 </div>
}
function Checkout({entries,total,onDone}){
 const [name,setName]=useState(''),[phone,setPhone]=useState(''),[address,setAddress]=useState(''),[note,setNote]=useState(''),[sending,setSending]=useState(false),[done,setDone]=useState(''),[error,setError]=useState('');
 async function submit(e){e.preventDefault();setSending(true);setError('');
  const {data,error:err}=await supabase.rpc('ripiano_place_order',{p_name:name,p_phone:phone,p_address:address,p_note:note,p_items:entries.map(x=>({product_id:x.product.id,quantity:x.quantity}))});
  setSending(false);if(err){setError('Не удалось отправить заявку. Проверьте данные и попробуйте ещё раз.');console.error(err)}else{setDone(data)}}
 return <div className="checkout"><div className="checkout-total"><span>Итого</span><strong>{money(total)}</strong></div>{entries.some(x=>x.product.price===null)&&<p className="quote-warning">Часть товаров — по запросу. Финальную сумму подтвердит менеджер.</p>}{done?<div className="checkout-success"><Check size={28}/><b>Заявка отправлена</b><span>Мы свяжемся с вами для подтверждения.</span><button className="btn-dark" onClick={onDone}>Готово</button></div>:<form onSubmit={submit}><h3>Оформить заказ</h3><input required maxLength={120} minLength={2} placeholder="Ваше имя" value={name} onChange={e=>setName(e.target.value)}/><input required type="tel" minLength={7} maxLength={35} placeholder="Телефон" value={phone} onChange={e=>setPhone(e.target.value)}/><input maxLength={400} placeholder="Город / адрес (по желанию)" value={address} onChange={e=>setAddress(e.target.value)}/><textarea maxLength={1500} placeholder="Комментарий к заказу" rows={2} value={note} onChange={e=>setNote(e.target.value)}/>{error&&<p className="error">{error}</p>}<button className="btn-dark" disabled={sending}>{sending?'Отправляем…':'Отправить заявку'} <ArrowRight size={17}/></button><small>Оплата не списывается. Заказ подтвердит менеджер.</small></form>}</div>;
}
function Admin({session,refresh}){
 const [authorized,setAuthorized]=useState(false),[checking,setChecking]=useState(true),[mode,setMode]=useState('login'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[authMessage,setAuthMessage]=useState(''),[busy,setBusy]=useState(false);
 const [tab,setTab]=useState('products'),[products,setProducts]=useState([]),[orders,setOrders]=useState([]),[editing,setEditing]=useState(null),[form,setForm]=useState(emptyForm()),[notice,setNotice]=useState('');
 useEffect(()=>{let cancelled=false;async function check(){setChecking(true);if(!session){setAuthorized(false);setChecking(false);return}const {data}=await supabase.from('ripiano_admins').select('user_id').eq('user_id',session.user.id).maybeSingle();if(cancelled)return;setAuthorized(!!data);setChecking(false)}check();return()=>{cancelled=true}},[session?.user?.id]);
 useEffect(()=>{if(authorized){loadProducts();loadOrders()}},[authorized]);
 async function loadProducts(){const {data,error}=await supabase.from('ripiano_products').select('*').order('sort_order');if(!error)setProducts(data||[])}
 async function loadOrders(){const {data,error}=await supabase.from('ripiano_orders').select('*,ripiano_order_items(*)').order('created_at',{ascending:false});if(!error)setOrders(data||[])}
 async function authenticate(e){e.preventDefault();setAuthMessage('');setBusy(true);const {error}=mode==='signup'?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});setBusy(false);setAuthMessage(error?error.message:(mode==='signup'?'Проверьте почту и подтвердите регистрацию. Доступ к панели будет предоставлен владельцем.':'Вход выполнен.'))}
 function startEdit(p){setEditing(p?.id||'new');setForm(p?{name:p.name,slug:p.slug,category:p.category,price:p.price??'',description:p.description||'',image_url:p.image_url||'',dimensions:p.specifications?.dimensions||'',active:p.active,sort_order:p.sort_order||100,specifications:p.specifications||{}}:emptyForm());setNotice('');window.scrollTo({top:0,behavior:'smooth'})}
 async function saveProduct(e){e.preventDefault();setBusy(true);setNotice('');
  const payload={name:form.name.trim(),slug:form.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g,'-'),category:form.category,price:form.price===''?null:Number(form.price),description:form.description,image_url:form.image_url,active:form.active,sort_order:Number(form.sort_order)||100,specifications:{...form.specifications,dimensions:form.dimensions}};
  const req=editing==='new'?supabase.from('ripiano_products').insert(payload):supabase.from('ripiano_products').update(payload).eq('id',editing);
  const {error}=await req;setBusy(false);if(error){setNotice('Ошибка: '+error.message)}else{setEditing(null);setNotice('Товар сохранён');loadProducts();refresh()}}
 async function uploadImage(e){const file=e.target.files?.[0];if(!file)return;if(!['image/png','image/webp','image/jpeg'].includes(file.type)||file.size>10*1024*1024){setNotice('Допустимы JPG, PNG, WebP до 10 МБ');return}setBusy(true);
 const path=crypto.randomUUID()+'-'+file.name.replace(/[^a-zA-Z0-9_.-]/g,'');
 const {error}=await supabase.storage.from('ripiano-products').upload(path,file,{cacheControl:'3600'});
 setBusy(false);if(error){setNotice('Ошибка загрузки: '+error.message);return}
 const {data}=supabase.storage.from('ripiano-products').getPublicUrl(path);
 setForm(f=>({...f,image_url:data.publicUrl,specifications:{...f.specifications,spriteIndex:-1}}));setNotice('Фотография загружена. Не забудьте сохранить товар.')}
 async function setOrder(id,status){const {error}=await supabase.from('ripiano_orders').update({status}).eq('id',id);if(!error)loadOrders()}
 if(checking)return <main className="admin-main"><p>Проверка доступа…</p></main>;
 if(!session)return <main className="admin-main admin-login"><span className="eyebrow">RIPIANO / УПРАВЛЕНИЕ</span><h1>Личный кабинет</h1><p>Только для владельца магазина.</p><form onSubmit={authenticate}><input type="email" value={email} placeholder="Email" onChange={e=>setEmail(e.target.value)} required/><input type="password" minLength={6} value={password} placeholder="Пароль" onChange={e=>setPassword(e.target.value)} required/><button className="btn-dark" disabled={busy}>{mode==='signup'?'Зарегистрироваться':'Войти'} <ArrowRight size={16}/></button></form><button className="linklike" onClick={()=>{setMode(mode==='login'?'signup':'login');setAuthMessage('')}}>{mode==='login'?'Зарегистрировать аккаунт':'Уже есть аккаунт? Войти'}</button>{authMessage&&<p className="admin-notice">{authMessage}</p>}</main>;
 if(!authorized)return <main className="admin-main admin-login"><span className="eyebrow">RIPIANO / УПРАВЛЕНИЕ</span><h1>Доступ не назначен</h1><p>Вы вошли как {session.user.email}. Для безопасного доступа к товарам и заказам владельца нужно отдельно добавить в список администраторов в Supabase.</p><button className="btn-outline" onClick={()=>supabase.auth.signOut()}>Выйти</button></main>;
 return <main className="admin-main"><div className="admin-heading"><div><span className="eyebrow">RIPIANO / ПАНЕЛЬ ВЛАДЕЛЬЦА</span><h1>Управление магазином</h1></div><button onClick={()=>supabase.auth.signOut()} className="btn-outline"><LogOut size={16}/> Выйти</button></div><div className="admin-tabs"><button className={tab==='products'?'active':''} onClick={()=>{setTab('products');setEditing(null)}}><Package size={17}/> Товары</button><button className={tab==='orders'?'active':''} onClick={()=>{setTab('orders');setEditing(null)}}><ClipboardList size={17}/> Заказы {orders.filter(o=>o.status==='new').length>0?'('+orders.filter(o=>o.status==='new').length+')':''}</button></div>
 {notice&&<p className="admin-notice">{notice}</p>}
 {tab==='products'&&(editing?<form className="editor" onSubmit={saveProduct}><div className="editor-heading"><h2>{editing==='new'?'Новый товар':'Редактировать товар'}</h2><button type="button" onClick={()=>setEditing(null)}><X size={22}/></button></div><label>Название<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Адрес (slug)<input required value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})}/></label><div className="editor-row"><label>Категория<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.slice(1).concat('Другое').map(c=><option key={c}>{c}</option>)}</select></label><label>Цена в ₽ (пусто — по запросу)<input type="number" min="0" step="1" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label></div><label>Описание<textarea rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><label>Размеры<input value={form.dimensions} onChange={e=>setForm({...form,dimensions:e.target.value})}/></label><label>Фото товара<input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadImage}/></label>{form.image_url&&<div className="uploaded-preview"><img src={form.image_url} alt="" onError={e=>e.currentTarget.style.display='none'}/><small>{form.image_url}</small></div>}<div className="editor-row"><label>Порядок<input type="number" value={form.sort_order} onChange={e=>setForm({...form,sort_order:e.target.value})}/></label><label className="checkbox"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/> Показывать в магазине</label></div><button type="submit" className="btn-dark" disabled={busy}>{busy?'Сохраняем…':'Сохранить товар'} <Check size={18}/></button></form>:<><div className="admin-tools"><p>{products.length} товаров в каталоге</p><button className="btn-dark" onClick={()=>startEdit()}><Plus size={17}/> Добавить товар</button></div><div className="admin-products">{products.map(p=><div className="admin-product" key={p.id}><Photo product={p}/><div className="admin-product-details"><b>{p.name}</b><span>{p.category} · {p.active?'На сайте':'Скрыт'}</span></div><strong>{money(p.price)}</strong><button onClick={()=>startEdit(p)}><Edit3 size={18}/></button></div>)}</div></>)}
 {tab==='orders'&&<div className="admin-orders">{orders.length===0?<div className="empty-state">Заказов пока нет.</div>:orders.map(o=><div className="admin-order" key={o.id}><div className="order-top"><b>Заказ №{o.id.slice(0,8).toUpperCase()}</b><span>{new Date(o.created_at).toLocaleString('ru-RU')}</span></div><div className="order-info"><span>{o.customer_name} · <a href={'tel:'+o.phone}>{o.phone}</a></span><strong>{money(o.total)}</strong></div>{o.address&&<p>{o.address}</p>}{o.note&&<p>{o.note}</p>}<ul>{(o.ripiano_order_items||[]).map(it=><li key={it.id}>{it.product_name} × {it.quantity} — {money(it.unit_price)}</li>)}</ul><select value={o.status} onChange={e=>setOrder(o.id,e.target.value)}><option value="new">Новый</option><option value="confirmed">Подтверждён</option><option value="completed">Выполнен</option><option value="cancelled">Отменён</option></select></div>)}</div>}
 </main>;
}
function emptyForm(){return {name:'',slug:'',category:'Стеллажи',price:'',description:'',image_url:'',dimensions:'',active:true,sort_order:100,specifications:{spriteIndex:-1}}}
export default App;
