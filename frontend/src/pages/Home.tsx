import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#091122] text-white">
      
      {/* NAVBAR */}
      <header className="border-b border-white/10 bg-[#091122]">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-8">
          
          <button
            onClick={() => navigate('/')}
            className="text-2xl font-bold text-[#d0bcff]"
          >
            ✦ Lumina AI
          </button>

          <nav className="flex items-center gap-8">
            <button className="text-[#d0bcff]">
              Home
            </button>

            <button
              onClick={() => navigate('/generate')}
              className="text-gray-300 hover:text-white"
            >
              Generate
            </button>

            <button
              onClick={() => navigate('/images')}
              className="text-gray-300 hover:text-white"
            >
              My Images
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-300 hover:text-white"
            >
              Settings
            </button>
          </nav>

          <button
            onClick={() => navigate('/login')}
            className="rounded-full bg-gradient-to-r from-[#d0bcff] to-[#4cd7f6] px-6 py-3 font-bold text-[#091122]"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* HERO */}
      <main>
        <section className="relative overflow-hidden px-8 py-32">

          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-purple-500/20 blur-[120px]" />

          <div className="absolute right-1/4 top-1/3 h-96 w-96 rounded-full bg-cyan-400/10 blur-[120px]" />

          <div className="relative mx-auto max-w-5xl text-center">

            <div className="mb-8 inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-2">
              <span className="text-sm text-[#4cd7f6]">
                ✦ Lumina Engine v2.0 · Now Live
              </span>
            </div>

            <h1 className="text-6xl font-black leading-tight md:text-8xl">
              Turn Imagination
              <br />
              <span className="bg-gradient-to-r from-white to-[#b8b1c9] bg-clip-text text-transparent">
                into Digital Art
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-gray-400">
              Experience the next generation of creative freedom.
              Harness the power of advanced neural networks to generate
              breathtaking imagery in seconds.
            </p>

            <div className="mt-10 flex justify-center gap-4">

              <button
                onClick={() => navigate('/generate')}
                className="rounded-xl bg-gradient-to-r from-[#d0bcff] to-[#4cd7f6] px-8 py-4 font-bold text-[#091122]"
              >
                Start Generating →
              </button>

              <button
                onClick={() => navigate('/images')}
                className="rounded-xl border border-white/10 bg-[#18253d] px-8 py-4 text-white"
              >
                View Gallery
              </button>

            </div>

          </div>
        </section>

        {/* FEATURES */}
        <section className="bg-[#121b30] px-8 py-24">

          <div className="mx-auto max-w-6xl">

            <div className="text-center">

              <h2 className="text-4xl font-bold">
                Engineered for Creators
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-gray-400">
                Professional-grade tools packaged in an intuitive interface.
              </p>

            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">

              <div className="rounded-2xl border border-white/10 bg-[#10192d] p-8">
                <div className="text-4xl">⚡</div>

                <h3 className="mt-6 text-xl font-bold">
                  Instant Creation
                </h3>

                <p className="mt-3 leading-7 text-gray-400">
                  Generate complex and beautiful imagery with an optimized
                  AI pipeline.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#10192d] p-8">
                <div className="text-4xl">🎨</div>

                <h3 className="mt-6 text-xl font-bold">
                  Style Mastery
                </h3>

                <p className="mt-3 leading-7 text-gray-400">
                  Control composition, lighting, textures and visual styles.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#10192d] p-8">
                <div className="text-4xl">∞</div>

                <h3 className="mt-6 text-xl font-bold">
                  Unlimited Variety
                </h3>

                <p className="mt-3 leading-7 text-gray-400">
                  Explore an infinite spectrum of creative possibilities.
                </p>
              </div>

            </div>
          </div>
        </section>

      </main>

    </div>
  );
}

export default Home;