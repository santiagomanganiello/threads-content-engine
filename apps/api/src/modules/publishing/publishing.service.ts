import { prisma } from '../../infrastructure/database.js';
import { logger } from '../../infrastructure/logger.js';
import { getThreadsPublisher } from '../../adapters/index.js';

export class PublishingService {
  private publisher = getThreadsPublisher();

  async publishPost(id: string, idempotencyKeyInput?: string) {
    const post = await prisma.contentPost.findUnique({
      where: { id },
      include: { publishAttempts: true },
    });

    if (!post) {
      throw new Error(`Publicación con ID ${id} no encontrada`);
    }

    // Regla de oro de la arquitectura: Jamás publicar contenido no aprobado
    if (post.status !== 'APPROVED' && post.status !== 'SCHEDULED') {
      throw new Error(
        `Imposible publicar: el post está en estado "${post.status}". Solo se permite publicar contenido en estado "APPROVED" o "SCHEDULED".`
      );
    }

    const idempotencyKey = idempotencyKeyInput || `pub_${post.id}_${Date.now()}`;

    // Actualizar estado a PUBLISHING
    await prisma.contentPost.update({
      where: { id },
      data: { status: 'PUBLISHING' },
    });

    // Crear registro de intento de publicación
    const attempt = await prisma.publishAttempt.create({
      data: {
        postId: post.id,
        idempotencyKey,
        status: 'PENDING',
        attemptNumber: post.publishAttempts.length + 1,
      },
    });

    try {
      // Paso 1: Crear el contenedor de medios en Threads
      logger.info(`[PublishingService] Paso 1: Creando contenedor para post ${post.id}`);
      const { containerId } = await this.publisher.createMediaContainer(post.text, idempotencyKey);

      await prisma.publishAttempt.update({
        where: { id: attempt.id },
        data: {
          containerId,
          status: 'CONTAINER_CREATED',
        },
      });

      // Paso 2: Publicar el contenedor en Threads
      logger.info(`[PublishingService] Paso 2: Publicando contenedor ${containerId} en Threads`);
      const { externalPostId } = await this.publisher.publishMediaContainer(containerId);

      // Confirmación exitosa
      const [updatedPost] = await prisma.$transaction([
        prisma.contentPost.update({
          where: { id: post.id },
          data: {
            status: 'PUBLISHED',
            externalPostId,
            publishedAt: new Date(),
          },
        }),
        prisma.publishAttempt.update({
          where: { id: attempt.id },
          data: {
            externalPostId,
            status: 'PUBLISHED',
          },
        }),
      ]);

      logger.info(`[PublishingService] Post ${post.id} publicado con éxito en Threads! ID=${externalPostId}`);
      return updatedPost;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error(`[PublishingService] Falló la publicación del post ${post.id}`, { error: errorMsg });

      // Guardar intento fallido y regresar el post a FAILED
      await prisma.$transaction([
        prisma.publishAttempt.update({
          where: { id: attempt.id },
          data: {
            status: 'FAILED',
            errorMessage: errorMsg,
          },
        }),
        prisma.contentPost.update({
          where: { id: post.id },
          data: { status: 'FAILED' },
        }),
      ]);

      throw new Error(`Error durante la publicación en Threads: ${errorMsg}`);
    }
  }
}

export const publishingService = new PublishingService();
