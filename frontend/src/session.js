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
  // AbortSignal.timeout is absent in some Android WebViews used by the APK.
  const { timeoutMs = 25000, signal, ...requestOptions } = options;
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  let response;
  try {
    response = await fetch(url, { ...requestOptions, headers, signal: controller.signal });
  } catch (error) {
    if (timedOut) {
      const timeout = new Error('O serviço demorou para responder. Tente novamente em alguns instantes.');
      timeout.name = 'TimeoutError';
      throw timeout;
    }
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
  if (response.status === 401 && !/\/auth\/(login|register)$/.test(url)) {
    clearSession();
    window.dispatchEvent(new Event('revigorio-session-expired'));
  }
  return response;
}
