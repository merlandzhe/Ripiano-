
import React,{useEffect,useState} from 'react';
import {ArrowLeft,ArrowRight,CheckCircle,ShieldAlert} from 'lucide-react';
import './store-legal.css';
import {REQUESTS_ENABLED} from './ComplianceStatus.jsx';

const FALLBACK={id:1,legal_name:'',legal_type:'',inn:'',ogrn:'',registered_address:'',support_email:'',store_address:'Чеченская Республика, с. Толстой-Юрт, посёлок №2, 41',contact_phone:'+7 (965) 100-39-00',claims_contact:''};
const fields=[
 {key:'legal_name',name:'Официальное наименование продавца / ФИО ИП',placeholder:'ИП Фамилия Имя Отчество или ООО «…»',required:true,max:250},
 {key:'legal_type',name:'Правовой статус',placeholder:'ИП, ООО или другой подтверждённый статус',max:60},
 {key:'inn',name:'ИНН',placeholder:'10 или 12 цифр',max:12},
 {key:'ogrn',name:'ОГРН / ОГРНИП (при наличии)',placeholder:'13 или 15 цифр',max:15},
 {key:'registered_address',name:'Юридический адрес / место регистрации',placeholder:'Укажите реальный адрес',max:500},
 {key:'support_email',name:'Email для официальных обращений',placeholder:'contact@example.ru',max:250},
 {key:'store_address',name:'Адрес магазина',placeholder:'Адрес магазина, если есть',max:500},
 {key:'contact_phone',name:'Телефон',placeholder:'+7 999 000-00-00',max:45},
 {key:'claims_contact',name:'Адрес/контакт для претензий и возвратов',placeholder:'Почтовый адрес или email для обращений',max:250}
];
export function useStoreDetails(supabase){
 const [settings,setSettings]=useState(FALLBACK);
 const [loading,setLoading]=useState(true);
 useEffect(()=>{
  let cancelled=false;
  if(!supabase){setLoading(false);return}
  (async()=>{
   const {data,error}=await supabase.from('ripiano_store_settings').select('*').eq('id',1).maybeSingle();
   if(cancelled)return;
   if(!error&&data)setSettings(data);
   if(error)console.warn('RIPIANO legal information not available',error);
   setLoading(false);
  })();
  return()=>{cancelled=true};
 },[supabase]);
 return {settings,loading};
}
export function StoreSettingsAdmin({supabase}){
 const {settings,loading}=useStoreDetails(supabase);
 const [form,setForm]=useState(FALLBACK);
 const [saving,setSaving]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>setForm(settings),[settings]);
 async function save(e){
  e.preventDefault();if(saving)return;
  if(form.inn&&!/^\d{10}(\d{2})?$/.test(form.inn.trim())){setMessage('ИНН должен состоять из 10 или 12 цифр.');return}
  if(form.ogrn&&!/^\d{13}(\d{2})?$/.test(form.ogrn.trim())){setMessage('ОГРН/ОГРНИП должен состоять из 13 или 15 цифр.');return}
  setSaving(true);setMessage('');
  try{
   const values=Object.fromEntries(fields.map(x=>[x.key,String(form[x.key]||'').trim()]));
   const {data,error}=await supabase.from('ripiano_store_settings').update({...values,updated_at:new Date().toISOString()}).eq('id',1).select('*').maybeSingle();
   if(error||!data)throw error||new Error('Не удалось сохранить');
   setForm(data);setMessage('Реквизиты сохранены и доступны на страницах магазина.');
  }catch(error){setMessage('Ошибка сохранения: '+(error.message||'повторите попытку'))}
  finally{setSaving(false)}
 }
 return <section className="rl-admin">
  <h2>Реквизиты продавца</h2>
  <p>Эти сведения публикуются на сайте. Вносите только подтверждённые документы: юридические данные нельзя заменять адресом магазина или придуманным ИНН.</p>
  {!REQUESTS_ENABLED&&<div className="rl-warning"><ShieldAlert size={19}/><span>Сохранение реквизитов временно заблокировано до переноса персональных данных на сервер в РФ. ФИО ИП, ИНН и адрес могут являться персональными данными. Поля можно подготовить, но не отправляйте их в текущую зарубежную базу.</span></div>}
  {loading?<p>Загружаем реквизиты…</p>:<form onSubmit={save}>
   {fields.map(field=><label key={field.key}>{field.name}
    <input value={form[field.key]||''} maxLength={field.max} placeholder={field.placeholder}
     type={field.key==='support_email'?'email':'text'}
     onChange={e=>setForm(current=>({...current,[field.key]:e.target.value}))}/>
   </label>)}
   {message&&<p className="rl-status" role="status">{message}</p>}
   <button type="submit" className="btn-dark" disabled={saving||!REQUESTS_ENABLED}>{saving?'Сохраняем…':'Сохранить реквизиты'} <CheckCircle size={17}/></button>
  </form>}
 </section>;
}
function Value({label,value}){
 return <div className="rl-pair"><dt>{label}</dt><dd>{value?.trim()||<span className="rl-missing">Не заполнено</span>}</dd></div>;
}
export function SellerInfoPage({supabase,onNavigate}){
 const {settings,loading}=useStoreDetails(supabase);
 return <main className="rl-page">
  <div className="rl-breadcrumb"><button type="button" onClick={()=>onNavigate('/catalog')}><ArrowLeft size={16}/> Каталог</button><span>/</span>Информация о продавце</div>
  <h1>О ПРОДАВЦЕ</h1>
  <p className="rl-lead">Сведения о производителе и продавце мебели RIPIANO. Контакты для оформления заказа, обращений и претензий.</p>
  {!loading&&(!settings.legal_name||!settings.inn||!settings.registered_address)&&<div className="rl-warning"><ShieldAlert size={19}/><span>Юридические реквизиты пока заполнены не полностью. Владельцу необходимо дополнить их в кабинете администратора до полноценного запуска продаж.</span></div>}
  <dl className="rl-values">
   <Value label="Магазин" value="RIPIANO"/>
   <Value label="Продавец (официальное наименование)" value={settings.legal_name}/>
   <Value label="Правовой статус" value={settings.legal_type}/>
   <Value label="ИНН" value={settings.inn}/>
   <Value label="ОГРН / ОГРНИП" value={settings.ogrn}/>
   <Value label="Юридический адрес" value={settings.registered_address}/>
   <Value label="Адрес магазина" value={settings.store_address}/>
   <Value label="Контактный телефон" value={settings.contact_phone}/>
   <Value label="Электронная почта" value={settings.support_email}/>
   <Value label="Контакт для претензий" value={settings.claims_contact}/>
  </dl>
  <p className="rl-caption">Реквизиты продавца не заменяют документы о соответствии мебельной продукции, гарантийные обязательства и подтверждение согласованных условий заказа.</p>
 </main>;
}
export function DeliveryReturnsPage({supabase,onNavigate}){
 const {settings}=useStoreDetails(supabase);
 return <main className="rl-page">
  <div className="rl-breadcrumb"><button type="button" onClick={()=>onNavigate('/catalog')}><ArrowLeft size={16}/> Каталог</button><span>/</span>Доставка и возврат</div>
  <h1>ДОСТАВКА<br/>И ВОЗВРАТ</h1>
  <p className="rl-lead">Основная информация о том, как оформляется заказ мебели RIPIANO, рассчитываются условия доставки и осуществляется возврат.</p>
  <div className="rl-copy">
   <section><h2>Как оформляется заказ</h2>
    <p>На сайте можно направить запрос на товары из каталога или индивидуальный проект мебели. Оплата при отправке заявки не списывается. После получения заявки менеджер уточняет наличие, материалы, комплектацию, стоимость и сроки. Условия заключения договора и оплаты согласовываются отдельно.</p></section>
   <section><h2>Доставка и сборка</h2>
    <p>Место доставки, стоимость, возможность сборки, условия подъёма и сроки зависят от выбранной мебели и адреса. Точные условия сообщаются покупателю до подтверждения заказа. Не считайте доставку, подъём или сборку включёнными в указанную цену, если это отдельно не подтверждено продавцом.</p></section>
   <section><h2>Отмена и возврат</h2>
    <p>При применении правил дистанционной продажи потребитель, как правило, вправе отказаться от товара до его передачи и в течение семи дней после передачи. Если информация о порядке и сроках возврата не предоставлена в письменной форме в момент доставки, законом предусмотрен более продолжительный срок — три месяца.</p>
    <p>Для товара надлежащего качества, обладающего индивидуально-определёнными свойствами и пригодного исключительно для конкретного покупателя, действует предусмотренное законом исключение. Само по себе обозначение «под заказ» не означает автоматического запрета возврата. Права покупателя при недостатках товара сохраняются.</p>
    <p>Возврат уплаченной суммы при законном отказе производится в сроки, предусмотренные законодательством, как правило не позднее десяти дней с момента предъявления требования, с учётом законных правил о расходах на обратную доставку.</p>
   </section>
   <section><h2>Гарантия и документы</h2>
    <p>Сведения о гарантийном сроке, сроке службы, уходе, сборке, характеристиках и обязательном подтверждении соответствия должны предоставляться покупателю в предусмотренных законом случаях. Конкретные параметры каждой модели требуется уточнить перед заключением заказа.</p></section>
   <section><h2>Как подать обращение или претензию</h2>
    <p>Свяжитесь с магазином по телефону {settings.contact_phone||'+7 (965) 100-39-00'}{settings.claims_contact?' или по адресу: '+settings.claims_contact:'. Адрес для письменных претензий необходимо уточнить у продавца.'} Для рассмотрения обращения укажите товар, дату и обстоятельства покупки, а также требование и контакт для ответа. При наличии приложите подтверждающие документы и фотографии.</p>
   </section>
   <section><h2>Правовые основания</h2>
    <p>Закон РФ № 2300-1 «О защите прав потребителей» (включая статью 26.1) и Правила продажи товаров, утверждённые постановлением Правительства РФ от 30.05.2026 № 657.</p>
    <p>Конкретные договорные условия не могут ограничивать установленные законом права потребителя.</p>
   </section>
  </div>
  <button type="button" className="rl-link" onClick={()=>onNavigate('/seller-info')}>Информация о продавце <ArrowRight size={16}/></button>
 </main>;
}
