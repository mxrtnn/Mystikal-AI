import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Home as HomeIcon, Wand2, Image as ImageIcon, Settings, LogIn } from 'lucide-react';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: HomeIcon },
    { name: 'Generate', path: '/generate', icon: Wand2 },
    { name: 'My Images', path: '/images', icon: ImageIcon },
    { name: 'Settings', path: '/dashboard', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050914]/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-6 md:px-12">
        
        {/* LOGO */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 text-2xl font-black tracking-wide text-[#d0bcff] hover:scale-105 transition-transform"
        >
          <Sparkles className="w-6 h-6 text-[#4cd7f6] animate-pulse" />
          <span className="bg-gradient-to-r from-white via-[#d0bcff] to-[#4cd7f6] bg-clip-text text-transparent">
            Mystikal-AI
          </span>
        </button>

        {/* NAVEGACIÓN CON ICONOS */}
        <nav className="hidden md:flex items-center gap-2 bg-[#0d1527]/60 p-1.5 rounded-full border border-white/5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#d0bcff]/20 to-[#4cd7f6]/20 text-[#4cd7f6] border border-[#4cd7f6]/30 shadow-[0_0_15px_rgba(76,215,246,0.2)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#4cd7f6]' : 'text-gray-400'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* BOTÓN GET STARTED / LOGIN */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#d0bcff] via-[#4cd7f6] to-[#d0bcff] bg-[length:200%_auto] hover:bg-right hover:scale-105 active:scale-95 transition-all duration-500 px-6 py-2.5 font-bold text-[#050914] text-xs shadow-lg shadow-[#4cd7f6]/10"
        >
          <LogIn className="w-4 h-4" />
          <span>Get Started</span>
        </button>
      </div>
    </header>
  );
}