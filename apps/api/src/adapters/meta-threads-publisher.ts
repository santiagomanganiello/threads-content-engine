import { ThreadsPublisher } from './threads-publisher.interface.js';
import { logger } from '../infrastructure/logger.js';

export interface MetaThreadsConfig {
  userId: string;
  accessToken: string;
}

export class MetaThreadsPublisher implements ThreadsPublisher {
  private userId: string;
  private accessToken: string;
  private baseUrl = 'https://graph.threads.net/v1.0';

  constructor(config: MetaThreadsConfig) {
    this.userId = config.userId;
    this.accessToken = config.accessToken;
  }

  async createMediaContainer(text: string, idempotencyKey: string): Promise<{ containerId: string }> {
    logger.info(`[MetaThreads] Creando contenedor de texto en Threads API`, { idempotencyKey });

    const url = `${this.baseUrl}/${this.userId}/threads`;
    const params = new URLSearchParams({
      media_type: 'TEXT',
      text,
      access_token: this.accessToken,
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = (await response.json()) as { id?: string; error?: { message: string; code: number } };

    if (!response.ok || !data.id) {
      const errMessage = data.error?.message || `HTTP ${response.status}: Error al crear contenedor`;
      logger.error(`[MetaThreads] Error al crear contenedor`, { error: data.error });
      throw new Error(errMessage);
    }

    return { containerId: data.id };
  }

  async publishMediaContainer(containerId: string): Promise<{ externalPostId: string }> {
    logger.info(`[MetaThreads] Publicando contenedor en Threads API`, { containerId });

    const url = `${this.baseUrl}/${this.userId}/threads_publish`;
    const params = new URLSearchParams({
      creation_id: containerId,
      access_token: this.accessToken,
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = (await response.json()) as { id?: string; error?: { message: string; code: number } };

    if (!response.ok || !data.id) {
      const errMessage = data.error?.message || `HTTP ${response.status}: Error al publicar contenedor`;
      logger.error(`[MetaThreads] Error al publicar contenedor`, { error: data.error });
      throw new Error(errMessage);
    }

    return { externalPostId: data.id };
  }

  async checkPublishStatus(containerId: string): Promise<{ status: string; externalPostId?: string }> {
    const url = `${this.baseUrl}/${containerId}?fields=status,error_message&access_token=${this.accessToken}`;
    const response = await fetch(url);
    const data = (await response.json()) as { status?: string; id?: string };
    return {
      status: data.status || 'UNKNOWN',
      externalPostId: data.id,
    };
  }
}
