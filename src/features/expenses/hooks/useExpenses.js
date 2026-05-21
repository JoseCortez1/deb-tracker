import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../../api.js';
import { BUILT_IN_CATEGORIES } from '../types/expense.types.js';
import {
  computeExpensesSummary,
  getCurrentMonthKey,
  isDateInMonth,
  isDateInRange,
  sortExpensesByDateDesc,
} from '../utils/expense.utils.js';

const defaultFilters = () => ({
  monthKey: getCurrentMonthKey(),
  categories: [...BUILT_IN_CATEGORIES],
  recurringFilter: 'all',
  dateFrom: '',
  dateTo: '',
});

export function useExpenses() {
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(defaultFilters);

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/expenses');
      setAllExpenses(data);
    } catch (err) {
      console.error('Error loading expenses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const expenses = useMemo(() => {
    const { monthKey, categories, recurringFilter, dateFrom, dateTo } = filters;
    const catSet = new Set(categories);
    if (!catSet.size) return [];
    const hasDateRange = dateFrom && dateTo;
    return sortExpensesByDateDesc(
      allExpenses.filter((e) => {
        if (hasDateRange) { if (!isDateInRange(e.date, dateFrom, dateTo)) return false; }
        else { if (!isDateInMonth(e.date, monthKey)) return false; }
        if (!catSet.has(e.category)) return false;
        if (recurringFilter === 'recurring' && !e.isRecurring) return false;
        if (recurringFilter === 'unique' && e.isRecurring) return false;
        return true;
      })
    );
  }, [allExpenses, filters]);

  const summary = useMemo(() => computeExpensesSummary(expenses), [expenses]);

  const addExpense = useCallback(async (data) => {
    try {
      const created = await api.post('/api/expenses', {
        amount: Number(data.amount),
        category: data.category,
        description: data.description || '',
        date: data.date,
        isRecurring: Boolean(data.isRecurring),
      });
      setAllExpenses((prev) => [...prev, created]);
    } catch (err) {
      console.error('Error adding expense:', err);
    }
  }, []);

  const updateExpense = useCallback(async (id, data) => {
    try {
      const updated = await api.put('/api/expenses/' + id, data);
      setAllExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch (err) {
      console.error('Error updating expense:', err);
    }
  }, []);

  const deleteExpense = useCallback(async (id) => {
    try {
      await api.del('/api/expenses/' + id);
      setAllExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  }, []);

  return {
    expenses, allExpenses, loading,
    filters, setFilters,
    addExpense, updateExpense, deleteExpense,
    summary, refresh: loadExpenses,
  };
}
