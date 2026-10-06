function databaseErrorCode(error) {
  if (error?.code === 18 || /Authentication failed|bad auth/i.test(error?.message || '')) return 'DATABASE_AUTH_FAILED';
  if (/ENOTFOUND|ECONNREFUSED|querySrv|ETIMEOUT/i.test(error?.message || '')) return 'DATABASE_NETWORK_ERROR';
  return 'DATABASE_CONNECTION_FAILED';
}

function startRuntime(app, { port, connect, initialize, isConnected, configured = true, retryMs = 5000, logger = console }) {
  let ready = false;
  let stopped = false;
  let retryTimer;
  let attempts = 0;
  app.locals.databaseReady = () => ready && isConnected();
  const server = app.listen(port, '0.0.0.0');
  async function connectDatabase() {
    if (stopped) return;
    try {
      await connect();
      if (stopped) return;
      await initialize();
      if (stopped) return;
      ready = true;
      logger.log('Banco conectado; API pronta para contas e publicações.');
    } catch (error) {
      ready = false;
      if (stopped) return;
      // Never log the URI, credentials, hostnames or raw database error messages.
      logger.error(`Falha ao iniciar o banco: ${databaseErrorCode(error)}. Confira MONGODB_URI, o estado do cluster e a permissão de rede no MongoDB.`);
      const delay = Math.min(retryMs * 2 ** Math.min(attempts++, 4), 30000);
      retryTimer = setTimeout(connectDatabase, delay);
    }
  }
  server.once('listening', () => {
    logger.log(`HTTP aberto em 0.0.0.0:${server.address().port}. Verificação de prontidão: /health.`);
    if (!configured) {
      logger.error('DATABASE_CONFIGURATION_MISSING: configure MONGODB_URI no serviço da API no Render.');
      return;
    }
    void connectDatabase();
  });
  server.once('error', error => { stopped = true; clearTimeout(retryTimer); logger.error(`Falha na porta HTTP: ${error.code || 'LISTEN_ERROR'}`); });
  async function stop() {
    stopped = true;
    ready = false;
    clearTimeout(retryTimer);
    if (server.listening) await new Promise(resolve => server.close(resolve));
  }
  return { server, stop };
}
module.exports = { startRuntime, databaseErrorCode };
