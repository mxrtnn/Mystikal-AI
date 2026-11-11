export type UserSession = { name?: string; email?: string };
export function readUser(): UserSession | null {
  try { const user=JSON.parse(localStorage.getItem('user') || 'null'); return user && typeof user==='object' ? user : null; } catch { return null; }
}
export function isGuest() { return sessionStorage.getItem('mystikal_guest')==='true'; }
export async function syncSession() {
  const response=await fetch('/api/auth/session');
  if (!response.ok) { localStorage.removeItem('user'); sessionStorage.removeItem('mystikal_guest'); return false; }
  const data=await response.json();
  if (data.guest) { sessionStorage.setItem('mystikal_guest','true'); localStorage.removeItem('user'); }
  else { sessionStorage.removeItem('mystikal_guest'); localStorage.setItem('user',JSON.stringify(data.user)); }
  return true;
}
export async function continueAsGuest() {
  const response=await fetch('/api/auth/guest',{method:'POST'});
  if (!response.ok) throw new Error('No se pudo iniciar la sesión local. Reinicia el backend actualizado.');
  await syncSession();
  localStorage.setItem('mystikal_session_changed',crypto.randomUUID());
}
export async function endSession() {
  const response=await fetch('/api/auth/logout',{method:'POST'});
  if (!response.ok) throw new Error('No se pudo cerrar la sesión.');
  localStorage.removeItem('user'); sessionStorage.removeItem('mystikal_guest');
  localStorage.setItem('mystikal_session_changed',crypto.randomUUID());
}
