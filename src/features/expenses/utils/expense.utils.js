import { ALL_EXPENSE_CATEGORIES, BUILT_IN_CATEGORIES, CUSTOM_CATEGORIES_STORAGE_KEY, ExpenseCategory } from '../types/expense.types.js';
import { load, save } from '../../../utils/storage.js';

/** @type {Record<string, string>} */
const BUILT_IN_LABELS = {
  [ExpenseCategory.FOOD]: 'Comida y restaurantes',
  [ExpenseCategory.TRANSPORT]: 'Transporte',
  [ExpenseCategory.HOUSING]: 'Hogar y renta',
  [ExpenseCategory.HEALTH]: 'Salud',
  [ExpenseCategory.ENTERTAINMENT]: 'Entretenimiento',
  [ExpenseCategory.SHOPPING]: 'Compras',
  [ExpenseCategory.EDUCATION]: 'Educación',
  [ExpenseCategory.SAVINGS]: 'Ahorro',
  [ExpenseCategory.OTHER]: 'Otros',
};

/** @type {Record<string, string>} */
const BUILT_IN_ICONS = {
  [ExpenseCategory.FOOD]: '🍽️',
  [ExpenseCategory.TRANSPORT]: '🚗',
  [ExpenseCategory.HOUSING]: '🏠',
  [ExpenseCategory.HEALTH]: '🏥',
  [ExpenseCategory.ENTERTAINMENT]: '🎬',
  [ExpenseCategory.SHOPPING]: '🛍️',
  [ExpenseCategory.EDUCATION]: '📚',
  [ExpenseCategory.SAVINGS]: '💰',
  [ExpenseCategory.OTHER]: '📌',
};

const moneyFmt = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * @param {number} amount
 */
export function formatExpenseMoney(amount) {
  return moneyFmt.format(Number(amount) || 0);
}

/**
 * @param {string} isoDate — YYYY-MM-DD
 * @param {string} [locale]
 */
export function formatExpenseDateShort(isoDate, locale = 'es-MX') {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return '—';
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getCurrentMonthKey() {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getTodayKey() {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, '0');
  const d = String(n.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getMonthOptionsForFilter() {
  const now = new Date();
  const out = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const value = `${y}-${m}`;
    const label = d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    out.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return out;
}

export function isDateInMonth(isoDate, monthKey) {
  return typeof isoDate === 'string' && isoDate.startsWith(monthKey);
}

export function isDateInRange(isoDate, dateFrom, dateTo) {
  return typeof isoDate === 'string' && isoDate >= dateFrom && isoDate <= dateTo;
}

// ─── CATEGORÍAS CUSTOM ───

export function loadCustomCategories() {
  return load(CUSTOM_CATEGORIES_STORAGE_KEY, []);
}

export function saveCustomCategories(cats) {
  save(CUSTOM_CATEGORIES_STORAGE_KEY, cats);
}

export function addCustomCategory(name, icon = '📌', color = '#6b7280') {
  const cats = loadCustomCategories();
  const cat = { id: `custom-${Date.now()}`, name: name.trim(), icon, color, createdAt: Date.now() };
  cats.push(cat);
  saveCustomCategories(cats);
  return cat;
}

export function removeCustomCategory(id) {
  const cats = loadCustomCategories().filter((c) => c.id !== id);
  saveCustomCategories(cats);
}

export function getAllCategories() {
  const customs = loadCustomCategories();
  return [...BUILT_IN_CATEGORIES, ...customs.map((c) => c.id)];
}

export function getCategoryLabel(catId) {
  if (BUILT_IN_LABELS[catId]) return BUILT_IN_LABELS[catId];
  const customs = loadCustomCategories();
  const found = customs.find((c) => c.id === catId);
  return found ? found.name : catId;
}

export function getCategoryIcon(catId) {
  if (BUILT_IN_ICONS[catId]) return BUILT_IN_ICONS[catId];
  const customs = loadCustomCategories();
  const found = customs.find((c) => c.id === catId);
  return found ? found.icon : '📌';
}

export function isBuiltInCategory(catId) {
  return BUILT_IN_CATEGORIES.includes(catId);
}

// ─── SUMMARY ───

export function computeExpensesSummary(expenses) {
  const total = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const recurringTotal = expenses.filter((e) => e.isRecurring).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const byCat = new Map();
  for (const e of expenses) {
    const a = Number(e.amount) || 0;
    byCat.set(e.category, (byCat.get(e.category) || 0) + a);
  }
  let topKey = null;
  let topSum = 0;
  for (const [cat, sum] of byCat) {
    if (sum > topSum) { topSum = sum; topKey = cat; }
  }
  return {
    total,
    recurringTotal,
    topCategory: topKey && topSum > 0 ? { key: topKey, label: getCategoryLabel(topKey) } : null,
    count: expenses.length,
  };
}

export function sortExpensesByDateDesc(list) {
  return [...list].sort((a, b) => {
    const da = a.date.localeCompare(b.date);
    if (da !== 0) return -da;
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });
}
