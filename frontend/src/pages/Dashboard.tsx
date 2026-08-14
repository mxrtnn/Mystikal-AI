function Dashboard() {
  return (
    <div className="min-h-screen bg-[#091122] text-white pt-24 px-8 pb-12">
      <div className="max-w-[1200px] mx-auto">
        
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2">Studio Dashboard</h1>
          <p className="text-gray-400">Gestiona tus recursos, monitorea el uso y ajusta tu perfil.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMNA IZQUIERDA (Perfil y Créditos) */}
          <div className="space-y-8">
            
            {/* Tarjeta de Perfil */}
            <div className="bg-[#10192d] border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#d0bcff] to-[#4cd7f6] p-1 mb-4">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="Avatar" className="w-full h-full rounded-full bg-[#091122]" />
              </div>
              <h2 className="text-2xl font-bold">Martín C.</h2>
              <p className="text-gray-400 mb-6">martin@mystical-ai.com</p>
              <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl font-semibold transition border border-white/10">
                Editar Perfil
              </button>
            </div>

            {/* Tarjeta de Créditos */}
            <div className="bg-[#10192d] border border-white/10 rounded-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-[#4cd7f6] flex items-center gap-2">
                  ⚡ CRÉDITOS DE CÓMPUTO
                </h3>
                <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-gray-300">Free Tier</span>
              </div>
              
              <div className="text-5xl font-black mb-2">
                10 <span className="text-2xl text-gray-500 font-medium">/ 10</span>
              </div>
              <p className="text-gray-400 text-sm mb-6">intentos restantes este mes</p>
              
              {/* Barra de progreso */}
              <div className="w-full h-2 bg-gray-800 rounded-full mb-8 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#d0bcff] to-[#4cd7f6] w-[100%] rounded-full"></div>
              </div>

              <button className="w-full py-4 bg-transparent border border-[#d0bcff] text-[#d0bcff] hover:bg-[#d0bcff]/10 rounded-xl font-bold transition flex justify-center items-center gap-2">
                ⭐ Upgrade to PRO ($2)
              </button>
            </div>

          </div>

          {/* COLUMNA DERECHA (Actividad Reciente) */}
          <div className="lg:col-span-2 bg-[#10192d] border border-white/10 rounded-2xl p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold flex items-center gap-2">
                🕒 Actividad Reciente
              </h3>
              <a href="/images" className="text-sm text-gray-400 hover:text-white transition">Ver Galería Completa →</a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Aquí irían las imágenes mapeadas desde la base de datos, pongo placeholders por ahora */}
              <div className="aspect-square bg-gray-800 rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition cursor-pointer">
                <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=500&auto=format&fit=crop" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition" alt="Generada 1" />
              </div>
              <div className="aspect-square bg-gray-800 rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition cursor-pointer">
                <img src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=500&auto=format&fit=crop" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition" alt="Generada 2" />
              </div>
              
              {/* Botón para crear nueva */}
              <div className="aspect-square bg-transparent border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-white/40 transition cursor-pointer">
                <span className="text-3xl mb-2">+</span>
                <span className="text-sm font-bold">NUEVA IMAGEN</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Dashboard;