import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, UserRound } from 'lucide-react';
import { endSession, isGuest, readUser } from '../services/session';
export default function SessionControls({ disabled=false }: { disabled?:boolean }) {
  const navigate=useNavigate();
  const [error,setError]=useState('');
  const user=readUser(); const guest=isGuest();
  if(!guest&&!user) return <Link to="/login" className="session-login"><UserRound size={15}/> Iniciar sesión</Link>;
  return <div className="session-controls"><Link to="/profile" className="session-profile" aria-label={guest ? 'Invitado: abrir perfil' : 'Abrir mi perfil'}><span className="session-avatar"><UserRound size={16}/></span><span className="session-name">{guest?'Invitado':user?.name||'Mi perfil'}<small>Mi perfil</small></span></Link>{guest&&!disabled&&<Link className="session-signin" to="/login">Iniciar sesión</Link>}<button className="session-logout" type="button" disabled={disabled} onClick={async()=>{try{await endSession();navigate('/login');}catch(e){setError(String(e));}}} aria-label={guest?'Salir del modo invitado':'Cerrar sesión'}><LogOut size={14}/> Salir</button>{error&&<span role="alert">{error}</span>}</div>;
}
