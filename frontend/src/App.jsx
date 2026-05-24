import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  HandHeart,
  Heart,
  Lock,
  LogIn,
  Mail,
  MessageCircle,
  PenLine,
  Search,
  User,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import API_BASE_URL from './api';

const categories = [
  { id: 'todas', label: 'Todas', icon: Heart },
  { id: 'versiculos', label: 'Versículos', icon: BookOpen },
  { id: 'experiencias', label: 'Experiências', icon: User },
  { id: 'testemunhos', label: 'Testemunhos', icon: MessageCircle },
  { id: 'oracoes', label: 'Orações', icon: HandHeart }
];

const categoryLabels = {
  versiculos: 'Versículos',
  experiencias: 'Experiências',
  testemunhos: 'Testemunhos',
  oracoes: 'Orações'
};

function AuthModal({ mode, onClose, onModeChange, onAuth }) {
  const isRegister = mode === 'register';
  const [form, setForm] = useState({ nome: '', email: '', senha: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.email || !form.senha || (isRegister && !form.nome)) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/${isRegister ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Não foi possível continuar.');
        return;
      }

      onAuth(data.usuario);
      onClose();
    } catch {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <section className="modal" role="dialog" aria-modal="true">
        <button className="icon-button modal-close" onClick={onClose} aria-label="Fechar">
          <X size={22} />
        </button>

        <h2>{isRegister ? 'Criar Conta' : 'Entrar'}</h2>
        {error && <p className="form-error">{error}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <label>
              Nome
              <span className="field">
                <User size={20} />
                <input
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  placeholder="Seu nome completo"
                  autoComplete="name"
                  disabled={loading}
                />
              </span>
            </label>
          )}

          <label>
            Email
            <span className="field">
              <Mail size={20} />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                autoComplete="email"
                disabled={loading}
              />
            </span>
          </label>

          <label>
            Senha
            <span className="field">
              <Lock size={20} />
              <input
                name="senha"
                type="password"
                value={form.senha}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                disabled={loading}
              />
            </span>
          </label>

          <button className="gradient-button" disabled={loading}>
            {loading ? 'Aguarde...' : isRegister ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>

        <button className="text-button" onClick={() => onModeChange(isRegister ? 'login' : 'register')}>
          {isRegister ? 'Já tem uma conta? Entrar' : 'Não tem uma conta? Criar conta'}
        </button>
      </section>
    </div>
  );
}

function App() {
  const [category, setCategory] = useState('todas');
  const [view, setView] = useState('todos');
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [profileSearch, setProfileSearch] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('compartilhando-fe-user');
    return saved ? JSON.parse(saved) : null;
  });
  const [newPost, setNewPost] = useState({
    categoria: 'versiculos',
    titulo: '',
    conteudo: ''
  });

  const filteredPosts = useMemo(() => {
    if (category === 'todas') return posts;
    return posts.filter((post) => post.categoria === category);
  }, [category, posts]);

  const updateUser = (nextUser) => {
    setUser(nextUser ? { ...nextUser, seguindoIds: nextUser.seguindoIds || [] } : null);
  };

  const loadPosts = async (nextView = view, profile = selectedProfile) => {
    setLoading(true);
    setError('');
    try {
      let url = `${API_BASE_URL}/posts`;

      if (nextView === 'seguindo') {
        if (!user) {
          setPosts([]);
          return;
        }
        url = `${API_BASE_URL}/usuarios/${user.id}/seguindo/posts`;
      }

      if (nextView === 'perfil' && profile) {
        url = `${API_BASE_URL}/usuarios/${profile.id}/posts`;
      }

      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Não foi possível carregar os posts. Tente novamente.');
        return;
      }
      setPosts(Array.isArray(data) ? data : data.posts || []);
    } catch {
      setError('Não foi possível carregar os posts. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const loadProfiles = async (term = profileSearch) => {
    if (!user) {
      setProfiles([]);
      return;
    }

    setProfilesLoading(true);
    try {
      const params = new URLSearchParams({ viewerId: String(user.id) });
      if (term.trim()) params.set('q', term.trim());
      const response = await fetch(`${API_BASE_URL}/usuarios?${params.toString()}`);
      const data = await response.json();
      setProfiles(response.ok ? data : []);
    } catch {
      setProfiles([]);
    } finally {
      setProfilesLoading(false);
    }
  };

  useEffect(() => {
    loadPosts('todos', null);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('compartilhando-fe-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('compartilhando-fe-user');
    }
  }, [user]);

  useEffect(() => {
    if (view === 'perfis') loadProfiles();
  }, [view, user]);

  const changeView = (nextView) => {
    setView(nextView);
    setSelectedProfile(null);
    if (nextView === 'perfis') {
      loadProfiles();
      setLoading(false);
      return;
    }
    loadPosts(nextView, null);
  };

  const publishPost = async (event) => {
    event.preventDefault();
    if (!user || !newPost.titulo || !newPost.conteudo) return;

    try {
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPost,
          autorId: user.id,
          autorNome: user.nome
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Não foi possível publicar.');
        return;
      }
      setPosts((current) => [data.post, ...current]);
      setNewPost({ categoria: 'versiculos', titulo: '', conteudo: '' });
      setError('');
    } catch {
      setError('Não foi possível publicar agora.');
    }
  };

  const toggleFollow = async (profile) => {
    if (!user) {
      setModalMode('login');
      return;
    }

    const seguindo = profile.seguindo;
    const response = await fetch(`${API_BASE_URL}/usuarios/${profile.id}/seguir`, {
      method: seguindo ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seguidorId: user.id })
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || 'Não foi possível atualizar o perfil.');
      return;
    }

    updateUser(data.usuario);
    setProfiles((current) => current.map((item) => (
      item.id === profile.id ? { ...item, seguindo: !seguindo } : item
    )));
  };

  const openProfile = async (profile) => {
    setSelectedProfile(profile);
    setView('perfil');
    await loadPosts('perfil', profile);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Compartilhando Fé">
          <span className="logo">
            <Heart size={26} fill="currentColor" />
          </span>
          <span>
            <strong>COMPARTILHANDO F&Eacute;</strong>
            <small>Conectando corações</small>
          </span>
        </a>

        {user ? (
          <div className="user-actions">
            <span>{user.nome}</span>
            <button onClick={() => updateUser(null)}>Sair</button>
          </div>
        ) : (
          <button className="login-button" onClick={() => setModalMode('login')}>
            <LogIn size={20} />
            Entrar
          </button>
        )}
      </header>

      <section className="hero">
        <div>
          <p>Compartilhe versículos, experiências, testemunhos e pedidos de oração.</p>
          <h1>COMPARTILHANDO F&Eacute;</h1>
        </div>
        <div className="search-pill">
          <Search size={20} />
          <span>Comunidade de fé</span>
        </div>
      </section>

      <section className="filter-panel">
        <div className="view-tabs">
          <button className={view === 'todos' ? 'active' : ''} onClick={() => changeView('todos')}>
            <Heart size={18} />
            Todos
          </button>
          <button className={view === 'seguindo' ? 'active' : ''} onClick={() => changeView('seguindo')}>
            <Users size={18} />
            Seguindo
          </button>
          <button className={view === 'perfis' ? 'active' : ''} onClick={() => changeView('perfis')}>
            <UserPlus size={18} />
            Perfis
          </button>
        </div>

        {view !== 'perfis' && (
          <>
            <p>Filtrar por categoria</p>
            <div className="categories">
              {categories.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={category === item.id ? 'active' : ''}
                    onClick={() => setCategory(item.id)}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {view === 'perfil' && selectedProfile && (
          <div className="profile-heading">
            <strong>{selectedProfile.nome}</strong>
            <button onClick={() => changeView('perfis')}>Voltar aos perfis</button>
          </div>
        )}
      </section>

      {user && view !== 'perfis' && (
        <section className="compose">
          <div>
            <PenLine size={21} />
            <h2>Nova publicação</h2>
          </div>
          <form onSubmit={publishPost}>
            <select
              value={newPost.categoria}
              onChange={(event) => setNewPost((current) => ({ ...current, categoria: event.target.value }))}
            >
              {categories.filter((item) => item.id !== 'todas').map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
            <input
              value={newPost.titulo}
              onChange={(event) => setNewPost((current) => ({ ...current, titulo: event.target.value }))}
              placeholder="Título"
            />
            <textarea
              value={newPost.conteudo}
              onChange={(event) => setNewPost((current) => ({ ...current, conteudo: event.target.value }))}
              placeholder="Escreva sua mensagem"
              rows="4"
            />
            <button className="gradient-button">Publicar</button>
          </form>
        </section>
      )}

      {view === 'perfis' && (
        <section className="profiles-panel">
          {user ? (
            <>
              <form onSubmit={(event) => { event.preventDefault(); loadProfiles(); }} className="profile-search">
                <Search size={19} />
                <input
                  value={profileSearch}
                  onChange={(event) => setProfileSearch(event.target.value)}
                  placeholder="Buscar perfil para seguir"
                />
                <button>Buscar</button>
              </form>

              {profilesLoading && <p className="profiles-empty">Buscando perfis...</p>}

              {!profilesLoading && profiles.map((profile) => (
                <article className="profile-card" key={profile.id}>
                  <button className="profile-main" onClick={() => openProfile(profile)}>
                    <span>{profile.nome.slice(0, 1).toUpperCase()}</span>
                    <strong>{profile.nome}</strong>
                    <small>{profile.email}</small>
                  </button>
                  <button className={profile.seguindo ? 'outline-button' : 'gradient-button'} onClick={() => toggleFollow(profile)}>
                    {profile.seguindo ? 'Seguindo' : 'Seguir'}
                  </button>
                </article>
              ))}

              {!profilesLoading && profiles.length === 0 && (
                <p className="profiles-empty">Nenhum perfil encontrado.</p>
              )}
            </>
          ) : (
            <section className="status">
              Entre na sua conta para buscar perfis e seguir pessoas.
            </section>
          )}
        </section>
      )}

      {loading && view !== 'perfis' && <section className="status">Carregando posts...</section>}

      {!loading && error && (
        <section className="error-panel">
          <p>{error}</p>
          <button onClick={() => loadPosts()}>Tentar novamente</button>
        </section>
      )}

      {!loading && !error && view !== 'perfis' && (
        <section className="feed">
          {filteredPosts.map((post) => (
            <article key={post.id} className="post">
              <div>
                <span>{categoryLabels[post.categoria] || 'Publicação'}</span>
                <time>{new Date(post.createdAt).toLocaleDateString('pt-BR')}</time>
              </div>
              <h2>{post.titulo}</h2>
              <p>{post.conteudo}</p>
              <footer>
                {post.autorId ? (
                  <button onClick={() => openProfile({ id: post.autorId, nome: post.autorNome })}>{post.autorNome}</button>
                ) : (
                  post.autorNome
                )}
              </footer>
            </article>
          ))}

          {filteredPosts.length === 0 && (
            <section className="status">
              {view === 'seguindo' ? 'Nenhuma publicação dos perfis que você segue ainda.' : 'Nenhuma publicação nessa categoria ainda.'}
            </section>
          )}
        </section>
      )}

      {modalMode && (
        <AuthModal
          mode={modalMode}
          onClose={() => setModalMode(null)}
          onModeChange={setModalMode}
          onAuth={updateUser}
        />
      )}
    </main>
  );
}

export default App;
