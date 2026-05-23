import { useEffect, useId, useState } from 'react';

export function BudgetItemModal({ open, item, index, onClose, onSave }) {
  const titleId = useId();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    if (!open || !item) return;
    setName(item.name || '');
    setEmoji(item.emoji || '📌');
    setAmount(item.amount || 0);
  }, [open, item?.name, item?.emoji, item?.amount]);

  if (!open || !item) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { alert('Escribe un nombre para el concepto.'); return; }
    onSave(index, { name: trimmed, emoji: emoji.trim() || '📌', amount: Number(amount) || 0 });
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className="modal-title">Editar concepto</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="input-group">
            <label htmlFor={`${titleId}-emoji`}>Emoji</label>
            <input id={`${titleId}-emoji`} type="text" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={8} placeholder="📌" />
          </div>
          <div className="input-group">
            <label htmlFor={`${titleId}-name`}>Nombre</label>
            <input id={`${titleId}-name`} type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
          </div>
          <div className="input-group">
            <label htmlFor={`${titleId}-amt`}>Monto</label>
            <input id={`${titleId}-amt`} type="number" min="0" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn modal-btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
