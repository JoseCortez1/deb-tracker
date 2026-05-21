import { useEffect, useId, useState } from 'react';
import { ExpenseCategory } from '../types/expense.types.js';
import { getAllCategories, getCategoryLabel } from '../utils/expense.utils.js';

function todayLocalISO() {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, '0');
  const d = String(n.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function ExpenseFormModal({ open, mode, initial, onClose, onSubmit, customCategories = [] }) {
  const titleId = useId();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(ExpenseCategory.OTHER);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayLocalISO());
  const [isRecurring, setIsRecurring] = useState(false);
  const [errors, setErrors] = useState({});

  const categoryOptions = getAllCategories();

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initial) {
      setAmount(String(initial.amount ?? ''));
      setCategory(initial.category || ExpenseCategory.OTHER);
      setDescription(initial.description ?? '');
      setDate(initial.date || todayLocalISO());
      setIsRecurring(Boolean(initial.isRecurring));
    } else {
      setAmount(''); setCategory(ExpenseCategory.FOOD); setDescription('');
      setDate(todayLocalISO()); setIsRecurring(false);
    }
    setErrors({});
  }, [open, mode, initial?.id, customCategories]);

  if (!open) return null;

  const validate = () => {
    const e = {};
    const num = Number(amount);
    if (!amount || Number.isNaN(num) || num <= 0) e.amount = 'Ingresa un monto mayor a 0.';
    if (description.trim().length > 120) e.description = 'Máximo 120 caracteres.';
    if (!date) e.date = 'Elige una fecha.';
    else if (date > todayLocalISO()) e.date = 'La fecha no puede ser futura.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    onSubmit({ amount: Number(amount), category, description: description.trim(), date, isRecurring });
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={(ev) => ev.target === ev.currentTarget && onClose()}>
      <div className="modal-panel expense-form-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className="modal-title">{mode === 'add' ? 'Agregar gasto' : 'Editar gasto'}</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="input-group">
            <label htmlFor={`${titleId}-amt`}>Monto</label>
            <input id={`${titleId}-amt`} type="number" inputMode="decimal" min="0" step="0.01" value={amount} onChange={(ev) => setAmount(ev.target.value)} />
            {errors.amount ? <span className="input-error" role="alert">{errors.amount}</span> : null}
          </div>
          <div className="input-group">
            <label htmlFor={`${titleId}-cat`}>Categoría</label>
            <select id={`${titleId}-cat`} className="input-select" value={category} onChange={(ev) => setCategory(ev.target.value)}>
              {categoryOptions.map((c) => (<option key={c} value={c}>{getCategoryLabel(c)}</option>))}
            </select>
          </div>
          <div className="input-group">
            <label htmlFor={`${titleId}-desc`}>Descripción (opcional)</label>
            <input id={`${titleId}-desc`} type="text" maxLength={130} value={description} onChange={(ev) => setDescription(ev.target.value)} placeholder="Ej. Uber al trabajo" />
            {errors.description ? <span className="input-error" role="alert">{errors.description}</span> : null}
          </div>
          <div className="input-group">
            <label htmlFor={`${titleId}-date`}>Fecha</label>
            <input id={`${titleId}-date`} type="date" max={todayLocalISO()} value={date} onChange={(ev) => setDate(ev.target.value)} />
            {errors.date ? <span className="input-error" role="alert">{errors.date}</span> : null}
          </div>
          <div className="input-group expense-toggle-row">
            <label className="expense-toggle-label" htmlFor={`${titleId}-rec`}>
              <input id={`${titleId}-rec`} type="checkbox" checked={isRecurring} onChange={(ev) => setIsRecurring(ev.target.checked)} />
              <span>¿Es recurrente? (mensual)</span>
            </label>
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
