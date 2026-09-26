const crypto = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(crypto.scrypt);
const digestToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${key.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  if (/^[a-f0-9]{64}$/.test(stored)) {
    return crypto.timingSafeEqual(Buffer.from(digestToken(password), 'hex'), Buffer.from(stored, 'hex'));
  }
  const [algorithm, salt, hash] = stored.split('$');
  if (algorithm !== 'scrypt' || !/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/.test(hash)) return false;
  const key = await scrypt(password, salt, 64);
  return crypto.timingSafeEqual(key, Buffer.from(hash, 'hex'));
}

function createAuth(Usuario, Sessao) {
  async function issueSession(usuario) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await Sessao.create({ tokenHash: digestToken(token), usuarioId: usuario.id, expiresAt });
    return { token, expiresAt };
  }
  async function requireAuth(req, res, next) {
    try {
      const token = (req.headers.authorization || '').match(/^Bearer ([a-f0-9]{64})$/)?.[1];
      if (!token) return res.status(401).json({ error: 'Entre na sua conta para continuar.' });
      const session = await Sessao.findOne({ tokenHash: digestToken(token), expiresAt: { $gt: new Date() } }).lean();
      if (!session) return res.status(401).json({ error: 'Sua sessão expirou. Entre novamente.' });
      const usuario = await Usuario.findOne({ id: session.usuarioId }).lean();
      if (!usuario) return res.status(401).json({ error: 'Conta não encontrada. Entre novamente.' });
      req.usuario = usuario;
      req.sessionTokenHash = session.tokenHash;
      next();
    } catch (error) { next(error); }
  }
  return { issueSession, requireAuth };
}

module.exports = { hashPassword, verifyPassword, createAuth, digestToken };
