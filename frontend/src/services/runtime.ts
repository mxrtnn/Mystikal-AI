// The public site is a showcase. GPU, sessions and private files stay on loopback.
export function isLocalStudioHost(hostname: string) {
  return ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname.toLowerCase());
}
export const IS_LOCAL_STUDIO = isLocalStudioHost(window.location.hostname);
export const LOCAL_STUDIO_ORIGIN = 'http://127.0.0.1:5173';
