import { CATEGORY_ICONS, CATEGORY_LABELS, formatExpenseDateShort, formatExpenseMoney } from '../utils/expense.utils.js';

/**
 * @param {{
 *   expense: import('../types/expense.types.js').Expense,
 *   onEdit: () => void,
 *   onDelete: () => void,
 * }} props
 */
export function ExpenseCard({ expense, onEdit, onDelete }) {
  const desc = (expense.description || '').trim();
  const title = desc || CATEGORY_LABELS[expense.category] || expense.category;
  const icon = CATEGORY_ICONS[expense.category] || '📌';

  return (
    <div className="expense-card">
      <div className="expense-card-main">
        <span className="expense-card-icon" aria-hidden="true">
          {icon}
        </span>
        <div className="expense-card-body">
          <div className="expense-card-title-row">
            <span className="expense-card-title">{title}</span>
            {expense.isRecurring ? (
              <span className="expense-badge">Recurrente</span>
            ) : null}
          </div>
          <div className="expense-card-meta">{formatExpenseDateShort(expense.date)}</div>
        </div>
        <div className="expense-card-amount">{formatExpenseMoney(expense.amount)}</div>
      </div>
      <div className="expense-card-actions">
        <button type="button" className="btn-ghost expense-card-btn" onClick={onEdit}>
          Editar
        </button>
        <span className="expense-card-actions-sep" aria-hidden="true">
          |
        </span>
        <button type="button" className="btn-ghost expense-card-btn" onClick={onDelete}>
          Eliminar
        </button>
      </div>
    </div>
  );
}
