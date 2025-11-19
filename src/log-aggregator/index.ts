/**
 * Log Aggregator MCP Service
 *
 * Provides MCP tools for searching and retrieving logs across all Call Me Back services
 */

import { Env } from './raindrop.gen';
import { z } from 'zod';
import { VultrLogCollector } from './collectors/vultr';
import { RaindropLogCollector } from './collectors/raindrop';
import {
  LogEntry,
  SearchLogsParams,
  LogSearchResult,
  GetCallLogsParams,
  CallLogsResult,
  TailLogsParams,
  TailLogsResult,
  TimelineEntry
} from './types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Get MCP server instance
    const mcpServer = env.LOG_AGGREGATOR;

    // Register simple ping tool
    mcpServer.registerTool('ping', {
      description: 'Test tool that returns pong'
    }, async () => {
      return { message: 'pong' };
    });

    // Register simple echo tool
    mcpServer.registerTool('echo', {
      description: 'Echo back the input message',
      inputSchema: {
        message: z.string()
      }
    }, async (args: any) => {
      return { echo: args.message };
    });

    // Framework handles MCP protocol routing - return minimal response
    return new Response();
  }
};

/**
 * Search logs using simple text search
 */
async function searchLogs(
  params: SearchLogsParams,
  vultrCollector: VultrLogCollector,
  raindropCollector: RaindropLogCollector
): Promise<LogSearchResult> {
  try {
    // Fetch fresh logs from all sources
    const [voiceLogs, dbLogs] = await Promise.all([
      vultrCollector.fetchVoicePipelineLogs(100),
      vultrCollector.fetchDbProxyLogs(100)
    ]);

    const allLogs = [...voiceLogs, ...dbLogs];

    // Filter by service if specified
    let filtered = allLogs;
    if (params.service && params.service !== 'all') {
      filtered = allLogs.filter(log => log.service === params.service);
    }

    // Simple text search (case-insensitive)
    const query = params.query.toLowerCase();
    const matched = filtered.filter(log =>
      log.message.toLowerCase().includes(query) ||
      log.raw.toLowerCase().includes(query) ||
      (log.callId && log.callId.toLowerCase().includes(query))
    );

    // Limit results
    const limit = params.limit || 20;
    const results = matched.slice(0, limit);

    return {
      total: results.length,
      query: params.query,
      logs: results
    };
  } catch (error) {
    console.error('Error in searchLogs:', error);
    return {
      total: 0,
      query: params.query,
      logs: [],
    };
  }
}

/**
 * Get all logs for a specific call ID
 */
async function getCallLogs(
  params: GetCallLogsParams,
  vultrCollector: VultrLogCollector,
  raindropCollector: RaindropLogCollector
): Promise<CallLogsResult> {
  try {
    // Fetch fresh logs
    const [voiceLogs, dbLogs] = await Promise.all([
      vultrCollector.fetchVoicePipelineLogs(200),
      vultrCollector.fetchDbProxyLogs(200)
    ]);

    // Filter by call ID
    const allLogs = [...voiceLogs, ...dbLogs].filter(log =>
      log.callId === params.call_id ||
      log.message.includes(params.call_id) ||
      log.raw.includes(params.call_id)
    );

    // Sort chronologically
    const sortedLogs = allLogs.sort((a, b) =>
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Build timeline
    const timeline = buildTimeline(sortedLogs);

    return {
      call_id: params.call_id,
      total_logs: sortedLogs.length,
      logs: sortedLogs,
      timeline
    };
  } catch (error) {
    console.error('Error in getCallLogs:', error);
    return {
      call_id: params.call_id,
      total_logs: 0,
      logs: [],
      timeline: []
    };
  }
}

/**
 * Tail logs from specified services
 */
async function tailLogs(
  params: TailLogsParams,
  vultrCollector: VultrLogCollector,
  raindropCollector: RaindropLogCollector
): Promise<TailLogsResult> {
  try {
    const results: Record<string, LogEntry[]> = {};
    const services = params.services.includes('all')
      ? ['voice-pipeline', 'db-proxy'] as const
      : params.services;

    for (const service of services) {
      switch (service) {
        case 'voice-pipeline':
          results[service] = await vultrCollector.fetchVoicePipelineLogs(params.lines);
          break;
        case 'db-proxy':
          results[service] = await vultrCollector.fetchDbProxyLogs(params.lines);
          break;
        case 'raindrop':
          results[service] = await raindropCollector.fetchLogs(params.lines);
          break;
      }
    }

    return {
      services: params.services,
      logs_by_service: results
    };
  } catch (error) {
    console.error('Error in tailLogs:', error);
    return {
      services: params.services,
      logs_by_service: {}
    };
  }
}

/**
 * Build a timeline from log entries
 */
function buildTimeline(logs: LogEntry[]): TimelineEntry[] {
  return logs.map(log => ({
    timestamp: log.timestamp,
    service: log.service,
    event: `${log.level.toUpperCase()}: ${log.message.substring(0, 100)}${log.message.length > 100 ? '...' : ''}`
  }));
}
