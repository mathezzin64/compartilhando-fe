const KEY = 'revigorio-fe-session';
let memoryToken = null;
let memoryUser = null;
const validToken = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const validUser = value => value && Number.isSafeInteger(value.id) && value.id > 0 && typeof value.nome === 'string' && value.nome.trim();
export function readToken() {
  try { const token = sessionStorage.getItem(KEY); return validToken(token) ? token : null; }
  catch { return memoryToken; }
}
export function saveToken(token) {
  if (!validToken(token)) throw new Error('Sessão inválida. Entre novamente.');
  memoryToken = token;
  try { sessionStorage.setItem(KEY, token); } catch { /* Session remains in memory. */ }
}
export function persistUser(user) {
  memoryUser = validUser(user) ? user : null;
  try {
    if (memoryUser) localStorage.setItem('revigorio-fe-user', JSON.stringify(memoryUser));
    else localStorage.removeItem('revigorio-fe-user');
    localStorage.removeItem('compartilhando-fe-user');
  } catch { /* Blocked storage must not crash the current visit. */ }
}
export function clearSession() {
  memoryToken = null;
  try { sessionStorage.removeItem(KEY); } catch { /* Storage may be blocked. */ }
  persistUser(null);
}
export function readUser() {
  if (!readToken()) return null;
  try {
    const user = JSON.parse(localStorage.getItem('revigorio-fe-user') || 'null');
    if (validUser(user)) return user;
  } catch { if (validUser(memoryUser)) return memoryUser; }
  clearSession();
  return null;
}
export async function apiFetch(url, options = {}) {
  const token = readToken();
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const { timeoutMs = 25000, signal, ...requestOptions } = options;
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  let timer;
  let response;
  try {
    response = await Promise.race([
      (async () => {
        const result = await fetch(url, { ...requestOptions, headers, signal: controller.signal });
        // Timeout includes downloading the body, not only the HTTP headers.
        const body = await result.arrayBuffer();
        return new Response(body.byteLength ? body : null, { status: result.status, statusText: result.statusText, headers: result.headers });
      })(),
      new Promise((resolve, reject) => {
        timer = setTimeout(() => {
          const error = new Error('O serviço demorou para responder. Tente novamente em alguns instantes.');
          error.name = 'TimeoutError';
          reject(error);
          controller.abort();
        }, timeoutMs);
      })
    ]);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
  if (response.status === 401 && token && readToken() === token && !/\/auth\/(login|register)$/.test(url)) {
    clearSession();
    window.dispatchEvent(new Event('revigorio-session-expired'));
  }
  return response;
}
