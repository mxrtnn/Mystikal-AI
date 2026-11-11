import { IS_LOCAL_STUDIO } from './runtime';
export type UserSession = { id?: string | number; name?: string; email?: string; avatar?:string };
export function readUser(): UserSession | null {
  try { const user=JSON.parse(localStorage.getItem('user') || 'null'); return user && typeof user==='object' && (typeof user.email==='string'||typeof user.name==='string') ? user : null; } catch { return null; }
}
export function isGuest() { return sessionStorage.getItem('mystikal_guest')==='true'; }
export async function syncSession() {
  // Public session state controls navigation only; it never authorizes local private files.
  if (!IS_LOCAL_STUDIO) {
    if(isGuest())return true;
    if(!readUser())return false;
    const response=await fetch('/api/account');
    if(!response.ok){if(response.status===401)localStorage.removeItem('user');return false;}
    const data=await response.json();localStorage.setItem('user',JSON.stringify(data.user));return true;
  }
  const response=await fetch('/api/auth/session');
  if (!response.ok) { localStorage.removeItem('user'); sessionStorage.removeItem('mystikal_guest'); return false; }
  const data=await response.json();
  if (data.guest) { sessionStorage.setItem('mystikal_guest','true'); if(data.user)localStorage.setItem('user',JSON.stringify(data.user));else localStorage.removeItem('user'); }
  else { sessionStorage.removeItem('mystikal_guest'); localStorage.setItem('user',JSON.stringify(data.user)); }
  return true;
}
export async function continueAsGuest() {
  if (IS_LOCAL_STUDIO) {
    const response=await fetch('/api/auth/guest',{method:'POST'});
    if (!response.ok) throw new Error('No se pudo iniciar la sesión local. Reinicia el backend actualizado.');
    if (!await syncSession()) throw new Error('No se pudo confirmar la sesión local.');
  } else {
    localStorage.removeItem('user');
    sessionStorage.setItem('mystikal_guest','true');
  }
  localStorage.setItem('mystikal_session_changed',crypto.randomUUID());
}
export async function endSession() {
  if (IS_LOCAL_STUDIO) {
    const response=await fetch('/api/auth/logout',{method:'POST'});
    if (!response.ok) throw new Error('No se pudo cerrar la sesión.');
  } else if(!isGuest()) {
    const response=await fetch('/api/account/logout',{method:'POST'});
    if(!response.ok)throw new Error('No se pudo cerrar la sesión del servidor.');
  }
  localStorage.removeItem('user'); sessionStorage.removeItem('mystikal_guest');
  sessionStorage.removeItem('mystikal_demo_owner');
  localStorage.setItem('mystikal_session_changed',crypto.randomUUID());
}
