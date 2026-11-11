import { Link } from 'react-router-dom';
import { ArrowRight, LockKeyhole, Sparkles, UserRound } from 'lucide-react';
import SessionControls from '../components/SessionControls';
import { isGuest, readUser } from '../services/session';
import '../local.css';
export default function WebProfile(){
  const user=readUser();const guest=isGuest();
  return <div className="studio"><header className="studio-header"><Link className="brand" to="/"><Sparkles size={23}/> Mystikal <span>AI</span></Link><nav className="site-nav"><Link to="/">Inicio</Link><SessionControls/></nav></header><main className="profile-page"><span className="eyebrow">TU CUENTA EN MYSTIKAL</span><h1>{guest?'Bienvenido, invitado':`Hola, ${user?.name||'creador'}`}</h1><div className="privacy-card"><UserRound size={24}/><div><h2>{guest?'Modo invitado':user?.name||'Mi cuenta'}</h2>{user?.email&&!guest&&<p>{user.email}</p>}<p>{guest?'Puedes explorar el sitio sin crear una cuenta.':'Tu acceso utiliza el servicio de cuentas original de Mystikal.'}</p><Link className="text-link" to="/generate">Abrir mi estudio local <ArrowRight size={15}/></Link></div></div><div className="privacy-card"><LockKeyhole size={24}/><div><h2>Tu galería se queda en tu equipo</h2><p>Las imágenes y sus preferencias de publicación se administran desde el perfil del estudio local. La sesión de esta web no da acceso a archivos de tu PC; inicia sesión también en localhost para abrirlos.</p></div></div></main></div>;
}
