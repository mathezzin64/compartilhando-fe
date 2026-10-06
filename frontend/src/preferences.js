import { useEffect, useState } from 'react';

const KEY = 'revigorio-fe-preferences';
export const DEFAULT_PREFERENCES = { theme: 'system', textSize: 'normal', highContrast: false, reduceMotion: false };

export function readPreferences() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || 'null');
    return {
      theme: ['system', 'light', 'dark'].includes(value?.theme) ? value.theme : 'system',
      textSize: ['normal', 'large', 'larger'].includes(value?.textSize) ? value.textSize : 'normal',
      highContrast: value?.highContrast === true,
      reduceMotion: value?.reduceMotion === true
    };
  } catch { return { ...DEFAULT_PREFERENCES }; }
}

export function applyPreferences(preferences) {
  const dark = preferences.theme === 'dark' || (preferences.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const root = document.documentElement;
  root.dataset.theme = dark ? 'dark' : 'light';
  root.dataset.highContrast = String(preferences.highContrast);
  root.dataset.reduceMotion = String(preferences.reduceMotion);
  root.dataset.textSize = preferences.textSize;
  root.style.setProperty('--reading-scale', { normal: 1, large: 1.25, larger: 1.5 }[preferences.textSize] || 1);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#191421' : '#faf7ff');
}

export function usePreferences() {
  const [preferences, setPreferences] = useState(readPreferences);
  const [saved, setSaved] = useState(true);
  useEffect(() => {
    applyPreferences(preferences);
    try { localStorage.setItem(KEY, JSON.stringify(preferences)); setSaved(true); }
    catch { setSaved(false); }
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => applyPreferences(preferences);
    systemTheme.addEventListener('change', update);
    return () => systemTheme.removeEventListener('change', update);
  }, [preferences]);
  return { preferences, setPreferences, saved };
}
