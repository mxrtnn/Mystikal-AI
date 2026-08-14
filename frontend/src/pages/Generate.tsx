import { useState } from 'react';

function Generate() {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Photoreal');
  const [aspectRatio, setAspectRatio] = useState('16:9');

  const styles = ['Photoreal', 'Anime', '3D Render', 'Retro', 'Cyberpunk', 'Concept Art'];
  const ratios = ['1:1', '16:9', '9:16', '4:3'];

  return (
    <div className="min-h-screen bg-[#091122] text-white flex pt-20">
      
      {/* SIDEBAR DE CONFIGURACIÓN */}
      <aside className="w-full md:w-[400px] p-8 border-r border-white/10 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Prompt Canvas</h2>
        
        {/* Textarea del Prompt */}
        <div className="bg-[#10192d] border border-white/10 rounded-xl p-4 mb-8">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe la imagen que quieres crear... ej. 'Un zorro cyberpunk en una ciudad lluviosa de neón.'"
            className="w-full h-32 bg-transparent text-gray-300 resize-none outline-none placeholder-gray-600"
          />
          <div className="flex justify-end gap-2 text-gray-500 mt-2">
            <button className="hover:text-white transition">✨ Mejorar prompt</button>
          </div>
        </div>

        {/* Aspect Ratio */}
        <div className="mb-8">
          <h3 className="text-sm font-bold tracking-widest text-gray-400 mb-4 uppercase">Aspect Ratio</h3>
          <div className="grid grid-cols-4 gap-3">
            {ratios.map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`py-3 rounded-lg border flex justify-center items-center font-mono text-sm transition-all ${
                  aspectRatio === ratio 
                    ? 'bg-[#d0bcff]/20 border-[#d0bcff] text-[#d0bcff]' 
                    : 'border-white/10 bg-[#10192d] text-gray-400 hover:border-white/30'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        {/* Estilos */}
        <div className="mb-8">
          <h3 className="text-sm font-bold tracking-widest text-gray-400 mb-4 uppercase">Style</h3>
          <div className="grid grid-cols-2 gap-3">
            {styles.map((style) => (
              <button
                key={style}
                onClick={() => setSelectedStyle(style)}
                className={`py-4 px-4 rounded-xl border text-left font-semibold transition-all ${
                  selectedStyle === style 
                    ? 'bg-gradient-to-r from-[#d0bcff]/20 to-[#4cd7f6]/20 border-[#4cd7f6] text-white' 
                    : 'border-white/10 bg-[#10192d] text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DEL LIENZO */}
      <main className="flex-1 p-8 flex flex-col">
        <div className="flex-1 border border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center bg-[#10192d]/50 relative overflow-hidden">
          
          {/* Estado vacío */}
          <div className="text-center z-10">
            <span className="text-6xl mb-4 block opacity-50">🖼️</span>
            <h3 className="text-2xl font-bold text-gray-300">Tu obra de arte aparecerá aquí</h3>
            <p className="text-gray-500 mt-2">Configura tus parámetros y presiona generar</p>
          </div>

        </div>

        {/* Botón de Generar Flotante o en el footer */}
        <div className="mt-6 flex justify-end items-center gap-4">
          <span className="text-gray-400 text-sm">Costo: 1 Crédito</span>
          <button className="rounded-xl bg-gradient-to-r from-[#d0bcff] to-[#4cd7f6] px-10 py-4 font-bold text-[#091122] text-lg hover:scale-105 transition-transform shadow-lg shadow-[#4cd7f6]/20">
            Generar Imagen ✨
          </button>
        </div>
      </main>
    </div>
  );
}

export default Generate;