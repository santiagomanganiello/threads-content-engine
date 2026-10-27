import { ContentGenerator } from './ai-generator.interface.js';
import { MockAiGenerator } from './mock-ai-generator.js';
import { GeminiAiGenerator } from './gemini-ai-generator.js';
import { ThreadsPublisher } from './threads-publisher.interface.js';
import { MockThreadsPublisher } from './mock-threads-publisher.js';
import { MetaThreadsPublisher } from './meta-threads-publisher.js';

export function getAiGenerator(): ContentGenerator {
  const provider = (process.env.AI_PROVIDER || 'mock').toLowerCase();

  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('[getAiGenerator] AI_PROVIDER=gemini pero GEMINI_API_KEY no está configurada en el .env');
    }
    return new GeminiAiGenerator(apiKey);
  }

  if (provider === 'mock') {
    return new MockAiGenerator();
  }

  throw new Error(`[getAiGenerator] Proveedor de IA no soportado: ${provider}`);
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
