import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
        // Guarda la sesión para que ProtectedRoute permita la entrada
        localStorage.setItem('user', JSON.stringify(data.user || { email }));

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
    <div className="min-h-screen bg-[#091122] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#10192d] border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl transition-all duration-300 hover:border-white/20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Bienvenido de vuelta</h2>
          <p className="text-gray-400">Ingresa a Mystical AI para seguir creando.</p>
        </div>

        {message && (
          <div className={`p-4 mb-6 rounded-xl text-sm font-medium transition-all ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <input 
              type="email" 
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#091122] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4cd7f6] transition-colors disabled:opacity-50"
              placeholder="tu@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Contraseña</label>
            <input 
              type="password" 
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#091122] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4cd7f6] transition-colors disabled:opacity-50"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-[#d0bcff] to-[#4cd7f6] px-4 py-3 font-bold text-[#091122] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-[#4cd7f6]/10"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-[#091122]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Iniciando sesión...</span>
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400">
          ¿No tienes cuenta?{' '}
          <button onClick={() => navigate('/register')} className="text-[#4cd7f6] hover:underline font-medium">
            Regístrate aquí
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;