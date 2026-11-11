// Accounts are public; GPU inference and private files stay on loopback.
export function isLocalStudioHost(hostname: string) {
  return ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname.toLowerCase());
}
export const IS_LOCAL_STUDIO = isLocalStudioHost(window.location.hostname);
export const LOCAL_STUDIO_ORIGIN = 'http://127.0.0.1:5173';
export const AUTH_SERVICE_ORIGIN = (import.meta.env.VITE_AUTH_API_URL || 'https://mystikal-ai.onrender.com').replace(/\/$/,'');
export const LOGIN_URL = IS_LOCAL_STUDIO ? '/api/auth/login' : '/api/login';
export const REGISTER_URL = IS_LOCAL_STUDIO ? `${AUTH_SERVICE_ORIGIN}/api/register` : '/api/register';
