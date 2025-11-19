/**
 * Log Aggregator Types
 *
 * Types for aggregating logs across Raindrop and Vultr services
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export type ServiceName = 'raindrop' | 'voice-pipeline' | 'db-proxy' | 'all';

export interface LogEntry {
  timestamp: Date;
  service: string;
  level: LogLevel;
  message: string;
  callId?: string;
  raw: string;
}

export interface SearchLogsParams {
  query: string;
  service?: ServiceName;
  limit?: number;
}

export interface LogSearchResult {
  total: number;
  query: string;
  logs: LogEntry[];
}

export interface GetCallLogsParams {
  call_id: string;
}

export interface CallLogsResult {
  call_id: string;
  total_logs: number;
  logs: LogEntry[];
  timeline: TimelineEntry[];
}

export interface TimelineEntry {
  timestamp: Date;
  service: string;
  event: string;
}

export interface TailLogsParams {
  services: ServiceName[];
  lines: number;
}

export interface TailLogsResult {
  services: ServiceName[];
  logs_by_service: Record<string, LogEntry[]>;
}

export interface LogFilters {
  service?: string;
  limit?: number;
  since?: string;
}

export interface VultrLogFetchRequest {
  service: 'voice-pipeline' | 'db-proxy';
  lines: number;
}

export interface VultrLogFetchResponse {
  logs: string;
}
