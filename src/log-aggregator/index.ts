/**
 * Log Aggregator MCP Service - DISABLED
 *
 * NOTE: MCP log aggregator not currently working (see PCR2.md - MCP Services blocked)
 * Using Vultr log-query-service instead (http://localhost:3001/api/admin/logs)
 */

import { Env } from './raindrop.gen';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return new Response(JSON.stringify({
      error: 'MCP log aggregator not available',
      message: 'Use log-query-service on Vultr instead',
      vultrEndpoint: 'http://localhost:3001/api/admin/logs'
    }), {
      status: 501,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
