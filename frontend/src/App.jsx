import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Camera,
  HandHeart,
  Heart,
  Home,
  Lock,
  LogIn,
  Mail,
  MessageCircle,
  PenLine,
  PlusCircle,
  RefreshCw,
  Search,
  Trash2,
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
  const [tab, setTab] = useState('inicio');
  const [feedMode, setFeedMode] = useState('seguindo');
  const [category, setCategory] = useState('todas');
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [searchPosts, setSearchPosts] = useState([]);
  const [searchProfiles, setSearchProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileDetails, setProfileDetails] = useState(null);
  const [profilePosts, setProfilePosts] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('revigorio-fe-user') || localStorage.getItem('compartilhando-fe-user');
    return saved ? JSON.parse(saved) : null;
  });
  const [newPost, setNewPost] = useState({
    categoria: 'versiculos',
    titulo: '',
    conteudo: ''
  });

  const filteredPosts = useMemo(() => {
    return posts;
  }, [posts]);

  const updateUser = (nextUser) => {
    setUser(nextUser ? { ...nextUser, seguindoIds: nextUser.seguindoIds || [] } : null);
  };

  const buildPostUrl = (mode = feedMode, profile = selectedProfile) => {
    if (mode === 'seguindo' && user) return `${API_BASE_URL}/usuarios/${user.id}/seguindo/posts`;
    if (mode === 'perfil' && profile) return `${API_BASE_URL}/usuarios/${profile.id}/posts`;
    return `${API_BASE_URL}/posts`;
  };

  const loadPosts = async (mode = feedMode, profile = selectedProfile) => {
    setLoading(true);
    setError('');
    try {
      if (mode === 'seguindo' && !user) {
        setPosts([]);
        return;
      }

      const response = await fetch(buildPostUrl(mode, profile));
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

  const loadProfiles = async (term = '') => {
    try {
      const params = new URLSearchParams();
      if (user) params.set('viewerId', String(user.id));
      if (term.trim()) params.set('q', term.trim());
      const response = await fetch(`${API_BASE_URL}/usuarios?${params.toString()}`);
      const data = await response.json();
      setProfiles(response.ok ? data : []);
      return response.ok ? data : [];
    } catch {
      setProfiles([]);
      return [];
    }
  };

  const loadProfilePage = async (profile = user) => {
    if (!profile) return;

    setProfileLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/${profile.id}/posts`);
      const data = await response.json();

      if (response.ok) {
        const perfil = {
          ...data.usuario,
          seguindo: profile.seguindo ?? selectedProfile?.seguindo ?? (user?.seguindoIds || []).includes(data.usuario.id)
        };
        setProfileDetails(perfil);
        setProfilePosts(data.posts || []);
      } else {
        setProfileDetails(profile);
        setProfilePosts([]);
      }
    } catch {
      setProfileDetails(profile);
      setProfilePosts([]);
    } finally {
      setProfileLoading(false);
    }
  };

  const runSearch = async (event, termOverride) => {
    event?.preventDefault();
    const termoBusca = typeof termOverride === 'string' ? termOverride : searchTerm;
    if (typeof termOverride === 'string') setSearchTerm(termOverride);
    setSearchLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (termoBusca.trim()) params.set('q', termoBusca.trim());
      const [postsResponse, profilesResult] = await Promise.all([
        fetch(`${API_BASE_URL}/posts?${params.toString()}`),
        loadProfiles(termoBusca)
      ]);
      const postsData = await postsResponse.json();
      setSearchPosts(postsResponse.ok ? postsData : []);
      setSearchProfiles(profilesResult);
    } catch {
      setSearchPosts([]);
      setSearchProfiles([]);
      setError('Não foi possível pesquisar agora.');
    } finally {
      setSearchLoading(false);
    }
  };

  const refreshCurrent = async () => {
    setIsRefreshing(true);
    if (tab === 'pesquisar') await runSearch();
    else if (tab === 'perfil' && (selectedProfile || user)) await loadProfilePage(selectedProfile || user);
    else await loadPosts('seguindo', null);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadPosts('seguindo', null);
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('revigorio-fe-user', JSON.stringify(user));
      localStorage.removeItem('compartilhando-fe-user');
    } else {
      localStorage.removeItem('revigorio-fe-user');
      localStorage.removeItem('compartilhando-fe-user');
    }
  }, [user]);

  useEffect(() => {
    if (tab === 'perfil' && (selectedProfile || user)) loadProfilePage(selectedProfile || user);
  }, [tab, selectedProfile?.id, user?.id]);

  const handleTouchStart = (event) => {
    if (window.scrollY === 0) touchStartY.current = event.touches[0].clientY;
  };

  const handleTouchMove = (event) => {
    if (touchStartY.current === null || window.scrollY > 0) return;
    const distance = event.touches[0].clientY - touchStartY.current;
    if (distance > 0) setPullDistance(Math.min(distance, 92));
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 64) await refreshCurrent();
    touchStartY.current = null;
    setPullDistance(0);
  };

  const changeFeedMode = (mode) => {
    setFeedMode(mode);
    setSelectedProfile(null);
    setTab('inicio');
    loadPosts(mode, null);
  };

  const openProfile = async (profile) => {
    setSelectedProfile(profile);
    setTab('perfil');
    await loadProfilePage(profile);
  };

  const openSearch = async (event) => {
    event.preventDefault();
    setTab('pesquisar');
    await runSearch(event, searchTerm);
  };

  const handleProfilePhotoChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !user) return;

    if (!file.type.startsWith('image/') || file.size > 1200000) {
      setError('Escolha uma imagem menor para o perfil.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      setProfileLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/usuarios/${user.id}/foto`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuarioId: user.id, fotoPerfil: reader.result })
        });
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Não foi possível atualizar a foto.');
          return;
        }

        updateUser(data.usuario);
        setProfileDetails((current) => ({ ...(current || data.usuario), fotoPerfil: data.usuario.fotoPerfil }));
        setError('');
      } catch {
        setError('Não foi possível atualizar a foto agora.');
      } finally {
        setProfileLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const deletePost = async (post) => {
    if (!user || post.autorId !== user.id) return;
    if (!window.confirm('Excluir esta publicação?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/posts/${post.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autorId: user.id })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Não foi possível excluir a publicação.');
        return;
      }

      setPosts((current) => current.filter((item) => item.id !== post.id));
      setSearchPosts((current) => current.filter((item) => item.id !== post.id));
      setProfilePosts((current) => current.filter((item) => item.id !== post.id));
      setProfileDetails((current) => current ? { ...current, postsCount: Math.max(0, (current.postsCount || 1) - 1) } : current);
      setError('');
    } catch {
      setError('Não foi possível excluir a publicação agora.');
    }
  };

  const publishPost = async (event) => {
    event.preventDefault();
    if (!user) {
      setModalMode('login');
      return;
    }
    if (!newPost.titulo || !newPost.conteudo) return;

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
      setSelectedProfile(null);
      setTab('perfil');
      loadProfilePage(user);
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
    const updateList = (items) => items.map((item) => (
      item.id === profile.id
        ? {
            ...item,
            seguindo: !seguindo,
            seguidoresCount: Math.max(0, (item.seguidoresCount || 0) + (seguindo ? -1 : 1))
          }
        : item
    ));
    setProfiles(updateList);
    setSearchProfiles(updateList);
    setProfileDetails((current) => current && current.id === profile.id
      ? {
          ...current,
          seguindo: !seguindo,
          seguidoresCount: Math.max(0, (current.seguidoresCount || 0) + (seguindo ? -1 : 1))
        }
      : current);
    if (selectedProfile?.id === profile.id) {
      setSelectedProfile((current) => current ? { ...current, seguindo: !seguindo } : current);
    }
  };

  const renderAvatar = (profile, className = '') => (
    <span className={className}>
      {profile?.fotoPerfil ? (
        <img src={profile.fotoPerfil} alt="" />
      ) : (
        profile?.nome?.slice(0, 1).toUpperCase() || 'R'
      )}
    </span>
  );

  const renderPost = (post) => (
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
        {user && post.autorId === user.id && (
          <button className="delete-post" onClick={() => deletePost(post)}>
            <Trash2 size={16} />
            Excluir
          </button>
        )}
      </footer>
    </article>
  );

  const renderProfileCard = (profile) => (
    <article className="profile-card" key={profile.id}>
      <button className="profile-main" onClick={() => openProfile(profile)}>
        {renderAvatar(profile)}
        <strong>{profile.nome}</strong>
        <small>
          {profile.seguidoresCount || 0} seguidores · {profile.seguindoCount || 0} seguindo · {profile.postsCount || 0} posts
        </small>
      </button>
      <button className={profile.seguindo ? 'outline-button' : 'gradient-button'} onClick={() => toggleFollow(profile)}>
        {profile.seguindo ? 'Seguindo' : 'Seguir'}
      </button>
    </article>
  );

  const profileTarget = selectedProfile || user;
  const activeProfile = profileDetails?.id === profileTarget?.id ? profileDetails : profileTarget;
  const isOwnProfile = Boolean(user && activeProfile?.id === user.id);

  return (
    <main
      className="app-shell"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`pull-refresh ${pullDistance > 0 || isRefreshing ? 'visible' : ''}`} style={{ height: pullDistance ? `${pullDistance}px` : undefined }}>
        <RefreshCw size={18} className={isRefreshing ? 'spin' : ''} />
        <span>{isRefreshing ? 'Atualizando...' : 'Solte para atualizar'}</span>
      </div>

      <header className="topbar">
        <a className="brand" href="/" aria-label="Revigório de Fé">
          <span className="logo">
            <Heart size={26} />
          </span>
          <span>
            <strong>REVIG&Oacute;RIO DE F&Eacute;</strong>
            <small>Conectando corações</small>
          </span>
        </a>

        {user ? (
          <div className="user-actions">
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
          <h1>REVIG&Oacute;RIO DE F&Eacute;</h1>
        </div>
        <div className="search-pill">
          <Search size={20} />
          <span>Comunidade de fé</span>
        </div>
      </section>

      {tab === 'inicio' && (
        <>
          <section className="home-search-panel">
            <form onSubmit={openSearch} className="profile-search">
              <Search size={19} />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Pesquisar perfil ou publicação"
              />
              <button>Buscar</button>
            </form>
          </section>

          {loading && <section className="status">Carregando posts...</section>}
          {!loading && error && (
            <section className="error-panel">
              <p>{error}</p>
              <button onClick={() => loadPosts()}>Tentar novamente</button>
            </section>
          )}
          {!loading && !error && (
            <section className="feed">
              {filteredPosts.map(renderPost)}
              {filteredPosts.length === 0 && (
                <section className="status">
                  {user ? 'Nenhuma publicação dos perfis que você segue ainda.' : 'Entre para ver as publicações dos perfis que você segue.'}
                  {!user && <button className="gradient-button inline-action" onClick={() => setModalMode('login')}>Entrar</button>}
                </section>
              )}
            </section>
          )}
        </>
      )}

      {tab === 'criar' && (
        <section className="compose page-panel">
          {user ? (
            <>
              <div>
                <PenLine size={21} />
                <h2>Criar post</h2>
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
                  rows="7"
                />
                <button className="gradient-button">Publicar</button>
              </form>
            </>
          ) : (
            <section className="status">
              Entre na sua conta para criar uma publicação.
              <button className="gradient-button inline-action" onClick={() => setModalMode('login')}>Entrar</button>
            </section>
          )}
        </section>
      )}

      {tab === 'pesquisar' && (
        <section className="search-page">
          <form onSubmit={runSearch} className="profile-search">
            <Search size={19} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Pesquisar perfil ou publicação"
            />
            <button>Buscar</button>
          </form>

          {searchLoading && <p className="profiles-empty">Pesquisando...</p>}

          {!searchLoading && (
            <>
              <div className="section-title">
                <UserPlus size={18} />
                <h2>Perfis</h2>
              </div>
              <div className="profiles-list">
                {searchProfiles.map(renderProfileCard)}
                {searchProfiles.length === 0 && <p className="profiles-empty">Nenhum perfil encontrado.</p>}
              </div>

              <div className="section-title">
                <MessageCircle size={18} />
                <h2>Publicações</h2>
              </div>
              <div className="feed search-feed">
                {searchPosts.map(renderPost)}
                {searchPosts.length === 0 && <p className="profiles-empty">Nenhuma publicação encontrada.</p>}
              </div>
            </>
          )}
        </section>
      )}

      {tab === 'perfil' && (
        <section className="profile-page">
          {activeProfile ? (
            <>
              <div className="profile-summary">
                {renderAvatar(activeProfile, 'profile-photo')}
                <div>
                  <h2>{activeProfile.nome}</h2>
                  <div className="profile-stats">
                    <span>
                      <strong>{profileDetails?.seguidoresCount || 0}</strong>
                      seguidores
                    </span>
                    <span>
                      <strong>{profileDetails?.seguindoCount ?? (activeProfile.seguindoIds || []).length}</strong>
                      seguindo
                    </span>
                    <span>
                      <strong>{profileDetails?.postsCount ?? profilePosts.length}</strong>
                      posts
                    </span>
                  </div>
                </div>
              </div>

              <div className="profile-actions-row">
                {isOwnProfile ? (
                  <label className="outline-button photo-upload">
                    <Camera size={17} />
                    Foto de perfil
                    <input type="file" accept="image/*" onChange={handleProfilePhotoChange} />
                  </label>
                ) : user ? (
                  <button className={profileDetails?.seguindo ? 'outline-button' : 'gradient-button'} onClick={() => toggleFollow(profileDetails || activeProfile)}>
                    {profileDetails?.seguindo ? 'Seguindo' : 'Seguir'}
                  </button>
                ) : (
                  <button className="gradient-button" onClick={() => setModalMode('login')}>Entrar para seguir</button>
                )}
                {selectedProfile && <button className="outline-button" onClick={() => { setSelectedProfile(null); setTab('inicio'); }}>Voltar</button>}
              </div>

              <div className="section-title">
                <MessageCircle size={18} />
                <h2>Posts publicados</h2>
              </div>
              <div className="profile-posts">
                {profileLoading && <section className="status compact-status">Carregando posts...</section>}
                {!profileLoading && profilePosts.map(renderPost)}
                {!profileLoading && profilePosts.length === 0 && (
                  <section className="status compact-status">Nenhuma publicação postada ainda.</section>
                )}
              </div>
              {isOwnProfile && <button className="outline-button" onClick={() => updateUser(null)}>Sair da conta</button>}
            </>
          ) : (
            <section className="status">
              Entre para ver seu perfil, seguir pessoas e criar publicações.
              <button className="gradient-button inline-action" onClick={() => setModalMode('login')}>Entrar</button>
            </section>
          )}
        </section>
      )}

      <nav className="bottom-nav" aria-label="Menu principal">
        <button className={tab === 'inicio' ? 'active' : ''} onClick={() => setTab('inicio')}>
          <Home size={21} />
          <span>Início</span>
        </button>
        <button className={tab === 'criar' ? 'active' : ''} onClick={() => setTab('criar')}>
          <PlusCircle size={21} />
          <span>Criar</span>
        </button>
        <button className={tab === 'pesquisar' ? 'active' : ''} onClick={() => { setTab('pesquisar'); if (!searchPosts.length && !searchProfiles.length) runSearch(); }}>
          <Search size={21} />
          <span>Pesquisar</span>
        </button>
        <button className={tab === 'perfil' && !selectedProfile ? 'active' : ''} onClick={() => { setSelectedProfile(null); setTab('perfil'); }}>
          <User size={21} />
          <span>Perfil</span>
        </button>
      </nav>

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



