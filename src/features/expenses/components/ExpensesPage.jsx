import { useMemo, useState } from 'react';
import { useExpenses } from '../hooks/useExpenses.js';
import { api } from '../../../api.js';
import { getAllCategories, getCategoryLabel, getCategoryIcon, getMonthOptionsForFilter, getTodayKey, getCurrentMonthKey } from '../utils/expense.utils.js';
import { ExpenseCard } from './ExpenseCard.jsx';
import { ExpenseFormModal } from './ExpenseFormModal.jsx';
import { ExpenseSummaryCards } from './ExpenseSummaryCards.jsx';
import { CategoryManager } from './CategoryManager.jsx';

export function ExpensesPage() {
  const {
    expenses, filters, setFilters, addExpense, updateExpense, deleteExpense,
    summary, refresh,
  } = useExpenses();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [editing, setEditing] = useState(null);
  const [catManagerOpen, setCatManagerOpen] = useState(false);
  const [customCategories, setCustomCategories] = useState([]);

  // Load custom categories from API
  useState(() => {
    api.get('/api/categories').then(setCustomCategories).catch(() => {});
  });

  const monthOptions = useMemo(() => getMonthOptionsForFilter(), []);
  const allCategoryIds = useMemo(() => getAllCategories(), [customCategories]);

  const openAdd = () => { setFormMode('add'); setEditing(null); setFormOpen(true); };
  const openEdit = (exp) => { setFormMode('edit'); setEditing(exp); setFormOpen(true); };
  const handleFormSubmit = (data) => {
    if (formMode === 'add') addExpense(data);
    else if (editing) updateExpense(editing.id, data);
    refresh();
  };
  const handleDelete = (exp) => {
    if (window.confirm('Eliminar este gasto? Esta acción no se puede deshacer.')) deleteExpense(exp.id);
  };

  const toggleCategory = (cat) => {
    setFilters((prev) => {
      const set = new Set(prev.categories);
      if (set.has(cat)) set.delete(cat); else set.add(cat);
      return { ...prev, categories: Array.from(set) };
    });
  };
  const selectAllCategories = () => setFilters((prev) => ({ ...prev, categories: [...allCategoryIds] }));

  const handleAddCategory = async (name, icon) => {
    try {
      const created = await api.post('/api/categories', { name, icon });
      setCustomCategories((prev) => [...prev, created]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveCategory = async (id) => {
    try {
      await api.del('/api/categories/' + id);
      setCustomCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-in expenses-page">
      <div className="expenses-section-head">
        <div className="section-title section-title--inline">
          Registro de Gastos <span>· Base de hábitos de gasto</span>
        </div>
        <div className="expenses-head-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setCatManagerOpen(true)}>Gestión Categorías</button>
          <button type="button" className="btn" onClick={openAdd}>Agregar gasto</button>
        </div>
      </div>

      <ExpenseSummaryCards summary={summary} />

      <div className="card expense-filters-card">
        <div className="expense-filters-row">
          <div className="input-group expense-filter-field">
            <label htmlFor="expense-filter-month">Mes</label>
            <select id="expense-filter-month" className="input-select" value={filters.monthKey}
              onChange={(e) => setFilters((p) => ({ ...p, monthKey: e.target.value, dateFrom: '', dateTo: '' }))}>
              {monthOptions.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
          </div>
          <div className="input-group expense-filter-field">
            <label htmlFor="expense-filter-date-from">Desde</label>
            <input id="expense-filter-date-from" type="date" className="input-select" value={filters.dateFrom}
              onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value, monthKey: '' }))} />
          </div>
          <div className="input-group expense-filter-field">
            <label htmlFor="expense-filter-date-to">Hasta</label>
            <input id="expense-filter-date-to" type="date" className="input-select" max={getTodayKey()} value={filters.dateTo}
              onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value, monthKey: '' }))} />
          </div>
          {filters.dateFrom && filters.dateTo && (
            <div className="expense-filter-date-clear">
              <button type="button" className="btn-ghost expense-cat-all"
                onClick={() => setFilters((p) => ({ ...p, dateFrom: '', dateTo: '', monthKey: getCurrentMonthKey() }))}>
                Quitar rango
              </button>
            </div>
          )}
          <div className="input-group expense-filter-field expense-filter-cats">
            <span className="modal-label-block">Categorías</span>
            <div className="expense-cat-chips">
              <button type="button" className="btn-ghost expense-cat-all" onClick={selectAllCategories}>Todas</button>
              {allCategoryIds.map((cat) => {
                const on = filters.categories.includes(cat);
                return (
                  <label key={cat} className={`expense-cat-chip${on ? ' on' : ''}`}>
                    <input type="checkbox" checked={on} onChange={() => toggleCategory(cat)} />
                    <span>{getCategoryIcon(cat)} {getCategoryLabel(cat)}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
        <div className="expense-recurring-tabs" role="group" aria-label="Tipo de gasto">
          {[['all', 'Todos'], ['recurring', 'Solo recurrentes'], ['unique', 'Solo únicos']].map(([k, label]) => (
            <button key={k} type="button"
              className={`expense-rec-tab${filters.recurringFilter === k ? ' active' : ''}`}
              onClick={() => setFilters((p) => ({ ...p, recurringFilter: k }))}>{label}</button>
          ))}
        </div>
      </div>

      <div className="expense-list">
        {expenses.length === 0 ? (
          <div className="expense-empty">
            <div className="expense-empty-icon" aria-hidden="true">{'\uD83E\uDDFE'}</div>
            <p className="expense-empty-text">No hay gastos registrados para este período</p>
            <button type="button" className="btn" onClick={openAdd}>Agregar primer gasto</button>
          </div>
        ) : expenses.map((e) => (
          <ExpenseCard key={e.id} expense={e} onEdit={() => openEdit(e)} onDelete={() => handleDelete(e)} />
        ))}
      </div>

      <ExpenseFormModal open={formOpen} mode={formMode} initial={editing} onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit} customCategories={customCategories} />
      <CategoryManager open={catManagerOpen} onClose={() => setCatManagerOpen(false)}
        customCategories={customCategories} addCustomCategory={handleAddCategory} removeCustomCategory={handleRemoveCategory} />
    </div>
  );
}
