import { GithubMark, LinkedinMark } from './components/SocialMarks';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Cpu, Download, Image, Layers, Mail, Monitor, ShieldCheck, Sparkles, Terminal, WandSparkles, Zap } from 'lucide-react';
import SessionControls from './components/SessionControls';
import { IS_LOCAL_STUDIO } from './services/runtime';
import './local.css';
type Artwork = { id: string; prompt: string; steps: number; width: number; height: number };
export default function LocalHome() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  useEffect(() => {
    if (!IS_LOCAL_STUDIO) return;
    const controller = new AbortController();
    fetch('/api/public/gallery', { signal: controller.signal }).then(r => { if (!r.ok) throw new Error('gallery'); return r.json(); }).then(setArtworks).catch(() => {});
    return () => controller.abort();
  }, []);
  return <div id="top" className="studio home-page home-refined">
    <header className="studio-header"><Link to="/" className="brand"><Sparkles size={23} /> Mystikal <span>AI</span></Link><nav className="site-nav" aria-label="Navegación principal"><a href="#como-funciona">Cómo funciona</a><a href="#tecnologia">Tecnología</a><SessionControls /><Link className="nav-cta" to="/generate">{IS_LOCAL_STUDIO ? 'Abrir estudio' : 'Usar en mi PC'} <ArrowUpRight size={15} /></Link></nav></header>
    <main>
      <section className="home-hero">
        <div className="hero-copy"><span className="pill"><span className="status-dot" /> TU ESTUDIO DE ANIME LOCAL</span><h1 className="spotlight-title" onPointerMove={event => {
          if (event.pointerType === 'touch') return;
          const bounds = event.currentTarget.getBoundingClientRect();
          event.currentTarget.style.setProperty('--light-x', `${event.clientX - bounds.left}px`);
          event.currentTarget.style.setProperty('--light-y', `${event.clientY - bounds.top}px`);
          event.currentTarget.style.setProperty('--light-active', '1');
        }} onPointerLeave={event => event.currentTarget.style.setProperty('--light-active', '0')}>
          <span className="title-line">Tu universo anime.</span><span className="title-line title-accent">Hecho en tu GPU.</span>
          <span className="title-glow" aria-hidden="true"><span className="title-line">Tu universo anime.</span><span className="title-line">Hecho en tu GPU.</span></span>
        </h1><p>Un estudio personal de ilustración anime. Describe tu mundo, explora personajes y conserva cada creación en tu equipo.</p><div className="hero-actions"><Link className="primary-link" to="/generate"><WandSparkles size={18} /> {IS_LOCAL_STUDIO ? 'Empezar a crear' : 'Abrir mi estudio local'} <ArrowRight size={18} /></Link><a className="text-link" href="#como-funciona">Descubre cómo funciona ↓</a></div><div className="hero-facts"><span><Cpu size={15} /> Generación local</span><span><ShieldCheck size={15} /> Sin créditos por imagen</span><span><Download size={15} /> Tus archivos, en tu PC</span></div></div>
        <div className="hero-art"><img src="/images/mystikal-home-v1.png" alt="Exploradora de cabello violeta en un balcón sobre una ciudad fantástica iluminada al atardecer" width={1120} height={1400} fetchPriority="high" /><div className="art-top-label"><span className="status-dot" /> ILUSTRACIÓN DE PORTADA</div><div className="art-caption"><span>UN UNIVERSO DE POSIBILIDADES</span><strong>Donde nacen tus mundos.</strong><span>Arte promocional creado para Mystikal · SFW</span></div></div>
      </section>
      <div className="tech-strip"><span>CONSTRUIDO CON</span><strong>React + TypeScript</strong><span>✦</span><strong>FastAPI</strong><span>✦</span><strong>PyTorch + CUDA</strong><span>✦</span><strong>Diffusers · SDXL</strong></div>
      <section className="home-section" id="como-funciona"><div className="section-title"><div><span className="eyebrow">DE LA IDEA A LA ILUSTRACIÓN</span><h2>Imagina. Ajusta. Crea.</h2></div><p>Tres pasos para empezar.<br />Tu imaginación marca el camino.</p></div><div className="feature-grid">{[
        { icon: <WandSparkles />, number: '01', title: 'Describe tu idea', text: 'Combina escena, iluminación y estilo en Base prompt. Usa Undesired para indicar lo que quieres evitar.' },
        { icon: <Layers />, number: '02', title: 'Dale tu dirección', text: 'Organiza descripciones en tarjetas y elige resolución, pasos, guidance y seed. Las tarjetas comparten el mismo prompt.' },
        { icon: <Image />, number: '03', title: 'Conserva cada detalle', text: 'Genera en tu GPU, descarga el PNG y recupera los ajustes de cualquier imagen guardada en la galería local.' },
      ].map(card => <article className="feature-card" key={card.number}><div className="row"><div className="icon-tile">{card.icon}</div><span className="card-number">{card.number}</span></div><h3>{card.title}</h3><p>{card.text}</p></article>)}</div></section>
      <section className="home-section technology-section" id="tecnologia"><div className="technology-copy"><span className="eyebrow">DETRÁS DEL LIENZO</span><h2>Un estudio local.<br /><span>Un proceso transparente.</span></h2><p>Mystikal AI nació como proyecto de un curso de IA generativa. Hoy es un estudio personal que conecta una interfaz React con un modelo anime ejecutado en tu equipo.</p><div className="architecture"><span><Monitor size={17} /> Interfaz React</span><ArrowRight size={17} /><span><Terminal size={17} /> API Python</span><ArrowRight size={17} /><span><Cpu size={17} /> GPU NVIDIA</span></div><a className="text-link" href="https://huggingface.co/cagliostrolab/animagine-xl-4.0" target="_blank" rel="noreferrer">Conocer el modelo oficial <ArrowUpRight size={15} /></a></div><div className="stack-cards"><article><Cpu /><div><h3>Inferencia en tu equipo</h3><p>PyTorch y CUDA ejecutan Animagine XL 4.0 mediante Diffusers. Los componentes se mueven entre RAM y GPU para ahorrar VRAM.</p></div></article><article><ShieldCheck /><div><h3>Archivos bajo tu control</h3><p>Imágenes y parámetros se guardan en disco. Después de instalar modelo y dependencias, puedes generar sin conexión.</p></div></article><article><Zap /><div><h3>Una creación a la vez</h3><p>El procesamiento secuencial evita cargas simultáneas. El tiempo varía con la resolución, los pasos y los recursos disponibles.</p></div></article></div></section>
      {artworks.length > 0 && <section className="home-section"><div className="section-title"><div><span className="eyebrow">COMPARTIDO POR SUS CREADORES</span><h2>Una ventana a la imaginación.</h2></div><Link className="text-link" to="/generate">Ir a la galería del estudio <ArrowRight size={16} /></Link></div><div className="home-gallery">{artworks.slice(0, 3).map(art => <Link to="/generate" key={art.id}><img src={`/api/images/${art.id}/file`} alt={art.prompt} loading="lazy" /><span>{art.width} × {art.height}<ArrowUpRight size={18} /></span></Link>)}</div></section>}
      <section className="home-cta"><div><span className="eyebrow">DALE FORMA A LO QUE IMAGINAS</span><h2>Tu siguiente mundo empieza aquí.</h2><p>Escribe la primera idea. El resto comienza en el lienzo.</p></div><Link className="primary-link" to="/generate">Entrar al generador <ArrowRight size={18} /></Link></section>
    </main>
    <footer className="home-footer developer-footer"><div className="footer-main"><div className="footer-project"><Link className="brand" to="/"><Sparkles size={20} /> Mystikal AI</Link><p>Un espacio donde el código y la imaginación se encuentran.</p><span className="footer-local"><span className="status-dot" /> Ilustración anime · Generación local</span></div><div className="footer-developer"><span className="eyebrow">DISEÑO Y DESARROLLO</span><h2>mxrtnn<span>_dev</span></h2><p>Detrás de Mystikal AI está mxrtnn_dev: explorando la inteligencia artificial generativa y dando forma a una experiencia creativa con React, Python y herramientas de código abierto.</p><div className="developer-skills"><span>Desarrollo web</span><span>IA generativa</span><span>Proyectos personales</span></div></div><div className="footer-contact"><span className="eyebrow">CONECTEMOS</span><div className="neon-socials"><button type="button" disabled aria-label="GitHub de mxrtnn_dev, próximamente" title="GitHub · Próximamente"><GithubMark size={20} /></button><button type="button" disabled aria-label="LinkedIn de mxrtnn_dev, próximamente" title="LinkedIn · Próximamente"><LinkedinMark size={20} /></button><button type="button" disabled aria-label="Correo de mxrtnn_dev, próximamente" title="Correo · Próximamente"><Mail size={20} /></button></div><p>Próximamente, más formas de conectar.</p></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} mxrtnn_dev · Creado con curiosidad y código.</span><span>Animagine XL 4.0 · CreativeML Open RAIL++-M</span><a href="#top">Volver arriba ↑</a></div></footer>
  </div>;
}
