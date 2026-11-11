import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Check, Download, Image as ImageIcon, LoaderCircle, Plus, RotateCcw, SlidersHorizontal, Sparkles, Square, Trash2, WandSparkles } from 'lucide-react';
import SessionControls from './components/SessionControls';
import demoExamples from './data/demo-examples.json';
import './local.css';

import type { StudioSettings as Settings, ImageResult, Job } from './types/studio';
import { modelLabel, type ModelAvailability } from './services/models';
import AdvancedSettings from './components/AdvancedSettings';
import { saveDemoImage } from './services/demoLibrary';
import { ApiError, requestJson } from './services/http';
const defaults: Settings = { prompt: 'garden, soft afternoon lighting, medium shot, eye-level camera, detailed background', negative_prompt: 'lowres, bad anatomy, bad hands, text, worst quality, low quality, watermark, blurry', characters: [], width: 1024, height: 1024, steps: 28, guidance: 5, seed: -1, sampler: 'euler_a', nsfw: false, artist: '', engine: 'animagine', style: 'original', count: 1, adult_confirmed: false };
async function api<T>(path: string, data?: object): Promise<T> {
  return requestJson<T>(`/api/${path}`,data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:undefined);
}
function imageSrc(image: ImageResult) { return image.image_url ?? `/api/images/${image.id}/file`; }
export default function LocalStudio({ demo = false }: { demo?: boolean }) {
  const reduceMotion = useReducedMotion();
  const [advancedOpen,setAdvancedOpen] = useState(false);
  const [models,setModels]=useState<ModelAvailability>({});
  const [settings, setSettings] = useState<Settings>(defaults);
  const [gallery, setGallery] = useState<ImageResult[]>(demo ? demoExamples : []);
  const [selected, setSelected] = useState<ImageResult | null>(demo ? demoExamples[0] ?? null : null);
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [connected, setConnected] = useState(demo);
  const [modelReady, setModelReady] = useState(demo);
  const [elapsed, setElapsed] = useState(0);
  const [cancelPending, setCancelPending] = useState(false);
  const [tokenCount,setTokenCount]=useState<{key:string;positive:number;negative:number;limit:number;effective_prompt?:string;character_count?:number}|null>(null);
  const [tokenError,setTokenError]=useState('');
  const tokenInput=JSON.stringify({prompt:settings.prompt,negative_prompt:settings.negative_prompt,artist:settings.artist,style:settings.style,characters:settings.characters,engine:settings.engine});
  const currentTokens=tokenCount?.key===tokenInput?tokenCount:null;
  const tokensExceeded=!!currentTokens&&(currentTokens.positive>currentTokens.limit||currentTokens.negative>currentTokens.limit);
  const change = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings(s => ({ ...s, [key]: value }));
  useEffect(()=>{
    if(demo||!connected||!modelReady)return;
    const controller=new AbortController();
    const timer=window.setTimeout(async()=>{
      try{
        const count=await requestJson<{positive:number;negative:number;limit:number;effective_prompt:string;character_count:number}>('/api/prompt/tokens',{method:'POST',headers:{'Content-Type':'application/json'},body:tokenInput,signal:controller.signal});
        if(!controller.signal.aborted){setTokenCount({...count,key:tokenInput});setTokenError('');}
      }catch(e){if(!controller.signal.aborted)setTokenError(String(e));}
    },400);
    return()=>{controller.abort();window.clearTimeout(timer);};
  },[tokenInput,demo,settings.engine,connected,modelReady]);
  useEffect(() => {
    if (demo) return;
    let alive = true;
    async function refresh() {
      try {
        const status = await api<{ model_installed: boolean; active_job: string | null; models?:{id:keyof ModelAvailability;installed:boolean}[] }>('status');
        const images = await api<ImageResult[]>('gallery');
        if (!alive) return;
        setConnected(true); setModelReady(status.model_installed); setModels(Object.fromEntries((status.models??[]).map(model=>[model.id,model.installed]))); setGallery(images);
        if (status.active_job) { setJob({ id: status.active_job, status: 'loading', completed_steps: 0, steps: 28 }); setBusy(true); }
      } catch { if (alive) { setConnected(false); setError('No se pudo conectar al backend local. Ejecuta iniciar-local.ps1.'); } }
    }
    void refresh();
    const healthTimer=window.setInterval(async()=>{try{await api('status');if(alive)setConnected(true);}catch{if(alive)setConnected(false);}},10000);
    return () => { alive = false;window.clearInterval(healthTimer); };
  }, [demo]);
  useEffect(() => {
    if (!job?.id || !busy) return;
    let alive = true;
    const timer = window.setInterval(async () => {
      try {
        const next = await api<Job>(`jobs/${job.id}`);
        if (!alive) return;
        setJob(next);
        if (typeof next.elapsed_seconds === 'number') setElapsed(Math.floor(next.elapsed_seconds));
        if (['done', 'cancelled', 'error'].includes(next.status)) {
          setBusy(false);
          if (next.error) setError(next.error);
          if (next.result) { setSelected(next.result); setGallery(await api<ImageResult[]>('gallery')); }
        }
      } catch (e) { if (alive) { setError(e instanceof Error?e.message:String(e));if(e instanceof ApiError&&e.unavailable)setConnected(false);setBusy(false); } }
    }, 800);
    return () => { alive = false; window.clearInterval(timer); };
  }, [job?.id, busy]);
  useEffect(() => {
    if (!busy) return;
    const timer = window.setInterval(() => setElapsed(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [busy]);
  function loadExample(image?: ImageResult) {
    const next = image ?? demoExamples[(demoExamples.findIndex(item => item.id === selected?.id) + 1) % demoExamples.length];
    if (!next) return;
    reuse(next);
    setNotice('Ejemplo pregenerado cargado con sus ajustes reales. No se ejecutó una generación nueva.');
  }
  function exportDraft() {
    const blob = new Blob([JSON.stringify({ ...settings, mode: 'demo-draft', generated: false }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'mystikal-demo-configuracion.json'; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function generate() {
    if (demo) { loadExample(); return; }
    setError(''); setNotice(''); setElapsed(0); setCancelPending(false); setJob(null); setBusy(true);
    try {
      const result = await api<{ id: string }>('generate', settings);
      setJob({ id: result.id, status: 'queued', completed_steps: 0, steps: settings.steps });
    } catch (e) { setError(e instanceof Error?e.message:String(e));if(e instanceof ApiError&&e.unavailable)setConnected(false);setBusy(false); }
  }
  function reuse(image: ImageResult) {
    const { prompt, negative_prompt, characters, width, height, steps, guidance, seed, sampler, artist } = image;
    const engine=image.engine??(image.model.toLowerCase().includes('wai')?'wai':image.model.includes('pony')?'pony':image.model.includes('flux')?'flux':'animagine');
    if(engine!=='animagine'&&engine!=='wai'){setSelected(image);setNotice('Esta imagen usa un modelo retirado. Se conserva, pero sus ajustes no se aplicaron al generador.');return;}
    setSettings({prompt,negative_prompt,characters,width,height,steps,guidance,seed,sampler,nsfw:false,artist:artist??'',engine,style:image.style??'original',count:1,adult_confirmed:false});
    setSelected(image); setNotice('Parámetros recuperados, incluida la seed fija.');
  }
  return <div className="studio generator-page">
    <header className="studio-header generator-header"><Link to="/" className="brand"><Sparkles size={23} /> Mystikal <span>AI</span></Link><span className="studio-badge">{demo ? 'DEMO PÚBLICA' : 'ESTUDIO LOCAL'}</span><nav className="site-nav generator-nav" aria-label="Navegación del estudio"><Link to="/" className="header-home"><ArrowLeft size={16} /><span>Inicio</span></Link><span className={`connection-pill ${connected ? 'online' : 'offline'}`}><i aria-hidden="true" />{demo ? 'Ejemplos SFW' : connected ? 'Conectado' : 'Desconectado'}</span><SessionControls disabled={busy} /></nav></header>
    <motion.main className="studio-layout generator-layout" initial={reduceMotion ? false : {opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.3}}>
      {demo && <aside className="demo-banner"><div><span className="demo-label"><Sparkles size={15} /> DEMO INTERACTIVA</span><h2>Explora el estudio, sin instalar nada.</h2><p>Modifica los controles y carga ejemplos SFW creados previamente con la GPU local. Esta demo no genera imágenes nuevas ni usa tus prompts para cambiar los ejemplos.</p></div><a href="#demo-gallery">Ver ejemplos ↓</a></aside>}
      <section className="controls" aria-label="Controles de generación">
        <div className="section-heading"><div className="row"><span className="eyebrow">ESTUDIO DE ILUSTRACIÓN</span><button type="button" className="advanced-trigger" disabled={busy} onClick={()=>setAdvancedOpen(true)}><SlidersHorizontal size={15}/> Ajustes avanzados</button></div><h1>Crea tu próxima<br /><em>ilustración.</em></h1><p>Diseña la escena. Ajusta los detalles.</p></div>
        <form noValidate={demo} onSubmit={e => { e.preventDefault(); void generate(); }}>
          <fieldset disabled={busy}>
            <div className="control-panel"><div className="panel-heading"><span>01</span><h2>Tu escena</h2></div><label>Escena, contexto y cámara<textarea spellCheck={false} rows={5} required value={settings.prompt} onChange={e => change('prompt', e.target.value)} /></label>
            <p className="hint">Describe el lugar, la acción general, la iluminación y el encuadre. Define identidad, ropa y apariencia en las tarjetas de personajes.</p>
            {<p className={tokensExceeded?'error':'hint'} aria-live="polite">{demo?'Hasta 220 tokens combinados en los modelos SDXL locales. El conteo exacto está disponible en el estudio local.':currentTokens?`Prompt combinado: ${currentTokens.positive}/${currentTokens.limit} tokens · Negativo: ${currentTokens.negative}/${currentTokens.limit}. Incluye estilo, artista y personajes.`:tokenError||'Contando tokens del prompt combinado…'}{tokensExceeded&&' Acorta el texto para generar; no se recorta automáticamente.'}</p>}
            {currentTokens?.effective_prompt&&<details className="control-help"><summary>Ver prompt efectivo · {currentTokens.character_count??0} personajes incluidos</summary><p className="hint">{currentTokens.effective_prompt}</p><p className="hint">Los personajes se envían antes de la escena. El modelo recibe un único texto compartido; no tiene regiones independientes.</p></details>}
            <label>Undesired / negative prompt<textarea spellCheck={false} rows={3} value={settings.negative_prompt} onChange={e=>change('negative_prompt',e.target.value)}/></label>
            </div><div className="control-panel"><div className="row"><div className="panel-heading"><span>02</span><h2>Personajes <small>{settings.characters.length}/6</small></h2></div><button type="button" disabled={settings.characters.length >= 6} onClick={() => change('characters', [...settings.characters, { name: '', description: '' }])}><Plus size={14} /> Añadir</button></div>
            <details className="control-help"><summary>Cómo funcionan las tarjetas</summary><p className="hint">Las descripciones no vacías se envían primero; la escena y cámara van después. El nombre de tarjeta solo organiza la interfaz. SDXL combina el texto y puede mezclar atributos entre personajes; no asigna regiones independientes. Hasta 220 tokens para el prompt combinado (base, estilo, artista y personajes), y 220 independientes para el negativo. Los prompts largos se procesan en bloques.</p></details>
            <AnimatePresence initial={false}>{settings.characters.map((character, index) => <motion.div className="character" key={index} layout={!reduceMotion} initial={reduceMotion ? false : {opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} transition={{duration:reduceMotion ? 0 : 0.2}}>
              <label>Nombre de tarjeta<input value={character.name} maxLength={100} onChange={e => change('characters', settings.characters.map((c, i) => i === index ? { ...c, name: e.target.value } : c))} /></label>
              <label>Descripción<textarea spellCheck={false} rows={2} value={character.description} onChange={e => change('characters', settings.characters.map((c, i) => i === index ? { ...c, description: e.target.value } : c))} /></label>
              <button type="button" onClick={() => change('characters', settings.characters.filter((_, i) => i !== index))}><Trash2 size={14} /> Eliminar</button>
            </motion.div>)}</AnimatePresence>
</div><div className="generate-action"><div className="generation-summary"><span>{settings.width} × {settings.height}</span><span>{settings.steps} pasos</span><span>{modelLabel(settings.engine)}</span><span>{settings.count} imagen{settings.count>1?'es':''}</span></div><button className="generate-button" type="submit" disabled={!demo&&(!connected||tokensExceeded||!(models[settings.engine]??(settings.engine==='animagine'&&modelReady))||!settings.prompt.trim())}>{busy ? <LoaderCircle className="spinner" size={19} /> : <WandSparkles size={19} />}{demo ? 'Cargar siguiente ejemplo' : busy ? 'Creando tu ilustración…' : 'Generar imagen'}</button>{demo && <button type="button" className="demo-export" onClick={exportDraft}><Download size={14} /> Descargar mi configuración</button>}</div>
          </fieldset>
        </form>
        {!modelReady && connected && <p role="status" className="notice">Modelo pendiente. Ejecuta backend/download_model.py.</p>}
        {busy && <button className="cancel-button" disabled={!job?.id || cancelPending} onClick={async () => { try { setCancelPending(true); const reply = await api<{message: string}>(`jobs/${job?.id}/cancel`, {}); setNotice(reply.message); } catch(e) { setError(String(e)); setCancelPending(false); } }}><Square size={14} /> {cancelPending ? 'Cancelación solicitada…' : 'Cancelar generación'}</button>}
        {error && <p className="error" role="alert">{error}</p>}{notice && <p className="notice" role="status">{notice}</p>}
      </section>
      <section className="results" aria-label="Resultados">
        <div className="row"><div><span className="eyebrow">TU ESPACIO CREATIVO</span><h2>{demo ? 'Ejemplo pregenerado' : 'Vista previa'}</h2></div><span className="model-label"><Sparkles size={13} /> {selected?modelLabel(selected.engine,selected.model):modelLabel(settings.engine)}</span></div>
        <div className={`preview ${busy ? 'is-generating' : ''}`} aria-busy={busy}>{selected ? <motion.img key={selected.id} initial={reduceMotion ? false : {opacity:0,scale:0.985}} animate={{opacity:1,scale:1}} transition={{duration:0.25}} src={imageSrc(selected)} alt={selected.prompt} /> : <div className="empty"><span>✦</span><h2>Tu próxima ilustración empieza aquí</h2><p>Escribe una idea y genera en tu equipo.</p></div>}{busy && <div className="generation-overlay" role="status" aria-live="polite"><div className="generation-orbit"><LoaderCircle size={52} className="spinner" /><Sparkles size={20} /></div><span className="eyebrow">TU IDEA ESTÁ TOMANDO FORMA</span><h3>{!job || job.status === 'queued' ? 'Preparando el lienzo' : job.status === 'loading' ? 'Preparando el modelo' : job.status === 'encoding' ? 'Interpretando tu prompt' : job.status === 'remote_running' ? 'Creando con FLUX en Replicate' : job.status === 'decoding' ? 'Revelando tu ilustración' : job.completed_steps >= job.steps ? 'Revelando tu ilustración' : 'Creando tu ilustración'}</h3><p>{job?.status === 'loading' ? 'El modelo se carga en un proceso temporal. Su memoria se libera al terminar la solicitud.' : job?.status === 'running' && job.completed_steps < job.steps ? `Paso ${job.completed_steps} de ${job.steps}` : job?.status === 'remote_running' ? 'La solicitud se procesa en la nube. Las imágenes terminadas se guardarán en tu galería privada.' : 'Espera un momento; la generación sigue en tu equipo.'}</p><span className="elapsed-time">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')} transcurridos</span></div>}</div>
        {demo && selected && <p className="demo-result-caption"><strong>{selected.demo_title}</strong> · Ejemplo fijo con parámetros registrados. Editar el formulario no modifica esta imagen.</p>}
        {job && <div className="progress" role="status"><p>{({ queued: 'En espera', loading: 'Cargando modelo en RAM/GPU…', encoding: 'Interpretando el prompt…', decoding: 'Decodificando y guardando…', remote_running: 'Procesando en Replicate…', running: 'Generando', done: 'Imagen guardada', cancelled: 'Generación cancelada', error: 'No se pudo generar' } as Record<string,string>)[job.status]}{job.status === 'running' && ` · ${job.completed_steps}/${job.steps} pasos${job.completed_steps === job.steps ? ' · Decodificando y guardando…' : ''}`}{job.total_images && job.total_images>1 ? ` · ${job.completed_images??0}/${job.total_images} imágenes guardadas` : ''}</p>{busy && <progress max={job.steps || 1} value={job.status === 'running' && job.steps>0 ? job.completed_steps : undefined} />}</div>}
        {selected && <div className="result-info"><div className="saved-label"><Check size={14} /> {demo ? 'Ejemplo SFW · Generado previamente en GPU local' : <>Imagen {selected.nsfw ? 'NSFW' : 'SFW'} guardada · {selected.shared ? 'Compartida por tu preferencia' : 'Privada'}</>}</div><div className="image-stats"><span><small>Resolución</small>{selected.width} × {selected.height}</span><span><small>Pasos</small>{selected.engine==='flux' ? 'Automático' : selected.steps}</span><span><small>{demo ? 'Tiempo registrado' : 'Tiempo total'}</small>{selected.seconds} s</span><span><small>Seed</small>{selected.seed}</span></div><details className="control-help"><summary>Detalles de rendimiento</summary><p>Pico PyTorch: {selected.peak_vram_mib} MiB</p>{selected.load_seconds !== undefined && <p>Carga: {selected.load_seconds} s · Texto: {selected.encoding_seconds ?? 0} s · Inferencia: {selected.inference_seconds} s</p>}</details><div className="row">{demo && <button onClick={()=>{try{saveDemoImage(selected);setNotice('Ejemplo guardado en tu colección demo. Puedes organizarlo desde tu perfil.');}catch(e){setError(String(e));}}}><Plus size={15}/> Guardar ejemplo en mi perfil</button>}<Link to="/profile">Mi perfil y galería ↗</Link><a download href={imageSrc(selected)}><Download size={15} /> Descargar PNG</a><a download href={selected.metadata_url ?? `/api/images/${selected.id}/metadata`}><SlidersHorizontal size={15} /> Parámetros</a><button onClick={() => demo ? loadExample(selected) : reuse(selected)}><RotateCcw size={15} /> {demo ? 'Restaurar ajustes del ejemplo' : 'Reutilizar ajustes'}</button></div></div>}
        <div id="demo-gallery" className="row gallery-heading"><h2 className="icon-heading"><ImageIcon size={17} /> {demo ? 'Ejemplos SFW de la demo' : 'Mi galería'}</h2><span>{gallery.length} imágenes</span></div>
        <div className="gallery">{gallery.map(image => <button className={selected?.id === image.id ? 'is-selected' : ''} key={image.id} onClick={() => demo ? loadExample(image) : setSelected(image)} aria-label={`Ver imagen, seed ${image.seed}`}><img loading="lazy" src={imageSrc(image)} alt={image.prompt} /><span>{demo ? image.demo_title : image.nsfw ? 'NSFW' : 'SFW'} · Seed {image.seed}</span></button>)}</div>
        {!gallery.length && <p className="hint">Las imágenes reales aparecerán aquí y se conservarán en tu carpeta privada de esta sesión.</p>}
        <footer>{demo ? 'Demo de portafolio · Ejemplos reales pregenerados · Configuración editable sin inferencia · Animagine XL 4.0' : 'Modelos locales FP16 · Proceso temporal por solicitud · Memoria liberada al terminar'}</footer>
      </section>
    </motion.main><AdvancedSettings open={advancedOpen} onClose={()=>setAdvancedOpen(false)} settings={settings} onChange={setSettings} demo={demo} models={models}/>
  </div>;
}
