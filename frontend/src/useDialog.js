import { useEffect, useRef } from 'react';

export default function useDialog(onClose) {
  const ref = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const element = ref.current;
    const focusable = () => [...element.querySelectorAll('button, input, select, textarea, a[href], [tabindex="0"]')].filter(item => !item.disabled && item.getClientRects().length);
    element.querySelector('input')?.focus();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); close.current(); }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) { event.preventDefault(); element.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (!items.includes(document.activeElement)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    element.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = oldOverflow; element.removeEventListener('keydown', onKey); previous?.focus(); };
  }, []);
  return ref;
}
