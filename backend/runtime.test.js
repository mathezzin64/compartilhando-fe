const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const express = require('express');
const { startRuntime } = require('./runtime');
function setup(options) {
  const app = express();
  app.get('/health', (req,res) => res.status(app.locals.databaseReady() ? 200 : 503).json({ ready: app.locals.databaseReady() }));
  const messages = [];
  const runtime = startRuntime(app, { port: 0, retryMs: 10, isConnected: () => true, initialize: async () => {}, logger: { log: text => messages.push(text), error: text => messages.push(text) }, ...options });
  return { app, runtime, messages };
}
test('HTTP opens on 0.0.0.0 before a slow database connection; health stays 503', async t => {
  let finish;
  const { app, runtime } = setup({ connect: () => new Promise(resolve => { finish = resolve; }) });
  t.after(() => runtime.stop());
  await once(runtime.server, 'listening');
  assert.equal(runtime.server.address().address, '0.0.0.0');
  const response = await fetch(`http://127.0.0.1:${runtime.server.address().port}/health`);
  assert.equal(response.status, 503);
  finish();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.locals.databaseReady(), true);
});
test('initial database failure retries without closing HTTP or logging a secret', async t => {
  let attempts = 0;
  let recovered;
  const done = new Promise(resolve => { recovered = resolve; });
  const { app, runtime, messages } = setup({ connect: async () => { if (++attempts === 1) throw new Error('querySrv SECRET_URI'); }, initialize: async () => recovered() });
  t.after(() => runtime.stop());
  await done;
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(attempts, 2);
  assert.equal(app.locals.databaseReady(), true);
  assert.equal(messages.some(message => message.includes('SECRET_URI')), false);
});
test('missing database configuration opens diagnostics but is never marked healthy', async t => {
  const { app, runtime, messages } = setup({ configured: false, connect: async () => { throw Error('should not connect'); } });
  t.after(() => runtime.stop());
  await once(runtime.server, 'listening');
  assert.equal(app.locals.databaseReady(), false);
  assert.ok(messages.some(message => message.includes('DATABASE_CONFIGURATION_MISSING')));
});
test('a database disconnection invalidates readiness after successful startup', async t => {
  let connected = true;
  const { app, runtime } = setup({ connect: async () => {}, isConnected: () => connected });
  t.after(() => runtime.stop());
  await once(runtime.server, 'listening');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.locals.databaseReady(), true);
  connected = false;
  assert.equal(app.locals.databaseReady(), false);
});
