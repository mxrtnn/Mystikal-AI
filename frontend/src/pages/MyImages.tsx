import { useState } from 'react';

// Datos de prueba (mock) para simular tu base de datos
const MOCK_IMAGES = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=600&auto=format&fit=crop', // Estilo Cyberpunk
    prompt: 'A cyberpunk cityscape at dusk with neon reflections in rain puddles',
    aspect: 'aspect-[3/4]' // Imagen alta
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop', // Abstracto
    prompt: 'Fluid dynamics engine metallic glowing aura',
    aspect: 'aspect-square' // Cuadrada
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1634014012296-6014e21a41ce?q=80&w=600&auto=format&fit=crop', // Hongos mágicos
    prompt: 'Bioluminescent mushrooms in a dark mystical forest',
    aspect: 'aspect-square'
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=600&auto=format&fit=crop', // Paisaje espacial
    prompt: 'Desert landscape with twin suns and planets in the sky',
    aspect: 'aspect-video' // Apaisada (16:9)
  },
  {
    id: 5,
    url: 'https://images.unsplash.com/photo-1618005192384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop', 
    prompt: 'Abstract liquid metal flowing in zero gravity',
    aspect: 'aspect-[4/5]'
  }
];

function MyImages() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <div className="min-h-screen bg-[#091122] text-white pt-24 px-8 pb-12">
      <div className="max-w-[1440px] mx-auto">
        
        {/* CABECERA: Título y Filtros */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-white to-[#b8b1c9] bg-clip-text text-transparent">
              My Images
            </h1>
            <p className="text-gray-400 text-lg">
              Your personal gallery of generated creations.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Buscador */}
            <div className="relative w-full sm:w-64">
              <span className="absolute left-4 top-3 text-gray-500">🔍</span>
              <input
                type="text"
                placeholder="Search prompts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#10192d] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#4cd7f6] transition-colors"
              />
            </div>

            {/* Filtros rápidos */}
            <div className="flex bg-[#10192d] border border-white/10 rounded-xl p-1">
              {['All', 'Favorites', 'Recent'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === filter
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* GALERÍA MASONRY */}
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {MOCK_IMAGES.map((img) => (
            <div 
              key={img.id} 
              className="relative group rounded-2xl overflow-hidden border border-white/10 bg-[#10192d] break-inside-avoid"
            >
              {/* Imagen real */}
              <img 
                src={img.url} 
                alt={img.prompt} 
                className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${img.aspect}`}
              />
              
              {/* Overlay oscuro que aparece al pasar el mouse (Hover Effect) */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#091122] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                
                <p className="text-white text-sm font-medium line-clamp-2 mb-4 drop-shadow-md">
                  {img.prompt}
                </p>
                
                <div className="flex items-center gap-2">
                  <button className="flex-1 bg-white/20 hover:bg-[#d0bcff] hover:text-[#091122] backdrop-blur-md border border-white/20 text-white py-2 rounded-lg font-semibold transition-all">
                    Ampliar
                  </button>
                  <button className="w-10 h-10 flex justify-center items-center bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white rounded-lg transition-all" title="Descargar">
                    ↓
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default MyImages;