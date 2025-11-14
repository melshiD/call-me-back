// Database helper functions for Vultr PostgreSQL via HTTP API

export interface VultrDbConfig {
  apiUrl: string;
  apiKey: string;
}

/**
 * Execute a SQL query via Vultr API proxy
 */
export async function executeSQL(
  config: VultrDbConfig,
  sql: string,
  params?: any[]
): Promise<{ rows: any[] }> {
  try {
    console.log('Executing SQL via Vultr API:', {
      apiUrl: config.apiUrl,
      sqlPreview: sql.substring(0, 100),
      hasApiKey: !!config.apiKey,
      apiKeyPreview: config.apiKey ? config.apiKey.substring(0, 10) + '...' : 'MISSING'
    });

    const response = await fetch(`${config.apiUrl}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql,
        params: params || []
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', JSON.stringify(Object.fromEntries(response.headers)));

    if (!response.ok) {
      const responseText = await response.text();
      console.error('Query failed:', { 
        status: response.status, 
        statusText: response.statusText,
        responseText: responseText 
      });
      
      let errorData: any;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { error: responseText || 'Unknown error' };
      }
      
      throw new Error(`Database query failed: ${errorData.error || response.statusText}`);
    }

    const result: any = await response.json();
    console.log('Query succeeded, rows:', result.rows?.length || 0);
    return { rows: result.rows || [] };
  } catch (error) {
    console.error('Vultr DB query error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'N/A'
    });
    throw error;
  }
}
