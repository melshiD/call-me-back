import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';

export default class extends Service<Env> {
  async fetch(request: Request): Promise<Response> {
    return new Response('Not implemented', { status: 501 });
  }

  async handleConnection(connection: any): Promise<{ status: string }> {
    try {
      this.env.logger.info('Handling WebSocket connection');

      return {
        status: 'connected',
      };
    } catch (error) {
      this.env.logger.error('Failed to handle connection', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async processAudio(audioData: Buffer): Promise<{ processed: boolean }> {
    try {
      this.env.logger.info('Processing audio');

      return {
        processed: true,
      };
    } catch (error) {
      this.env.logger.error('Failed to process audio', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}
