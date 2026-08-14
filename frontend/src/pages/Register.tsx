import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí conectaremos con MySQL
    console.log('Register attempt', { name, email, password });
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#091122] flex items-center justify-center p-4">
      <div className="bg-[#10192d] border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Crea tu cuenta</h2>
          <p className="text-gray-400">Únete a Mystical AI y obtén créditos gratis.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Nombre</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#091122] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4cd7f6] transition-colors"
              placeholder="Tu nombre"
              required
            />
          </div>
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
            className="w-full rounded-xl border border-[#d0bcff] text-[#d0bcff] hover:bg-[#d0bcff]/10 px-4 py-3 font-bold transition-colors mt-2"
          >
            Registrarse
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400">
          ¿Ya tienes cuenta?{' '}
          <button onClick={() => navigate('/login')} className="text-[#4cd7f6] hover:underline font-medium">
            Inicia sesión
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;