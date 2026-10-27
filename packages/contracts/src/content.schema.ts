import { z } from 'zod';

export const PostCategoryEnum = z.enum([
  'BASS_HISTORY',
  'COMMUNITY',
  'EDUCATION',
  'CULTURE',
  'HUMOR',
  'GROWTH',
]);
export type PostCategory = z.infer<typeof PostCategoryEnum>;

export const PostStatusEnum = z.enum([
  'IDEA',
  'GENERATING',
  'PENDING_REVIEW',
  'APPROVED',
  'SCHEDULED',
  'PUBLISHING',
  'PUBLISHED',
  'REJECTED',
  'FAILED',
]);
export type PostStatus = z.infer<typeof PostStatusEnum>;

export const PublishAttemptStatusEnum = z.enum([
  'PENDING',
  'CONTAINER_CREATED',
  'PUBLISHED',
  'FAILED',
  'UNKNOWN',
]);
export type PublishAttemptStatus = z.infer<typeof PublishAttemptStatusEnum>;

/**
 * Esquema estricto de generación de contenido producido por IA
 * Limite de caracteres editorial: 500 caracteres max.
 */
export const GeneratedContentDraftSchema = z.object({
  category: PostCategoryEnum,
  text: z
    .string()
    .min(10, 'El texto debe tener al menos 10 caracteres')
    .max(500, 'El texto no puede superar los 500 caracteres'),
  hook: z.string().min(5, 'El hook debe ser claro'),
  question: z.string().optional().nullable(),
  factualClaims: z.array(z.string()).default([]),
  needsFactCheck: z.boolean().default(false),
});
export type GeneratedContentDraft = z.infer<typeof GeneratedContentDraftSchema>;

/**
 * Metadata editorial de las secciones diarias
 */
export const DAILY_EDITORIAL_SECTIONS: Record<
  number,
  { name: string; category: PostCategory; description: string }
> = {
  1: {
    name: 'Bajos que cambiaron el mundo',
    category: 'BASS_HISTORY',
    description: 'Historia musical, líneas icónicas de bajo e identidad de grandes bajistas.',
  },
  2: {
    name: 'Bajista, si tuvieras que…',
    category: 'COMMUNITY',
    description: 'Preguntas dilemáticas, debate e interacción con la comunidad bajista.',
  },
  3: {
    name: 'La cocina del bajo',
    category: 'EDUCATION',
    description: 'Técnica, tips prácticos, armonía aplicada, sonido y setup de bajo.',
  },
  4: {
    name: 'Imán de Seguidores',
    category: 'GROWTH',
    description: 'Contenido de alto valor para guardar/compartir con llamado a la acción para ganar seguidores (@polagruv).',
  },
};
