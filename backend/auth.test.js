const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, verifyPassword, digestToken } = require('./auth');
const { app, Usuario, Post, Sessao } = require('./index');
let server, base, users, sessions, posts;
const validToken = 'a'.repeat(64);
const query = (value) => ({ lean: async () => value });
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  Usuario.findOne = ({ id, email }) => query(users.find(u => id !== undefined ? u.id === id : u.email === email));
  Usuario.create = async value => { users.push(value); return value; };
  Usuario.updateOne = async (filter, changes) => Object.assign(users.find(u => u.id === filter.id), changes);
  Sessao.create = async value => { sessions.push(value); return value; };
  Sessao.findOne = ({ tokenHash, expiresAt }) => query(sessions.find(s => s.tokenHash === tokenHash && s.expiresAt > expiresAt.$gt));
  Sessao.deleteOne = async ({ tokenHash }) => { sessions = sessions.filter(s => s.tokenHash !== tokenHash); };
  Post.create = async value => { posts.push(value); return value; };
  Post.findOne = async ({ id }) => posts.find(p => p.id === id);
});
after(async () => { await new Promise(resolve => server.close(resolve)); });
beforeEach(() => {
  app.locals.databaseReady = () => true;
  users = [{ id: 11, nome: 'Ana', email: 'ana@example.test', senhaHash: digestToken('senha-antiga') }];
  sessions = [{ tokenHash: digestToken(validToken), usuarioId: 11, expiresAt: new Date(Date.now() + 60000) }];
  posts = [];
});
test('health and database routes report 503 while the database is unavailable', async () => {
  app.locals.databaseReady = () => false;
  assert.equal((await request('/health')).status, 503);
  assert.equal((await request('/posts')).status, 503);
  assert.equal((await request('/auth/login', { method: 'POST', body: { email: 'ana@example.test', senha: 'senha-antiga' } })).status, 503);
  assert.equal((await request('/live')).status, 200);
});
async function request(route, { method = 'GET', token, body } = {}) {
  const response = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, body: await response.json() };
}
test('passwords use independent salts and verify both current and legacy records', async () => {
  const first = await hashPassword('uma-senha-segura');
  const second = await hashPassword('uma-senha-segura');
  assert.notEqual(first, second);
  assert.equal(await verifyPassword('uma-senha-segura', first), true);
  assert.equal(await verifyPassword('outra', first), false);
  assert.equal(await verifyPassword('senha-antiga', digestToken('senha-antiga')), true);
  assert.equal(await verifyPassword('outra', digestToken('senha-antiga')), false);
  assert.equal(await verifyPassword('x', 'scrypt$invalido$invalido'), false);
});
test('every mutation rejects a caller with only a forged user ID', async () => {
  for (const [method, route] of [['POST', '/posts'], ['DELETE', '/posts/4'], ['PATCH', '/usuarios/11/foto'], ['POST', '/usuarios/22/seguir'], ['DELETE', '/usuarios/22/seguir']]) {
    assert.equal((await request(route, { method, body: { autorId: 11, usuarioId: 11, seguidorId: 11 } })).status, 401);
  }
});
test('a publication uses the authenticated author, ignoring forged identity', async () => {
  const result = await request('/posts', { method: 'POST', token: validToken, body: { categoria: 'oracoes', titulo: 'Pedido', conteudo: 'Uma oração', autorId: 999, autorNome: 'Outra pessoa' } });
  assert.equal(result.status, 201);
  assert.equal(result.body.post.autorId, 11);
  assert.equal(result.body.post.autorNome, 'Ana');
});
test('another user cannot delete a post or change the owner photo', async () => {
  posts.push({ id: 4, autorId: 22 });
  assert.equal((await request('/posts/4', { method: 'DELETE', token: validToken, body: { autorId: 22 } })).status, 403);
  assert.equal((await request('/usuarios/22/foto', { method: 'PATCH', token: validToken, body: { usuarioId: 22, fotoPerfil: '' } })).status, 403);
});
test('expired sessions are rejected even before MongoDB TTL cleanup', async () => {
  sessions[0].expiresAt = new Date(Date.now() - 1000);
  assert.equal((await request('/auth/me', { token: validToken })).status, 401);
});
test('logout revokes the token at the server', async () => {
  assert.equal((await request('/auth/logout', { method: 'POST', token: validToken })).status, 200);
  assert.equal((await request('/auth/me', { token: validToken })).status, 401);
});
test('existing login upgrades the password and issues a usable session', async () => {
  const result = await request('/auth/login', { method: 'POST', body: { email: 'ana@example.test', senha: 'senha-antiga' } });
  assert.equal(result.status, 200);
  assert.match(users[0].senhaHash, /^scrypt\$/);
  assert.equal((await request('/auth/me', { token: result.body.token })).body.usuario.id, 11);
  assert.equal(result.body.usuario.senhaHash, undefined);
  assert.equal(sessions.some(session => session.tokenHash === result.body.token), false);
});
test('wrong password is rejected without modifying the account', async () => {
  const result = await request('/auth/login', { method: 'POST', body: { email: 'ana@example.test', senha: 'errada' } });
  assert.equal(result.status, 401);
  assert.equal(users[0].senhaHash, digestToken('senha-antiga'));
});
test('new registration stores a salted password and returns a valid session', async () => {
  const result = await request('/auth/register', { method: 'POST', body: { nome: 'Bia', email: 'bia@example.test', senha: 'senha-segura-123' } });
  assert.equal(result.status, 201);
  assert.match(users[1].senhaHash, /^scrypt\$/);
  assert.equal((await request('/auth/me', { token: result.body.token })).body.usuario.nome, 'Bia');
});
