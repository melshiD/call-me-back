/**
 * Raindrop Log Collector
 *
 * Fetches logs from Raindrop services via CLI (future: use API when available)
 */

import { LogEntry, LogLevel } from '../types';

export class RaindropLogCollector {
  /**
   * Fetch logs from Raindrop services
   *
   * Note: This is a placeholder. In Phase 1, we'll fetch logs externally
   * and inject them. In Phase 2, we'll use automated collection via Tasks.
   */
  async fetchLogs(lines: number = 100): Promise<LogEntry[]> {
    // For Phase 1, this will be populated from external CLI calls
    // The MCP service will receive pre-fetched logs as input
    console.log('RaindropLogCollector: Manual fetch required for Phase 1');
    return [];
  }

  /**
   * Parse Raindrop log output into structured LogEntry objects
   */
  parseLogs(rawLogs: string): LogEntry[] {
    const lines = rawLogs.split('\n').filter(line => line.trim().length > 0);
    const entries: LogEntry[] = [];

    for (const line of lines) {
      const entry = this.parseLine(line);
      if (entry) {
        entries.push(entry);
      }
    }

    return entries;
  }

  /**
   * Parse a single Raindrop log line
   *
   * Format examples from Raindrop:
   * [2025-11-18T17:05:12.123Z] [api-gateway] INFO: Request received
   * 2025-11-18 17:05:12 [auth-manager] ERROR: Invalid token
   */
  private parseLine(line: string): LogEntry | null {
    try {
      let timestamp = new Date();
      let service = 'raindrop';
      let message = line;
      let level: LogLevel = 'info';
      let callId: string | undefined;

      // Extract timestamp
      // NOTE: Fixed TypeScript optional chaining issues (done previously, redoing after regeneration)
      const isoMatch = line.match(/\[?(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)\]?/);
      if (isoMatch && isoMatch[1]) {
        timestamp = new Date(isoMatch[1]);
        message = line.substring(line.indexOf(isoMatch[0]) + isoMatch[0].length).trim();
      }

      // Extract service name
      const serviceMatch = message.match(/\[([\w-]+)\]/);
      if (serviceMatch && serviceMatch[1]) {
        service = serviceMatch[1];
        message = message.substring(message.indexOf(serviceMatch[0]) + serviceMatch[0].length).trim();
      }

      // Extract log level
      const levelMatch = message.match(/^(INFO|WARN|ERROR|DEBUG):\s*/i);
      if (levelMatch && levelMatch[0] && levelMatch[1]) {
        level = levelMatch[1].toLowerCase() as LogLevel;
        message = message.substring(levelMatch[0].length);
      } else if (message.match(/\berror\b/i)) {
        level = 'error';
      } else if (message.match(/\bwarn(ing)?\b/i)) {
        level = 'warn';
      }

      // Extract call_id if present
      const callIdMatch = message.match(/call[_\s]?id[:\s]+([A-Z0-9]+)/i);
      if (callIdMatch) {
        callId = callIdMatch[1];
      } else {
        // Try Twilio SID format
        const sidMatch = message.match(/\b(CA[a-f0-9]{32})\b/);
        if (sidMatch) {
          callId = sidMatch[1];
        }
      }

      return {
        timestamp,
        service,
        level,
        message,
        callId,
        raw: line
      };
    } catch (error) {
      console.error('Error parsing Raindrop log line:', error);
      return null;
    }
  }
}
