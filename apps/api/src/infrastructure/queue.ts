import { Queue, ConnectionOptions } from 'bullmq';
import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const GENERATION_QUEUE_NAME = 'threads-generation-queue';
export const PUBLISHING_QUEUE_NAME = 'threads-publishing-queue';

export const generationQueue = new Queue(GENERATION_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export const publishingQueue = new Queue(PUBLISHING_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
    removeOnComplete: 200,
    removeOnFail: 1000,
  },
});
