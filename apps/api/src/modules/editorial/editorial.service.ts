import { Prisma } from '@prisma/client';
import { prisma } from '../../infrastructure/database.js';
import { logger } from '../../infrastructure/logger.js';
import { ListPostsQuery, UpdatePostInput } from '@threads-engine/contracts';

export class EditorialService {
  async listPosts(query: ListPostsQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ContentPostWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.search) {
      where.OR = [
        { text: { contains: query.search, mode: 'insensitive' } },
        { hook: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, posts] = await Promise.all([
      prisma.contentPost.count({ where }),
      prisma.contentPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          generations: { orderBy: { createdAt: 'desc' }, take: 1 },
          publishAttempts: { orderBy: { createdAt: 'desc' }, take: 1 },
          revisions: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
      }),
    ]);

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPostById(id: string) {
    const post = await prisma.contentPost.findUnique({
      where: { id },
      include: {
        generations: { orderBy: { createdAt: 'desc' } },
        publishAttempts: { orderBy: { createdAt: 'desc' } },
        revisions: { orderBy: { createdAt: 'desc' } },
        idea: true,
      },
    });

    if (!post) {
      throw new Error(`Publicación con ID ${id} no encontrada`);
    }

    return post;
  }

  async updatePost(id: string, input: UpdatePostInput, user: string = 'editor') {
    const existing = await this.getPostById(id);

    const isTextModified = input.text !== undefined && input.text !== existing.text;
    const wasApproved = existing.status === 'APPROVED';
    const invalidatedApproval = isTextModified && wasApproved;

    // Regla de arquitectura: Si el texto cambia después de aprobarse, la aprobación se invalida
    const nextStatus = invalidatedApproval ? 'PENDING_REVIEW' : existing.status;

    logger.info(`[EditorialService] Actualizando post=${id}`, {
      isTextModified,
      wasApproved,
      invalidatedApproval,
      nextStatus,
    });

    return await prisma.$transaction(async (tx) => {
      // 1. Si hubo cambio de texto, registrar la revisión histórica
      if (isTextModified) {
        await tx.contentRevision.create({
          data: {
            postId: id,
            previousText: existing.text,
            newText: input.text,
            changedBy: user,
            changeSource: 'USER_EDIT',
            invalidatedApproval,
          },
        });
      }

      // 2. Actualizar el contenido y estado
      const updated = await tx.contentPost.update({
        where: { id },
        data: {
          text: input.text,
          hook: input.hook !== undefined ? input.hook : existing.hook,
          question: input.question !== undefined ? input.question : existing.question,
          category: input.category || existing.category,
          needsFactCheck: input.needsFactCheck !== undefined ? input.needsFactCheck : existing.needsFactCheck,
          status: nextStatus,
          approvedAt: invalidatedApproval ? null : existing.approvedAt,
          approvedBy: invalidatedApproval ? null : existing.approvedBy,
        },
        include: {
          generations: { orderBy: { createdAt: 'desc' }, take: 1 },
          revisions: { orderBy: { createdAt: 'desc' }, take: 5 },
          publishAttempts: true,
        },
      });

      return updated;
    });
  }

  async approvePost(id: string, notes?: string, user: string = 'editor') {
    const post = await this.getPostById(id);

    if (post.status === 'PUBLISHED') {
      throw new Error('No se puede volver a aprobar una publicación que ya fue publicada en Threads');
    }

    const updated = await prisma.contentPost.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: user,
        rejectedAt: null,
        rejectionReason: null,
      },
      include: {
        revisions: { orderBy: { createdAt: 'desc' }, take: 5 },
        publishAttempts: true,
      },
    });

    logger.info(`[EditorialService] Post ${id} aprobado por ${user}`);
    return updated;
  }

  async rejectPost(id: string, reason: string, user: string = 'editor') {
    const post = await this.getPostById(id);

    if (post.status === 'PUBLISHED') {
      throw new Error('No se puede rechazar una publicación ya realizada');
    }

    const updated = await prisma.contentPost.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: reason,
        approvedAt: null,
        approvedBy: null,
      },
      include: {
        revisions: { orderBy: { createdAt: 'desc' }, take: 5 },
        publishAttempts: true,
      },
    });

    logger.info(`[EditorialService] Post ${id} rechazado por ${user}. Motivo: ${reason}`);
    return updated;
  }

  async schedulePost(id: string, scheduledAt: string) {
    const post = await this.getPostById(id);

    // Regla de negocio: Solo posts aprobados pueden ser programados
    if (post.status !== 'APPROVED' && post.status !== 'SCHEDULED') {
      throw new Error('Solo se puede programar un contenido que haya sido previamente APROBADO');
    }

    const scheduleDate = new Date(scheduledAt);
    if (isNaN(scheduleDate.getTime()) || scheduleDate <= new Date()) {
      throw new Error('La fecha y hora de programación debe ser posterior al momento actual');
    }

    const updated = await prisma.contentPost.update({
      where: { id },
      data: {
        status: 'SCHEDULED',
        scheduledAt: scheduleDate,
      },
      include: {
        revisions: true,
        publishAttempts: true,
      },
    });

    logger.info(`[EditorialService] Post ${id} programado para ${scheduleDate.toISOString()}`);
    return updated;
  }
}

export const editorialService = new EditorialService();
