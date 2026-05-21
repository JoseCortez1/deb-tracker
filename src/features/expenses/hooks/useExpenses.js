import { useCallback, useEffect, useMemo, useState } from 'react';
import { load, save } from '../../../utils/storage.js';
import { BUILT_IN_CATEGORIES } from '../types/expense.types.js';
import {
  computeExpensesSummary,
  getCurrentMonthKey,
  isDateInMonth,
  isDateInRange,
  loadCustomCategories,
  saveCustomCategories,
  sortExpensesByDateDesc,
} from '../utils/expense.utils.js';

function storageKey(userId) { return `debttracker_expenses_${userId}`; }

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `exp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const defaultFilters = () => ({
  monthKey: getCurrentMonthKey(),
  categories: [...BUILT_IN_CATEGORIES],
  recurringFilter: 'all',
  dateFrom: '',
  dateTo: '',
});

export function useExpenses(userId) {
  const key = storageKey(userId);
  const [allExpenses, setAllExpenses] = useState(() => load(key, []));
  const [filters, setFilters] = useState(defaultFilters);
  const [customCategories, setCustomCategoriesState] = useState(() => loadCustomCategories());

  useEffect(() => { setAllExpenses(load(key, [])); }, [key]);
  useEffect(() => { save(key, allExpenses); }, [key, allExpenses]);

  const setCustomCategories = useCallback((cats) => {
    setCustomCategoriesState(cats);
    saveCustomCategories(cats);
  }, []);

  const addCustomCategory = useCallback((name, icon = '📌', color = '#6b7280') => {
    setCustomCategoriesState((prev) => {
      const cat = { id: `custom-${Date.now()}`, name: name.trim(), icon, color, createdAt: Date.now() };
      const next = [...prev, cat];
      saveCustomCategories(next);
      return next;
    });
  }, []);

  const removeCustomCategory = useCallback((id) => {
    setCustomCategoriesState((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveCustomCategories(next);
      return next;
    });
  }, []);

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

  const addExpense = useCallback((data) => {
    const now = new Date().toISOString();
    setAllExpenses((prev) => [...prev, {
      id: newId(), userId,
      amount: Number(data.amount),
      category: data.category,
      description: typeof data.description === 'string' ? data.description : '',
      date: data.date,
      isRecurring: Boolean(data.isRecurring),
      createdAt: now,
    }]);
  }, [userId]);

  const updateExpense = useCallback((id, data) => {
    setAllExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...data, id: e.id, userId: e.userId } : e)));
  }, []);

  const deleteExpense = useCallback((id) => {
    setAllExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return {
    expenses, allExpenses, filters, setFilters,
    addExpense, updateExpense, deleteExpense,
    summary, customCategories, setCustomCategories, addCustomCategory, removeCustomCategory,
  };
}
