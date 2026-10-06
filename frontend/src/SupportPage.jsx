import { useState } from 'react';
import { Download, Mail, MessageCircle } from 'lucide-react';

// Public support addresses only; never configure SMTP credentials in the frontend.
const configuredEmail = (import.meta.env.VITE_SUPPORT_EMAIL || '').trim();
const configuredReportsEmail = (import.meta.env.VITE_REPORT_EMAIL || '').trim();
const validEmail = value => /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(value);

export default function SupportPage({ post }) {
  const [type, setType] = useState(post ? 'Denúncia de conteúdo' : 'Problema no aplicativo');
  const [details, setDetails] = useState('');
  const [message, setMessage] = useState('');
  const email = type === 'Denúncia de conteúdo' && validEmail(configuredReportsEmail) ? configuredReportsEmail : configuredEmail;
  const canSend = validEmail(email);
  const subject = `[Revigório de Fé] ${type}`;
  const body = `${subject}\n${post ? `Publicação: ${post.id}\nTítulo: ${post.titulo}\n` : ''}\n${details.trim()}\n\nVersão: beta-acessibilidade-1`;
  const emailUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  function download(event) {
    event.preventDefault();
    const url = URL.createObjectURL(new Blob([body], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'revigorio-relato.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage('Relato baixado. Ele ainda não foi enviado à equipe.');
  }

  return <section className="discovery-page support-page">
    <div className="page-intro"><span className="eyebrow"><MessageCircle size={18} aria-hidden="true" /> ESTAMOS CONSTRUINDO JUNTOS</span><h1>Ajuda e relatos</h1><p>Conte o que aconteceu ou compartilhe uma sugestão.</p></div>
    <article className="discovery-card">
      {canSend ? <p>Contato da equipe: <a href={`mailto:${email}`}>{email}</a></p> : <p className="educational-note">O canal de atendimento ainda não está disponível nesta versão. Você pode preparar e baixar seu relato para compartilhar com a equipe pelo canal que já utiliza.</p>}
      <form className="support-form" onSubmit={download}>
        <label>Tipo de relato<select value={type} onChange={event => { setType(event.target.value); setMessage(''); }}>{['Problema no aplicativo', 'Denúncia de conteúdo', 'Sugestão de melhoria'].map(value => <option key={value}>{value}</option>)}</select></label>
        {post && <p className="report-context">Publicação #{post.id}: {post.titulo}</p>}
        <label>O que aconteceu?<textarea required minLength={10} maxLength={1500} rows={6} value={details} onChange={event => { setDetails(event.target.value); setMessage(''); }} placeholder={type === 'Denúncia de conteúdo' ? 'Explique por que o conteúdo precisa de revisão. Se possível, informe o autor e o título.' : 'Descreva os passos, o resultado esperado e a mensagem de erro, se houver.'} /></label>
        <small>Não inclua senhas ou dados pessoais de outras pessoas. O texto não é publicado na comunidade nem enviado automaticamente.</small>
        <div className="support-actions">
          <button className="outline-button" type="submit"><Download size={18} aria-hidden="true" /> Baixar relato</button>
          {canSend && details.trim().length >= 10 && <a className="gradient-button email-action" href={emailUrl} onClick={() => setMessage('Confirme o envio no seu aplicativo de e-mail. Abrir a mensagem não significa que ela foi enviada.')}><Mail size={18} aria-hidden="true" /> Abrir no e-mail</a>}
        </div>
        <p role="status">{message}</p>
      </form>
    </article>
    <article className="discovery-card"><h2>Sobre sua conta</h2><p>O beta permite cadastro e entrada com e-mail e senha. Se houver falha de conexão, tente novamente mais tarde: seu acesso depende da disponibilidade do serviço de contas.</p><p>Este beta ainda não oferece vinculação com Google ou Facebook.</p></article>
  </section>;
}
