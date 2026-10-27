import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { ZodError } from 'zod';
import {
  ListPostsQuerySchema,
  UpdatePostSchema,
  ApprovePostSchema,
  RejectPostSchema,
  SchedulePostSchema,
  ManualGenerationSchema,
} from '@threads-engine/contracts';
import { editorialService } from './modules/editorial/editorial.service.js';
import { generationService } from './modules/generation/generation.service.js';
import { publishingService } from './modules/publishing/publishing.service.js';
import { dashboardService } from './modules/dashboard/dashboard.service.js';
import { logger } from './infrastructure/logger.js';

export function buildApp(): FastifyInstance {
  const app = fastify({
    logger: false, // Usamos nuestro logger controlado para evitar fugas de secretos
  });

  // CORS
  app.register(cors, {
    origin: true,
    credentials: true,
  });

  // Healthcheck
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Central Error Handler
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      reply.status(400).send({
        statusCode: 400,
        error: 'Validation Error',
        message: 'Los datos enviados no cumplen el contrato establecido',
        details: error.issues,
      });
      return;
    }

    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[App Error] ${request.method} ${request.url}: ${message}`);
    reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: message || 'Ha ocurrido un error inesperado',
    });
  });

  // -------------------------------------------------------------
  // RUTAS DEL DASHBOARD
  // -------------------------------------------------------------
  app.get('/api/dashboard/summary', async () => {
    return await dashboardService.getSummary();
  });

  // -------------------------------------------------------------
  // RUTAS DE POSTS Y BANDEJA EDITORIAL
  // -------------------------------------------------------------
  app.get('/api/posts', async (request, reply) => {
    const query = ListPostsQuerySchema.parse(request.query);
    return await editorialService.listPosts(query);
  });

  app.get('/api/posts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    return await editorialService.getPostById(id);
  });

  app.patch('/api/posts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = UpdatePostSchema.parse(request.body);
    return await editorialService.updatePost(id, body);
  });

  app.post('/api/posts/:id/approve', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = ApprovePostSchema.parse(request.body || {});
    return await editorialService.approvePost(id, body.notes);
  });

  app.post('/api/posts/:id/reject', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = RejectPostSchema.parse(request.body);
    return await editorialService.rejectPost(id, body.reason);
  });

  app.post('/api/posts/:id/schedule', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = SchedulePostSchema.parse(request.body);
    return await editorialService.schedulePost(id, body.scheduledAt);
  });

  app.post('/api/posts/:id/publish', async (request, reply) => {
    const { id } = request.params as { id: string };
    return await publishingService.publishPost(id);
  });

  // -------------------------------------------------------------
  // RUTAS DE GENERACIÓN CON IA
  // -------------------------------------------------------------
  app.post('/api/generations/daily', async (request, reply) => {
    const body = (request.body as { date?: string }) || {};
    return await generationService.generateDailyBatch(body.date);
  });

  app.post('/api/generations', async (request, reply) => {
    const body = ManualGenerationSchema.parse(request.body);
    return await generationService.generateManual(body);
  });

  return app;
}
