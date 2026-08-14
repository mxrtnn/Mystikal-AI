import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  const features = [
    {
      icon: 'bolt',
      title: 'Instant Creation',
      description:
        'Our optimized rendering pipeline delivers complex, high-quality outputs with near-zero latency.',
      iconClass:
        'text-[#d0bcff] bg-[#d0bcff]/10 border-[#d0bcff]/20 group-hover:bg-[#d0bcff]/20',
    },
    {
      icon: 'tune',
      title: 'Style Mastery',
      description:
        'Exert total control over composition, lighting, and texture with our advanced parameter suite.',
      iconClass:
        'text-[#4cd7f6] bg-[#4cd7f6]/10 border-[#4cd7f6]/20 group-hover:bg-[#4cd7f6]/20',
    },
    {
      icon: 'all_inclusive',
      title: 'Unlimited Variety',
      description:
        'Break through creative blocks with an infinite spectrum of styles, from photorealism to abstract expressionism.',
      iconClass:
        'text-[#ffafd3] bg-[#e364a7]/10 border-[#e364a7]/20 group-hover:bg-[#e364a7]/20',
    },
  ];

  const creations = [
    {
      title: 'Cosmic Lens',
      image:
        'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1400&auto=format&fit=crop',
      className: 'md:col-span-2 md:row-span-2',
    },
    {
      title: 'Celestial Bloom',
      image:
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop',
      className: '',
    },
    {
      title: 'Digital Structure',
      image:
        'https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=1000&auto=format&fit=crop',
      className: '',
    },
    {
      title: 'Creative Nexus',
      image:
        'https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?q=80&w=1200&auto=format&fit=crop',
      className: 'md:col-span-2',
    },
  ];

  return (
    <div className="min-h-screen bg-[#091122] text-[#e7e5ef] selection:bg-[#d0bcff]/30 selection:text-[#d0bcff]">

      {/* =========================================================
          NAVBAR
      ========================================================== */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#091122]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 md:px-10">

          {/* LOGO */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d0bcff]/30 bg-[#d0bcff]/10">
              <span className="material-symbols-outlined text-xl text-[#d0bcff]">
                auto_awesome
              </span>
            </div>

            <span className="text-xl font-bold tracking-tight text-[#d8c5ff] md:text-2xl">
              Lumina AI
            </span>
          </button>

          {/* NAVIGATION */}
          <nav className="hidden items-center gap-8 lg:flex">
            <button
              onClick={() => navigate('/')}
              className="relative pb-1 text-sm font-medium text-[#d0bcff]"
            >
              Home
              <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-[#d0bcff]" />
            </button>

            <button
              onClick={() => navigate('/generate')}
              className="text-sm font-medium text-[#c2c0cf] transition-colors hover:text-white"
            >
              Generate
            </button>

            <button
              onClick={() => navigate('/images')}
              className="text-sm font-medium text-[#c2c0cf] transition-colors hover:text-white"
            >
              My Images
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm font-medium text-[#c2c0cf] transition-colors hover:text-white"
            >
              Settings
            </button>
          </nav>

          {/* GET STARTED */}
          <button
            onClick={() => navigate('/login')}
            className="rounded-full bg-gradient-to-r from-[#d0bcff] to-[#4cd7f6] px-5 py-2.5 text-sm font-bold text-[#071020] shadow-[0_0_20px_rgba(76,215,246,0.12)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(208,188,255,0.25)]"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* =========================================================
          HERO
      ========================================================== */}
      <main className="pt-[72px]">

        <section className="relative overflow-hidden">

          {/* BACKGROUND GLOWS */}
          <div className="pointer-events-none absolute left-[10%] top-[20%] h-[420px] w-[420px] rounded-full bg-[#8f75ff]/20 blur-[140px]" />
          <div className="pointer-events-none absolute right-[8%] top-[26%] h-[350px] w-[350px] rounded-full bg-[#4cd7f6]/15 blur-[130px]" />
          <div className="pointer-events-none absolute left-1/2 top-[45%] h-[280px] w-[600px] -translate-x-1/2 rounded-full bg-[#5f72b9]/10 blur-[120px]" />

          <div className="relative mx-auto max-w-[1440px] px-5 pb-20 pt-16 md:px-10 md:pb-24 md:pt-24">

            {/* ENGINE BADGE */}
            <div className="mx-auto mb-7 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-[#121d34]/70 px-4 py-2 backdrop-blur-md">
              <span className="material-symbols-outlined text-sm text-[#4cd7f6]">
                auto_awesome
              </span>

              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#64d9f4] md:text-xs">
                Lumina Engine v2.0 · Now Live
              </span>
            </div>

            {/* TITLE */}
            <div className="mx-auto max-w-5xl text-center">
              <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.04em] text-white sm:text-6xl md:text-7xl lg:text-[88px]">
                Turn Imagination
                <br />
                <span className="bg-gradient-to-r from-white via-[#d9d2f5] to-[#b9b5c9] bg-clip-text text-transparent">
                  into Digital Art
                </span>
              </h1>

              <p className="mx-auto mt-8 max-w-2xl text-sm leading-7 text-[#bdbbcc] md:text-base">
                Experience the next generation of creative freedom. Harness the
                power of advanced neural networks to generate breathtaking,
                high-fidelity imagery in seconds.
              </p>
            </div>

            {/* HERO BUTTONS */}
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">

              <button
                onClick={() => navigate('/generate')}
                className="group flex min-w-[180px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d0bcff] to-[#4cd7f6] px-7 py-3.5 text-sm font-bold text-[#071020] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(116,213,255,0.2)]"
              >
                Start Generating

                <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </button>

              <button
                onClick={() => navigate('/images')}
                className="min-w-[140px] rounded-xl border border-white/10 bg-[#18253d] px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#22324f]"
              >
                View Gallery
              </button>
            </div>

            {/* HERO IMAGE */}
            <div className="relative mt-14 overflow-hidden rounded-2xl border border-white/10 bg-[#10182b] shadow-[0_20px_80px_rgba(0,0,0,0.35)] md:mt-16">

              <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#091122] via-transparent to-transparent" />

              <img
                src="https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=1800&auto=format&fit=crop"
                alt="Lumina AI creative interface"
                className="h-[300px] w-full object-cover opacity-75 md:h-[430px]"
              />

              {/* SMALL PREVIEW CARD */}
              <div className="absolute bottom-5 left-5 z-20 hidden rounded-xl border border-white/10 bg-[#091122]/70 px-4 py-3 backdrop-blur-xl md:block">
                <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-[#4cd7f6]">
                  Creative Nexus
                </p>

                <p className="mt-1 text-xs font-medium text-white/90">
                  Neural imagery generation · AI powered
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            ENGINEERED FOR CREATORS
        ========================================================== */}
        <section className="border-y border-white/5 bg-[#121b30]">
          <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-24">

            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold text-white md:text-4xl">
                Engineered for Creators
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#b6b4c4]">
                Professional-grade tools packaged in an intuitive,
                frictionless interface designed to accelerate your workflow.
              </p>
            </div>

            {/* FEATURE CARDS */}
            <div className="mt-14 grid gap-5 md:grid-cols-3">

              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-white/10 bg-[#10192d]/70 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-[#152039]"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-300 ${feature.iconClass}`}
                  >
                    <span className="material-symbols-outlined text-2xl">
                      {feature.icon}
                    </span>
                  </div>

                  <h3 className="mt-6 text-lg font-semibold text-white">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-[#b8b6c4]">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            RECENT CREATIONS
        ========================================================== */}
        <section className="bg-[#091122]">
          <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-24">

            {/* HEADER */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

              <div>
                <h2 className="text-2xl font-bold text-white md:text-3xl">
                  Recent Creations
                </h2>

                <p className="mt-2 text-sm text-[#aaa8b6]">
                  Explore masterpieces generated by the Lumina community.
                </p>
              </div>

              <button
                onClick={() => navigate('/images')}
                className="flex w-fit items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#d0bcff] transition-colors hover:text-white"
              >
                View All

                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </button>
            </div>

            {/* CREATION GRID */}
            <div className="mt-10 grid auto-rows-[180px] gap-3 md:grid-cols-4 md:auto-rows-[190px]">

              {creations.map((creation) => (
                <button
                  key={creation.title}
                  onClick={() => navigate('/images')}
                  className={`group relative overflow-hidden rounded-xl border border-white/10 bg-[#10182b] text-left ${creation.className}`}
                >
                  <img
                    src={creation.image}
                    alt={creation.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* OVERLAY */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-80" />

                  <div className="absolute bottom-4 left-4 right-4 translate-y-1 transition-transform duration-300 group-hover:translate-y-0">
                    <p className="text-xs font-semibold text-white">
                      {creation.title}
                    </p>

                    <p className="mt-1 text-[10px] text-white/60">
                      Generated with Lumina AI
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* =========================================================
          FOOTER
      ========================================================== */}
      <footer className="border-t border-white/10 bg-[#071020]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-7 text-center md:flex-row md:items-center md:justify-between md:px-10 md:text-left">

          <div className="flex items-center justify-center gap-2 md:justify-start">
            <span className="material-symbols-outlined text-[#d0bcff]">
              auto_awesome
            </span>

            <span className="text-sm font-medium text-[#d4cde5]">
              Lumina AI
            </span>
          </div>

          <p className="font-mono text-[10px] tracking-[0.08em] text-[#817d8c]">
            © 2024 Lumina AI. Boundless Creativity.
          </p>

          <div className="flex items-center justify-center gap-5 text-[10px] text-[#aaa5b5] md:justify-end">
            <button className="transition-colors hover:text-white">
              Terms of Service
            </button>

            <button className="transition-colors hover:text-white">
              Privacy Policy
            </button>

            <button className="transition-colors hover:text-white">
              Discord
            </button>

            <button className="transition-colors hover:text-white">
              Twitter
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;