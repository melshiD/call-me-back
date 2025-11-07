// Database helper functions for SmartSQL

import type { SmartSql } from '@liquidmetal-ai/raindrop-framework';

/**
 * Execute a SQL query using SmartSQL
 */
export async function executeSQL(db: SmartSql, sql: string, args?: any[]): Promise<{ rows: any[] }> {
  // For now, format SQL with args inline since SmartSQL uses sqlQuery
  let formattedSql = sql;
  if (args && args.length > 0) {
    args.forEach((arg, index) => {
      const value = typeof arg === 'string' ? `'${arg.replace(/'/g, "''")}'` : arg;
      formattedSql = formattedSql.replace('?', String(value));
    });
  }

  const result = await db.executeQuery({ sqlQuery: formattedSql });
  
  // Parse the results
  if (result.results) {
    try {
      const parsed = JSON.parse(result.results);
      return { rows: Array.isArray(parsed) ? parsed : [parsed] };
    } catch {
      return { rows: [] };
    }
  }
  
  return { rows: [] };
}
