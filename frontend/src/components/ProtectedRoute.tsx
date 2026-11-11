import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { syncSession } from '../services/session';
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const location=useLocation();
  const [allowed,setAllowed]=useState<boolean|null>(null);
  useEffect(() => {
    let alive=true;
    const check=()=>syncSession().then(value=>{if(alive)setAllowed(value);}).catch(()=>{if(alive)setAllowed(false);});
    const changed=(event:StorageEvent)=>{if(event.key==='mystikal_session_changed'){setAllowed(null);void check();}};
    void check();window.addEventListener('storage',changed);
    return()=>{alive=false;window.removeEventListener('storage',changed);};
  },[]);
  if (allowed===null) return <div className="session-check" role="status">Comprobando tu sesión privada…</div>;
  return allowed ? <>{children}</> : <Navigate to="/login" state={{from:location.pathname}} replace />;
}
