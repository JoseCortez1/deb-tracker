/** @typedef {"food"|"transport"|"housing"|"health"|"entertainment"|"shopping"|"education"|"savings"|"other"|string} ExpenseCategory */

/**
 * @typedef {Object} Expense
 * @property {string} id
 * @property {string} userId
 * @property {number} amount
 * @property {ExpenseCategory} category
 * @property {string} description
 * @property {string} date -- YYYY-MM-DD
 * @property {boolean} isRecurring
 * @property {string} createdAt -- ISO 8601
 */

/**
 * @typedef {Object} CustomCategory
 * @property {string} id
 * @property {string} name
 * @property {string} icon
 * @property {string} color
 * @property {number} createdAt
 */

export const ExpenseCategory = {
  FOOD: "food",
  TRANSPORT: "transport",
  HOUSING: "housing",
  HEALTH: "health",
  ENTERTAINMENT: "entertainment",
  SHOPPING: "shopping",
  EDUCATION: "education",
  SAVINGS: "savings",
  OTHER: "other",
};

export const BUILT_IN_CATEGORIES = Object.values(ExpenseCategory);
export const ALL_EXPENSE_CATEGORIES = BUILT_IN_CATEGORIES;
export const CUSTOM_CATEGORIES_STORAGE_KEY = "debttracker_custom_categories";
