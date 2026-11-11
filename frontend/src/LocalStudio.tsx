import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Check, Download, Image as ImageIcon, LoaderCircle, Plus, RotateCcw, SlidersHorizontal, Sparkles, Square, Trash2, WandSparkles } from 'lucide-react';
import SessionControls from './components/SessionControls';
import './local.css';

type Character = { name: string; description: string };
type Settings = { prompt: string; negative_prompt: string; characters: Character[]; width: number; height: number; steps: number; guidance: number; seed: number; sampler: string; nsfw: boolean; artist: string };
type ImageResult = Settings & { id: string; model: string; seconds: number; peak_vram_mib: number; created_at: number; shared?: boolean; load_seconds?: number; encoding_seconds?: number; inference_seconds?: number };
type Job = { id: string; status: string; completed_steps: number; steps: number; error?: string; result?: ImageResult; elapsed_seconds?: number };
const defaults: Settings = { prompt: '1girl, solo, original character, garden, soft lighting, masterpiece, high score, great score', negative_prompt: 'lowres, bad anatomy, bad hands, text, worst quality, low quality, watermark, blurry', characters: [], width: 1024, height: 1024, steps: 28, guidance: 5, seed: -1, sampler: 'euler_a', nsfw: false, artist: '' };
async function api<T>(path: string, data?: object): Promise<T> {
  const response = await fetch(`/api/${path}`, data ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) } : undefined);
  const body = await response.json();
  if (!response.ok) throw new Error(typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail ?? body));
  return body;
}
export default function LocalStudio() {
  const reduceMotion = useReducedMotion();
  const [artists, setArtists] = useState<string[]>([]);
  const [settings, setSettings] = useState<Settings>(defaults);
  const [gallery, setGallery] = useState<ImageResult[]>([]);
  const [selected, setSelected] = useState<ImageResult | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [connected, setConnected] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [cancelPending, setCancelPending] = useState(false);
  const change = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings(s => ({ ...s, [key]: value }));
  useEffect(() => {
    let alive = true;
    async function refresh() {
      try {
        const status = await api<{ model_installed: boolean; active_job: string | null }>('status');
        const images = await api<ImageResult[]>('gallery');
        if (!alive) return;
        setConnected(true); setModelReady(status.model_installed); setGallery(images);
        if (status.active_job) { setJob({ id: status.active_job, status: 'loading', completed_steps: 0, steps: 28 }); setBusy(true); }
      } catch { if (alive) { setConnected(false); setError('No se pudo conectar al backend local. Ejecuta iniciar-local.ps1.'); } }
    }
    void refresh();
    api<{names:string[]}>('artists').then(data=>{if(alive)setArtists(data.names);}).catch(()=>{});
    return () => { alive = false; };
  }, []);
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
      } catch (e) { if (alive) { setError(String(e)); setBusy(false); } }
    }, 800);
    return () => { alive = false; window.clearInterval(timer); };
  }, [job?.id, busy]);
  useEffect(() => {
    if (!busy) return;
    const timer = window.setInterval(() => setElapsed(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [busy]);
  async function generate() {
    setError(''); setNotice(''); setElapsed(0); setCancelPending(false); setJob(null); setBusy(true);
    try {
      const result = await api<{ id: string }>('generate', settings);
      setJob({ id: result.id, status: 'queued', completed_steps: 0, steps: settings.steps });
    } catch (e) { setError(String(e)); setBusy(false); }
  }
  function reuse(image: ImageResult) {
    const { prompt, negative_prompt, characters, width, height, steps, guidance, seed, sampler, nsfw, artist } = image;
    setSettings({ prompt, negative_prompt, characters, width, height, steps, guidance, seed, sampler, nsfw: nsfw ?? false, artist: artist ?? '' });
    setSelected(image); setNotice('Parámetros recuperados, incluida la seed fija.');
  }
  return <div className="studio generator-page">
    <header className="studio-header generator-header"><Link to="/" className="brand"><Sparkles size={23} /> Mystikal <span>AI</span></Link><span className="studio-badge">ESTUDIO LOCAL</span><nav className="site-nav generator-nav" aria-label="Navegación del estudio"><Link to="/" className="header-home"><ArrowLeft size={16} /><span>Inicio</span></Link><span className={`connection-pill ${connected ? 'online' : 'offline'}`}><i aria-hidden="true" />{connected ? 'Conectado' : 'Desconectado'}</span><SessionControls disabled={busy} /></nav></header>
    <motion.main className="studio-layout generator-layout" initial={reduceMotion ? false : {opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.3}}>
      <section className="controls" aria-label="Controles de generación">
        <div className="section-heading"><span className="eyebrow">ESTUDIO DE ILUSTRACIÓN</span><h1>Crea tu próxima<br /><em>ilustración.</em></h1><p>Diseña la escena. Ajusta los detalles.</p></div>
        <form onSubmit={e => { e.preventDefault(); void generate(); }}>
          <fieldset disabled={busy}>
            <div className="control-panel"><div className="panel-heading"><span>01</span><h2>Dirección creativa</h2></div>
            <div className="content-selector" role="group" aria-label="Tipo de contenido"><button type="button" aria-pressed={!settings.nsfw} onClick={()=>change('nsfw',false)}>SFW</button><button type="button" aria-pressed={settings.nsfw} onClick={()=>change('nsfw',true)}>NSFW · Adultos</button></div><p className="hint">Tú marcas la categoría. No cambia el prompt ni detecta contenido. Se guarda en tu carpeta {settings.nsfw?'NSFW':'SFW'}; la publicación se controla en <Link to="/profile">tu perfil</Link>.</p>
            <label>Artista / etiqueta de estilo<input list="artist-tags" value={settings.artist} maxLength={200} placeholder="Nombre de etiqueta, sin pesos NovelAI" onChange={e=>change('artist',e.target.value)}/><datalist id="artist-tags">{artists.map(name=><option key={name} value={name}/>)}</datalist></label><p className="hint"><a href="https://tags.gallery/en/v4-5" target="_blank" rel="noreferrer">Consultar TAGs ↗</a> · Pega un nombre del catálogo. Su respuesta en Animagine puede variar; no se descarga ni se entrena un estilo.</p>
            </div><div className="control-panel"><div className="panel-heading"><span>02</span><h2>Tu escena</h2></div><label>Base prompt<textarea spellCheck={false} rows={5} required value={settings.prompt} onChange={e => change('prompt', e.target.value)} /></label>
            <p className="hint">Describe escena, estilo y composición. Las etiquetas en inglés suelen funcionar mejor.</p>
            <label>Undesired / negative prompt<textarea spellCheck={false} rows={3} value={settings.negative_prompt} onChange={e => change('negative_prompt', e.target.value)} /></label>
            </div><div className="control-panel"><div className="row"><div className="panel-heading"><span>03</span><h2>Personajes <small>{settings.characters.length}/6</small></h2></div><button type="button" disabled={settings.characters.length >= 6} onClick={() => change('characters', [...settings.characters, { name: '', description: '' }])}><Plus size={14} /> Añadir</button></div>
            <details className="control-help"><summary>Cómo funcionan las tarjetas</summary><p className="hint">Modo texto compartido: las descripciones se combinan con Base prompt. Los atributos pueden mezclarse entre personajes; este backend no asigna regiones. Máximo 77 tokens por prompt combinado; se avisa si lo superas.</p></details>
            <AnimatePresence initial={false}>{settings.characters.map((character, index) => <motion.div className="character" key={index} layout={!reduceMotion} initial={reduceMotion ? false : {opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} transition={{duration:reduceMotion ? 0 : 0.2}}>
              <label>Nombre de tarjeta<input value={character.name} maxLength={100} onChange={e => change('characters', settings.characters.map((c, i) => i === index ? { ...c, name: e.target.value } : c))} /></label>
              <label>Descripción<textarea spellCheck={false} rows={2} value={character.description} onChange={e => change('characters', settings.characters.map((c, i) => i === index ? { ...c, description: e.target.value } : c))} /></label>
              <button type="button" onClick={() => change('characters', settings.characters.filter((_, i) => i !== index))}><Trash2 size={14} /> Eliminar</button>
            </motion.div>)}</AnimatePresence>
            </div><div className="control-panel"><div className="panel-heading"><span>04</span><h2><SlidersHorizontal size={16} /> Ajustes</h2></div><div className="quality-presets"><button type="button" onClick={() => setSettings(s => ({ ...s, width: 768, height: 768, steps: 20 }))}>Borrador · 768 px / 20 pasos</button><button type="button" onClick={() => setSettings(s => ({ ...s, width: 1024, height: 1024, steps: 28 }))}>Detalle · 1024 px / 28 pasos</button></div><p className="hint">Borrador reduce trabajo y puede perder detalle. No cambia el modelo.</p>
            <label>Resolución<select value={`${settings.width}x${settings.height}`} onChange={e => { const [width, height] = e.target.value.split('x').map(Number); setSettings(s => ({ ...s, width, height })); }}>
              <option value="1024x1024">1024 × 1024 · Cuadrada</option><option value="832x1216">832 × 1216 · Retrato</option><option value="1216x832">1216 × 832 · Paisaje</option><option value="768x768">768 × 768 · Menor consumo</option>
            </select></label>
            <div className="two-cols"><label>Pasos<input type="number" min={1} max={50} required value={settings.steps} onChange={e => change('steps', Number(e.target.value))} /></label><label>Guidance<input type="number" min={1.1} max={10} step={0.1} required value={settings.guidance} onChange={e => change('guidance', Number(e.target.value))} /></label></div>
            <label>Sampler<select value={settings.sampler} onChange={e => change('sampler', e.target.value)}><option value="euler_a">Euler Ancestral</option><option value="euler">Euler</option></select></label>
            <label>Seed · −1 para aleatoria<input type="number" min={-1} max={4294967295} required value={settings.seed} onChange={e => change('seed', Number(e.target.value))} /></label>
            </div><div className="generate-action"><div className="generation-summary"><span>{settings.width} × {settings.height}</span><span>{settings.steps} pasos</span><span>{settings.nsfw ? 'NSFW' : 'SFW'}</span></div><button className="generate-button" type="submit" disabled={!connected || !modelReady || !settings.prompt.trim()}>{busy ? <LoaderCircle className="spinner" size={19} /> : <WandSparkles size={19} />}{busy ? 'Creando tu ilustración…' : 'Generar imagen'}</button></div>
          </fieldset>
        </form>
        {!modelReady && connected && <p role="status" className="notice">Modelo pendiente. Ejecuta backend/download_model.py.</p>}
        {busy && <button className="cancel-button" disabled={!job?.id || cancelPending} onClick={async () => { try { setCancelPending(true); const reply = await api<{message: string}>(`jobs/${job?.id}/cancel`, {}); setNotice(reply.message); } catch(e) { setError(String(e)); setCancelPending(false); } }}><Square size={14} /> {cancelPending ? 'Cancelación solicitada…' : 'Cancelar generación'}</button>}
        {error && <p className="error" role="alert">{error}</p>}{notice && <p className="notice" role="status">{notice}</p>}
      </section>
      <section className="results" aria-label="Resultados">
        <div className="row"><div><span className="eyebrow">TU ESPACIO CREATIVO</span><h2>Vista previa</h2></div><span className="model-label"><Sparkles size={13} /> Animagine XL 4.0</span></div>
        <div className={`preview ${busy ? 'is-generating' : ''}`} aria-busy={busy}>{selected ? <motion.img key={selected.id} initial={reduceMotion ? false : {opacity:0,scale:0.985}} animate={{opacity:1,scale:1}} transition={{duration:0.25}} src={`/api/images/${selected.id}/file`} alt={selected.prompt} /> : <div className="empty"><span>✦</span><h2>Tu próxima ilustración empieza aquí</h2><p>Escribe una idea y genera en tu equipo.</p></div>}{busy && <div className="generation-overlay" role="status" aria-live="polite"><div className="generation-orbit"><LoaderCircle size={52} className="spinner" /><Sparkles size={20} /></div><span className="eyebrow">TU IDEA ESTÁ TOMANDO FORMA</span><h3>{!job || job.status === 'queued' ? 'Preparando el lienzo' : job.status === 'loading' ? 'Preparando el modelo' : job.status === 'encoding' ? 'Interpretando tu prompt' : job.status === 'decoding' ? 'Revelando tu ilustración' : job.completed_steps >= job.steps ? 'Revelando tu ilustración' : 'Creando tu ilustración'}</h3><p>{job?.status === 'loading' ? 'La primera carga puede tardar más. El modelo se conserva para las siguientes imágenes.' : job?.status === 'running' && job.completed_steps < job.steps ? `Paso ${job.completed_steps} de ${job.steps}` : 'Espera un momento; la generación sigue en tu equipo.'}</p><span className="elapsed-time">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')} transcurridos</span></div>}</div>
        {job && <div className="progress" role="status"><p>{({ queued: 'En espera', loading: 'Cargando modelo en RAM/GPU…', encoding: 'Interpretando el prompt…', decoding: 'Decodificando y guardando…', running: 'Generando', done: 'Imagen guardada', cancelled: 'Generación cancelada', error: 'No se pudo generar' } as Record<string,string>)[job.status]}{job.status === 'running' && ` · ${job.completed_steps}/${job.steps} pasos${job.completed_steps === job.steps ? ' · Decodificando y guardando…' : ''}`}</p>{busy && <progress max={job.steps} value={job.status === 'running' ? job.completed_steps : undefined} />}</div>}
        {selected && <div className="result-info"><div className="saved-label"><Check size={14} /> Imagen {selected.nsfw ? 'NSFW' : 'SFW'} guardada · {selected.shared ? 'Compartida por tu preferencia' : 'Privada'}</div><div className="image-stats"><span><small>Resolución</small>{selected.width} × {selected.height}</span><span><small>Pasos</small>{selected.steps}</span><span><small>Tiempo total</small>{selected.seconds} s</span><span><small>Seed</small>{selected.seed}</span></div><details className="control-help"><summary>Detalles de rendimiento</summary><p>Pico PyTorch: {selected.peak_vram_mib} MiB</p>{selected.load_seconds !== undefined && <p>Carga: {selected.load_seconds} s · Texto: {selected.encoding_seconds ?? 0} s · Inferencia: {selected.inference_seconds} s</p>}</details><div className="row"><a download href={`/api/images/${selected.id}/file`}><Download size={15} /> Descargar PNG</a><a download href={`/api/images/${selected.id}/metadata`}><SlidersHorizontal size={15} /> Parámetros</a><button onClick={() => reuse(selected)}><RotateCcw size={15} /> Reutilizar ajustes</button></div></div>}
        <div className="row gallery-heading"><h2 className="icon-heading"><ImageIcon size={17} /> Mi galería</h2><span>{gallery.length} imágenes</span></div>
        <div className="gallery">{gallery.map(image => <button className={selected?.id === image.id ? 'is-selected' : ''} key={image.id} onClick={() => setSelected(image)} aria-label={`Ver imagen, seed ${image.seed}`}><img loading="lazy" src={`/api/images/${image.id}/file`} alt={image.prompt} /><span>{image.nsfw ? 'NSFW' : 'SFW'} · Seed {image.seed}</span></button>)}</div>
        {!gallery.length && <p className="hint">Las imágenes reales aparecerán aquí y se conservarán en tu carpeta privada de esta sesión.</p>}
        <footer>FP16 · Descarga de componentes a RAM · Inferencia sin conexión tras instalar · CreativeML Open RAIL++-M</footer>
      </section>
    </motion.main>
  </div>;
}
