import { useId, useState, useRef, useEffect, useCallback } from 'react';

/**
 * EmojiPicker — picker de emojis usando Emoji Mart
 *
 * @param {{
 *   value?: string,
 *   onChange: (emoji: string) => void,
 *   label?: string,
 * }} props
 */
export function EmojiPicker({ value = '📌', onChange, label }) {
  const pickerId = useId();
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);
  const btnRef = useRef(null);

  // Cerrar al hacer clic fuera
  const handleOutside = useCallback((ev) => {
    if (
      pickerRef.current && !pickerRef.current.contains(ev.target) &&
      btnRef.current && !btnRef.current.contains(ev.target)
    ) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleOutside);
      return () => document.removeEventListener('mousedown', handleOutside);
    }
  }, [open, handleOutside]);

  // Cargar Picker de Emoji Mart dinámicamente (solo cuando se abre)
  useEffect(() => {
    if (!open) return;
    let mounted = true;

    async function loadPicker() {
      try {
        const [{ default: data }, { default: Picker }] = await Promise.all([
          import('@emoji-mart/data'),
          import('@emoji-mart/react'),
        ]);

        if (!mounted || !pickerRef.current) return;

        // Limpiar el contenedor antes de montar
        pickerRef.current.innerHTML = '';

        const picker = new Picker({
          data,
          onEmojiSelect: (emojiData) => {
            onChange(emojiData.native || emojiData.id || value);
            setOpen(false);
          },
          onClickOutside: () => setOpen(false),
          autoFocus: true,
          theme: 'light',
          set: 'native',
          skin: 1,
          previewPosition: 'none',
          categories: ['frequent', 'people', 'nature', 'foods', 'activity', 'places', 'objects', 'symbols'],
        });

        pickerRef.current.appendChild(
          typeof picker === 'function'
            ? picker()
            : picker
        );
      } catch (err) {
        console.error('Error loading Emoji Mart:', err);
      }
    }

    loadPicker();

    return () => { mounted = false; };
  }, [open, onChange, value]);

  return (
    <div className="emoji-picker-wrapper">
      {label && <label className="emoji-picker-label">{label}</label>}
      <button
        ref={btnRef}
        type="button"
        className="emoji-picker-btn"
        id={`${pickerId}-btn`}
        onClick={() => setOpen((v) => !v)}
        title="Elegir emoji"
      >
        <span className="emoji-picker-current">{value}</span>
        <span className="emoji-picker-arrow" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div
          ref={pickerRef}
          className="emoji-picker-dropdown"
          id={`${pickerId}-panel`}
        />
      )}
    </div>
  );
}
