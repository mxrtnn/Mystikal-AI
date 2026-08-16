import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, Check } from 'lucide-react';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fallback directo a Render para evitar fallos de localhost en producción
  const API_URL = import.meta.env.VITE_API_URL || 'https://mystikal-ai-backend.onrender.com';

  // Cargar credenciales guardadas si el usuario activó "Recordarme" previamente
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Guardar sesión
        localStorage.setItem('user', JSON.stringify(data.user || { email }));

        // Guardar o limpiar email recordado según el checkbox
        if (rememberMe) {
          localStorage.setItem('remembered_email', email);
        } else {
          localStorage.removeItem('remembered_email');
        }

        setMessage({ type: 'success', text: '¡Sesión iniciada! Redirigiendo al generador...' });
        setTimeout(() => {
          navigate('/generate');
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Credenciales incorrectas.' });
        setLoading(false);
      }
    } catch (error) {
      console.error('Error en el login:', error);
      setMessage({ type: 'error', text: 'No se pudo conectar con el servidor.' });
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050914] flex items-center justify-center p-4 overflow-hidden select-none">
      
      {/* FONDO FUTURISTA: Rejilla Cibernética */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d15_1px,transparent_1px),linear-gradient(to_bottom,#1f293d15_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* FONDO FUTURISTA: Orbes de Luz Neón en Movimiento */}
      <motion.div 
        animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0.5, 0.25] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-28 -left-28 w-96 h-96 bg-[#d0bcff]/20 rounded-full blur-[130px] pointer-events-none" 
      />
      <motion.div 
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-28 -right-28 w-96 h-96 bg-[#4cd7f6]/20 rounded-full blur-[130px] pointer-events-none" 
      />

      {/* TARJETA PRINCIPAL DEL LOGIN */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 bg-[#0d1527]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-[0_0_50px_rgba(76,215,246,0.12)] transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_60px_rgba(76,215,246,0.2)]"
      >
        <div className="text-center mb-8">
          <motion.div 
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#d0bcff]/20 to-[#4cd7f6]/20 border border-[#4cd7f6]/40 mb-3 shadow-[0_0_20px_rgba(76,215,246,0.25)]"
          >
            <Sparkles className="w-7 h-7 text-[#4cd7f6]" />
          </motion.div>
          <h2 className="text-3xl font-black text-white tracking-wide bg-gradient-to-r from-white via-gray-100 to-[#4cd7f6] bg-clip-text text-transparent">
            Mystikal-AI
          </h2>
          <p className="text-gray-400 text-sm mt-1">Ingresa para seguir creando imágenes con IA</p>
        </div>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 mb-6 rounded-xl text-sm font-medium transition-all ${
              message.type === 'success' 
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Campo Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="email" 
                value={email}
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#050914]/80 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#4cd7f6] focus:ring-1 focus:ring-[#4cd7f6] transition-all disabled:opacity-50"
                placeholder="tu@email.com"
                required
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="password" 
                value={password}
                disabled={loading}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#050914]/80 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#4cd7f6] focus:ring-1 focus:ring-[#4cd7f6] transition-all disabled:opacity-50"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Opción Recordarme */}
          <div className="flex items-center justify-between text-sm text-gray-400 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="hidden"
              />
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${rememberMe ? 'bg-[#4cd7f6] border-[#4cd7f6] text-[#050914]' : 'border-white/20 bg-[#050914]'}`}>
                {rememberMe && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <span className="hover:text-gray-200 transition-colors">Recordar mis datos</span>
            </label>
          </div>

          {/* Botón Iluminado Neón */}
          <motion.button 
            whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(76,215,246,0.35)' }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-[#d0bcff] via-[#4cd7f6] to-[#d0bcff] bg-[length:200%_auto] hover:bg-right transition-all duration-500 py-3.5 font-bold text-[#050914] flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg mt-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-[#050914]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Accediendo al sistema...</span>
              </>
            ) : (
              'Iniciar Sesión ✨'
            )}
          </motion.button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-400">
          ¿No tienes una cuenta?{' '}
          <button onClick={() => navigate('/register')} className="text-[#4cd7f6] hover:underline font-semibold">
            Regístrate aquí
          </button>
        </p>
      </motion.div>
    </div>
  );
}

export default Login;