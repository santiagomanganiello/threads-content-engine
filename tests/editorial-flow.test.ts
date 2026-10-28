import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { prisma } from '../apps/api/src/infrastructure/database.js';
import { generationService } from '../apps/api/src/modules/generation/generation.service.js';
import { editorialService } from '../apps/api/src/modules/editorial/editorial.service.js';
import { publishingService } from '../apps/api/src/modules/publishing/publishing.service.js';
import { MockThreadsPublisher } from '../apps/api/src/adapters/mock-threads-publisher.js';

describe('Threads Content Engine - Editorial & Publishing Core Logic', () => {
  const testBatchDate = `test-${Date.now()}`;

  const testBatchId = `daily-generation:${testBatchDate}`;

  // Guarda los Ids de cada post que el test crea, para borrar solo esos
  const createdPostIds = new Set<string>();

  const trackPosts = <T extends { id: string }>(posts: T[]): T[] => {
    posts.forEach((p) => createdPostIds.add(p.id));
    return posts;
  };

  beforeAll(() => {
    // Usar mock en tests unitarios para no llamar a la API real de Meta ni gastar cuotas
    publishingService.setPublisher(new MockThreadsPublisher());
  });

    afterAll(async () => {
      try {
      if (createdPostIds.size > 0){
        // Las relaciones tienen onDelete: Cascade, así que revisiones,
        // intentos de publicación y generaciones se eliminan solas.
        await prisma.contentPost.deleteMany({
          where: { id: { in: [...createdPostIds]}},
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  it('1. Genera exactamente 4 borradores diarios para las secciones configuradas (incluyendo Crecimiento)', async () => {
    const result = await generationService.generateDailyBatch(testBatchDate);
    trackPosts(result.posts);

    expect(result.batchId).toBe(testBatchId);
    expect(result.posts.length).toBe(4);
    expect(result.isNew).toBe(true);

    const categories = result.posts.map((p) => p.category);
    expect(categories).toContain('BASS_HISTORY');
    expect(categories).toContain('COMMUNITY');
    expect(categories).toContain('EDUCATION');
    expect(categories).toContain('GROWTH');

    // Todos nacen en PENDING_REVIEW
    result.posts.forEach((p) => {
      expect(p.status).toBe('PENDING_REVIEW');
      expect(p.text.length).toBeLessThanOrEqual(500);
    });
  });

  it('2. Idempotencia: Una segunda llamada al mismo lote diario no duplica los borradores', async () => {
    const secondCall = await generationService.generateDailyBatch(testBatchDate);

    expect(secondCall.isNew).toBe(false);
    expect(secondCall.posts.length).toBe(4);

    // Contar en BD
    const count = await prisma.contentPost.count({
      where: { generationBatchId: `daily-generation:${testBatchDate}` },
    });
    expect(count).toBe(4);
  });

  it('3. Regla de seguridad: Ningún contenido pendiente de revisión puede publicarse', async () => {
    const batch = trackPosts((await generationService.generateDailyBatch(testBatchDate)).posts);
    const pendingPost = batch[0];

    expect(pendingPost.status).toBe('PENDING_REVIEW');

    // Intentar publicar debe lanzar excepción
    await expect(publishingService.publishPost(pendingPost.id)).rejects.toThrow(
      /Solo se permite publicar contenido en estado "APPROVED"/
    );
  });

  it('4. Permite aprobar un borrador pendiente', async () => {
    const batch = trackPosts((await generationService.generateDailyBatch(testBatchDate)).posts);
    const postToApprove = batch[0];

    const approved = await editorialService.approvePost(postToApprove.id, 'Aprobado para publicar', 'editor-santi');
    expect(approved.status).toBe('APPROVED');
    expect(approved.approvedBy).toBe('editor-santi');
    expect(approved.approvedAt).not.toBeNull();
  });

  it('5. Regla de integridad: Si se modifica el texto de un post aprobado, la aprobación se invalida', async () => {
    const batch = trackPosts((await generationService.generateDailyBatch(testBatchDate)).posts);
    const post = batch[0];

    // Asegurar que esté aprobado
    await editorialService.approvePost(post.id);

    // Modificar el texto
    const updated = await editorialService.updatePost(
      post.id,
      {
        text: 'Texto editado por el redactor: James Jamerson y su legendario sonido Motown con cuerdas La Bella.',
      },
      'editor-santi'
    );

    // Debe volver inmediatamente a PENDING_REVIEW
    expect(updated.status).toBe('PENDING_REVIEW');
    expect(updated.approvedAt).toBeNull();
    expect(updated.approvedBy).toBeNull();

    // Debe haber registrado una revisión con invalidatedApproval: true
    expect(updated.revisions.length).toBeGreaterThan(0);
    expect(updated.revisions[0].invalidatedApproval).toBe(true);
    expect(updated.revisions[0].newText).toContain('Texto editado por el redactor');
  });

  it('6. Publicación controlada: Publicar un contenido aprobado registra externalPostId y pasa a PUBLISHED', async () => {
    const batch = trackPosts((await generationService.generateDailyBatch(testBatchDate)).posts);
    const post = batch[0];

    // 1. Aprobar
    await editorialService.approvePost(post.id, 'Listo para salir');

    // 2. Publicar
    const published = await publishingService.publishPost(post.id);

    expect(published.status).toBe('PUBLISHED');
    expect(published.externalPostId).toBeDefined();
    expect(published.externalPostId).toMatch(/^th_/);
    expect(published.publishedAt).not.toBeNull();

    // Verificar intento de publicación registrado
    const attempt = await prisma.publishAttempt.findFirst({
      where: { postId: post.id },
    });
    expect(attempt).not.toBeNull();
    expect(attempt?.status).toBe('PUBLISHED');
    expect(attempt?.containerId).toBeDefined();
    expect(attempt?.externalPostId).toBe(published.externalPostId);
  });
});
