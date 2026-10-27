import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { redisConnection, PUBLISHING_QUEUE_NAME } from '../infrastructure/queue.js';
import { publishingService } from '../modules/publishing/publishing.service.js';
import { logger } from '../infrastructure/logger.js';

interface PublishingJobData {
  postId: string;
  idempotencyKey?: string;
}

export const publishingWorker = new Worker<PublishingJobData>(
  PUBLISHING_QUEUE_NAME,
  async (job: Job<PublishingJobData>) => {
    logger.info(`[Worker Publishing] Procesando publicación de post ${job.data.postId} (Job ${job.id})`);
    const publishedPost = await publishingService.publishPost(job.data.postId, job.data.idempotencyKey);
    return publishedPost;
  },
  {
    connection: redisConnection,
    concurrency: 1, // Secuencial para respetar rate limits de la API externa
  }
);

publishingWorker.on('completed', (job) => {
  logger.info(`[Worker Publishing] Publicación completada con éxito: ${job.id}`);
});

publishingWorker.on('failed', (job, err) => {
  logger.error(`[Worker Publishing] Publicación fallida: ${job?.id}. Error: ${err.message}`);
});

logger.info(`[Worker Publishing] Worker de publicación iniciado y escuchando cola ${PUBLISHING_QUEUE_NAME}`);
