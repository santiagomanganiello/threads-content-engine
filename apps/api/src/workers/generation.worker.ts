import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { redisConnection, GENERATION_QUEUE_NAME } from '../infrastructure/queue.js';
import { generationService } from '../modules/generation/generation.service.js';
import { logger } from '../infrastructure/logger.js';

interface GenerationJobData {
  type: 'DAILY_BATCH' | 'MANUAL';
  dateStr?: string;
  category?: any;
  customPrompt?: string;
}

export const generationWorker = new Worker<GenerationJobData>(
  GENERATION_QUEUE_NAME,
  async (job: Job<GenerationJobData>) => {
    logger.info(`[Worker Generation] Procesando trabajo ${job.id} (tipo: ${job.data.type})`);

    if (job.data.type === 'DAILY_BATCH') {
      const result = await generationService.generateDailyBatch(job.data.dateStr);
      logger.info(`[Worker Generation] Lote completado: ${result.batchId} (${result.posts.length} posts)`);
      return result;
    }

    if (job.data.type === 'MANUAL' && job.data.category) {
      const post = await generationService.generateManual({
        category: job.data.category,
        customPrompt: job.data.customPrompt,
      });
      logger.info(`[Worker Generation] Post manual generado: ${post.id}`);
      return post;
    }

    throw new Error(`Tipo de trabajo de generación desconocido: ${job.data.type}`);
  },
  {
    connection: redisConnection,
    concurrency: 2,
  }
);

generationWorker.on('completed', (job) => {
  logger.info(`[Worker Generation] Trabajo completado con éxito: ${job.id}`);
});

generationWorker.on('failed', (job, err) => {
  logger.error(`[Worker Generation] Trabajo fallido: ${job?.id}. Error: ${err.message}`);
});

logger.info(`[Worker Generation] Worker de generación iniciado y escuchando cola ${GENERATION_QUEUE_NAME}`);
