import { useState } from 'react';
import { ArrowRight, BookOpen, Brain, HandHeart, Heart, Sparkles, Sun, Users } from 'lucide-react';

const readings = [
  { ref: 'Salmo 23:1–3', title: 'Há cuidado no caminho', reflection: 'A imagem do pastor nos convida a confiar no cuidado de Deus. Hoje, reserve um momento para reconhecer o que tem sustentado você.', step: 'Agradeça por uma pessoa que esteve ao seu lado.', prayer: 'Senhor, ajuda-me a perceber teu cuidado nas pequenas coisas e a oferecer cuidado a quem caminha comigo. Amém.' },
  { ref: 'Mateus 11:28–30', title: 'Um convite ao descanso', reflection: 'Jesus acolhe quem está cansado. Você pode levar suas preocupações a Deus com sinceridade, sem precisar encontrar as palavras perfeitas.', step: 'Separe alguns minutos para uma pausa tranquila.', prayer: 'Jesus, recebe o que hoje pesa em meu coração. Ensina-me a caminhar com mansidão e a reconhecer meus limites. Amém.' },
  { ref: 'Lamentações 3:22–23', title: 'Espaço para recomeçar', reflection: 'A passagem lembra a renovação das misericórdias de Deus. Um dia difícil não precisa definir toda a sua história.', step: 'Escolha uma tarefa pequena que você possa retomar hoje.', prayer: 'Pai, obrigado por mais um dia. Dá-me coragem para recomeçar com humildade e esperança. Amém.' },
  { ref: 'Filipenses 4:6–7', title: 'Uma conversa sincera', reflection: 'A oração abre espaço para apresentar necessidades e gratidão a Deus. Fé e busca por apoio podem caminhar juntas.', step: 'Escreva, em um lugar só seu, um agradecimento e um pedido.', prayer: 'Deus, apresento a ti minhas inquietações. Ajuda-me a receber apoio e a viver este dia um passo de cada vez. Amém.' },
  { ref: 'Gálatas 6:2', title: 'Caminhar em companhia', reflection: 'Carregar as cargas uns dos outros é um convite à presença. Nem sempre precisamos ter uma resposta; às vezes, escutar já é uma forma de servir.', step: 'Pergunte a alguém de confiança como ele está e escute com atenção.', prayer: 'Senhor, torna-me atento às pessoas. Dá-me humildade para pedir ajuda e generosidade para acolher. Amém.' },
  { ref: 'Tiago 1:5', title: 'Sabedoria para hoje', reflection: 'A passagem nos convida a pedir sabedoria. Antes de uma decisão, podemos orar, buscar informação e ouvir pessoas de confiança.', step: 'Anote uma dúvida e uma informação que ajudaria você a decidir.', prayer: 'Pai, guia minhas escolhas. Ajuda-me a ouvir com atenção e agir com responsabilidade. Amém.' },
  { ref: 'Salmo 118:24', title: 'Perceber o presente', reflection: 'Há espaço para gratidão mesmo quando a vida não está perfeita. Procure um pequeno sinal de beleza ou cuidado neste dia.', step: 'Observe algo simples ao seu redor e agradeça por isso.', prayer: 'Deus, abre meus olhos para o bem que encontro hoje. Que minha gratidão se transforme em cuidado com os outros. Amém.' }
];

function dailyReading() {
  const now = new Date();
  const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  return readings[day % readings.length];
}

export function HomePage({ user, navigate, posts, renderPost, loading }) {
  const daily = dailyReading();
  return <section className="discovery-page">
    <div className="welcome-panel">
      <span className="eyebrow"><Sun size={16} /> SEU ESPAÇO DE ACOLHIMENTO</span>
      <h1>Meu Revigório<span>Olá{user ? `, ${user.nome.split(' ')[0]}` : ''}. Como está seu coração hoje?</span></h1>
      <p>Fé para a alma. Conhecimento para a mente.<br />Esperança para a caminhada.</p>
      <button className="welcome-action" onClick={() => navigate('fe')}>Um momento com Deus <ArrowRight size={18} /></button>
      <Heart className="welcome-heart" aria-hidden="true" />
    </div>
    <div className="section-heading"><h2>Um pouco de cuidado para hoje</h2><span>{new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</span></div>
    <div className="discovery-grid">
      <article className="discovery-card scripture-card"><span className="eyebrow"><BookOpen size={17} /> PALAVRA DO DIA</span><h2>{daily.title}</h2><strong className="scripture-reference">{daily.ref}</strong><p>{daily.reflection}</p><button className="card-link" onClick={() => navigate('fe')}>Continuar a reflexão <ArrowRight size={16} /></button></article>
      <article className="discovery-card"><span className="eyebrow"><HandHeart size={17} /> ORAÇÃO DE HOJE</span><h2>Uma pausa para conversar com Deus</h2><p>{daily.prayer}</p></article>
      <article className="discovery-card"><span className="eyebrow"><Brain size={17} /> MENTE EM FOCO</span><h2>Cuidado também cabe na rotina</h2><p>Conheça conteúdos educativos sobre autocuidado e sono, com fontes para aprofundar sua leitura.</p><button className="card-link" onClick={() => navigate('mente')}>Explorar Mente <ArrowRight size={16} /></button></article>
      <article className="discovery-card step-card"><span className="eyebrow"><Sparkles size={17} /> PEQUENO PASSO</span><h2>Uma ação possível</h2><p>{daily.step}</p><small>No seu tempo, sem comparação.</small></article>
    </div>
    <div className="section-heading"><h2>Uma comunidade para caminhar junto</h2><button className="card-link" onClick={() => navigate('comunidade')}>Ver comunidade <ArrowRight size={16} /></button></div>
    <div className="home-posts">{loading ? <p role="status">Carregando a comunidade…</p> : posts.length ? posts.slice(0, 2).map(renderPost) : <article className="discovery-card"><Users size={24} /><h2>Sua história pode acolher alguém</h2><p>Compartilhe uma reflexão, um testemunho ou um pedido de oração.</p><button className="card-link" onClick={() => navigate('criar')}>Criar publicação <ArrowRight size={16} /></button></article>}</div>
  </section>;
}

const prayers = {
  'Gratidão': 'Senhor, obrigado pelo cuidado recebido, pelas pessoas que caminham comigo e pelas oportunidades de aprender. Ajuda-me a transformar gratidão em generosidade. Amém.',
  'Família': 'Pai, cuida da nossa família. Ensina-nos a ouvir, respeitar limites e construir relações com amor e responsabilidade. Que saibamos buscar apoio quando precisarmos. Amém.',
  'Recomeços': 'Deus, acompanha este novo passo. Dá-me coragem para aprender com o passado e paciência para construir o que vem pela frente. Amém.'
};

export function FaithPage({ navigate }) {
  const [theme, setTheme] = useState('Gratidão');
  const daily = dailyReading();
  return <section className="discovery-page">
    <div className="page-intro"><span className="eyebrow"><BookOpen size={18} /> FÉ</span><h1>Alimento para a sua caminhada</h1><p>Reflexão, oração e um pequeno passo de cada vez.</p></div>
    <article className="discovery-card scripture-card"><span className="eyebrow">DEVOCIONAL DO DIA · LEITURA BREVE</span><h2>{daily.title}</h2><p><strong>Leitura bíblica sugerida: {daily.ref}</strong></p><p>Leia a passagem na sua Bíblia e reserve um momento para refletir.</p><p>{daily.reflection}</p><h3>Para levar ao dia</h3><p>{daily.step}</p><h3>Vamos orar?</h3><p>{daily.prayer}</p><small>Reflexão autoral da equipe Revigório de Fé.</small></article>
    <article className="discovery-card"><span className="eyebrow"><HandHeart size={18} /> ORAÇÕES POR TEMA</span><h2>Encontre palavras para este momento</h2><div className="topic-buttons" aria-label="Tema da oração">{Object.keys(prayers).map(item => <button key={item} aria-pressed={theme === item} onClick={() => setTheme(item)}>{item}</button>)}</div><p aria-live="polite">{prayers[theme]}</p></article>
    <article className="discovery-card"><h2>Compartilhe sua caminhada</h2><p>Conheça testemunhos e pedidos de oração da comunidade.</p><button className="card-link" onClick={() => navigate('comunidade')}>Ir para a comunidade <ArrowRight size={16} /></button></article>
  </section>;
}

export function MindPage() {
  return <section className="discovery-page">
    <div className="page-intro"><span className="eyebrow"><Brain size={18} aria-hidden="true" /> MENTE & CONHECIMENTO</span><h1>Compreender também é cuidar</h1><p>Conteúdos curtos e referências em português para aprofundar sua leitura.</p></div>
    <p className="educational-note">Este conteúdo é educativo e não substitui avaliação, diagnóstico ou acompanhamento profissional.</p>
    <div className="discovery-grid">
      <article className="discovery-card"><span className="eyebrow">SAÚDE MENTAL · LEITURA BREVE</span><h2>Cuidado que vai além do indivíduo</h2><p>A saúde mental se relaciona com o corpo, as emoções, os vínculos e as condições de vida. Apoio social e acesso a cuidado também fazem parte dessa história.</p><details><summary>Continuar lendo</summary><p>O Ministério da Saúde apresenta o bem-estar como resultado de fatores biológicos, psicológicos e sociais. Isso ajuda a compreender por que o cuidado não depende apenas da vontade de uma pessoa.</p><p>Buscar apoio não é sinal de fraqueza. Consulte os serviços e orientações da rede pública no material de referência.</p></details><a className="source-link" href="https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-mental" target="_blank" rel="noreferrer">Fonte: Ministério da Saúde — Saúde Mental (português; abre em nova aba) ↗</a></article>
      <article className="discovery-card"><span className="eyebrow">SONO E BEM-ESTAR · LEITURA BREVE</span><h2>Por que o sono importa?</h2><p>O sono participa do cuidado com a saúde física e mental. A qualidade do descanso também se relaciona com memória, humor e raciocínio.</p><details><summary>Continuar lendo</summary><p>O Canal Saúde, da Fiocruz, apresenta uma conversa com um pesquisador sobre o sono e seus benefícios. A Biblioteca Virtual em Saúde do Ministério da Saúde aborda como dificuldades de sono podem afetar o humor, a memória e o raciocínio.</p><p>Esses materiais são educativos. Dificuldades persistentes com o sono merecem avaliação profissional.</p></details><a className="source-link" href="https://www.canalsaude.fiocruz.br/videos/910-sono" target="_blank" rel="noreferrer">Fonte: Canal Saúde / Fiocruz — Sono (vídeo em português; abre em nova aba) ↗</a><a className="source-link" href="https://bvsms.saude.gov.br/disturbios-do-sono/" target="_blank" rel="noreferrer">Fonte: Biblioteca Virtual em Saúde / MS — Distúrbios do sono (português; abre em nova aba) ↗</a></article>
    </div>
    <article className="discovery-card"><span className="eyebrow">PARA APRENDER MAIS</span><h2>Referências em português</h2><ul className="source-list"><li><a href="https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-mental" target="_blank" rel="noreferrer">Ministério da Saúde: saúde mental e rede de cuidado (nova aba)</a></li><li><a href="https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/c/covid-19/publicacoes-tecnicas/capacitacao/cuidados-com-a-saude-mental" target="_blank" rel="noreferrer">Ministério da Saúde: vídeos sobre cuidados e redes de apoio (nova aba)</a></li><li><a href="https://www.canalsaude.fiocruz.br/videos/910-sono" target="_blank" rel="noreferrer">Canal Saúde / Fiocruz: conversa sobre sono (nova aba)</a></li><li><a href="https://bvsms.saude.gov.br/disturbios-do-sono/" target="_blank" rel="noreferrer">Biblioteca Virtual em Saúde / MS: distúrbios do sono (nova aba)</a></li></ul><small>Fontes consultadas em 6 de outubro de 2026. Conteúdo apresentado em resumo, com acesso ao material original.</small></article>
    <article className="discovery-card"><span className="eyebrow">FÉ E CONHECIMENTO</span><h2>Espaço para reflexão, respeito às evidências</h2><p>As reflexões espirituais estão na área Fé. Aqui, os conteúdos educativos apresentam suas fontes. Uma reflexão religiosa não é uma comprovação científica.</p></article>
  </section>;
}
