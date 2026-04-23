import { ALL_EXPENSE_CATEGORIES, ExpenseCategory } from '../types/expense.types.js';

/** @type {Record<import('../types/expense.types.js').ExpenseCategory, string>} */
export const CATEGORY_LABELS = {
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

/** @type {Record<import('../types/expense.types.js').ExpenseCategory, string>} */
export const CATEGORY_ICONS = {
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

/**
 * YYYY-MM del mes actual (calendario local).
 */
export function getCurrentMonthKey() {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Meses desde (actual - 11) hasta actual, cada uno `{ value: 'YYYY-MM', label }`.
 */
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

/**
 * @param {string} monthKey — YYYY-MM
 */
export function isDateInMonth(isoDate, monthKey) {
  return typeof isoDate === 'string' && isoDate.startsWith(monthKey);
}

/**
 * Resumen del mes calendario actual (no el mes del filtro de lista).
 * @param {import('../types/expense.types.js').Expense[]} expenses — todos del usuario
 */
export function computeCurrentMonthSummary(expenses) {
  const monthKey = getCurrentMonthKey();
  const inMonth = expenses.filter((e) => isDateInMonth(e.date, monthKey));
  const totalMonth = inMonth.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const recurringTotal = inMonth
    .filter((e) => e.isRecurring)
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  /** @type {Map<string, number>} */
  const byCat = new Map();
  for (const e of inMonth) {
    const a = Number(e.amount) || 0;
    byCat.set(e.category, (byCat.get(e.category) || 0) + a);
  }
  let topKey = null;
  let topSum = 0;
  for (const cat of ALL_EXPENSE_CATEGORIES) {
    const v = byCat.get(cat) || 0;
    if (v > topSum) {
      topSum = v;
      topKey = cat;
    }
  }

  return {
    totalMonth,
    recurringTotal,
    topCategory: topKey && topSum > 0 ? { key: topKey, label: CATEGORY_LABELS[topKey] } : null,
  };
}

/**
 * @param {import('../types/expense.types.js').Expense[]} list
 */
export function sortExpensesByDateDesc(list) {
  return [...list].sort((a, b) => {
    const da = a.date.localeCompare(b.date);
    if (da !== 0) return -da;
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });
}
