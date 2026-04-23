import { useCallback, useEffect, useMemo, useState } from 'react';
import { load, save } from '../../../utils/storage.js';
import { ALL_EXPENSE_CATEGORIES } from '../types/expense.types.js';
import {
  computeCurrentMonthSummary,
  getCurrentMonthKey,
  isDateInMonth,
  sortExpensesByDateDesc,
} from '../utils/expense.utils.js';

function storageKey(userId) {
  return `debttracker_expenses_${userId}`;
}

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `exp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const defaultFilters = () => ({
  monthKey: getCurrentMonthKey(),
  categories: [...ALL_EXPENSE_CATEGORIES],
  recurringFilter: 'all', // 'all' | 'recurring' | 'unique'
});

/**
 * @param {string} userId
 */
export function useExpenses(userId) {
  const key = storageKey(userId);

  const [allExpenses, setAllExpenses] = useState(() => load(key, []));
  const [filters, setFilters] = useState(defaultFilters);

  useEffect(() => {
    setAllExpenses(load(key, []));
  }, [key]);

  useEffect(() => {
    save(key, allExpenses);
  }, [key, allExpenses]);

  const expenses = useMemo(() => {
    const { monthKey, categories, recurringFilter } = filters;
    if (!categories.length) {
      return [];
    }
    const catSet = new Set(categories);
    return sortExpensesByDateDesc(
      allExpenses.filter((e) => {
        if (!isDateInMonth(e.date, monthKey)) return false;
        if (!catSet.has(e.category)) return false;
        if (recurringFilter === 'recurring' && !e.isRecurring) return false;
        if (recurringFilter === 'unique' && e.isRecurring) return false;
        return true;
      })
    );
  }, [allExpenses, filters]);

  const summary = useMemo(() => {
    const s = computeCurrentMonthSummary(allExpenses);
    return {
      totalMonth: s.totalMonth,
      recurringTotal: s.recurringTotal,
      topCategory: s.topCategory ? s.topCategory.label : null,
    };
  }, [allExpenses]);

  const addExpense = useCallback(
    (data) => {
      const now = new Date().toISOString();
      const row = {
        id: newId(),
        userId,
        amount: Number(data.amount),
        category: data.category,
        description: typeof data.description === 'string' ? data.description : '',
        date: data.date,
        isRecurring: Boolean(data.isRecurring),
        createdAt: now,
      };
      setAllExpenses((prev) => [...prev, row]);
    },
    [userId]
  );

  const updateExpense = useCallback((id, data) => {
    setAllExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...data, id: e.id, userId: e.userId } : e))
    );
  }, []);

  const deleteExpense = useCallback((id) => {
    setAllExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return {
    expenses,
    allExpenses,
    filters,
    setFilters,
    addExpense,
    updateExpense,
    deleteExpense,
    summary,
  };
}
