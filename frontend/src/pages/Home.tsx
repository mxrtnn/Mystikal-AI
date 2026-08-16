import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Palette, Infinity as InfinityIcon, ArrowRight, Image as ImageIcon } from 'lucide-react';

function Home() {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className="relative min-h-screen bg-[#050914] text-white overflow-hidden select-none">
      
      {/* FONDO FUTURISTA: Rejilla Cibernética */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d15_1px,transparent_1px),linear-gradient(to_bottom,#1f293d15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050914]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-8">
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-2xl font-black tracking-wide text-[#d0bcff]"
          >
            <Sparkles className="w-6 h-6 text-[#4cd7f6] animate-pulse" />
            <span className="bg-gradient-to-r from-white via-[#d0bcff] to-[#4cd7f6] bg-clip-text text-transparent">
              Mystikal-AI
            </span>
          </motion.button>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wide">
            <button className="text-[#4cd7f6] transition-colors">
              Home
            </button>

            <button
              onClick={() => navigate('/generate')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Generate
            </button>

            <button
              onClick={() => navigate('/images')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              My Images
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Settings
            </button>
          </nav>

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(76,215,246,0.3)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
            className="rounded-full bg-gradient-to-r from-[#d0bcff] via-[#4cd7f6] to-[#d0bcff] bg-[length:200%_auto] hover:bg-right transition-all duration-500 px-6 py-2.5 font-bold text-[#050914] text-sm shadow-md"
          >
            Get Started
          </motion.button>
        </div>
      </header>

      {/* HERO SECTION CON SPOTLIGHT */}
      <main>
        <section 
          onMouseMove={handleMouseMove}
          className="relative min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-8 py-20 overflow-hidden"
        >

          {/* ESFERA PÚRPURA Y CIAN EN ÓRBITA GIRATORIA */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#7c3aed]/30 via-[#d0bcff]/20 to-[#4cd7f6]/30 rounded-full blur-[130px] pointer-events-none" 
          />

          {/* SPOTLIGHT REACTIVO AL MOUSE (EFECTO LINTERNA NEÓN) */}
          <div 
            className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-0"
            style={{
              background: `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(76, 215, 246, 0.18), rgba(208, 188, 255, 0.1) 40%, transparent 80%)`,
            }}
          />

          <div className="relative mx-auto max-w-6xl text-center z-10">

            {/* BADGE */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#4cd7f6]/30 bg-[#4cd7f6]/10 px-5 py-2 backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 text-[#4cd7f6]" />
              <span className="text-xs md:text-sm font-semibold tracking-wide text-[#4cd7f6]">
                Lumina Engine v2.0 · Now Live
              </span>
            </motion.div>

            {/* TÍTULO GIGANTE DEGRADADO */}
            <motion.h1 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight uppercase leading-none font-sans"
            >
              <span className="bg-gradient-to-r from-gray-500 via-gray-200 to-gray-500 bg-clip-text text-transparent hover:from-[#4cd7f6] hover:via-[#d0bcff] hover:to-[#4cd7f6] transition-all duration-700">
                Turn Imagination
              </span>
              <br />
              <span className="bg-gradient-to-r from-[#d0bcff] via-[#4cd7f6] to-[#d0bcff] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(76,215,246,0.3)]">
                Into Digital Art
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mt-8 max-w-2xl text-base md:text-lg leading-relaxed text-gray-400"
            >
              Experience the next generation of creative freedom. Harness the power of advanced neural networks to generate breathtaking imagery in seconds.
            </motion.p>

            {/* BOTONES */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(76,215,246,0.4)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/generate')}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d0bcff] via-[#4cd7f6] to-[#d0bcff] bg-[length:200%_auto] hover:bg-right transition-all duration-500 px-8 py-4 font-bold text-[#050914] text-base shadow-lg"
              >
                <span>Start Generating</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.3)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/images')}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#0d1527]/80 backdrop-blur-md px-8 py-4 font-semibold text-white transition-all hover:bg-[#131d33]"
              >
                <ImageIcon className="w-5 h-5 text-gray-400" />
                <span>View Gallery</span>
              </motion.button>
            </motion.div>

          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="relative bg-[#080d1a] border-t border-white/5 px-8 py-24 z-10">
          <div className="mx-auto max-w-6xl">

            <div className="text-center">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
                Engineered for Creators
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-gray-400 text-sm md:text-base">
                Professional-grade tools packaged in an intuitive interface.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">

              {/* CARD 1 */}
              <motion.div 
                whileHover={{ y: -6, borderColor: 'rgba(76,215,246,0.3)' }}
                className="rounded-3xl border border-white/10 bg-[#0d1527]/80 backdrop-blur-xl p-8 shadow-xl transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#4cd7f6]/10 border border-[#4cd7f6]/30 flex items-center justify-center mb-6 text-[#4cd7f6]">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Instant Creation
                </h3>
                <p className="leading-relaxed text-gray-400 text-sm">
                  Generate complex and beautiful imagery with an optimized AI pipeline.
                </p>
              </motion.div>

              {/* CARD 2 */}
              <motion.div 
                whileHover={{ y: -6, borderColor: 'rgba(208,188,255,0.3)' }}
                className="rounded-3xl border border-white/10 bg-[#0d1527]/80 backdrop-blur-xl p-8 shadow-xl transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#d0bcff]/10 border border-[#d0bcff]/30 flex items-center justify-center mb-6 text-[#d0bcff]">
                  <Palette className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Style Mastery
                </h3>
                <p className="leading-relaxed text-gray-400 text-sm">
                  Control composition, lighting, textures and visual styles with precision.
                </p>
              </motion.div>

              {/* CARD 3 */}
              <motion.div 
                whileHover={{ y: -6, borderColor: 'rgba(76,215,246,0.3)' }}
                className="rounded-3xl border border-white/10 bg-[#0d1527]/80 backdrop-blur-xl p-8 shadow-xl transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#4cd7f6]/10 border border-[#4cd7f6]/30 flex items-center justify-center mb-6 text-[#4cd7f6]">
                  <InfinityIcon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Unlimited Variety
                </h3>
                <p className="leading-relaxed text-gray-400 text-sm">
                  Explore an infinite spectrum of creative possibilities for any project.
                </p>
              </motion.div>

            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;