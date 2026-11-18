
import React,{lazy,Suspense,useState} from 'react';
import './furniture-3d.css';

const Furniture3D=lazy(()=>import('./Furniture3D.jsx'));
export default function FurniturePreviewSwitch({config,doors=false,twoD}){
 const [mode,setMode]=useState('3d');
 const [resetKey,setResetKey]=useState(0);
 const [unsupported,setUnsupported]=useState(false);
 return <div className="ripiano-preview-panel">
  <div className="ripiano-view-tabs" role="group" aria-label="Тип просмотра">
   <button type="button" className={mode==='3d'?'active':''} aria-pressed={mode==='3d'} disabled={unsupported} onClick={()=>setMode('3d')}>3D · вращать</button>
   <button type="button" className={mode==='2d'?'active':''} aria-pressed={mode==='2d'} onClick={()=>setMode('2d')}>2D · чертёж</button>
  </div>
  {mode==='3d'?<Suspense fallback={<div className="ripiano-viewer-loading">Загружаем 3D-просмотр…</div>}>
    <Furniture3D config={config} showDoors={doors} resetKey={resetKey} onFail={()=>{setUnsupported(true);setMode('2d')}}/>
  </Suspense>:twoD}
  <div className="ripiano-view-actions">
   <span>{mode==='3d'?'Проведите пальцем для вращения · двумя пальцами для масштаба':'Схема с размерами для расчёта'}</span>
   {mode==='3d'&&<button type="button" onClick={()=>setResetKey(value=>value+1)}>Вернуть ракурс</button>}
  </div>
  {unsupported&&<p className="ripiano-viewer-error">3D не поддерживается на этом устройстве. Доступен 2D-эскиз.</p>}
 </div>;
}
