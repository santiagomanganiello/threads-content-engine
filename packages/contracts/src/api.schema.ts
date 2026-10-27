import { z } from 'zod';
import { PostCategoryEnum, PostStatusEnum } from './content.schema.js';

export const ListPostsQuerySchema = z.object({
  status: PostStatusEnum.optional(),
  category: PostCategoryEnum.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type ListPostsQuery = z.infer<typeof ListPostsQuerySchema>;

export const CreateIdeaSchema = z.object({
  topic: z.string().min(3, 'El tema debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  category: PostCategoryEnum,
  source: z.string().default('manual'),
});
export type CreateIdeaInput = z.infer<typeof CreateIdeaSchema>;

export const UpdatePostSchema = z.object({
  text: z
    .string()
    .min(10, 'El texto debe tener al menos 10 caracteres')
    .max(500, 'El límite son 500 caracteres'),
  hook: z.string().optional(),
  question: z.string().optional().nullable(),
  category: PostCategoryEnum.optional(),
  needsFactCheck: z.boolean().optional(),
});
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;

export const ApprovePostSchema = z.object({
  notes: z.string().optional(),
});
export type ApprovePostInput = z.infer<typeof ApprovePostSchema>;

export const RejectPostSchema = z.object({
  reason: z.string().min(3, 'Debe indicar un motivo de rechazo'),
});
export type RejectPostInput = z.infer<typeof RejectPostSchema>;

export const SchedulePostSchema = z.object({
  scheduledAt: z.string().datetime({ message: 'Fecha programada inválida en formato ISO 8601' }),
});
export type SchedulePostInput = z.infer<typeof SchedulePostSchema>;

export const ManualGenerationSchema = z.object({
  category: PostCategoryEnum,
  ideaId: z.string().optional(),
  customPrompt: z.string().optional(),
  editorialSection: z.string().optional(),
});
export type ManualGenerationInput = z.infer<typeof ManualGenerationSchema>;
