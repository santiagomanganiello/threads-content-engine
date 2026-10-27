import { ThreadsPublisher } from './threads-publisher.interface.js';
import { logger } from '../infrastructure/logger.js';

export class MockThreadsPublisher implements ThreadsPublisher {
  private containers = new Map<string, { text: string; idempotencyKey: string; createdAt: Date }>();

  async createMediaContainer(text: string, idempotencyKey: string): Promise<{ containerId: string }> {
    logger.info(`[MockThreads] Creando contenedor de Threads para idempotencyKey=${idempotencyKey}`);
    const containerId = `mock_cnt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.containers.set(containerId, { text, idempotencyKey, createdAt: new Date() });
    return { containerId };
  }

  async publishMediaContainer(containerId: string): Promise<{ externalPostId: string }> {
    logger.info(`[MockThreads] Publicando contenedor=${containerId}`);
    const container = this.containers.get(containerId);
    if (!container) {
      throw new Error(`Contenedor ${containerId} no encontrado en MockThreadsPublisher`);
    }

    const externalPostId = `th_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    logger.info(`[MockThreads] Publicado con éxito en Threads! externalPostId=${externalPostId}`);
    return { externalPostId };
  }

  async checkPublishStatus(containerId: string): Promise<{ status: string; externalPostId?: string }> {
    const container = this.containers.get(containerId);
    if (container) {
      return { status: 'EXPIRED' };
    }
    return { status: 'NOT_FOUND' };
  }
}
