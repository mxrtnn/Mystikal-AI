import { useState } from 'react';

function Generate() {

  // =====================================================
  // ESTADOS
  // =====================================================

  const [prompt, setPrompt] = useState('');

  const [selectedStyle, setSelectedStyle] =
    useState('Photoreal');

  const [aspectRatio, setAspectRatio] =
    useState('16:9');

  const [customWidth, setCustomWidth] =
    useState(1024);

  const [customHeight, setCustomHeight] =
    useState(1024);

  const [imageUrl, setImageUrl] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  // =====================================================
  // OPCIONES
  // =====================================================

  const styles = [
    'Photoreal',
    'Anime',
    '3D Render',
    'Retro',
    'Cyberpunk',
    'Concept Art'
  ];

  const ratios = [
    '1:1',
    '16:9',
    '9:16',
    '4:3',
    'custom'
  ];

  // =====================================================
  // API
  // =====================================================

  const API_URL =
    import.meta.env.VITE_API_URL ||
    'https://mystikal-ai.onrender.com';

  // =====================================================
  // GENERAR IMAGEN
  // =====================================================

  const handleGenerate = async () => {

    // ---------------------------------------------------
    // Validar prompt
    // ---------------------------------------------------

    if (!prompt.trim()) {
      alert(
        'Ingresa un prompt antes de generar.'
      );
      return;
    }

    // ---------------------------------------------------
    // Validar Custom
    // ---------------------------------------------------

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

    // ---------------------------------------------------
    // Loading
    // ---------------------------------------------------

    setLoading(true);

    try {

      // -------------------------------------------------
      // Preparar datos
      // -------------------------------------------------

      const body = {
        prompt,
        style: selectedStyle,
        aspectRatio,

        ...(aspectRatio === 'custom'
          ? {
              width: customWidth,
              height: customHeight
            }
          : {})
      };

      console.log(
        '📤 Enviando a Mystikal:',
        body
      );

      // -------------------------------------------------
      // Request
      // -------------------------------------------------

      const response = await fetch(
        `${API_URL}/api/generate`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify(body)
        }
      );

      // -------------------------------------------------
      // Respuesta
      // -------------------------------------------------

      const data =
        await response.json();

      console.log(
        '📥 Respuesta del backend:',
        data
      );

      // -------------------------------------------------
      // Éxito
      // -------------------------------------------------

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
  // INTERFAZ
  // =====================================================

  return (

    <div className="min-h-screen bg-[#091122] text-white flex pt-20">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="w-full md:w-[400px] p-8 border-r border-white/10 overflow-y-auto">

        <h2 className="text-2xl font-bold mb-6">
          Prompt Canvas
        </h2>

        {/* =================================================
            PROMPT
        ================================================= */}

        <div className="bg-[#10192d] border border-white/10 rounded-xl p-4 mb-8">

          <textarea
            value={prompt}
            onChange={(e) =>
              setPrompt(e.target.value)
            }
            disabled={loading}
            placeholder="Describe la imagen que quieres crear... ej. 'Un zorro cyberpunk en una ciudad lluviosa de neón.'"
            className="w-full h-32 bg-transparent text-gray-300 resize-none outline-none placeholder-gray-600 disabled:opacity-50"
          />

          <div className="flex justify-end gap-2 text-gray-500 mt-2">

            <button
              disabled={loading}
              className="hover:text-white transition disabled:opacity-50"
            >
              ✨ Mejorar prompt
            </button>

          </div>

        </div>

        {/* =================================================
            ASPECT RATIO
        ================================================= */}

        <div className="mb-8">

          <h3 className="text-sm font-bold tracking-widest text-gray-400 mb-4 uppercase">
            Aspect Ratio
          </h3>

          <div className="grid grid-cols-3 gap-3">

            {ratios.map((ratio) => (

              <button
                key={ratio}
                disabled={loading}
                onClick={() =>
                  setAspectRatio(ratio)
                }
                className={`
                  py-3 rounded-lg border
                  flex justify-center items-center
                  font-mono text-sm
                  transition-all
                  disabled:opacity-50

                  ${
                    aspectRatio === ratio
                      ? 'bg-[#d0bcff]/20 border-[#d0bcff] text-[#d0bcff]'
                      : 'border-white/10 bg-[#10192d] text-gray-400 hover:border-white/30'
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

        {/* =================================================
            CUSTOM DIMENSIONS
        ================================================= */}

        {aspectRatio === 'custom' && (

          <div className="mb-8 bg-[#10192d] border border-white/10 rounded-xl p-4">

            <h3 className="text-sm font-bold tracking-widest text-gray-400 mb-4 uppercase">
              Custom Dimensions
            </h3>

            <div className="grid grid-cols-2 gap-4">

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
                  className="w-full bg-[#091122] border border-white/10 rounded-lg px-3 py-3 text-white outline-none focus:border-[#4cd7f6] disabled:opacity-50"
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
                  className="w-full bg-[#091122] border border-white/10 rounded-lg px-3 py-3 text-white outline-none focus:border-[#4cd7f6] disabled:opacity-50"
                />

              </div>

            </div>

            <p className="text-xs text-gray-500 mt-3">
              Máximo 1440 × 1440. Usa múltiplos de 32.
            </p>

          </div>

        )}

        {/* =================================================
            ESTILOS
        ================================================= */}

        <div className="mb-8">

          <h3 className="text-sm font-bold tracking-widest text-gray-400 mb-4 uppercase">
            Style
          </h3>

          <div className="grid grid-cols-2 gap-3">

            {styles.map((style) => (

              <button
                key={style}
                disabled={loading}
                onClick={() =>
                  setSelectedStyle(style)
                }
                className={`
                  py-4 px-4 rounded-xl border
                  text-left font-semibold
                  transition-all
                  disabled:opacity-50

                  ${
                    selectedStyle === style
                      ? 'bg-gradient-to-r from-[#d0bcff]/20 to-[#4cd7f6]/20 border-[#4cd7f6] text-white'
                      : 'border-white/10 bg-[#10192d] text-gray-400 hover:bg-white/5 hover:text-white'
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
          ÁREA PRINCIPAL
      ================================================= */}

      <main className="flex-1 p-8 flex flex-col">

        <div className="flex-1 border border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center bg-[#10192d]/50 relative overflow-hidden">

          {/* LOADING */}

          {loading ? (

            <div className="text-center z-10 animate-pulse">

              <span className="text-6xl mb-4 block animate-spin">
                🌀
              </span>

              <h3 className="text-2xl font-bold text-gray-300">
                Creando tu obra de arte...
              </h3>

              <p className="text-gray-500 mt-2">
                FLUX 1.1 Pro está generando tu imagen
              </p>

            </div>

          ) : imageUrl ? (

            /* IMAGEN */

            <img
              src={imageUrl}
              alt="Arte generado"
              className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
            />

          ) : (

            /* ESTADO INICIAL */

            <div className="text-center z-10">

              <span className="text-6xl mb-4 block opacity-50">
                🖼️
              </span>

              <h3 className="text-2xl font-bold text-gray-300">
                Tu obra de arte aparecerá aquí
              </h3>

              <p className="text-gray-500 mt-2">
                Configura tus parámetros y presiona generar
              </p>

            </div>

          )}

        </div>

        {/* =================================================
            BOTÓN GENERAR
        ================================================= */}

        <div className="mt-6 flex justify-end items-center gap-4">

          <span className="text-gray-400 text-sm">
            Costo: 1 Crédito
          </span>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-[#d0bcff] to-[#4cd7f6] px-10 py-4 font-bold text-[#091122] text-lg hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-[#4cd7f6]/20 disabled:opacity-50"
          >

            {loading
              ? 'Generando...'
              : 'Generar Imagen ✨'}

          </button>

        </div>

      </main>

    </div>
  );
}

export default Generate;