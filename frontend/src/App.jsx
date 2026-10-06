import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Brain,
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
  Settings,
  Flag,
  Share2,
  Trash2,
  User,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import API_BASE_URL from './api';
import { apiFetch, readUser, saveToken, clearSession, readToken, persistUser } from './session';
import { HomePage, FaithPage, MindPage } from './Discovery';
import PreferencesPage from './PreferencesPage';
import SupportPage from './SupportPage';
import { usePreferences } from './preferences';
import useDialog from './useDialog';

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
  const authRequest = useRef(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; authRequest.current?.abort(); };
  }, []);
  const dialogRef = useDialog(onClose);
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

    if (loading) return;
    setLoading(true);
    authRequest.current = new AbortController();
    try {
      const response = await apiFetch(`${API_BASE_URL}/auth/${isRegister ? 'register' : 'login'}`, {
        method: 'POST',
        timeoutMs: 45000,
        signal: authRequest.current.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await response.json().catch(() => ({ error: 'O serviço de contas está indisponível no momento. Tente novamente mais tarde.' }));

      if (!alive.current) return;
      if (!response.ok) {
        setError(data.error || 'Não foi possível continuar.');
        return;
      }

      if (!/^[a-f0-9]{64}$/.test(data.token || '') || !data.usuario?.id) {
        setError('O acesso à conta está sendo atualizado. Tente novamente em instantes.');
        return;
      }
      saveToken(data.token);
      onAuth(data.usuario);
      onClose();
    } catch (error) {
      if (!alive.current || error.name === 'AbortError') return;
      setError(error.name === 'TimeoutError' ? error.message : 'Não foi possível conectar ao serviço de contas. Verifique sua conexão e tente novamente.');
    } finally {
      if (alive.current) setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <section ref={dialogRef} tabIndex={-1} className="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="icon-button modal-close" onClick={onClose} aria-label="Fechar">
          <X size={22} />
        </button>

        <h2 id="auth-title">{isRegister ? 'Criar Conta' : 'Entrar'}</h2>
        {error && <p className="form-error" role="alert">{error}</p>}
        <p className="auth-help">{isRegister ? "Crie sua conta com e-mail e senha." : "Entre com o e-mail e a senha cadastrados no Revigório."}</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <label>
              Nome
              <span className="field">
                <User size={20} />
                <input
                  required
                  maxLength={100}
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
                required
                maxLength={254}
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
                required
                name="senha"
                type="password"
                value={form.senha}
                onChange={handleChange}
                placeholder={isRegister ? "Entre 8 e 128 caracteres" : "Sua senha"}
                minLength={isRegister ? 8 : undefined}
                maxLength={128}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                disabled={loading}
              />
            </span>
          </label>

          <button className="gradient-button" disabled={loading}>
            {loading ? 'Aguarde...' : isRegister ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>

        <button className="text-button" disabled={loading} onClick={() => { setError(''); onModeChange(isRegister ? 'login' : 'register'); }}>
          {isRegister ? 'Já tem uma conta? Entrar' : 'Não tem uma conta? Criar conta'}
        </button>
      </section>
    </div>
  );
}

function App() {
  const { preferences, setPreferences, saved } = usePreferences();
  const [reportPost, setReportPost] = useState(null);
  const contentRef = useRef(null);
  const [tab, setTab] = useState('inicio');
  const feedRequest = useRef(0);
  const profileRequest = useRef(0);
  const searchRequest = useRef(0);
  const [feedError, setFeedError] = useState('');
  const [profileError, setProfileError] = useState('');
  const [searchError, setSearchError] = useState('');
  const [feedMode, setFeedMode] = useState('todos');
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
  const [publishing, setPublishing] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const [notice, setNotice] = useState('');
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(null);
  const [user, setUser] = useState(readUser);
  const [newPost, setNewPost] = useState({
    categoria: 'versiculos',
    titulo: '',
    conteudo: ''
  });

  const filteredPosts = useMemo(() => {
    return category === 'todas' ? posts : posts.filter(post => post.categoria === category);
  }, [posts, category]);

  const navigate = (target) => {
    setSelectedProfile(null);
    setTab(target);
    setError('');
    if (target === 'inicio') { setFeedMode('todos'); loadPosts('todos', null); }
    else if (target === 'comunidade') loadPosts(feedMode, null);
    setNotice('');
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => contentRef.current?.focus({ preventScroll: true }));
  };

  const openSupport = (post = null) => {
    setReportPost(post);
    navigate('ajuda');
  };

  const sharePost = async (post) => {
    const text = `${post.titulo}\n\n${post.conteudo}\n\n${post.autorNome} • Revigório de Fé`;
    try {
      if (navigator.share) await navigator.share({ title: post.titulo, text });
      else {
        await navigator.clipboard.writeText(text);
        setNotice('Publicação copiada. Cole a mensagem no aplicativo em que deseja compartilhar.');
      }
    } catch (error) {
      if (error.name !== 'AbortError') setError('Não foi possível abrir o compartilhamento. Você pode selecionar e copiar o texto da publicação.');
    }
  };

  const logout = async () => {
    const revocation = apiFetch(API_BASE_URL + '/auth/logout', { method: 'POST' });
    clearSession();
    updateUser(null);
    profileRequest.current++;
    setSelectedProfile(null);
    setProfileDetails(null);
    setProfilePosts([]);
    setTab('inicio');
    setNotice('Você saiu deste aparelho.');
    try {
      const response = await revocation;
      if (!response.ok && response.status !== 401) throw new Error();
    } catch {
      if (!readToken()) setNotice('Você saiu deste aparelho. Não foi possível confirmar o encerramento da sessão no servidor.');
    }
  };

  useEffect(() => {
    const expired = () => {
      setUser(null);
      setSelectedProfile(null);
      setProfileDetails(null);
      setProfilePosts([]);
      setError('Sua sessão expirou. Entre novamente para publicar ou editar seu perfil.');
    };
    window.addEventListener('revigorio-session-expired', expired);
    let active = true;
    const token = readToken();
    if (token) apiFetch(API_BASE_URL + '/auth/me').then(async response => {
      if (response.ok) {
        const data = await response.json();
        if (active && readToken() === token) updateUser(data.usuario);
      }
    }).catch(() => {});
    return () => { active = false; window.removeEventListener('revigorio-session-expired', expired); };
  }, []);

  const updateUser = (nextUser) => {
    setUser(nextUser ? { ...nextUser, seguindoIds: nextUser.seguindoIds || [] } : null);
  };

  const buildPostUrl = (mode = feedMode, profile = selectedProfile) => {
    if (mode === 'seguindo' && user) return `${API_BASE_URL}/usuarios/${user.id}/seguindo/posts`;
    if (mode === 'perfil' && profile) return `${API_BASE_URL}/usuarios/${profile.id}/posts`;
    return `${API_BASE_URL}/posts`;
  };

  const loadPosts = async (mode = feedMode, profile = selectedProfile) => {
    const request = ++feedRequest.current;
    setLoading(true);
    setFeedError('');
    try {
      if (mode === 'seguindo' && !user) { setPosts([]); return; }
      const response = await apiFetch(buildPostUrl(mode, profile));
      const data = await response.json();
      if (!response.ok) throw new Error('Feed indisponível.');
      if (request === feedRequest.current) setPosts(Array.isArray(data) ? data : data.posts || []);
    } catch {
      if (request === feedRequest.current) {
        setPosts([]);
        setFeedError('Não foi possível carregar a comunidade. Tente novamente em instantes.');
      }
    } finally { if (request === feedRequest.current) setLoading(false); }
  };
  const loadProfiles = async (term = '') => {
    const params = new URLSearchParams();
    if (user) params.set('viewerId', String(user.id));
    if (term.trim()) params.set('q', term.trim());
    const response = await apiFetch(API_BASE_URL + '/usuarios?' + params);
    const data = await response.json();
    if (!response.ok) throw new Error('Pesquisa indisponível.');
    return Array.isArray(data) ? data : [];
  };
  const loadProfilePage = async (profile = user) => {
    if (!profile) return;
    const request = ++profileRequest.current;
    setProfileLoading(true);
    setProfileError('');
    setProfileDetails(profile);
    setProfilePosts([]);
    try {
      const response = await apiFetch(API_BASE_URL + '/usuarios/' + profile.id + '/posts');
      const data = await response.json();
      if (!response.ok) throw new Error('Perfil indisponível.');
      if (request !== profileRequest.current) return;
      setProfileDetails({ ...data.usuario, seguindo: (user?.seguindoIds || []).includes(data.usuario.id) });
      setProfilePosts(data.posts || []);
    } catch {
      if (request === profileRequest.current) setProfileError('Não foi possível carregar este perfil. Tente novamente.');
    } finally { if (request === profileRequest.current) setProfileLoading(false); }
  };
  const runSearch = async (event, termOverride) => {
    event?.preventDefault();
    const term = typeof termOverride === 'string' ? termOverride : searchTerm;
    const request = ++searchRequest.current;
    if (typeof termOverride === 'string') setSearchTerm(termOverride);
    setSearchLoading(true);
    setSearchError('');
    try {
      const params = new URLSearchParams();
      if (term.trim()) params.set('q', term.trim());
      const [response, profilesResult] = await Promise.all([apiFetch(API_BASE_URL + '/posts?' + params), loadProfiles(term)]);
      const data = await response.json();
      if (!response.ok) throw new Error('Pesquisa indisponível.');
      if (request !== searchRequest.current) return;
      setSearchPosts(Array.isArray(data) ? data : []);
      setSearchProfiles(profilesResult);
    } catch {
      if (request === searchRequest.current) {
        setSearchPosts([]);
        setSearchProfiles([]);
        setSearchError('Não foi possível pesquisar agora. Tente novamente.');
      }
    } finally { if (request === searchRequest.current) setSearchLoading(false); }
  };

  const refreshCurrent = async () => {
    setIsRefreshing(true);
    if (tab === 'pesquisar') await runSearch();
    else if (tab === 'perfil' && (selectedProfile || user)) await loadProfilePage(selectedProfile || user);
    else await loadPosts(tab === 'inicio' ? 'todos' : feedMode, null);
    setIsRefreshing(false);
  };

  useEffect(() => {
    setFeedMode('todos');
    loadPosts('todos', null);
  }, [user?.id]);

  useEffect(() => { persistUser(user); }, [user]);

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
    setTab('comunidade');
    loadPosts(mode, null);
  };

  const openProfile = async (profile) => {
    setSelectedProfile(profile);
    setTab('perfil');
    window.scrollTo({ top: 0 });
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
        const response = await apiFetch(`${API_BASE_URL}/usuarios/${user.id}/foto`, {
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
    if (!user || Number(post.autorId) !== Number(user.id)) return;
    if (!window.confirm('Excluir esta publicação?')) return;

    try {
      const response = await apiFetch(`${API_BASE_URL}/posts/${post.id}`, {
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
    if (publishing) return;
    if (!user) {
      setModalMode('login');
      return;
    }
    if (!newPost.conteudo.trim()) return;

    setPublishing(true);
    try {
      const response = await apiFetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPost,
          titulo: newPost.titulo.trim() || newPost.conteudo.trim().split('\n')[0].slice(0, 80),
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
    } finally {
      setPublishing(false);
    }
  };

  const toggleFollow = async (profile) => {
    if (!user) {
      setModalMode('login');
      return;
    }

    const seguindo = profile.seguindo;
    try {
    const response = await apiFetch(`${API_BASE_URL}/usuarios/${profile.id}/seguir`, {
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
    } catch { setError('Não foi possível atualizar o perfil. Tente novamente.'); }
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

  const renderPost = (post, options = {}) => (
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
        {user && (Number(post.autorId) === Number(user.id) || options.allowDelete) && (
          <button className="delete-post" onClick={() => deletePost(post)}>
            <Trash2 size={16} />
            Excluir post
          </button>
        )}
      </footer>
      <div className="post-actions">
        <button className="report-button" onClick={() => sharePost(post)} aria-label={`Compartilhar: ${post.titulo}`}><Share2 size={16} aria-hidden="true" /> Compartilhar</button>
        <button className="report-button" onClick={() => openSupport(post)} aria-label={`Relatar conteúdo: ${post.titulo}`}><Flag size={16} aria-hidden="true" /> Relatar conteúdo</button>
      </div>
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
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
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
            <small>Fé, conhecimento e acolhimento</small>
          </span>
        </a>

        <div className="header-actions">
          <button className="settings-button" onClick={() => navigate('preferencias')} aria-label="Preferências e acessibilidade" title="Preferências e acessibilidade"><Settings size={22} aria-hidden="true" /></button>
        {user ? (
          <div className="user-actions">
            <button onClick={logout}>Sair</button>
          </div>
        ) : (
          <button className="login-button" onClick={() => setModalMode('login')}>
            <LogIn size={20} />
            Entrar
          </button>
        )}
        </div>
      </header>

      <div id="conteudo" ref={contentRef} tabIndex={-1}>
      {notice && <p className="global-notice" role="status">{notice}</p>}
      {tab === 'preferencias' && <PreferencesPage preferences={preferences} setPreferences={setPreferences} saved={saved} onSupport={() => openSupport()} />}
      {tab === 'ajuda' && <SupportPage key={reportPost?.id || 'general'} post={reportPost} />}
      {error && <div className="global-error" role="alert">{error}<button onClick={() => setError('')} aria-label="Fechar aviso"><X size={18} /></button></div>}
      {tab === 'inicio' && <HomePage user={user} navigate={navigate} posts={posts} renderPost={renderPost} loading={loading} error={feedError} onRetry={() => loadPosts('todos', null)} />}
      {tab === 'fe' && <FaithPage navigate={navigate} />}
      {tab === 'mente' && <MindPage />}

      {tab === 'comunidade' && (
        <>
          <div className="discovery-page community-intro"><div className="page-intro"><span className="eyebrow"><Users size={18} /> COMUNIDADE</span><h1>Juntos na caminhada</h1><p>Versículos, experiências, testemunhos e orações.</p></div><button className="gradient-button publish-action" onClick={() => navigate('criar')}><PlusCircle size={18} /> Criar publicação</button></div>
          <section className="home-search-panel">
            <form onSubmit={openSearch} className="profile-search">
              <Search size={19} />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                aria-label="Pesquisar perfil ou publicação"
                placeholder="Pesquisar perfil ou publicação"
              />
              <button>Buscar</button>
            </form>
          </section>

          <section className="community-filters" aria-label="Filtrar publicações">
            <div className="topic-buttons"><button aria-pressed={feedMode === 'todos'} onClick={() => changeFeedMode('todos')}>Todos</button><button aria-pressed={feedMode === 'seguindo'} onClick={() => changeFeedMode('seguindo')}>Seguindo</button></div>
            <div className="topic-buttons">{categories.map(item => <button key={item.id} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</button>)}</div>
          </section>
          {loading && <section className="status">Carregando posts...</section>}
          {!loading && feedError && (
            <section className="error-panel">
              <p>{feedError}</p>
              <button onClick={() => loadPosts()}>Tentar novamente</button>
            </section>
          )}
          {!loading && !feedError && (
            <section className="feed">
              {filteredPosts.map(renderPost)}
              {filteredPosts.length === 0 && (
                <section className="status">
                  {feedMode === 'seguindo' ? (user ? 'Nenhuma publicação nesta seleção. Encontre pessoas pela busca para começar a seguir.' : 'Entre para ver as publicações dos perfis que você segue.') : 'Nenhuma publicação nesta categoria ainda. Que tal compartilhar uma reflexão?'}
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
                <select aria-label="Categoria da publicação"
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
                  aria-label="Título da publicação (opcional)"
                  placeholder="Título (opcional)"
                  maxLength={160}
                />
                <textarea
                  required
                  value={newPost.conteudo}
                  onChange={(event) => setNewPost((current) => ({ ...current, conteudo: event.target.value }))}
                  aria-label="Conteúdo da publicação"
                  placeholder="Escreva sua mensagem"
                  maxLength={10000}
                  rows="7"
                />
                <small className="compose-hint">Uma nota também é uma publicação. Escreva sua mensagem; o título é opcional.</small>
                <button className="gradient-button" disabled={publishing}>{publishing ? 'Publicando...' : 'Publicar'}</button>
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
              aria-label="Pesquisar perfil ou publicação"
                placeholder="Pesquisar perfil ou publicação"
            />
            <button>Buscar</button>
          </form>

          {searchLoading && <p className="profiles-empty">Pesquisando...</p>}

          {searchError && <p role="alert" className="global-error">{searchError}</p>}
          {!searchLoading && !searchError && (
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
              {profileError && <div role="alert" className="error-panel"><p>{profileError}</p><button onClick={() => loadProfilePage(profileTarget)}>Tentar novamente</button></div>}
              <div className="profile-posts">
                {profileLoading && <section className="status compact-status">Carregando posts...</section>}
                {!profileLoading && profilePosts.map((post) => renderPost(post, { allowDelete: isOwnProfile }))}
                {!profileLoading && !profileError && profilePosts.length === 0 && (
                  <section className="status compact-status">Nenhuma publicação postada ainda.</section>
                )}
              </div>
              {isOwnProfile && <button className="outline-button" onClick={logout}>Sair da conta</button>}
            </>
          ) : (
            <section className="status">
              Entre para ver seu perfil, seguir pessoas e criar publicações.
              <button className="gradient-button inline-action" onClick={() => setModalMode('login')}>Entrar</button>
            </section>
          )}
        </section>
      )}

      </div>
      <nav className="bottom-nav" aria-label="Menu principal">
        {[['inicio', 'Início', Home], ['fe', 'Fé', BookOpen], ['mente', 'Mente', Brain], ['comunidade', 'Comunidade', Users], ['perfil', 'Perfil', User]].map(([id, label, Icon]) => {
          const active = tab === id || (id === 'comunidade' && ['criar', 'pesquisar'].includes(tab));
          return <button key={id} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} onClick={() => navigate(id)}><Icon size={21} /><span>{label}</span></button>;
        })}
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

