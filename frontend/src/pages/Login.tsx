import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí después conectaremos con MySQL/Backend
    console.log('Login attempt', { email, password });
    // Simulamos que el login fue exitoso y lo mandamos al generador
    navigate('/generate');
  };

  return (
    <div className="min-h-screen bg-[#091122] flex items-center justify-center p-4">
      <div className="bg-[#10192d] border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Bienvenido de vuelta</h2>
          <p className="text-gray-400">Ingresa a Mystical AI para seguir creando.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#091122] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4cd7f6] transition-colors"
              placeholder="tu@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#091122] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4cd7f6] transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-[#d0bcff] to-[#4cd7f6] px-4 py-3 font-bold text-[#091122] hover:scale-[1.02] transition-transform"
          >
            Iniciar Sesión
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