const { Pool } = require('pg');

// Shared pool for all database access
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD
});

class Database {
  constructor() {
    this.pool = pool;
  }

  async writeCallCostEvents(callId, userId, costBreakdown) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Write to call_cost_events table (from PCR2.md schema)
      const events = [
        {
          service: 'twilio',
          operation: 'call_duration',
          usage_amount: costBreakdown.usage.twilio.duration_minutes,
          usage_unit: 'minute',
          unit_cost: costBreakdown.costs.twilio / (costBreakdown.usage.twilio.duration_minutes || 1),
          total_cost: costBreakdown.costs.twilio
        },
        {
          service: 'deepgram',
          operation: 'streaming_stt',
          usage_amount: costBreakdown.usage.deepgram.duration_minutes,
          usage_unit: 'minute',
          unit_cost: 0.0059,
          total_cost: costBreakdown.costs.deepgram
        },
        {
          service: 'cerebras',
          operation: 'inference',
          usage_amount: costBreakdown.usage.cerebras.total_tokens,
          usage_unit: 'token',
          unit_cost: 0.0000001,
          total_cost: costBreakdown.costs.cerebras
        },
        {
          service: 'elevenlabs',
          operation: 'tts_streaming',
          usage_amount: costBreakdown.usage.elevenlabs.total_characters,
          usage_unit: 'character',
          unit_cost: 0.00015,
          total_cost: costBreakdown.costs.elevenlabs
        }
      ];

      for (const event of events) {
        await client.query(`
          INSERT INTO call_cost_events
            (call_id, user_id, service, operation, usage_amount, usage_unit, unit_cost, total_cost, estimated)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          callId,
          userId,
          event.service,
          event.operation,
          event.usage_amount,
          event.usage_unit,
          event.unit_cost,
          event.total_cost,
          true // estimated = true (from logs)
        ]);
      }

      // Update calls table with total cost
      await client.query(`
        UPDATE calls
        SET cost_usd = $1, updated_at = NOW()
        WHERE id = $2
      `, [costBreakdown.totalCost, callId]);

      await client.query('COMMIT');

      return { success: true, eventsWritten: events.length };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getCallCostSummary(callId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT
          service,
          operation,
          SUM(usage_amount) as total_usage,
          usage_unit,
          SUM(total_cost) as total_cost
        FROM call_cost_events
        WHERE call_id = $1
        GROUP BY service, operation, usage_unit
        ORDER BY service
      `, [callId]);

      return result.rows;
    } finally {
      client.release();
    }
  }
}

module.exports = Database;
module.exports.pool = pool;
