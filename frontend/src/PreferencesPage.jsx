import { Accessibility, ArrowRight, Monitor, Moon, Settings, Sun } from 'lucide-react';
import { DEFAULT_PREFERENCES } from './preferences';

export default function PreferencesPage({ preferences, setPreferences, saved, onSupport }) {
  const change = (key, value) => setPreferences(current => ({ ...current, [key]: value }));
  return <section className="discovery-page preferences-page">
    <div className="page-intro"><span className="eyebrow"><Settings size={18} aria-hidden="true" /> DO SEU JEITO</span><h1>Preferências e acessibilidade</h1><p>Ajuste o Revigório para uma leitura mais confortável.</p></div>
    <article className="discovery-card">
      <fieldset className="preference-group"><legend>Aparência</legend><div className="preference-options">
        {[['system', 'Usar tema do aparelho', Monitor], ['light', 'Claro', Sun], ['dark', 'Escuro', Moon]].map(([value, label, Icon]) => <label className="preference-choice" key={value}><input type="radio" name="theme" value={value} checked={preferences.theme === value} onChange={() => change('theme', value)} /><Icon size={19} aria-hidden="true" /><span>{label}</span></label>)}
      </div></fieldset>
      <fieldset className="preference-group"><legend><Accessibility size={20} aria-hidden="true" /> Tamanho do texto</legend><div className="preference-options">
        {[['normal', 'Padrão (100%)'], ['large', 'Grande (125%)'], ['larger', 'Maior (150%)']].map(([value, label]) => <label className="preference-choice" key={value}><input type="radio" name="textSize" value={value} checked={preferences.textSize === value} onChange={() => change('textSize', value)} /><span>{label}</span></label>)}
      </div></fieldset>
      <div className="preference-switches">
        <label><input type="checkbox" checked={preferences.highContrast} onChange={event => change('highContrast', event.target.checked)} /><span><strong>Aumentar contraste</strong><small>Deixa textos, bordas e controles mais definidos.</small></span></label>
        <label><input type="checkbox" checked={preferences.reduceMotion} onChange={event => change('reduceMotion', event.target.checked)} /><span><strong>Reduzir animações</strong><small>Também respeitamos a preferência de movimento do seu aparelho.</small></span></label>
      </div>
      <div className="reading-preview"><span className="eyebrow">PRÉVIA DA LEITURA</span><h2>Seu tempo, sua caminhada</h2><p>Fé para a alma. Conhecimento para a mente. Esperança para a caminhada.</p></div>
      <p className="preference-status" role="status">{saved ? 'Preferências salvas neste aparelho, mesmo sem conta.' : 'As preferências valem nesta visita. O navegador não permitiu salvá-las.'}</p>
      <button className="outline-button" onClick={() => setPreferences({ ...DEFAULT_PREFERENCES })}>Restaurar preferências</button>
    </article>
    <article className="discovery-card"><h2>Ajude a melhorar o Revigório</h2><p>Encontrou um problema ou um conteúdo inadequado? Prepare um relato para a equipe.</p><button className="card-link" onClick={onSupport}>Ajuda e relatos <ArrowRight size={18} aria-hidden="true" /></button></article>
  </section>;
}
