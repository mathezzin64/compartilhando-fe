import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { apiFetch, readUser, saveToken, persistUser, clearSession, readToken } from './session.js';

const originalFetch = globalThis.fetch;
const originalTimeout = AbortSignal.timeout;
const storage = () => { const items = new Map(); return { getItem: key => items.get(key) ?? null, setItem: (key, value) => items.set(key, String(value)), removeItem: key => items.delete(key), clear: () => items.clear() }; };
globalThis.sessionStorage = storage();
globalThis.localStorage = storage();
globalThis.window = new EventTarget();
beforeEach(() => { clearSession(); sessionStorage.clear(); localStorage.clear(); globalThis.fetch = originalFetch; AbortSignal.timeout = originalTimeout; });
after(() => { globalThis.fetch = originalFetch; AbortSignal.timeout = originalTimeout; });

test('works in an Android WebView without AbortSignal.timeout', async () => {
  AbortSignal.timeout = undefined;
  saveToken('a'.repeat(64));
  globalThis.fetch = async (_, options) => {
    assert.equal(options.headers.get('Authorization'), 'Bearer ' + 'a'.repeat(64));
    assert.ok(options.signal instanceof AbortSignal);
    return new Response('{}');
  };
  assert.equal((await apiFetch('https://api.example.test/posts')).status, 200);
});
test('a stalled request times out without retrying a mutation', async () => {
  let attempts = 0;
  globalThis.fetch = async (_, options) => {
    attempts++;
    return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))));
  };
  await assert.rejects(apiFetch('https://api.example.test/auth/register', { method: 'POST', timeoutMs: 10 }), { name: 'TimeoutError' });
  assert.equal(attempts, 1);
});
test('401 from a protected endpoint clears the session and notifies the app', async () => {
  saveToken('a'.repeat(64));
  localStorage.setItem('revigorio-fe-user', JSON.stringify({ id: 11 }));
  let count = 0;
  window.addEventListener('revigorio-session-expired', () => count++, { once: true });
  globalThis.fetch = async () => new Response('{}', { status: 401 });
  await apiFetch('https://api.example.test/auth/me');
  assert.equal(count, 1);
  assert.equal(readUser(), null);
});
test('an invalid login does not clear another active session', async () => {
  saveToken('a'.repeat(64));
  globalThis.fetch = async () => new Response('{}', { status: 401 });
  await apiFetch('https://api.example.test/auth/login');
  assert.equal(sessionStorage.getItem('revigorio-fe-session'), 'a'.repeat(64));
});
test('malformed local user data does not crash the application', () => {
  saveToken('a'.repeat(64));
  localStorage.setItem('revigorio-fe-user', '{invalid');
  assert.equal(readUser(), null);
});
test('valid JSON with an invalid user shape is discarded', () => {
  saveToken('a'.repeat(64));
  localStorage.setItem('revigorio-fe-user', '{}');
  assert.equal(readUser(), null);
});
test('blocked storage still allows login and local logout during the visit', () => {
  const local = globalThis.localStorage;
  const session = globalThis.sessionStorage;
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }, removeItem() { throw Error('blocked'); } };
  try {
    globalThis.localStorage = blocked;
    globalThis.sessionStorage = blocked;
    saveToken('a'.repeat(64));
    persistUser({ id: 11, nome: 'Ana' });
    assert.equal(readUser().nome, 'Ana');
    clearSession();
    assert.equal(readUser(), null);
  } finally { globalThis.localStorage = local; globalThis.sessionStorage = session; }
});
test('a late 401 cannot destroy a newer login', async () => {
  let finish;
  saveToken('a'.repeat(64));
  globalThis.fetch = () => new Promise(resolve => { finish = resolve; });
  const response = apiFetch('https://api.example.test/auth/me');
  saveToken('b'.repeat(64));
  finish(new Response('{}', { status: 401 }));
  await response;
  assert.equal(readToken(), 'b'.repeat(64));
});
test('timeout covers a response whose headers arrive but whose body stalls', async () => {
  globalThis.fetch = async () => ({ arrayBuffer: () => new Promise(() => {}) });
  await assert.rejects(apiFetch('https://api.example.test/posts', { timeoutMs: 10 }), { name: 'TimeoutError' });
});
test('storage with read access but no write quota uses the current in-memory session', () => {
  const local = globalThis.localStorage;
  const session = globalThis.sessionStorage;
  const readOnly = { getItem: () => null, setItem() { throw Error('quota'); }, removeItem() {} };
  try {
    globalThis.localStorage = readOnly;
    globalThis.sessionStorage = readOnly;
    saveToken('a'.repeat(64));
    persistUser({ id: 11, nome: 'Ana' });
    assert.equal(readToken(), 'a'.repeat(64));
    assert.equal(readUser().id, 11);
    clearSession();
    assert.equal(readToken(), null);
  } finally { globalThis.localStorage = local; globalThis.sessionStorage = session; }
});
