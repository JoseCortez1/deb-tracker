import { formatExpenseMoney } from '../utils/expense.utils.js';

/**
 * @param {{ summary: { totalMonth: number, recurringTotal: number, topCategory: string|null } }} props
 */
export function ExpenseSummaryCards({ summary }) {
  return (
    <div className="expense-summary-grid">
      <div className="stat-card expense-summary-card" style={{ '--accent-color': '#4fd1a5' }}>
        <div className="stat-label">Total del mes</div>
        <div className="stat-value">{formatExpenseMoney(summary.totalMonth)}</div>
        <div className="stat-sub">Mes calendario actual</div>
      </div>
      <div className="stat-card expense-summary-card" style={{ '--accent-color': '#a78bfa' }}>
        <div className="stat-label">Gastos recurrentes</div>
        <div className="stat-value">{formatExpenseMoney(summary.recurringTotal)}</div>
        <div className="stat-sub">Suma de ítems marcados recurrentes</div>
      </div>
      <div className="stat-card expense-summary-card" style={{ '--accent-color': '#4a8cf7' }}>
        <div className="stat-label">Categoría principal</div>
        <div className="stat-value expense-summary-topcat">
          {summary.topCategory ?? '—'}
        </div>
        <div className="stat-sub">Mayor gasto este mes</div>
      </div>
    </div>
  );
}
