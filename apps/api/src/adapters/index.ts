import { ContentGenerator } from './ai-generator.interface.js';
import { MockAiGenerator } from './mock-ai-generator.js';
import { ThreadsPublisher } from './threads-publisher.interface.js';
import { MockThreadsPublisher } from './mock-threads-publisher.js';
import { MetaThreadsPublisher } from './meta-threads-publisher.js';

export function getAiGenerator(): ContentGenerator {
  // En modo mock o por defecto
  return new MockAiGenerator();
}

export function getThreadsPublisher(): ThreadsPublisher {
  const provider = process.env.THREADS_PROVIDER || 'mock';
  const userId = process.env.THREADS_USER_ID;
  const accessToken = process.env.THREADS_ACCESS_TOKEN;

  if (provider === 'meta' && userId && accessToken) {
    return new MetaThreadsPublisher({ userId, accessToken });
  }

  return new MockThreadsPublisher();
}
