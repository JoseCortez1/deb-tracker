import { useEffect, useId, useState } from 'react';

function isPngOrSvg(file) {
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  if (type === 'image/png' || type === 'image/svg+xml') return true;
  if (name.endsWith('.png') || name.endsWith('.svg')) return true;
  return false;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function DebtIdentityModal({
  open,
  variant,
  debt,
  onClose,
  onSaveAdd,
  onSaveEdit,
}) {
  const titleId = useId();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('💳');
  const [iconUrl, setIconUrl] = useState('');
  const [initialBalance, setInitialBalance] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [minPayment, setMinPayment] = useState(0);
  const [fileKey, setFileKey] = useState(0);

  useEffect(() => {
    if (!open) return;
    if (variant === 'edit' && debt) {
      setName(debt.name ?? '');
      setEmoji(debt.emoji ?? '💳');
      setIconUrl(debt.iconUrl ?? '');
      setInitialBalance(debt.initialBalance ?? 0);
      setCurrentBalance(debt.currentBalance ?? 0);
      setMinPayment(debt.minPayment ?? 0);
    } else if (variant === 'add') {
      setName('Nueva deuda');
      setEmoji('💳');
      setIconUrl('');
      setInitialBalance(0);
      setCurrentBalance(0);
      setMinPayment(0);
    }
    setFileKey((k) => k + 1);
  }, [open, variant, debt?.id]);

  if (!open || !variant) return null;
  if (variant === 'edit' && !debt) return null;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isPngOrSvg(file)) {
      alert('Formato no admitido. Usa PNG o SVG.');
      e.target.value = '';
      return;
    }
    if (file.size > 800 * 1024) {
      alert('El archivo supera 800 KB. Elige una imagen más liviana.');
      e.target.value = '';
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setIconUrl(String(dataUrl));
    } catch {
      alert('No se pudo leer el archivo.');
    }
    e.target.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      alert('Escribe un nombre para la deuda.');
      return;
    }
    if (variant === 'add') {
      onSaveAdd({
        name: trimmed,
        emoji: emoji.trim() || '💳',
        iconUrl: iconUrl.trim(),
        initialBalance: Number(initialBalance) || 0,
        currentBalance: Number(currentBalance) || 0,
        minPayment: Number(minPayment) || 0,
      });
    } else if (variant === 'edit' && debt) {
      onSaveEdit(debt.id, {
        name: trimmed,
        emoji: emoji.trim() || '💳',
        iconUrl: iconUrl.trim(),
      });
    }
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="modal-title">
          {variant === 'add' ? 'Nueva deuda' : 'Editar nombre e icono'}
        </h2>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="input-group">
            <label htmlFor={`${titleId}-name`}>Nombre</label>
            <input
              id={`${titleId}-name`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="input-group">
            <label htmlFor={`${titleId}-emoji`}>Emoji (si no usas imagen)</label>
            <input
              id={`${titleId}-emoji`}
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={8}
              placeholder="💳"
            />
          </div>

          <div className="input-group">
            <span className="modal-label-block">Icono PNG o SVG</span>
            <input
              key={fileKey}
              type="file"
              accept="image/png,image/svg+xml,.png,.svg"
              className="modal-file-input"
              onChange={handleFile}
            />
            <p className="modal-hint">
              Opcional. Si subes imagen, se muestra en lugar del emoji (máx. ~800 KB).
            </p>
            {iconUrl ? (
              <div className="modal-icon-preview-row">
                <img src={iconUrl} alt="" className="modal-icon-preview" />
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setIconUrl('');
                    setFileKey((k) => k + 1);
                  }}
                >
                  Quitar imagen
                </button>
              </div>
            ) : null}
          </div>

          {variant === 'add' ? (
            <>
              <div className="modal-grid-3">
                <div className="input-group">
                  <label htmlFor={`${titleId}-ini`}>Saldo inicial</label>
                  <input
                    id={`${titleId}-ini`}
                    type="number"
                    min="0"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor={`${titleId}-cur`}>Saldo actual</label>
                  <input
                    id={`${titleId}-cur`}
                    type="number"
                    min="0"
                    value={currentBalance}
                    onChange={(e) => setCurrentBalance(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor={`${titleId}-min`}>Pago mínimo</label>
                  <input
                    id={`${titleId}-min`}
                    type="number"
                    min="0"
                    value={minPayment}
                    onChange={(e) => setMinPayment(e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : null}

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn modal-btn-primary">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
