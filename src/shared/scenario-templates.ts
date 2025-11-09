// Call Scenario Template Management
import type { SmartSql } from '@liquidmetal-ai/raindrop-framework';
import { executeSQL } from './db-helpers';

export interface ScenarioTemplate {
  id: string;
  user_id: string;
  name: string;
  scenario_text: string;
  icon: string;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export class ScenarioTemplateManager {
  private db: SmartSql;

  constructor(db: SmartSql) {
    this.db = db;
  }

  /**
   * Get all scenario templates for a user
   */
  async getTemplates(userId: string): Promise<ScenarioTemplate[]> {
    const result = await executeSQL(
      this.db,
      'SELECT * FROM call_scenario_templates WHERE user_id = ? ORDER BY use_count DESC, name ASC',
      [userId]
    );

    return result.rows as ScenarioTemplate[];
  }

  /**
   * Get a specific scenario template
   */
  async getTemplate(userId: string, templateId: string): Promise<ScenarioTemplate | null> {
    const result = await executeSQL(
      this.db,
      'SELECT * FROM call_scenario_templates WHERE id = ? AND user_id = ?',
      [templateId, userId]
    );

    return result.rows.length > 0 ? (result.rows[0] as ScenarioTemplate) : null;
  }

  /**
   * Create a new scenario template
   */
  async createTemplate(
    userId: string,
    name: string,
    scenarioText: string,
    icon: string = '🎭'
  ): Promise<ScenarioTemplate> {
    const id = this.generateId();

    await executeSQL(
      this.db,
      `INSERT INTO call_scenario_templates (
        id, user_id, name, scenario_text, icon
      ) VALUES (?, ?, ?, ?, ?)`,
      [id, userId, name, scenarioText, icon]
    );

    return {
      id,
      user_id: userId,
      name,
      scenario_text: scenarioText,
      icon,
      use_count: 0,
      last_used_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Update a scenario template
   */
  async updateTemplate(
    userId: string,
    templateId: string,
    updates: {
      name?: string;
      scenario_text?: string;
      icon?: string;
    }
  ): Promise<void> {
    const setClauses: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      setClauses.push('name = ?');
      values.push(updates.name);
    }

    if (updates.scenario_text !== undefined) {
      setClauses.push('scenario_text = ?');
      values.push(updates.scenario_text);
    }

    if (updates.icon !== undefined) {
      setClauses.push('icon = ?');
      values.push(updates.icon);
    }

    if (setClauses.length === 0) return;

    setClauses.push("updated_at = datetime('now')");
    values.push(templateId, userId);

    await executeSQL(
      this.db,
      `UPDATE call_scenario_templates
       SET ${setClauses.join(', ')}
       WHERE id = ? AND user_id = ?`,
      values
    );
  }

  /**
   * Delete a scenario template
   */
  async deleteTemplate(userId: string, templateId: string): Promise<void> {
    await executeSQL(
      this.db,
      'DELETE FROM call_scenario_templates WHERE id = ? AND user_id = ?',
      [templateId, userId]
    );
  }

  /**
   * Increment use count when template is used
   */
  async incrementUseCount(userId: string, templateId: string): Promise<void> {
    await executeSQL(
      this.db,
      `UPDATE call_scenario_templates
       SET use_count = use_count + 1,
           last_used_at = datetime('now'),
           updated_at = datetime('now')
       WHERE id = ? AND user_id = ?`,
      [templateId, userId]
    );
  }

  /**
   * Get popular templates (most used)
   */
  async getPopularTemplates(userId: string, limit: number = 5): Promise<ScenarioTemplate[]> {
    const result = await executeSQL(
      this.db,
      `SELECT * FROM call_scenario_templates
       WHERE user_id = ? AND use_count > 0
       ORDER BY use_count DESC
       LIMIT ?`,
      [userId, limit]
    );

    return result.rows as ScenarioTemplate[];
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Default scenario templates to seed for new users
 */
export const DEFAULT_SCENARIO_TEMPLATES = [
  {
    name: 'Save Me From Bad Date',
    scenario_text: 'You\'re calling to save me from a potentially lame date. Act like there\'s an emergency or important situation that requires my immediate attention. Be convincing but not too serious - maybe talk about movies and your mother to give me an excuse to leave gracefully.',
    icon: '🆘'
  },
  {
    name: 'Boss Emergency Call',
    scenario_text: 'You\'re my boss calling about an urgent work matter. There\'s a critical issue that needs my immediate attention. Be professional and direct, but understanding of the interruption.',
    icon: '💼'
  },
  {
    name: 'Party Planning Check-in',
    scenario_text: 'We\'re planning a surprise party together and you\'re calling to coordinate last-minute details. Be excited and conspiratorial, making sure to act natural if someone might be listening nearby.',
    icon: '🎉'
  },
  {
    name: 'Family Health Update',
    scenario_text: 'You\'re calling with an update about a family member\'s health situation. It\'s not critical but important enough to warrant a call. Be caring and supportive.',
    icon: '🏥'
  },
  {
    name: 'Travel Plans Discussion',
    scenario_text: 'We\'re planning a trip together and you\'re calling to discuss flight times, hotel options, and activities. Be enthusiastic and help me think through the details.',
    icon: '✈️'
  }
];
