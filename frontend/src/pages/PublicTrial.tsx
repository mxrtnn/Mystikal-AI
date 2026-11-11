import { useCallback,useEffect,useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft,ArrowRight,Check,Download,Image,LoaderCircle,Sparkles,WandSparkles } from 'lucide-react';
import SessionControls from '../components/SessionControls';
import { ApiError,requestJson } from '../services/http';
import { isGuest } from '../services/session';
import '../local.css';
type TrialJob={id:string;status:string;progress:number;image_url?:string;error?:string};
type Access={owner:boolean;used:number;limit:number|null;finished:boolean;online:boolean;active_job:string|null;last_job:TrialJob|null};
async function call<T>(path:string,body?:object):Promise<T>{
 try{return await requestJson<T>(`/api/studio/${path}`,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined);}
 catch(error){if(error instanceof ApiError&&error.unavailable)throw new Error('No se pudo consultar el estudio web. Recarga para recuperar el estado de tu prueba.',{cause:error});throw error;}
}
export default function PublicTrial(){
 const [access,setAccess]=useState<Access|null>(null);const [needsLogin,setNeedsLogin]=useState(isGuest());
 const [prompt,setPrompt]=useState('Una ciudad flotante entre montañas y nubes, luz cálida del atardecer, ilustración detallada.');
 const [shape,setShape]=useState('square');const [job,setJob]=useState<TrialJob|null>(null);const [error,setError]=useState('');const [sending,setSending]=useState(false);
 const refresh=useCallback(async()=>{
  if(isGuest())return;
  try{const next=await call<Access>('access');setAccess(next);setNeedsLogin(false);if(next.last_job)setJob(next.last_job);}
  catch(e){if(e instanceof ApiError&&e.status===401)setNeedsLogin(true);else setError(e instanceof Error?e.message:String(e));}
 },[]);
 useEffect(()=>{const first=window.setTimeout(()=>void refresh(),0);const timer=window.setInterval(()=>void refresh(),15000);return()=>{window.clearTimeout(first);window.clearInterval(timer);};},[refresh]);
 const busy=!!job&&['queued','running'].includes(job.status);
 useEffect(()=>{
  if(!job?.id||!['queued','running'].includes(job.status))return;
  let alive=true;
  const timer=window.setInterval(async()=>{try{const next=await call<TrialJob>(`jobs/${job.id}`);if(!alive)return;setJob(next);if(!['queued','running'].includes(next.status))void refresh();}catch(e){if(alive)setError(e instanceof Error?e.message:String(e));}},2500);
  return()=>{alive=false;window.clearInterval(timer);};
 },[job?.id,job?.status,refresh]);
 async function generate(){
  setSending(true);setError('');
  try{const next=await call<TrialJob>('jobs',{prompt,shape});setJob(next);}
  catch(e){setError(e instanceof Error?e.message:String(e));void refresh();}
  finally{setSending(false);}
 }
 return <div className="studio public-trial"><header className="studio-header"><Link className="brand" to="/"><Sparkles size={23}/> Mystikal <span>AI</span></Link><nav className="site-nav"><Link to="/muestra-visual">Muestra visual</Link><SessionControls/></nav></header><main className="trial-page"><div className="trial-intro"><Link className="text-link" to="/"><ArrowLeft size={14}/> Inicio</Link><span className="eyebrow">UNA IDEA PUEDE SER EL COMIENZO</span><h1>Dale forma a tu imaginación.</h1><p>{access?.owner?'Tu cuenta tiene acceso ampliado al estudio.':'Crea una imagen real con tu cuenta. Una generación de prueba por cuenta registrada, sin instalar nada.'}</p></div>
 <div className="trial-layout"><section className="trial-controls"><div className="row"><h2>Tu primera creación</h2><span className="content-badge">{access?.owner?'Acceso ampliado':access?.finished?'1 / 1 utilizada':'1 generación de prueba'}</span></div>
 {needsLogin?<div className="trial-auth"><Sparkles size={30}/><h2>Tu imaginación merece un lienzo.</h2><p>Regístrate e inicia sesión para desbloquear tu generación. La muestra visual está disponible para todos.</p><Link className="primary-link" to="/register" state={{from:'/generate'}}>Crear mi cuenta <ArrowRight size={16}/></Link><Link className="text-link" to="/login" state={{from:'/generate'}}>Ya tengo cuenta · Iniciar sesión</Link></div>:access?.finished?<div className="trial-finished" role="status"><Check size={30}/><h2>Prueba terminada</h2><p>Ya creaste tu imagen de prueba. Puedes volver a verla y descargarla aquí.</p><Link className="text-link" to="/muestra-visual">Explorar la muestra visual <ArrowRight size={15}/></Link></div>:<form onSubmit={e=>{e.preventDefault();void generate();}}><label>Describe tu idea<textarea spellCheck={false} maxLength={1000} rows={7} value={prompt} onChange={e=>setPrompt(e.target.value)} disabled={busy||sending} required/></label><span className="hint">{prompt.length}/1000 caracteres · Incluye escena, luz y composición.</span>{access?.owner&&<label>Formato<select value={shape} onChange={e=>setShape(e.target.value)} disabled={busy||sending}><option value="square">Cuadrada · 768 × 768</option><option value="portrait">Retrato · 832 × 1216</option><option value="landscape">Paisaje · 1216 × 832</option></select></label>}<button className="generate-button" disabled={!access||!access.online||busy||sending||prompt.trim().length<3}>{busy||sending?<LoaderCircle className="spinner" size={18}/>:<WandSparkles size={18}/>} {busy?'Creando tu imagen…':sending?'Enviando tu idea…':'Generar mi imagen'}</button>{!access&&<p className="hint" role="status">Consultando tu acceso…</p>}{access&&!access.online&&!busy&&<p className="notice">El estudio está en descanso. Vuelve más tarde: tu prueba sigue disponible.</p>}</form>}
 {error&&<p className="error" role="alert">{error}</p>}{job?.status==='failed'&&<p className="error" role="alert">{job.error||'No se pudo completar la imagen. Tu prueba sigue disponible.'}</p>}<p className="hint">Los intentos fallidos no consumen la prueba. El límite se guarda con tu cuenta y no se reinicia al recargar la página.</p></section>
 <section className="trial-result" aria-label="Resultado de generación"><div className="row"><span className="eyebrow">DEL TEXTO A TU IMAGEN</span><span className="model-label">WAI Illustrious SDXL v17</span></div><div className="preview" aria-busy={busy}>{job?.image_url?<img src={job.image_url} alt="Imagen creada a partir de tu idea"/>:busy?<div className="empty" role="status"><LoaderCircle size={48} className="spinner"/><h2>{job.status==='queued'?'Tu idea está en la fila':'Tu imagen está tomando forma'}</h2><p>El tiempo varía según la carga del estudio. Puedes mantener esta página abierta.</p>{job.progress>0&&<progress value={job.progress} max={100} aria-label="Progreso de generación"/>}</div>:<div className="empty"><Image size={46}/><h2>Aquí comienza algo que solo tú imaginaste.</h2><p>Tu resultado aparecerá en este espacio.</p></div>}</div>{job?.image_url&&<div className="trial-download"><span className="saved-label"><Check size={15}/> Imagen lista · Visible desde tu cuenta</span><a className="primary-link" download={`mystikal-${job.id}.png`} href={job.image_url}><Download size={16}/> Descargar PNG</a></div>}<p className="hint">Esta sección genera imágenes nuevas. La <Link to="/muestra-visual">muestra visual</Link> contiene únicamente ejemplos pregenerados.</p></section></div></main></div>;
}
