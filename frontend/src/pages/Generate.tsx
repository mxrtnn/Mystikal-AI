import { useEffect, useState } from 'react';

type UserProfile = {
  id?: number | string;
  name?: string;
  email?: string;
  avatar?: string;
};

function Generate() {
  // =====================================================
  // ESTADOS
  // =====================================================

  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Photoreal');

  const [aspectRatio, setAspectRatio] = useState('16:9');

  const [customWidth, setCustomWidth] = useState(1024);
  const [customHeight, setCustomHeight] = useState(1024);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [user, setUser] = useState<UserProfile>({
    name: 'Usuario',
    email: '',
    avatar: '',
  });

  // =====================================================
  // OPCIONES
  // =====================================================

  const styles = [
    'Photoreal',
    'Anime',
    '3D Render',
    'Retro',
    'Cyberpunk',
    'Concept Art',
  ];

  const ratios = ['1:1', '16:9', '9:16', '4:3', 'custom'];

  // =====================================================
  // API
  // =====================================================

  const API_URL =
    import.meta.env.VITE_API_URL ||
    'https://mystikal-ai.onrender.com';

  // =====================================================
  // CARGAR USUARIO
  // =====================================================

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('mystikal_user');

      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);

        setUser({
          id: parsedUser.id,
          name: parsedUser.name || 'Usuario',
          email: parsedUser.email || '',
          avatar: parsedUser.avatar || '',
        });
      }
    } catch (error) {
      console.error('No se pudo cargar el perfil:', error);
    }
  }, []);

  // =====================================================
  // GENERAR IMAGEN
  // =====================================================

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Ingresa un prompt antes de generar.');
      return;
    }

    if (aspectRatio === 'custom') {
      if (
        customWidth < 256 ||
        customWidth > 1440 ||
        customHeight < 256 ||
        customHeight > 1440
      ) {
        alert(
          'Las dimensiones deben estar entre 256 y 1440 píxeles.'
        );
        return;
      }

      if (
        customWidth % 32 !== 0 ||
        customHeight % 32 !== 0
      ) {
        alert(
          'El ancho y alto deben ser múltiplos de 32.'
        );
        return;
      }
    }

    setLoading(true);

    try {
      const body = {
        prompt,
        style: selectedStyle,
        aspectRatio,

        ...(aspectRatio === 'custom'
          ? {
              width: customWidth,
              height: customHeight,
            }
          : {}),
      };

      console.log(
        '📤 Enviando a Mystikal:',
        body
      );

      const response = await fetch(
        `${API_URL}/api/generate`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      console.log(
        '📥 Respuesta del backend:',
        data
      );

      if (response.ok) {
        if (!data.imageUrl) {
          throw new Error(
            'El servidor no devolvió una imagen.'
          );
        }

        setImageUrl(data.imageUrl);
      } else {
        alert(
          data.details ||
          data.error ||
          'Error al generar la imagen'
        );
      }
    } catch (err) {
      console.error(
        '❌ Error:',
        err
      );

      alert(
        'Error al conectar con el servidor.'
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // NAVEGACIÓN
  // =====================================================

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // =====================================================
  // INTERFAZ
  // =====================================================

  return (
    <div className="min-h-screen bg-[#091122] text-white overflow-x-hidden">

      {/* =================================================
          FONDO ANIMADO
      ================================================= */}

      <div className="fixed inset-0 pointer-events-none overflow-hidden">

        {/* Glow superior izquierdo */}
        <div
          className="
            absolute
            -top-40
            -left-40
            w-[500px]
            h-[500px]
            rounded-full
            bg-[#d0bcff]/10
            blur-[120px]
            animate-pulse
          "
        />

        {/* Glow superior derecho */}
        <div
          className="
            absolute
            -top-20
            right-[-150px]
            w-[450px]
            h-[450px]
            rounded-full
            bg-[#4cd7f6]/10
            blur-[120px]
            animate-pulse
          "
          style={{
            animationDelay: '1.5s',
          }}
        />

        {/* Glow inferior */}
        <div
          className="
            absolute
            bottom-[-250px]
            left-1/2
            -translate-x-1/2
            w-[650px]
            h-[400px]
            rounded-full
            bg-[#7c5cff]/10
            blur-[140px]
            animate-pulse
          "
          style={{
            animationDelay: '3s',
          }}
        />

        {/* Grid */}
        <div
          className="
            absolute
            inset-0
            opacity-[0.035]
          "
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '70px 70px',
          }}
        />
      </div>

      {/* =================================================
          NAVBAR
      ================================================= */}

      <header
        className="
          sticky
          top-0
          z-50
          w-full
          border-b
          border-white/10
          bg-[#091122]/80
          backdrop-blur-xl
        "
      >
        <div
          className="
            max-w-[1600px]
            mx-auto
            h-16
            sm:h-[72px]
            px-4
            sm:px-6
            lg:px-8
            flex
            items-center
            justify-between
          "
        >

          {/* LOGO */}

          <a
            href="/"
            className="
              flex
              items-center
              gap-3
              group
            "
          >
            <div
              className="
                w-9
                h-9
                sm:w-10
                sm:h-10
                rounded-xl
                bg-gradient-to-br
                from-[#d0bcff]
                to-[#4cd7f6]
                flex
                items-center
                justify-center
                text-[#091122]
                font-black
                shadow-lg
                shadow-[#4cd7f6]/20
                transition-transform
                duration-300
                group-hover:scale-110
              "
            >
              ✦
            </div>

            <div className="flex flex-col leading-none">
              <span className="text-lg sm:text-xl font-black tracking-tight">
                Mystikal
              </span>

              <span className="text-[9px] sm:text-[10px] text-[#4cd7f6] tracking-[0.3em] uppercase">
                AI
              </span>
            </div>
          </a>

          {/* NAV DESKTOP */}

          <nav className="hidden md:flex items-center gap-2">

            <a
              href="/"
              className="
                px-4
                py-2
                rounded-lg
                text-sm
                text-gray-400
                hover:text-white
                hover:bg-white/5
                transition
              "
            >
              Inicio
            </a>

            <a
              href="/generate"
              className="
                px-4
                py-2
                rounded-lg
                text-sm
                text-white
                bg-white/5
                border
                border-white/10
              "
            >
              Generador
            </a>

            <a
              href="/images"
              className="
                px-4
                py-2
                rounded-lg
                text-sm
                text-gray-400
                hover:text-white
                hover:bg-white/5
                transition
              "
            >
              Mis imágenes
            </a>
          </nav>

          {/* USUARIO DESKTOP */}

          <a
            href="/profile"
            className="
              hidden
              md:flex
              items-center
              gap-3
              rounded-xl
              border
              border-white/10
              bg-white/[0.03]
              px-3
              py-2
              hover:bg-white/[0.07]
              hover:border-[#4cd7f6]/30
              transition
              group
            "
          >

            {user.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                className="
                  w-9
                  h-9
                  rounded-full
                  object-cover
                  border
                  border-[#4cd7f6]/30
                "
              />
            ) : (
              <div
                className="
                  w-9
                  h-9
                  rounded-full
                  bg-gradient-to-br
                  from-[#d0bcff]
                  to-[#4cd7f6]
                  flex
                  items-center
                  justify-center
                  text-[#091122]
                  font-bold
                  shadow-md
                "
              >
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}

            <div className="hidden lg:block text-left">
              <p className="text-sm font-semibold text-white max-w-[120px] truncate">
                {user.name || 'Usuario'}
              </p>

              <p className="text-[10px] text-gray-500">
                Mi perfil
              </p>
            </div>
          </a>

          {/* MOBILE MENU BUTTON */}

          <button
            onClick={() =>
              setMobileMenuOpen(!mobileMenuOpen)
            }
            className="
              md:hidden
              w-10
              h-10
              rounded-xl
              border
              border-white/10
              bg-white/5
              flex
              items-center
              justify-center
              text-xl
              hover:bg-white/10
              transition
            "
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* MOBILE MENU */}

        {mobileMenuOpen && (
          <div
            className="
              md:hidden
              border-t
              border-white/10
              bg-[#091122]/95
              backdrop-blur-xl
              px-4
              py-4
              animate-[fadeIn_0.2s_ease-out]
            "
          >

            <div className="flex flex-col gap-2">

              <a
                href="/"
                onClick={closeMobileMenu}
                className="
                  px-4
                  py-3
                  rounded-xl
                  text-gray-300
                  hover:bg-white/5
                  hover:text-white
                  transition
                "
              >
                Inicio
              </a>

              <a
                href="/generate"
                onClick={closeMobileMenu}
                className="
                  px-4
                  py-3
                  rounded-xl
                  bg-white/5
                  border
                  border-white/10
                  text-white
                "
              >
                Generador
              </a>

              <a
                href="/images"
                onClick={closeMobileMenu}
                className="
                  px-4
                  py-3
                  rounded-xl
                  text-gray-300
                  hover:bg-white/5
                  hover:text-white
                  transition
                "
              >
                Mis imágenes
              </a>

              <a
                href="/profile"
                onClick={closeMobileMenu}
                className="
                  flex
                  items-center
                  gap-3
                  px-4
                  py-3
                  rounded-xl
                  text-gray-300
                  hover:bg-white/5
                  hover:text-white
                  transition
                "
              >

                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="
                      w-8
                      h-8
                      rounded-full
                      bg-gradient-to-br
                      from-[#d0bcff]
                      to-[#4cd7f6]
                      flex
                      items-center
                      justify-center
                      text-[#091122]
                      font-bold
                    "
                  >
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}

                <span>
                  {user.name || 'Mi perfil'}
                </span>

              </a>

            </div>
          </div>
        )}
      </header>

      {/* =================================================
          CONTENIDO PRINCIPAL
      ================================================= */}

      <main
        className="
          relative
          z-10
          max-w-[1600px]
          mx-auto
          px-4
          sm:px-6
          lg:px-8
          py-6
          sm:py-8
          lg:py-10
        "
      >

        {/* =================================================
            HEADER DEL GENERADOR
        ================================================= */}

        <div
          className="
            mb-6
            sm:mb-8
            animate-[fadeInUp_0.5s_ease-out]
          "
        >
          <p
            className="
              text-xs
              sm:text-sm
              uppercase
              tracking-[0.25em]
              text-[#4cd7f6]
              font-semibold
              mb-2
            "
          >
            AI Image Generator
          </p>

          <h1
            className="
              text-3xl
              sm:text-4xl
              lg:text-5xl
              font-black
              tracking-tight
            "
          >
            Crea algo{' '}
            <span
              className="
                text-transparent
                bg-clip-text
                bg-gradient-to-r
                from-[#d0bcff]
                to-[#4cd7f6]
              "
            >
              extraordinario.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-gray-500 mt-2 max-w-2xl">
            Describe tu idea, elige un estilo y deja que Mystikal-AI haga el resto.
          </p>
        </div>

        {/* =================================================
            GENERADOR
        ================================================= */}

        <div
          className="
            grid
            grid-cols-1
            lg:grid-cols-[380px_minmax(0,1fr)]
            gap-5
            lg:gap-6
            items-stretch
          "
        >

          {/* =================================================
              PANEL DE CONFIGURACIÓN
          ================================================= */}

          <aside
            className="
              rounded-2xl
              border
              border-white/10
              bg-[#10192d]/80
              backdrop-blur-xl
              p-5
              sm:p-6
              shadow-2xl
              shadow-black/20
              animate-[fadeInLeft_0.6s_ease-out]
            "
          >

            {/* PROMPT */}

            <div className="mb-6">

              <div className="flex items-center justify-between mb-3">

                <h2 className="text-lg font-bold">
                  Prompt Canvas
                </h2>

                <span
                  className="
                    text-[10px]
                    uppercase
                    tracking-widest
                    text-gray-500
                    border
                    border-white/10
                    px-2
                    py-1
                    rounded-md
                  "
                >
                  Prompt
                </span>

              </div>

              <div
                className="
                  bg-[#091122]/80
                  border
                  border-white/10
                  rounded-xl
                  p-4
                  focus-within:border-[#4cd7f6]/50
                  focus-within:shadow-lg
                  focus-within:shadow-[#4cd7f6]/5
                  transition-all
                "
              >

                <textarea
                  value={prompt}
                  onChange={(e) =>
                    setPrompt(e.target.value)
                  }
                  disabled={loading}
                  placeholder="Describe la imagen que quieres crear..."
                  className="
                    w-full
                    h-28
                    sm:h-32
                    bg-transparent
                    text-gray-200
                    resize-none
                    outline-none
                    placeholder-gray-600
                    text-sm
                    leading-relaxed
                    disabled:opacity-50
                  "
                />

                <div className="flex justify-end mt-2">

                  <button
                    disabled={loading}
                    className="
                      text-xs
                      text-gray-500
                      hover:text-[#4cd7f6]
                      transition
                      disabled:opacity-50
                    "
                  >
                    ✨ Mejorar prompt
                  </button>

                </div>

              </div>
            </div>

            {/* ASPECT RATIO */}

            <div className="mb-6">

              <h3
                className="
                  text-xs
                  font-bold
                  tracking-[0.18em]
                  text-gray-400
                  mb-3
                  uppercase
                "
              >
                Aspect Ratio
              </h3>

              <div
                className="
                  grid
                  grid-cols-3
                  sm:grid-cols-5
                  lg:grid-cols-3
                  gap-2
                "
              >

                {ratios.map((ratio) => (

                  <button
                    key={ratio}
                    disabled={loading}
                    onClick={() =>
                      setAspectRatio(ratio)
                    }
                    className={`
                      py-2.5
                      rounded-lg
                      border
                      flex
                      justify-center
                      items-center
                      font-mono
                      text-xs
                      transition-all
                      hover:-translate-y-0.5
                      disabled:opacity-50
                      ${
                        aspectRatio === ratio
                          ? 'bg-[#d0bcff]/15 border-[#d0bcff] text-[#d0bcff] shadow-lg shadow-[#d0bcff]/10'
                          : 'border-white/10 bg-[#091122]/70 text-gray-400 hover:border-[#4cd7f6]/40 hover:text-white'
                      }
                    `}
                  >
                    {ratio === 'custom'
                      ? 'Custom'
                      : ratio}
                  </button>

                ))}

              </div>

            </div>

            {/* CUSTOM DIMENSIONS */}

            {aspectRatio === 'custom' && (

              <div
                className="
                  mb-6
                  bg-[#091122]/70
                  border
                  border-[#4cd7f6]/20
                  rounded-xl
                  p-4
                  animate-[fadeInUp_0.25s_ease-out]
                "
              >

                <h3
                  className="
                    text-xs
                    font-bold
                    tracking-[0.18em]
                    text-gray-400
                    mb-4
                    uppercase
                  "
                >
                  Custom Dimensions
                </h3>

                <div className="grid grid-cols-2 gap-3">

                  {/* WIDTH */}

                  <div>

                    <label className="block text-xs text-gray-500 mb-2">
                      Ancho
                    </label>

                    <input
                      type="number"
                      min="256"
                      max="1440"
                      step="32"
                      value={customWidth}
                      disabled={loading}
                      onChange={(e) =>
                        setCustomWidth(
                          Number(e.target.value)
                        )
                      }
                      className="
                        w-full
                        bg-[#10192d]
                        border
                        border-white/10
                        rounded-lg
                        px-3
                        py-2.5
                        text-white
                        outline-none
                        text-sm
                        focus:border-[#4cd7f6]
                        transition
                        disabled:opacity-50
                      "
                    />

                  </div>

                  {/* HEIGHT */}

                  <div>

                    <label className="block text-xs text-gray-500 mb-2">
                      Alto
                    </label>

                    <input
                      type="number"
                      min="256"
                      max="1440"
                      step="32"
                      value={customHeight}
                      disabled={loading}
                      onChange={(e) =>
                        setCustomHeight(
                          Number(e.target.value)
                        )
                      }
                      className="
                        w-full
                        bg-[#10192d]
                        border
                        border-white/10
                        rounded-lg
                        px-3
                        py-2.5
                        text-white
                        outline-none
                        text-sm
                        focus:border-[#4cd7f6]
                        transition
                        disabled:opacity-50
                      "
                    />

                  </div>

                </div>

                <p className="text-[10px] text-gray-500 mt-3">
                  Máximo 1440 × 1440. Usa múltiplos de 32.
                </p>

              </div>

            )}

            {/* ESTILOS */}

            <div>

              <h3
                className="
                  text-xs
                  font-bold
                  tracking-[0.18em]
                  text-gray-400
                  mb-3
                  uppercase
                "
              >
                Style
              </h3>

              <div className="grid grid-cols-2 gap-2">

                {styles.map((style) => (

                  <button
                    key={style}
                    disabled={loading}
                    onClick={() =>
                      setSelectedStyle(style)
                    }
                    className={`
                      py-3
                      px-3
                      rounded-xl
                      border
                      text-left
                      text-xs
                      sm:text-sm
                      font-semibold
                      transition-all
                      hover:-translate-y-0.5
                      disabled:opacity-50
                      ${
                        selectedStyle === style
                          ? 'bg-gradient-to-r from-[#d0bcff]/15 to-[#4cd7f6]/15 border-[#4cd7f6] text-white shadow-lg shadow-[#4cd7f6]/5'
                          : 'border-white/10 bg-[#091122]/60 text-gray-400 hover:bg-white/5 hover:text-white hover:border-white/20'
                      }
                    `}
                  >
                    {style}
                  </button>

                ))}

              </div>

            </div>

          </aside>

          {/* =================================================
              ÁREA DE RESULTADO
          ================================================= */}

          <section
            className="
              min-w-0
              flex
              flex-col
              gap-4
              animate-[fadeInRight_0.6s_ease-out]
            "
          >

            {/* CANVAS */}

            <div
              className="
                relative
                min-h-[380px]
                sm:min-h-[500px]
                lg:min-h-[620px]
                flex-1
                border
                border-white/10
                rounded-2xl
                flex
                flex-col
                items-center
                justify-center
                bg-[#10192d]/60
                backdrop-blur-xl
                overflow-hidden
                shadow-2xl
                shadow-black/20
              "
            >

              {/* Canvas glow */}

              <div
                className="
                  absolute
                  w-72
                  h-72
                  rounded-full
                  bg-[#4cd7f6]/5
                  blur-[100px]
                  pointer-events-none
                "
              />

              {/* Corner decorations */}

              <div className="absolute top-4 left-4 w-5 h-5 border-l border-t border-[#4cd7f6]/30" />
              <div className="absolute top-4 right-4 w-5 h-5 border-r border-t border-[#d0bcff]/30" />
              <div className="absolute bottom-4 left-4 w-5 h-5 border-l border-b border-[#d0bcff]/30" />
              <div className="absolute bottom-4 right-4 w-5 h-5 border-r border-b border-[#4cd7f6]/30" />

              {/* LOADING */}

              {loading ? (

                <div
                  className="
                    text-center
                    z-10
                    px-6
                    animate-[fadeInUp_0.4s_ease-out]
                  "
                >

                  <div
                    className="
                      relative
                      w-20
                      h-20
                      mx-auto
                      mb-6
                    "
                  >

                    <div
                      className="
                        absolute
                        inset-0
                        rounded-full
                        border-2
                        border-[#4cd7f6]/20
                      "
                    />

                    <div
                      className="
                        absolute
                        inset-0
                        rounded-full
                        border-2
                        border-transparent
                        border-t-[#4cd7f6]
                        border-r-[#d0bcff]
                        animate-spin
                      "
                    />

                    <div
                      className="
                        absolute
                        inset-3
                        rounded-full
                        bg-gradient-to-br
                        from-[#d0bcff]/20
                        to-[#4cd7f6]/20
                        blur-sm
                      "
                    />

                    <span className="absolute inset-0 flex items-center justify-center text-2xl">
                      ✦
                    </span>

                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-gray-200">
                    Creando tu obra...
                  </h3>

                  <p className="text-sm text-gray-500 mt-2">
                    FLUX 1.1 Pro está generando tu imagen
                  </p>

                  <div className="mt-5 flex justify-center gap-1.5">

                    <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] animate-bounce" />

                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[#d0bcff] animate-bounce"
                      style={{ animationDelay: '0.15s' }}
                    />

                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] animate-bounce"
                      style={{ animationDelay: '0.3s' }}
                    />

                  </div>

                </div>

              ) : imageUrl ? (

                /* IMAGEN */

                <img
                  src={imageUrl}
                  alt="Arte generado por Mystikal AI"
                  className="
                    relative
                    z-10
                    max-h-full
                    max-w-full
                    object-contain
                    rounded-xl
                    shadow-2xl
                    animate-[fadeIn_0.7s_ease-out]
                  "
                />

              ) : (

                /* ESTADO INICIAL */

                <div
                  className="
                    text-center
                    z-10
                    px-6
                    animate-[fadeIn_0.6s_ease-out]
                  "
                >

                  <div
                    className="
                      w-20
                      h-20
                      mx-auto
                      mb-6
                      rounded-2xl
                      bg-gradient-to-br
                      from-[#d0bcff]/10
                      to-[#4cd7f6]/10
                      border
                      border-white/10
                      flex
                      items-center
                      justify-center
                      text-4xl
                      shadow-xl
                    "
                  >
                    ✦
                  </div>

                  <h3
                    className="
                      text-xl
                      sm:text-2xl
                      font-bold
                      text-gray-300
                    "
                  >
                    Tu obra aparecerá aquí
                  </h3>

                  <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                    Describe lo que imaginas, configura los parámetros y deja que Mystikal-AI lo transforme en una imagen.
                  </p>

                </div>

              )}

            </div>

            {/* BOTÓN GENERAR */}

            <div
              className="
                flex
                flex-col
                sm:flex-row
                justify-between
                items-stretch
                sm:items-center
                gap-3
                rounded-2xl
                border
                border-white/10
                bg-[#10192d]/70
                backdrop-blur-xl
                p-3
                sm:p-4
              "
            >

              <div className="px-2">

                <p className="text-xs text-gray-500">
                  Generación
                </p>

                <p className="text-sm text-gray-300 mt-0.5">
                  Costo: <span className="text-[#4cd7f6] font-semibold">1 Crédito</span>
                </p>

              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="
                  group
                  w-full
                  sm:w-auto
                  rounded-xl
                  bg-gradient-to-r
                  from-[#d0bcff]
                  to-[#4cd7f6]
                  px-8
                  sm:px-10
                  py-3.5
                  sm:py-4
                  font-bold
                  text-[#091122]
                  text-base
                  sm:text-lg
                  hover:scale-[1.02]
                  active:scale-[0.98]
                  transition-all
                  shadow-lg
                  shadow-[#4cd7f6]/20
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >

                <span className="group-hover:mr-1 transition-all">
                  {loading
                    ? 'Generando...'
                    : 'Generar Imagen'}
                </span>

                {!loading && (
                  <span className="ml-1">
                    ✨
                  </span>
                )}

              </button>

            </div>

          </section>

        </div>

      </main>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer
        className="
          relative
          z-10
          mt-10
          border-t
          border-white/10
          bg-[#070d1a]/80
          backdrop-blur-xl
        "
      >

        <div
          className="
            max-w-[1600px]
            mx-auto
            px-4
            sm:px-6
            lg:px-8
            py-8
            sm:py-10
          "
        >

          <div
            className="
              flex
              flex-col
              md:flex-row
              items-center
              justify-between
              gap-6
            "
          >

            {/* BRAND */}

            <div className="text-center md:text-left">

              <div className="flex items-center justify-center md:justify-start gap-3">

                <div
                  className="
                    w-9
                    h-9
                    rounded-xl
                    bg-gradient-to-br
                    from-[#d0bcff]
                    to-[#4cd7f6]
                    flex
                    items-center
                    justify-center
                    text-[#091122]
                    font-black
                  "
                >
                  ✦
                </div>

                <div>

                  <p className="font-black text-lg">
                    Mystikal AI
                  </p>

                  <p className="text-xs text-gray-500">
                    Crea. Imagina. Genera.
                  </p>

                </div>

              </div>

              <p className="text-xs text-gray-600 mt-4">
                Proyecto creado por Martín Jara.
              </p>

            </div>

            {/* LINKS */}

            <div className="flex items-center gap-3">

              {/* GITHUB */}

              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="
                  w-11
                  h-11
                  rounded-xl
                  border
                  border-white/10
                  bg-white/[0.03]
                  flex
                  items-center
                  justify-center
                  text-gray-400
                  hover:text-[#4cd7f6]
                  hover:border-[#4cd7f6]/40
                  hover:bg-[#4cd7f6]/5
                  hover:-translate-y-1
                  transition-all
                "
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="currentColor"
                >
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.49.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.604-3.369-1.342-3.369-1.342-.455-1.157-1.11-1.466-1.11-1.466-.908-.621.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.529 2.341 1.087 2.913.831.091-.646.35-1.087.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844a9.58 9.58 0 0 1 2.504.337c1.909-1.294 2.748-1.025 2.748-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .268.18.58.688.482A10.002 10.002 0 0 0 22 12C22 6.477 17.523 2 12 2Z" />
                </svg>
              </a>

              {/* LINKEDIN */}

              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="
                  w-11
                  h-11
                  rounded-xl
                  border
                  border-white/10
                  bg-white/[0.03]
                  flex
                  items-center
                  justify-center
                  text-gray-400
                  hover:text-[#4cd7f6]
                  hover:border-[#4cd7f6]/40
                  hover:bg-[#4cd7f6]/5
                  hover:-translate-y-1
                  transition-all
                "
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="currentColor"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.35V8.999h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.287ZM5.337 7.433a2.063 2.063 0 1 1 0-4.126 2.063 2.063 0 0 1 0 4.126ZM3.554 20.452h3.558V8.999H3.554v11.453Z" />
                </svg>
              </a>

            </div>

          </div>

          <div
            className="
              mt-8
              pt-5
              border-t
              border-white/5
              flex
              flex-col
              sm:flex-row
              items-center
              justify-between
              gap-2
              text-[10px]
              text-gray-600
              uppercase
              tracking-widest
            "
          >
            <span>
              © 2026 Mystikal AI
            </span>

            <span>
              AI Image Generation
            </span>
          </div>

        </div>

      </footer>

      {/* =================================================
          ANIMACIONES
      ================================================= */}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

    </div>
  );
}

export default Generate;
