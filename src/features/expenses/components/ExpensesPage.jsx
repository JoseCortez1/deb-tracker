import { useMemo, useState } from 'react';
import { useExpenses } from '../hooks/useExpenses.js';
import { ALL_EXPENSE_CATEGORIES } from '../types/expense.types.js';
import { CATEGORY_LABELS, getMonthOptionsForFilter } from '../utils/expense.utils.js';
import { ExpenseCard } from './ExpenseCard.jsx';
import { ExpenseFormModal } from './ExpenseFormModal.jsx';
import { ExpenseSummaryCards } from './ExpenseSummaryCards.jsx';

/**
 * @param {{ userId: string }} props
 */
export function ExpensesPage({ userId }) {
  const {
    expenses,
    filters,
    setFilters,
    addExpense,
    updateExpense,
    deleteExpense,
    summary,
  } = useExpenses(userId);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState(/** @type {'add'|'edit'} */ ('add'));
  const [editing, setEditing] = useState(/** @type {import('../types/expense.types.js').Expense|null} */ (null));

  const monthOptions = useMemo(() => getMonthOptionsForFilter(), []);

  const openAdd = () => {
    setFormMode('add');
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (exp) => {
    setFormMode('edit');
    setEditing(exp);
    setFormOpen(true);
  };

  const handleFormSubmit = (data) => {
    if (formMode === 'add') {
      addExpense(data);
    } else if (editing) {
      updateExpense(editing.id, data);
    }
  };

  const handleDelete = (exp) => {
    const ok = window.confirm(
      '¿Eliminar este gasto? Esta acción no se puede deshacer.'
    );
    if (ok) deleteExpense(exp.id);
  };

  const toggleCategory = (cat) => {
    setFilters((prev) => {
      const set = new Set(prev.categories);
      if (set.has(cat)) set.delete(cat);
      else set.add(cat);
      return { ...prev, categories: Array.from(set) };
    });
  };

  const selectAllCategories = () => {
    setFilters((prev) => ({ ...prev, categories: [...ALL_EXPENSE_CATEGORIES] }));
  };

  return (
    <div className="animate-in expenses-page">
      <div className="expenses-section-head">
        <div className="section-title section-title--inline">
          Registro de Gastos <span>· Base de hábitos de gasto</span>
        </div>
        <button type="button" className="btn" onClick={openAdd}>
          Agregar gasto
        </button>
      </div>

      <ExpenseSummaryCards summary={summary} />

      <div className="card expense-filters-card">
        <div className="expense-filters-row">
          <div className="input-group expense-filter-field">
            <label htmlFor="expense-filter-month">Mes</label>
            <select
              id="expense-filter-month"
              className="input-select"
              value={filters.monthKey}
              onChange={(e) =>
                setFilters((p) => ({ ...p, monthKey: e.target.value }))
              }
            >
              {monthOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group expense-filter-field expense-filter-cats">
            <span className="modal-label-block">Categorías</span>
            <div className="expense-cat-chips">
              <button
                type="button"
                className="btn-ghost expense-cat-all"
                onClick={selectAllCategories}
              >
                Todas
              </button>
              {ALL_EXPENSE_CATEGORIES.map((cat) => {
                const on = filters.categories.includes(cat);
                return (
                  <label key={cat} className={`expense-cat-chip${on ? ' on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleCategory(cat)}
                    />
                    <span>{CATEGORY_LABELS[cat]}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="expense-recurring-tabs" role="group" aria-label="Tipo de gasto">
          {[
            ['all', 'Todos'],
            ['recurring', 'Solo recurrentes'],
            ['unique', 'Solo únicos'],
          ].map(([k, label]) => (
            <button
              key={k}
              type="button"
              className={`expense-rec-tab${filters.recurringFilter === k ? ' active' : ''}`}
              onClick={() =>
                setFilters((p) => ({
                  ...p,
                  recurringFilter: /** @type {'all'|'recurring'|'unique'} */ (k),
                }))
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="expense-list">
        {expenses.length === 0 ? (
          <div className="expense-empty">
            <div className="expense-empty-icon" aria-hidden="true">
              🧾
            </div>
            <p className="expense-empty-text">No hay gastos registrados para este período</p>
            <button type="button" className="btn" onClick={openAdd}>
              Agregar primer gasto
            </button>
          </div>
        ) : (
          expenses.map((e) => (
            <ExpenseCard
              key={e.id}
              expense={e}
              onEdit={() => openEdit(e)}
              onDelete={() => handleDelete(e)}
            />
          ))
        )}
      </div>

      <ExpenseFormModal
        open={formOpen}
        mode={formMode}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
