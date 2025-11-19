/**
 * Log Storage using SmartBucket
 *
 * Handles storing and searching logs using Raindrop SmartBucket
 */

import { LogEntry, LogFilters } from './types';

export class LogStorage {
  private bucket: any; // SmartBucket type from Raindrop

  constructor(bucket: any) {
    this.bucket = bucket;
  }

  /**
   * Store logs in SmartBucket
   * SmartBucket automatically indexes for semantic search
   */
  async storeLogs(logs: LogEntry[], batchId: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const key = `logs/${batchId}/${timestamp}.json`;

      // Convert logs to searchable format
      const searchableContent = logs.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString(),
        searchText: `${log.service} ${log.level} ${log.message} ${log.callId || ''}`
      }));

      // Store in SmartBucket (automatic semantic indexing)
      await this.bucket.put(key, JSON.stringify(searchableContent, null, 2));

      console.log(`Stored ${logs.length} logs in SmartBucket: ${key}`);
    } catch (error) {
      console.error('Error storing logs in SmartBucket:', error);
      throw error;
    }
  }

  /**
   * Search logs using SmartBucket semantic search
   */
  async searchLogs(query: string, filters: LogFilters = {}): Promise<LogEntry[]> {
    try {
      // Use SmartBucket's semantic search
      const results = await this.bucket.search({
        input: query,
        requestId: `search-${Date.now()}`
      });

      console.log(`SmartBucket search for "${query}" returned ${results.results.length} results`);

      // Parse and filter results
      const logs: LogEntry[] = [];
      for (const result of results.results) {
        if (result.text) {
          try {
            const parsed = JSON.parse(result.text);
            // Handle both single log and array of logs
            const logArray = Array.isArray(parsed) ? parsed : [parsed];

            for (const logData of logArray) {
              // Apply filters
              if (filters.service && logData.service !== filters.service) {
                continue;
              }

              logs.push({
                timestamp: new Date(logData.timestamp),
                service: logData.service,
                level: logData.level,
                message: logData.message,
                callId: logData.callId,
                raw: logData.raw
              });
            }
          } catch (parseError) {
            console.error('Error parsing log result:', parseError);
          }
        }
      }

      // Sort by timestamp descending (most recent first)
      logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply limit
      const limit = filters.limit || 20;
      return logs.slice(0, limit);
    } catch (error) {
      console.error('Error searching logs:', error);
      return [];
    }
  }

  /**
   * Get logs for a specific call ID
   */
  async getCallLogs(callId: string): Promise<LogEntry[]> {
    // Search for the call ID across all logs
    return this.searchLogs(`call_id:${callId} OR ${callId}`, { limit: 1000 });
  }

  /**
   * Store raw logs (for manual injection in Phase 1)
   */
  async storeRawLogs(rawLogs: string, source: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const key = `raw-logs/${source}/${timestamp}.txt`;

    await this.bucket.put(key, rawLogs);
    console.log(`Stored raw logs from ${source}: ${key}`);
  }
}
