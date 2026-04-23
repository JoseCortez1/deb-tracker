/** @typedef {'food'|'transport'|'housing'|'health'|'entertainment'|'shopping'|'education'|'savings'|'other'} ExpenseCategory */

/**
 * @typedef {Object} Expense
 * @property {string} id
 * @property {string} userId
 * @property {number} amount
 * @property {ExpenseCategory} category
 * @property {string} description
 * @property {string} date — YYYY-MM-DD
 * @property {boolean} isRecurring
 * @property {string} createdAt — ISO 8601
 */

export const ExpenseCategory = {
  FOOD: 'food',
  TRANSPORT: 'transport',
  HOUSING: 'housing',
  HEALTH: 'health',
  ENTERTAINMENT: 'entertainment',
  SHOPPING: 'shopping',
  EDUCATION: 'education',
  SAVINGS: 'savings',
  OTHER: 'other',
};

/** @type {ExpenseCategory[]} */
export const ALL_EXPENSE_CATEGORIES = Object.values(ExpenseCategory);
