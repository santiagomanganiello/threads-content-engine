import { prisma } from '../../infrastructure/database.js';
import { logger } from '../../infrastructure/logger.js';
import { getAiGenerator } from '../../adapters/index.js';
import { DAILY_EDITORIAL_SECTIONS, PostCategory } from '@threads-engine/contracts';

export class GenerationService {
  private generator = getAiGenerator();

  /**
   * Genera el lote diario de 3 borradores con clave de idempotencia
   */
  async generateDailyBatch(targetDate?: string) {
    const dateKey = targetDate || new Date().toISOString().split('T')[0];
    const batchId = `daily-generation:${dateKey}`;

    logger.info(`[GenerationService] Verificando lote diario: ${batchId}`);

    const targetCount = Object.keys(DAILY_EDITORIAL_SECTIONS).length;

    // Verificar si ya existen borradores generados para este batch
    const existing = await prisma.contentPost.findMany({
      where: { generationBatchId: batchId },
      include: { generations: true },
    });

    if (existing.length >= targetCount) {
      logger.info(`[GenerationService] Lote ${batchId} ya fue generado previamente (${existing.length} posts). Se retorna el lote existente.`);
      return { batchId, posts: existing, isNew: false };
    }

    const createdPosts = [];

    // Generar las 3 secciones editoriales diarias
    for (const [sectionKey, section] of Object.entries(DAILY_EDITORIAL_SECTIONS)) {
      // Verificar si ya existe este post específico en el batch
      const sectionAlreadyExists = existing.some((p) => p.category === section.category);
      if (sectionAlreadyExists) continue;

      logger.info(`[GenerationService] Generando sección ${sectionKey}: "${section.name}" (${section.category})`);

      try {
        const result = await this.generator.generateDraft({
          category: section.category,
          sectionName: section.name,
        });

        const post = await prisma.contentPost.create({
          data: {
            category: result.draft.category,
            text: result.draft.text,
            hook: result.draft.hook,
            question: result.draft.question,
            needsFactCheck: result.draft.needsFactCheck,
            factualClaims: result.draft.factualClaims,
            status: 'PENDING_REVIEW',
            generationBatchId: batchId,
            generations: {
              create: {
                model: result.model,
                promptVersion: result.promptVersion,
                prompt: result.promptText,
                rawResponse: result.rawResponse,
                tokensPrompt: result.tokensPrompt,
                tokensCompletion: result.tokensCompletion,
                status: 'SUCCESS',
              },
            },
          },
          include: {
            generations: true,
          },
        });

        createdPosts.push(post);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.error(`[GenerationService] Error generando sección ${section.name}`, { error: errorMsg });
      }
    }

    const allBatchPosts = await prisma.contentPost.findMany({
      where: { generationBatchId: batchId },
      include: { generations: true },
    });

    return {
      batchId,
      posts: allBatchPosts,
      isNew: createdPosts.length > 0,
    };
  }

  /**
   * Generación manual individual
   */
  async generateManual(params: {
    category: PostCategory;
    editorialSection?: string;
    customPrompt?: string;
    ideaId?: string;
  }) {
    logger.info(`[GenerationService] Generación manual solicitada para categoría ${params.category}`);

    const result = await this.generator.generateDraft({
      category: params.category,
      sectionName: params.editorialSection,
      customInstructions: params.customPrompt,
    });

    const post = await prisma.contentPost.create({
      data: {
        category: result.draft.category,
        text: result.draft.text,
        hook: result.draft.hook,
        question: result.draft.question,
        needsFactCheck: result.draft.needsFactCheck,
        factualClaims: result.draft.factualClaims,
        status: 'PENDING_REVIEW',
        ideaId: params.ideaId,
        generations: {
          create: {
            model: result.model,
            promptVersion: result.promptVersion,
            prompt: result.promptText,
            rawResponse: result.rawResponse,
            tokensPrompt: result.tokensPrompt,
            tokensCompletion: result.tokensCompletion,
            status: 'SUCCESS',
          },
        },
      },
      include: {
        generations: true,
      },
    });

    return post;
  }
}

export const generationService = new GenerationService();
