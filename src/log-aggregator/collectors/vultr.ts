/**
 * Vultr Log Collector
 *
 * Fetches logs from Vultr services (voice-pipeline, db-proxy) via db-proxy endpoint
 */

import { LogEntry, LogLevel, VultrLogFetchRequest, VultrLogFetchResponse } from '../types';

export class VultrLogCollector {
  private dbProxyUrl: string;
  private apiKey: string;

  constructor(dbProxyUrl: string, apiKey: string) {
    this.dbProxyUrl = dbProxyUrl;
    this.apiKey = apiKey;
  }

  /**
   * Fetch logs from voice-pipeline service
   */
  async fetchVoicePipelineLogs(lines: number = 100): Promise<LogEntry[]> {
    return this.fetchLogs('voice-pipeline', lines);
  }

  /**
   * Fetch logs from db-proxy service
   */
  async fetchDbProxyLogs(lines: number = 100): Promise<LogEntry[]> {
    return this.fetchLogs('db-proxy', lines);
  }

  /**
   * Generic log fetcher via db-proxy
   */
  private async fetchLogs(service: 'voice-pipeline' | 'db-proxy', lines: number): Promise<LogEntry[]> {
    try {
      const response = await fetch(`${this.dbProxyUrl}/logs/fetch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service,
          lines
        } as VultrLogFetchRequest)
      });

      if (!response.ok) {
        console.error(`Failed to fetch ${service} logs:`, response.status, response.statusText);
        return [];
      }

      // NOTE: Fixed type assertion (done previously, redoing after regeneration)
      const data = await response.json();
      if (data && typeof data === 'object' && 'logs' in data) {
        return this.parseVultrLogs((data as VultrLogFetchResponse).logs, service);
      }
      return [];
    } catch (error) {
      console.error(`Error fetching ${service} logs:`, error);
      return [];
    }
  }

  /**
   * Parse PM2 log output into structured LogEntry objects
   */
  private parseVultrLogs(rawLogs: string, service: string): LogEntry[] {
    const lines = rawLogs.split('\n').filter(line => line.trim().length > 0);
    const entries: LogEntry[] = [];

    for (const line of lines) {
      const entry = this.parseLine(line, service);
      if (entry) {
        entries.push(entry);
      }
    }

    return entries;
  }

  /**
   * Parse a single log line
   *
   * PM2 format examples:
   * 2025-11-18 17:05:12: [voice-pipeline] Error: quota_exceeded
   * [2025-11-18T17:05:12.123Z] INFO: Connection established
   */
  private parseLine(line: string, service: string): LogEntry | null {
    try {
      // Extract timestamp (multiple formats)
      let timestamp = new Date();
      let message = line;
      let level: LogLevel = 'info';
      let callId: string | undefined;

      // Try ISO format: [2025-11-18T17:05:12.123Z]
      // NOTE: Fixed TypeScript optional chaining issues (done previously, redoing after regeneration)
      const isoMatch = line.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)\]/);
      if (isoMatch && isoMatch[1]) {
        timestamp = new Date(isoMatch[1]);
        message = line.substring(isoMatch[0].length).trim();
      } else {
        // Try simple format: 2025-11-18 17:05:12
        const simpleMatch = line.match(/^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
        if (simpleMatch && simpleMatch[1]) {
          timestamp = new Date(simpleMatch[1]);
          message = line.substring(simpleMatch[0].length).replace(/^:\s*/, '').trim();
        }
      }

      // Extract log level
      if (message.match(/\berror\b/i)) {
        level = 'error';
      } else if (message.match(/\bwarn(ing)?\b/i)) {
        level = 'warn';
      } else if (message.match(/\bdebug\b/i)) {
        level = 'debug';
      }

      // Extract call_id if present
      const callIdMatch = message.match(/call[_\s]?id[:\s]+([A-Z0-9]+)/i);
      if (callIdMatch) {
        callId = callIdMatch[1];
      } else {
        // Also try Twilio SID format
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
      console.error('Error parsing log line:', error);
      return null;
    }
  }
}
