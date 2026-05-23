import { formatExpenseMoney } from '../utils/expense.utils.js';

export function ExpenseSummaryCards({ summary }) {
  return (
    <div className="expense-summary-grid">
      <div className="stat-card expense-summary-card" style={{ '--accent-color': '#4fd1a5' }}>
        <div className="stat-label">Total filtrado</div>
        <div className="stat-value">{formatExpenseMoney(summary.total)}</div>
        <div className="stat-sub">{summary.count} gastos en la lista</div>
      </div>
      <div className="stat-card expense-summary-card" style={{ '--accent-color': '#a78bfa' }}>
        <div className="stat-label">Gastos recurrentes</div>
        <div className="stat-value">{formatExpenseMoney(summary.recurringTotal)}</div>
        <div className="stat-sub">Suma de ítems marcados recurrentes</div>
      </div>
      <div className="stat-card expense-summary-card" style={{ '--accent-color': '#4a8cf7' }}>
        <div className="stat-label">Categoría principal</div>
        <div className="stat-value expense-summary-topcat">{summary.topCategory?.label ?? '—'}</div>
        <div className="stat-sub">Mayor gasto en la lista</div>
      </div>
    </div>
  );
}
