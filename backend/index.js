require('dotenv').config();

const { hashPassword, verifyPassword, createAuth } = require('./auth');
const cors = require('cors');
const dns = require('dns');
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3002;
const MONGODB_URI = process.env.MONGODB_URI;
const DNS_SERVERS = process.env.DNS_SERVERS;

if (require.main === module && !MONGODB_URI) {
  console.error('Erro: defina a variável MONGODB_URI com a string de conexão do MongoDB.');
  process.exit(1);
}

if (DNS_SERVERS) {
  dns.setServers(DNS_SERVERS.split(',').map((server) => server.trim()).filter(Boolean));
}

app.use(cors());
app.use(express.json({ limit: '5mb' }));

const baseOptions = {
  versionKey: false,
  timestamps: true
};

const Usuario = mongoose.model('Usuario', new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  senhaHash: { type: String, required: true },
  fotoPerfil: { type: String, default: '' },
  seguindoIds: { type: [Number], default: [] }
}, baseOptions));

const Post = mongoose.model('Post', new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  categoria: {
    type: String,
    enum: ['versiculos', 'experiencias', 'testemunhos', 'oracoes'],
    required: true,
    index: true
  },
  titulo: { type: String, required: true },
  conteudo: { type: String, required: true },
  autorId: { type: Number, default: null, index: true },
  autorNome: { type: String, default: 'Comunidade' }
}, baseOptions));

const Sessao = mongoose.model('Sessao', new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  usuarioId: { type: Number, required: true, index: true },
  expiresAt: { type: Date, required: true, expires: 0 }
}));
const { issueSession, requireAuth } = createAuth(Usuario, Sessao);
app.disable('x-powered-by');
app.set('trust proxy', 1);
const authAttempts = new Map();
app.use('/auth', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (!['/login', '/register'].includes(req.path)) return next();
  const now = Date.now();
  for (const [key, value] of authAttempts) if (value.until <= now) authAttempts.delete(key);
  const attempt = authAttempts.get(req.ip) || { count: 0, until: now + 15 * 60 * 1000 };
  if (++attempt.count > 30) return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' });
  authAttempts.set(req.ip, attempt);
  next();
});
app.post('/auth/logout', requireAuth, async (req, res, next) => {
  try {
    await Sessao.deleteOne({ tokenHash: req.sessionTokenHash });
    res.json({ message: 'Sessão encerrada.' });
  } catch (error) { next(error); }
});
app.get('/auth/me', requireAuth, (req, res) => res.json({ usuario: serializarUsuario(req.usuario) }));
let lastId = 0;
const nextId = () => (lastId = Math.max(Date.now(), lastId + 1));
const toNumber = (value) => Number.parseInt(value, 10);
const normalizarEmail = (email) => String(email || '').trim().toLowerCase();
const serializarUsuario = (usuario) => ({
  id: usuario.id,
  nome: usuario.nome,
  fotoPerfil: usuario.fotoPerfil || '',
  seguindoIds: Array.isArray(usuario.seguindoIds) ? usuario.seguindoIds : []
});
const montarPerfilPublico = async (usuario) => {
  const seguindoIds = Array.isArray(usuario.seguindoIds) ? usuario.seguindoIds : [];
  const [seguidoresCount, postsCount] = await Promise.all([
    Usuario.countDocuments({ seguindoIds: usuario.id }),
    Post.countDocuments({ autorId: usuario.id })
  ]);

  return {
    id: usuario.id,
    nome: usuario.nome,
    fotoPerfil: usuario.fotoPerfil || '',
    seguindoIds,
    seguidoresCount,
    seguindoCount: seguindoIds.length,
    postsCount
  };
};
const criarFiltroPosts = ({ categoria, autorId }) => {
  const filtro = {};

  if (['versiculos', 'experiencias', 'testemunhos', 'oracoes'].includes(categoria)) {
    filtro.categoria = categoria;
  }

  if (Number.isFinite(autorId)) {
    filtro.autorId = autorId;
  }

  return filtro;
};

async function seedDatabase() {
  const postsCount = await Post.countDocuments();
  if (postsCount > 0) return;

  await Post.insertMany([
    {
      id: nextId() + 1,
      categoria: 'versiculos',
      titulo: 'Um lembrete para hoje',
      conteudo: 'O Senhor é a minha força e o meu escudo; nele confiou o meu coração.',
      autorNome: 'Equipe Revigório de Fé'
    },
    {
      id: nextId() + 2,
      categoria: 'testemunhos',
      titulo: 'Gratidão que fortalece',
      conteudo: 'Compartilhar o que Deus tem feito também anima quem está precisando continuar firme.',
      autorNome: 'Equipe Revigório de Fé'
    },
    {
      id: nextId() + 3,
      categoria: 'oracoes',
      titulo: 'Pedido de oração',
      conteudo: 'Vamos orar pelas famílias, pelos professores e por cada aluno que precisa de direção.',
      autorNome: 'Equipe Revigório de Fé'
    }
  ]);
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'REVIGÓRIO DE FÉ', release: 'meu-revigorio-1' });
});

app.get('/', (req, res) => {
  res.send('Backend REVIGÓRIO DE FÉ rodando com MongoDB.');
});

app.post('/auth/register', async (req, res, next) => {
  try {
    const nome = String(req.body.nome || '').trim();
    const email = normalizarEmail(req.body.email);
    const senha = String(req.body.senha || '');

    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    if (senha.length < 8 || senha.length > 128) {
      return res.status(400).json({ error: 'A senha deve ter entre 8 e 128 caracteres' });
    }

    if (nome.length > 100 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Informe nome e email válidos.' });
    }
    const usuarioExistente = await Usuario.findOne({ email }).lean();
    if (usuarioExistente) {
      return res.status(409).json({ error: 'Este email já está cadastrado' });
    }

    const usuario = await Usuario.create({
      id: nextId(),
      nome,
      email,
      senhaHash: await hashPassword(senha)
    });

    res.status(201).json({
      message: 'Conta criada com sucesso',
      ...(await issueSession(usuario)),
      usuario: serializarUsuario(usuario)
    });
  } catch (error) {
    next(error);
  }
});

app.post('/auth/login', async (req, res, next) => {
  try {
    const email = normalizarEmail(req.body.email);
    const senha = String(req.body.senha || '');

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    if (senha.length > 128) return res.status(400).json({ error: 'Senha inválida' });
    const usuario = await Usuario.findOne({ email }).lean();
    if (!usuario || !(await verifyPassword(senha, usuario.senhaHash))) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    if (!usuario.senhaHash.startsWith('scrypt$')) {
      await Usuario.updateOne({ id: usuario.id, senhaHash: usuario.senhaHash }, { senhaHash: await hashPassword(senha) });
    }
    res.json({
      ...(await issueSession(usuario)),
      message: 'Login bem-sucedido',
      usuario: serializarUsuario(usuario)
    });
  } catch (error) {
    next(error);
  }
});

app.get('/usuarios', async (req, res, next) => {
  try {
    const termo = String(req.query.q || '').trim();
    const viewerId = req.query.viewerId ? toNumber(req.query.viewerId) : null;
    const filtro = termo
      ? { nome: { $regex: termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
      : {};

    const [usuarios, viewer] = await Promise.all([
      Usuario.find(filtro).select('id nome fotoPerfil seguindoIds createdAt').sort({ nome: 1 }).limit(25).lean(),
      Number.isFinite(viewerId) ? Usuario.findOne({ id: viewerId }).select('id seguindoIds').lean() : null
    ]);

    const seguindoIds = new Set(viewer?.seguindoIds || []);
    const perfis = await Promise.all(usuarios
      .filter((usuario) => usuario.id !== viewerId)
      .map(async (usuario) => ({
        ...(await montarPerfilPublico(usuario)),
        seguindo: seguindoIds.has(usuario.id),
        criadoEm: usuario.createdAt
      })));

    res.json(perfis);
  } catch (error) {
    next(error);
  }
});

app.post('/usuarios/:id/seguir', requireAuth, async (req, res, next) => {
  try {
    const seguidoId = toNumber(req.params.id);
    const seguidorId = req.usuario.id;

    if (!Number.isFinite(seguidoId) || !Number.isFinite(seguidorId)) {
      return res.status(400).json({ error: 'Perfis inválidos' });
    }

    if (seguidoId === seguidorId) {
      return res.status(400).json({ error: 'Você não pode seguir seu próprio perfil' });
    }

    const [seguido, seguidor] = await Promise.all([
      Usuario.findOne({ id: seguidoId }).lean(),
      Usuario.findOne({ id: seguidorId })
    ]);

    if (!seguido || !seguidor) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    seguidor.seguindoIds = [...new Set([...(seguidor.seguindoIds || []), seguidoId])];
    await seguidor.save();

    res.json({
      message: 'Perfil seguido com sucesso',
      usuario: serializarUsuario(seguidor)
    });
  } catch (error) {
    next(error);
  }
});

app.delete('/usuarios/:id/seguir', requireAuth, async (req, res, next) => {
  try {
    const seguidoId = toNumber(req.params.id);
    const seguidorId = req.usuario.id;

    if (!Number.isFinite(seguidoId) || !Number.isFinite(seguidorId)) {
      return res.status(400).json({ error: 'Perfis inválidos' });
    }

    const seguidor = await Usuario.findOne({ id: seguidorId });
    if (!seguidor) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    seguidor.seguindoIds = (seguidor.seguindoIds || []).filter((id) => id !== seguidoId);
    await seguidor.save();

    res.json({
      message: 'Você deixou de seguir este perfil',
      usuario: serializarUsuario(seguidor)
    });
  } catch (error) {
    next(error);
  }
});

app.patch('/usuarios/:id/foto', requireAuth, async (req, res, next) => {
  try {
    const usuarioId = toNumber(req.params.id);
    const solicitanteId = req.usuario.id;
    const fotoPerfil = String(req.body.fotoPerfil || '').trim();

    if (!Number.isFinite(usuarioId) || usuarioId !== solicitanteId) {
      return res.status(403).json({ error: 'Você só pode alterar a foto do seu próprio perfil' });
    }

    if (fotoPerfil && (!fotoPerfil.startsWith('data:image/') || fotoPerfil.length > 1800000)) {
      return res.status(400).json({ error: 'Envie uma imagem menor para o perfil' });
    }

    const usuario = await Usuario.findOneAndUpdate(
      { id: usuarioId },
      { fotoPerfil },
      { new: true }
    ).lean();

    if (!usuario) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    res.json({
      message: 'Foto de perfil atualizada',
      usuario: serializarUsuario(usuario)
    });
  } catch (error) {
    next(error);
  }
});

app.get('/usuarios/:id/posts', async (req, res, next) => {
  try {
    const autorId = toNumber(req.params.id);
    const categoria = String(req.query.categoria || '').trim();

    if (!Number.isFinite(autorId)) {
      return res.status(400).json({ error: 'Perfil inválido' });
    }

    const usuario = await Usuario.findOne({ id: autorId }).select('id nome fotoPerfil seguindoIds').lean();
    if (!usuario) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    const posts = await Post.find(criarFiltroPosts({ categoria, autorId })).sort({ createdAt: -1 }).lean();
    res.json({ usuario: await montarPerfilPublico(usuario), posts });
  } catch (error) {
    next(error);
  }
});

app.get('/usuarios/:id/seguindo/posts', async (req, res, next) => {
  try {
    const usuarioId = toNumber(req.params.id);
    const categoria = String(req.query.categoria || '').trim();

    if (!Number.isFinite(usuarioId)) {
      return res.status(400).json({ error: 'Perfil inválido' });
    }

    const usuario = await Usuario.findOne({ id: usuarioId }).select('id seguindoIds').lean();
    if (!usuario) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    const filtro = criarFiltroPosts({ categoria });
    filtro.autorId = { $in: usuario.seguindoIds || [] };

    const posts = await Post.find(filtro).sort({ createdAt: -1 }).lean();
    res.json({ seguindoIds: usuario.seguindoIds || [], posts });
  } catch (error) {
    next(error);
  }
});

app.get('/posts', async (req, res, next) => {
  try {
    const categoria = String(req.query.categoria || '').trim();
    const termo = String(req.query.q || '').trim();
    const autorId = req.query.autorId ? toNumber(req.query.autorId) : null;
    const filtro = criarFiltroPosts({ categoria, autorId });

    if (termo) {
      const regex = { $regex: termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
      filtro.$or = [
        { titulo: regex },
        { conteudo: regex },
        { autorNome: regex }
      ];
    }

    const posts = await Post.find(filtro).sort({ createdAt: -1 }).lean();
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

app.post('/posts', requireAuth, async (req, res, next) => {
  try {
    const categoria = String(req.body.categoria || '').trim();
    const titulo = String(req.body.titulo || '').trim();
    const conteudo = String(req.body.conteudo || '').trim();
    const autorId = req.usuario.id;
    const autorNome = req.usuario.nome;

    if (!['versiculos', 'experiencias', 'testemunhos', 'oracoes'].includes(categoria)) {
      return res.status(400).json({ error: 'Categoria inválida' });
    }

    if (!titulo || !conteudo || titulo.length > 160 || conteudo.length > 10000) {
      return res.status(400).json({ error: 'Informe título (até 160 caracteres) e conteúdo (até 10.000 caracteres)' });
    }

    if (autorId) {
      const usuario = await Usuario.findOne({ id: autorId }).lean();
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
    }

    const post = await Post.create({
      id: nextId(),
      categoria,
      titulo,
      conteudo,
      autorId,
      autorNome: autorNome || 'Comunidade'
    });

    res.status(201).json({
      message: 'Post publicado com sucesso',
      post
    });
  } catch (error) {
    next(error);
  }
});

app.delete('/posts/:id', requireAuth, async (req, res, next) => {
  try {
    const postId = toNumber(req.params.id);
    const autorId = req.usuario.id;

    if (!Number.isFinite(postId) || !Number.isFinite(autorId)) {
      return res.status(400).json({ error: 'Publicação inválida' });
    }

    const post = await Post.findOne({ id: postId });
    if (!post) {
      return res.status(404).json({ error: 'Publicação não encontrada' });
    }

    if (post.autorId !== autorId) {
      return res.status(403).json({ error: 'Você só pode excluir suas próprias publicações' });
    }

    await post.deleteOne();
    res.json({ message: 'Publicação excluída com sucesso' });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  if (error.code === 11000) return res.status(409).json({ error: 'Cadastro já existente. Tente entrar.' });
  console.error(error.message);
  res.status(500).json({ error: 'Erro interno no servidor' });
});

async function start() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    await seedDatabase();
    console.log('MongoDB conectado ao REVIGÓRIO DE FÉ.');
    app.listen(PORT, () => {
      console.log(`Backend REVIGÓRIO DE FÉ rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao conectar no MongoDB:', error.message);
    process.exit(1);
  }
}

if (require.main === module) start();
module.exports = { app, Usuario, Post, Sessao };


