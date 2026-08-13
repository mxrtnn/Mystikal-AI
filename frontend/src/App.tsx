import { useState, useEffect } from 'react';
import './App.css';

type Tab = 'home' | 'generate' | 'gallery';

export default function App() {
  // Estados para controlar la interfaz
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');

  // Cambiar de pestaña
  const switchTab = (tabName: Tab) => {
    setActiveTab(tabName);
    setIsMobileMenuOpen(false);
  };

  // Abrir/cerrar menú móvil
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  // Usar un prompt desde otra sección
  const usePrompt = (text: string) => {
    setPromptText(text);
    switchTab('generate');
  };

  // Agregar etiquetas al prompt
  const appendTag = (tag: string) => {
    setPromptText((prev) => (prev ? `${prev}, ${tag}` : tag));
  };

  // Generar un prompt aleatorio
  const randomizePrompt = () => {
    const prompts = [
      'Un astronauta flotando en un océano violeta, luces neón, 8k',
      'Ciudad ciberpunk bajo la lluvia, reflejos de neón, cinematográfico',
      'Retrato de un elfo del bosque, estilo anime, colores vibrantes',
      'Un auto deportivo futurista en Marte, fotorrealista, Unreal Engine 5',
    ];

    const randomPrompt =
      prompts[Math.floor(Math.random() * prompts.length)];

    setPromptText(randomPrompt);
  };

  // Estilos adicionales que estaban dentro del HTML original
  useEffect(() => {
    const style = document.createElement('style');

    style.innerHTML = `
      .material-symbols-outlined {
        font-variation-settings:
          'FILL' 0,
          'wght' 400,
          'GRAD' 0,
          'opsz' 24;
      }

      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        background: #0b1326;
      }

      ::-webkit-scrollbar-thumb {
        background: #27334d;
        border-radius: 4px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: #3b4968;
      }

      @keyframes pulse-glow {
        0%,
        100% {
          opacity: 0.4;
          transform: scale(1);
        }

        50% {
          opacity: 0.7;
          transform: scale(1.05);
        }
      }

      .animate-glow {
        animation: pulse-glow 8s ease-in-out infinite;
      }

      .glass-panel {
        background: rgba(15, 23, 42, 0.7);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
    `;

    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="bg-[#0b1326] text-[#dae2fd] min-h-screen selection:bg-[#d0bcff]/30 selection:text-[#d0bcff] flex flex-col font-sans">

      {/* =========================
          NAVBAR
      ========================== */}
      <nav className="fixed top-0 w-full z-50 bg-[#0b1326]/80 backdrop-blur-xl border-b border-white/10 shadow-sm transition-all duration-300">
        <div className="flex justify-between items-center h-16 px-4 md:px-10 max-w-[1440px] mx-auto">

          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => switchTab('home')}
          >
            <span
              className="material-symbols-outlined text-[#d0bcff] text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              generating_tokens
            </span>

            <div className="flex flex-col">
              <span className="text-2xl font-bold text-[#d0bcff] tracking-tight leading-none">
                Lumina{' '}
                <span className="text-[#4cd7f6] text-xs font-normal">
                  Mystikal
                </span>
              </span>
            </div>
          </div>

          {/* Navegación Desktop */}
          <ul className="hidden md:flex items-center gap-8 text-base">
            <li>
              <button
                onClick={() => switchTab('home')}
                className={`font-bold pb-1 transition-all ${
                  activeTab === 'home'
                    ? 'text-[#d0bcff] border-b-2 border-[#d0bcff]'
                    : 'text-[#cbc3d7] hover:text-[#dae2fd]'
                }`}
              >
                Inicio
              </button>
            </li>

            <li>
              <button
                onClick={() => switchTab('generate')}
                className={`font-bold pb-1 transition-all ${
                  activeTab === 'generate'
                    ? 'text-[#d0bcff] border-b-2 border-[#d0bcff]'
                    : 'text-[#cbc3d7] hover:text-[#dae2fd]'
                }`}
              >
                Generar IA
              </button>
            </li>

            <li>
              <button
                onClick={() => switchTab('gallery')}
                className={`font-bold pb-1 transition-all ${
                  activeTab === 'gallery'
                    ? 'text-[#d0bcff] border-b-2 border-[#d0bcff]'
                    : 'text-[#cbc3d7] hover:text-[#dae2fd]'
                }`}
              >
                Mis Imágenes
              </button>
            </li>
          </ul>

          {/* Estado y acciones */}
          <div className="flex items-center gap-4">

            {/* Estado GPU */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#171f33] border border-white/10 text-xs cursor-pointer hover:border-[#d0bcff]/50 transition-colors">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>

              <span className="text-[#cbc3d7] text-[11px] font-mono">
                RTX 5060 Online
              </span>
            </div>

            {/* Botón Crear */}
            <button
              onClick={() => switchTab('generate')}
              className="hidden md:flex bg-gradient-to-r from-[#d0bcff] to-[#4cd7f6] text-[#0b1326] text-base font-semibold px-6 py-2 rounded-full hover:shadow-[0_0_20px_rgba(208,188,255,0.4)] transition-all duration-300 active:scale-95 items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">
                auto_awesome
              </span>

              Crear
            </button>

            {/* Menú móvil */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden text-[#dae2fd] p-1"
              aria-label="Abrir menú"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="material-symbols-outlined text-3xl">
                menu
              </span>
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#222a3d] border-b border-white/10 px-6 py-4 flex flex-col gap-4">
            <button
              onClick={() => switchTab('home')}
              className="text-left py-2 font-medium text-[#dae2fd] border-b border-white/5"
            >
              Inicio
            </button>

            <button
              onClick={() => switchTab('generate')}
              className="text-left py-2 font-medium text-[#dae2fd] border-b border-white/5"
            >
              Generar IA
            </button>

            <button
              onClick={() => switchTab('gallery')}
              className="text-left py-2 font-medium text-[#dae2fd]"
            >
              Mis Imágenes
            </button>
          </div>
        )}
      </nav>

      {/* =========================
          CONTENIDO PRINCIPAL
      ========================== */}
      <main className="pt-16 flex-grow">

        {/* =========================
            HOME
        ========================== */}
        {activeTab === 'home' && (
          <section className="animate-in fade-in duration-500">

            {/* Hero */}
            <div className="relative min-h-[85vh] flex flex-col justify-center items-center pt-16 pb-16 px-4 md:px-10 overflow-hidden">

              {/* Glow izquierdo */}
              <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] bg-[#d0bcff]/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-glow"></div>

              {/* Glow derecho */}
              <div
                className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] bg-[#4cd7f6]/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none animate-glow"
                style={{ animationDelay: '1s' }}
              ></div>

              {/* Contenido principal */}
              <div className="z-10 max-w-4xl mx-auto text-center flex flex-col items-center gap-8">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#171f33]/80 border border-white/10 backdrop-blur-md mb-2">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-sm">
                    auto_awesome
                  </span>

                  <span className="text-xs text-[#4cd7f6] font-mono">
                    Mystikal Engine v2.0 - Activo con PyTorch
                  </span>
                </div>

                {/* Título */}
                <h1 className="text-5xl md:text-[72px] leading-tight tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-[#cbc3d7] font-extrabold drop-shadow-sm">
                  Turn Imagination
                  <br />
                  into Digital Art
                </h1>

                {/* Descripción */}
                <p className="text-lg text-[#cbc3d7] max-w-2xl">
                  Vive la nueva generación de libertad creativa. Utiliza redes
                  neuronales avanzadas para generar imágenes de alta
                  fidelidad en cuestión de segundos.
                </p>

                {/* Botones */}
                <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full sm:w-auto">

                  <button
                    onClick={() => switchTab('generate')}
                    className="w-full sm:w-auto bg-gradient-to-r from-[#d0bcff] to-[#4cd7f6] text-[#0b1326] text-lg font-semibold px-8 py-4 rounded-xl hover:shadow-[0_0_30px_rgba(208,188,255,0.5)] transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                  >
                    Comenzar a Generar

                    <span className="material-symbols-outlined">
                      arrow_forward
                    </span>
                  </button>

                  <button
                    onClick={() => switchTab('gallery')}
                    className="w-full sm:w-auto bg-[#171f33]/50 border border-white/10 backdrop-blur-md text-[#dae2fd] text-lg px-8 py-4 rounded-xl hover:bg-[#2d3449] transition-colors duration-300 active:scale-95 flex items-center justify-center gap-2"
                  >
                    Ver Galería
                  </button>
                </div>
              </div>

              {/* Banner */}
              <div className="w-full max-w-[1440px] mt-16 relative h-64 md:h-96 rounded-2xl overflow-hidden border border-white/10 shadow-2xl z-0">

                <div
                  className="bg-cover bg-center w-full h-full opacity-70"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop')",
                  }}
                ></div>

                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1326] via-transparent to-transparent"></div>

                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">

                  {/* Prompt destacado */}
                  <div className="bg-[#0b1326]/60 backdrop-blur-md p-4 rounded-xl border border-white/10 max-w-lg hidden md:block">
                    <span className="text-xs text-[#4cd7f6] font-mono mb-1 block">
                      PROMPT DESTACADO
                    </span>

                    <p className="text-sm font-medium text-white truncate">
                      "Futuristic cyberpunk city at twilight, glowing neon
                      purple lights..."
                    </p>
                  </div>

                  {/* Usar prompt */}
                  <button
                    onClick={() =>
                      usePrompt(
                        'Futuristic cyberpunk city at twilight, glowing neon purple lights, volumetric fog, ultra detailed 8k'
                      )
                    }
                    className="bg-[#d0bcff]/20 hover:bg-[#d0bcff]/30 border border-[#d0bcff]/40 text-[#d0bcff] px-4 py-2 rounded-lg text-xs font-semibold backdrop-blur-md transition-all"
                  >
                    Usar este Prompt
                  </button>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="py-24 px-4 md:px-10 bg-[#131b2e] border-t border-white/5">
              <div className="max-w-[1440px] mx-auto">

                {/* Título */}
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Diseñado para Creadores
                  </h2>

                  <p className="text-base text-[#cbc3d7] max-w-xl mx-auto">
                    Herramientas profesionales empaquetadas en una interfaz
                    intuitiva conectada a tu backend FastAPI.
                  </p>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* Card 1 */}
                  <div className="glass-panel rounded-2xl p-8 flex flex-col gap-6 hover:-translate-y-1 transition-transform duration-300 group">
                    <div className="w-14 h-14 rounded-xl bg-[#d0bcff]/10 flex items-center justify-center border border-[#d0bcff]/20 group-hover:bg-[#d0bcff]/20 transition-colors">
                      <span className="material-symbols-outlined text-[#d0bcff] text-3xl">
                        bolt
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold mb-2">
                        Creación Instantánea
                      </h3>

                      <p className="text-[#cbc3d7] leading-relaxed">
                        Generación optimizada aprovechando la aceleración por
                        hardware PyTorch CUDA de tu tarjeta gráfica.
                      </p>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="glass-panel rounded-2xl p-8 flex flex-col gap-6 hover:-translate-y-1 transition-transform duration-300 group">
                    <div className="w-14 h-14 rounded-xl bg-[#4cd7f6]/10 flex items-center justify-center border border-[#4cd7f6]/20 group-hover:bg-[#4cd7f6]/20 transition-colors">
                      <span className="material-symbols-outlined text-[#4cd7f6] text-3xl">
                        tune
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold mb-2">
                        Control Estilístico
                      </h3>

                      <p className="text-[#cbc3d7] leading-relaxed">
                        Ajusta dimensiones, prompts negativos y estilos
                        personalizados con total flexibilidad.
                      </p>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="glass-panel rounded-2xl p-8 flex flex-col gap-6 hover:-translate-y-1 transition-transform duration-300 group">
                    <div className="w-14 h-14 rounded-xl bg-[#e364a7]/10 flex items-center justify-center border border-[#e364a7]/20 group-hover:bg-[#e364a7]/20 transition-colors">
                      <span className="material-symbols-outlined text-[#ffafd3] text-3xl">
                        all_inclusive
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold mb-2">
                        Variedad Infinita
                      </h3>

                      <p className="text-[#cbc3d7] leading-relaxed">
                        Rompe el bloqueo creativo explorando un espectro
                        ilimitado desde fotorrealismo hasta arte conceptual.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================
            GENERATOR
        ========================== */}
        {activeTab === 'generate' && (
          <section className="animate-in fade-in duration-500 py-8 px-4 md:px-10 max-w-[1440px] mx-auto">

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* Panel izquierdo */}
              <div className="lg:col-span-5 flex flex-col gap-6">

                <div className="glass-panel p-6 rounded-2xl border border-white/10">

                  {/* Header */}
                  <div className="flex justify-between items-center mb-4">

                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#d0bcff]">
                        auto_awesome
                      </span>

                      Prompt Studio
                    </h2>

                    <button
                      onClick={randomizePrompt}
                      className="text-xs text-[#4cd7f6] hover:text-white flex items-center gap-1 bg-[#4cd7f6]/10 px-3 py-1 rounded-full border border-[#4cd7f6]/20 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">
                        casino
                      </span>

                      Aleatorio
                    </button>
                  </div>

                  {/* Prompt */}
                  <div className="relative mb-4">
                    <textarea
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      rows={4}
                      className="w-full bg-[#060e20] border border-white/10 rounded-xl p-4 text-[#dae2fd] placeholder:text-[#958ea0] focus:outline-none focus:border-[#d0bcff] transition-colors resize-none text-sm"
                      placeholder="Describe la imagen que deseas crear con detalle..."
                    />
                  </div>

                  {/* Tags */}
                  <div className="mb-6">
                    <label className="text-xs text-[#cbc3d7] mb-2 block font-mono">
                      Sugerencias rápidas:
                    </label>

                    <div className="flex flex-wrap gap-2">

                      <button
                        onClick={() =>
                          appendTag('Cyberpunk neon lighting')
                        }
                        className="text-xs bg-[#171f33] hover:bg-[#2d3449] border border-white/5 px-2.5 py-1 rounded-lg text-[#cbc3d7] transition-colors"
                      >
                        + Cyberpunk
                      </button>

                      <button
                        onClick={() =>
                          appendTag('Cinematic 8k resolution')
                        }
                        className="text-xs bg-[#171f33] hover:bg-[#2d3449] border border-white/5 px-2.5 py-1 rounded-lg text-[#cbc3d7] transition-colors"
                      >
                        + Cine 8K
                      </button>

                      <button
                        onClick={() => appendTag('Anime studio style')}
                        className="text-xs bg-[#171f33] hover:bg-[#2d3449] border border-white/5 px-2.5 py-1 rounded-lg text-[#cbc3d7] transition-colors"
                      >
                        + Anime
                      </button>

                    </div>
                  </div>

                  {/* Estilo */}
                  <div className="mb-6">

                    <label className="text-xs text-[#cbc3d7] mb-2 block font-mono">
                      Estilo Visual:
                    </label>

                    <div className="grid grid-cols-3 gap-2">

                      {/* General */}
                      <button
                        onClick={() => setSelectedStyle('')}
                        className={`p-2 rounded-xl text-center flex flex-col items-center gap-1 transition-all ${
                          selectedStyle === ''
                            ? 'border-2 border-[#d0bcff] bg-[#d0bcff]/10'
                            : 'border border-white/10 bg-[#131b2e]'
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-xl ${
                            selectedStyle === ''
                              ? 'text-[#d0bcff]'
                              : 'text-gray-400'
                          }`}
                        >
                          palette
                        </span>

                        <span className="text-[11px] text-white">
                          General
                        </span>
                      </button>

                      {/* Realista */}
                      <button
                        onClick={() =>
                          setSelectedStyle(
                            ', ultra photorealistic, 8k, DSLR photograph'
                          )
                        }
                        className={`p-2 rounded-xl text-center flex flex-col items-center gap-1 transition-all ${
                          selectedStyle.includes('photorealistic')
                            ? 'border-2 border-[#4cd7f6] bg-[#4cd7f6]/10'
                            : 'border border-white/10 bg-[#131b2e]'
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-xl ${
                            selectedStyle.includes('photorealistic')
                              ? 'text-[#4cd7f6]'
                              : 'text-gray-400'
                          }`}
                        >
                          photo_camera
                        </span>

                        <span className="text-[11px] text-white">
                          Realista
                        </span>
                      </button>

                      {/* Anime */}
                      <button
                        onClick={() =>
                          setSelectedStyle(
                            ', anime style, vibrant colors'
                          )
                        }
                        className={`p-2 rounded-xl text-center flex flex-col items-center gap-1 transition-all ${
                          selectedStyle.includes('anime')
                            ? 'border-2 border-[#ffafd3] bg-[#ffafd3]/10'
                            : 'border border-white/10 bg-[#131b2e]'
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-xl ${
                            selectedStyle.includes('anime')
                              ? 'text-[#ffafd3]'
                              : 'text-gray-400'
                          }`}
                        >
                          draw
                        </span>

                        <span className="text-[11px] text-white">
                          Anime
                        </span>
                      </button>

                    </div>
                  </div>

                  {/* Generar */}
                  <button
                    className="w-full bg-gradient-to-r from-[#d0bcff] to-[#4cd7f6] text-[#0b1326] font-bold py-4 rounded-xl shadow-lg hover:shadow-[0_0_25px_rgba(208,188,255,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    type="button"
                  >
                    <span className="material-symbols-outlined">
                      auto_awesome
                    </span>

                    <span>GENERAR IMAGEN</span>
                  </button>

                </div>
              </div>

              {/* Panel derecho */}
              <div className="lg:col-span-7 flex flex-col gap-4">

                <div className="glass-panel border border-white/10 rounded-2xl h-[500px] flex flex-col items-center justify-center relative overflow-hidden">

                  <div className="text-center opacity-50 flex flex-col items-center">

                    <span className="material-symbols-outlined text-6xl mb-4">
                      image
                    </span>

                    <p>
                      El lienzo está vacío. ¡Escribe un prompt y genera magia!
                    </p>

                  </div>

                </div>
              </div>

            </div>
          </section>
        )}

        {/* =========================
            GALLERY
        ========================== */}
        {activeTab === 'gallery' && (
          <section className="animate-in fade-in duration-500 py-12 px-4 text-center">

            <span className="material-symbols-outlined text-6xl text-[#d0bcff] mb-4">
              photo_library
            </span>

            <h2 className="text-3xl font-bold mb-2">
              Tu Galería
            </h2>

            <p className="text-[#cbc3d7]">
              Aquí aparecerán tus creaciones una vez que conectemos el backend.
            </p>

          </section>
        )}

      </main>
    </div>
  );
}