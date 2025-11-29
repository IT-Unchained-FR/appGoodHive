/**
 * Admin Panel Filter Utilities
 * Shared utilities for building filter queries across admin tables
 */

/**
 * Build a date range filter condition for SQL queries
 * @param dateRange - Date range string (1d, 3d, 7d, 14d, 30d, or custom "YYYY-MM-DD,YYYY-MM-DD")
 * @param columnName - Database column name to filter on (default: 'created_at')
 * @returns Object with SQL condition and parameter values
 */
export function buildDateFilter(
  dateRange: string | undefined | null,
  columnName: string = 'created_at'
): { condition: string; values: any[] } {
  if (!dateRange || dateRange === 'any') {
    return { condition: '', values: [] };
  }

  const now = new Date();

  // Quick date range options
  const ranges: Record<string, Date> = {
    '1d': new Date(now.getTime() - 24 * 60 * 60 * 1000),
    '3d': new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    '14d': new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
  };

  // Check if it's a quick range option
  if (dateRange in ranges) {
    return {
      condition: `${columnName} >= $`,
      values: [ranges[dateRange]],
    };
  }

  // Custom range format: "2024-01-01,2024-12-31"
  if (dateRange.includes(',')) {
    const [start, end] = dateRange.split(',');
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return { condition: '', values: [] };
      }

      // Set end date to end of day
      endDate.setHours(23, 59, 59, 999);

      return {
        condition: `${columnName} BETWEEN $ AND $`,
        values: [startDate, endDate],
      };
    } catch (error) {
      console.error('Invalid date range format:', dateRange);
      return { condition: '', values: [] };
    }
  }

  return { condition: '', values: [] };
}

/**
 * Build a sort clause for SQL queries
 * @param sort - Sort option string
 * @param defaultSort - Default sort clause if no sort provided
 * @returns SQL ORDER BY clause (without the ORDER BY keyword)
 */
export function buildSortClause(
  sort: string | undefined | null,
  defaultSort: string = 'created_at DESC'
): string {
  const sortMap: Record<string, string> = {
    latest: 'created_at DESC',
    oldest: 'created_at ASC',
    'name-asc': 'LOWER(first_name) ASC, LOWER(last_name) ASC',
    'name-desc': 'LOWER(first_name) DESC, LOWER(last_name) DESC',
    'email-asc': 'LOWER(email) ASC',
    'email-desc': 'LOWER(email) DESC',
    'title-asc': 'LOWER(title) ASC',
    'title-desc': 'LOWER(title) DESC',
    'company-asc': 'LOWER(company_name) ASC',
    'company-desc': 'LOWER(company_name) DESC',
    'budget-high': 'CAST(budget AS INTEGER) DESC',
    'budget-low': 'CAST(budget AS INTEGER) ASC',
  };

  return sortMap[sort || ''] || defaultSort;
}

/**
 * Build a complete WHERE clause from multiple filter conditions
 * @param filters - Array of filter objects with condition and values
 * @returns Object with complete WHERE clause and flattened parameter values
 */
export function buildWhereClause(
  filters: Array<{ condition: string; values: any[] }>
): { whereClause: string; values: any[] } {
  // Filter out empty conditions
  const validFilters = filters.filter((f) => f.condition && f.condition.trim());

  if (validFilters.length === 0) {
    return { whereClause: '', values: [] };
  }

  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  // Build conditions with numbered placeholders
  for (const filter of validFilters) {
    const placeholderCount = (filter.condition.match(/\$/g) || []).length;
    const numberedCondition = filter.condition.replace(/\$/g, () => `$${paramIndex++}`);
    conditions.push(numberedCondition);
    values.push(...filter.values);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  return { whereClause, values };
}

/**
 * Build a location filter condition (city or country)
 * @param location - Location search string
 * @param cityColumn - City column name (default: 'city')
 * @param countryColumn - Country column name (default: 'country')
 * @returns Filter object with condition and values
 */
export function buildLocationFilter(
  location: string | undefined | null,
  cityColumn: string = 'city',
  countryColumn: string = 'country'
): { condition: string; values: any[] } {
  if (!location || !location.trim()) {
    return { condition: '', values: [] };
  }

  const searchTerm = location.toLowerCase().trim();

  return {
    condition: `(LOWER(${cityColumn}) LIKE $ OR LOWER(${countryColumn}) LIKE $)`,
    values: [`%${searchTerm}%`, `%${searchTerm}%`],
  };
}

/**
 * Build a budget range filter condition
 * @param budgetRange - Budget range string (e.g., "0-1000", "5000-10000", "25000+")
 * @param budgetColumn - Budget column name (default: 'budget')
 * @returns Filter object with condition and values
 */
export function buildBudgetFilter(
  budgetRange: string | undefined | null,
  budgetColumn: string = 'budget'
): { condition: string; values: any[] } {
  if (!budgetRange) {
    return { condition: '', values: [] };
  }

  // Handle "25000+" format
  if (budgetRange.endsWith('+')) {
    const min = parseInt(budgetRange.replace('+', ''));
    if (isNaN(min)) return { condition: '', values: [] };

    return {
      condition: `CAST(${budgetColumn} AS INTEGER) >= $`,
      values: [min],
    };
  }

  // Handle "1000-5000" format
  if (budgetRange.includes('-')) {
    const [minStr, maxStr] = budgetRange.split('-');
    const min = parseInt(minStr);
    const max = parseInt(maxStr);

    if (isNaN(min) || isNaN(max)) return { condition: '', values: [] };

    return {
      condition: `CAST(${budgetColumn} AS INTEGER) BETWEEN $ AND $`,
      values: [min, max],
    };
  }

  return { condition: '', values: [] };
}

/**
 * Sanitize search input to prevent SQL injection
 * @param input - User input string
 * @returns Sanitized string safe for SQL LIKE queries
 */
export function sanitizeSearchInput(input: string | undefined | null): string {
  if (!input) return '';

  // Remove dangerous characters and limit length
  return input
    .replace(/[;'"\\]/g, '') // Remove SQL-dangerous characters
    .trim()
    .substring(0, 100); // Limit length
}

/**
 * Build a text search filter with multiple word AND logic
 * @param searchTerm - Search term from user
 * @param columns - Array of column names to search in
 * @returns Filter object with condition and values
 */
export function buildTextSearchFilter(
  searchTerm: string | undefined | null,
  columns: string[]
): { condition: string; values: any[] } {
  if (!searchTerm || !searchTerm.trim() || columns.length === 0) {
    return { condition: '', values: [] };
  }

  const sanitized = sanitizeSearchInput(searchTerm);
  if (!sanitized) return { condition: '', values: [] };

  // Split into words for AND logic
  const words = sanitized.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return { condition: '', values: [] };

  const conditions: string[] = [];
  const values: any[] = [];

  // Each word must match at least one column
  for (const word of words) {
    const columnConditions = columns.map(col => `LOWER(${col}) LIKE $`);
    conditions.push(`(${columnConditions.join(' OR ')})`);

    // Add the word pattern for each column
    for (let i = 0; i < columns.length; i++) {
      values.push(`%${word}%`);
    }
  }

  return {
    condition: conditions.join(' AND '),
    values,
  };
}
