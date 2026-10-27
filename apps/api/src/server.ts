import 'dotenv/config';
import { buildApp } from './app.js';
import { logger } from './infrastructure/logger.js';

const port = Number(process.env.PORT) || 3001;
const host = '0.0.0.0';

async function start() {
  const app = buildApp();

  try {
    await app.listen({ port, host });
    logger.info(`🚀 Servidor Threads Content Engine escuchando en http://localhost:${port}`);
    logger.info(`   - Health check: http://localhost:${port}/health`);
    logger.info(`   - API Posts: http://localhost:${port}/api/posts`);
    logger.info(`   - Dashboard Summary: http://localhost:${port}/api/dashboard/summary`);
  } catch (err) {
    logger.error('Error al iniciar el servidor:', err);
    process.exit(1);
  }
}

start();
