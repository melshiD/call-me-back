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

  // Log complete response structure for debugging
  console.log('SmartSQL Response:', {
    status: result.status,
    message: result.message,
    hasResults: !!result.results,
    resultsType: typeof result.results,
    resultsLength: result.results?.length,
    queryExecuted: result.queryExecuted,
    aiReasoning: result.aiReasoning,
    fullResult: JSON.stringify(result, null, 2)
  });

  // Check status code first
  if (result.status && result.status !== 200) {
    console.error('Query failed with status:', result.status, 'Message:', result.message);
    throw new Error(`Database query failed: ${result.message || 'Unknown error'}`);
  }

  // Check if results field exists and has content
  if (!result.results) {
    console.warn('Query succeeded but results field is undefined');
    // For INSERT/UPDATE/DELETE queries, this might be normal
    if (formattedSql.trim().toUpperCase().startsWith('SELECT')) {
      console.error('SELECT query returned no results field - this is unexpected');
    }
    return { rows: [] };
  }

  if (result.results.length === 0) {
    console.warn('Query succeeded but results field is empty string');
    return { rows: [] };
  }

  // Parse results
  try {
    const parsed = JSON.parse(result.results);
    console.log('Parsed results:', {
      isArray: Array.isArray(parsed),
      length: Array.isArray(parsed) ? parsed.length : 'N/A',
      sample: Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : parsed
    });
    return { rows: Array.isArray(parsed) ? parsed : [parsed] };
  } catch (e) {
    console.error('Failed to parse results:', e, 'Raw results:', result.results);
    throw new Error(`Failed to parse database results: ${e instanceof Error ? e.message : String(e)}`);
  }
}
