const KEY = 'revigorio-fe-session';
export const readToken = () => sessionStorage.getItem(KEY);
export const saveToken = (token) => sessionStorage.setItem(KEY, token);
export function clearSession() {
  sessionStorage.removeItem(KEY);
  localStorage.removeItem('revigorio-fe-user');
  localStorage.removeItem('compartilhando-fe-user');
}
export function readUser() {
  try {
    return readToken() ? JSON.parse(localStorage.getItem('revigorio-fe-user') || 'null') : null;
  } catch { clearSession(); return null; }
}
export async function apiFetch(url, options = {}) {
  const token = readToken();
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401 && !/\/auth\/(login|register)$/.test(url)) {
    clearSession();
    window.dispatchEvent(new Event('revigorio-session-expired'));
  }
  return response;
}
