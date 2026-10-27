import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeneratedContentDraftSchema, PostCategory } from '@threads-engine/contracts';
import { ContentGenerator, GenerateDraftParams, GenerationResult } from './ai-generator.interface.js';

const PROMPT_VERSION = 'v1.0-gemini-bass';
const PRIMARY_MODEL = 'gemini-3.5-flash';
const FALLBACK_MODELS = ['gemini-3.1-flash-lite', 'gemini-flash-latest'];

/**
 * Mapa de descripción editorial por categoría para enriquecer el prompt.
 */
const CATEGORY_CONTEXT: Record<PostCategory, string> = {
  BASS_HISTORY:
    'Historia del bajo eléctrico: instrumentos icónicos, técnicas históricas, bajistas legendarios y anécdotas fascinantes del mundo del bajo.',
  COMMUNITY:
    'Preguntas dilemáticas y debates para la comunidad bajista. Generá una pregunta polémica o divertida que invite a la participación y los comentarios.',
  EDUCATION:
    'Tip práctico de técnica, sonido o setup de bajo. Contenido educativo concreto, directo y aplicable en el ensayo de hoy.',
  CULTURE:
    'Cultura musical relacionada al bajo: cómo el bajo moldeó géneros, líneas sampleadas, influencias cruzadas entre géneros.',
  HUMOR:
    'Post de humor para bajistas: situaciones cotidianas graciosas, ironías de ser bajista, jokes de banda o prueba de sonido.',
  GROWTH:
    'Contenido de alto valor para guardar/compartir. Tips o guías que generen muchos saves y sigan a @polagruv. Incluir llamado a la acción explícito para ganar seguidores.',
};

function buildSystemPrompt(): string {
  return `Sos un experto en contenido para redes sociales especializado en bajo eléctrico.
Escribís para @polagruv, una cuenta de Threads enfocada en la comunidad bajista latinoamericana.
Usás español rioplatense natural (argentina/uruguay): "vos", "bárbaro", "che", "dale", etc.
Tu estilo es cercano, apasionado, técnicamente preciso y conversacional.

REGLAS ESTRICTAS:
- El campo "text" tiene MÁXIMO 500 caracteres (contando espacios). Es fundamental respetarlo.
- El "hook" es la primera frase gancho que aparece sola (máximo 80 caracteres, sin punto final).
- La "question" es la pregunta final para generar engagement (puede ser null).
- "factualClaims" es un array de afirmaciones históricas o técnicas que podrían necesitar verificación.
- "needsFactCheck" debe ser true solo si hay datos históricos específicos (fechas, nombres, modelos de instrumentos).
- Respondé SOLO con un JSON válido, sin markdown, sin bloques de código, solo el objeto JSON puro.

FORMATO JSON:
{
  "category": "<CATEGORIA>",
  "hook": "<gancho corto sin punto>",
  "text": "<cuerpo del post hasta 500 chars>",
  "question": "<pregunta de engagement o null>",
  "factualClaims": ["<claim1>", "<claim2>"],
  "needsFactCheck": true/false
}`;
}

function buildUserPrompt(params: GenerateDraftParams): string {
  const context = CATEGORY_CONTEXT[params.category] || '';
  const customNote = params.customInstructions ? `\nInstrucciones adicionales: ${params.customInstructions}` : '';
  const sectionNote = params.sectionName ? `\nSección editorial: "${params.sectionName}"` : '';

  return `Generá un post original para Threads para la categoría ${params.category}.${sectionNote}
Contexto editorial: ${context}${customNote}

Recordá: el campo "text" no puede superar los 500 caracteres. Respondé SOLO con el JSON.`;
}

export class GeminiAiGenerator implements ContentGenerator {
  private client: GoogleGenerativeAI;
  private promptVersion = PROMPT_VERSION;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generateDraft(params: GenerateDraftParams): Promise<GenerationResult> {
    const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];
    const userPrompt = buildUserPrompt(params);
    let lastError: unknown;

    for (const modelName of modelsToTry) {
      try {
        const model = this.client.getGenerativeModel({
          model: modelName,
          systemInstruction: buildSystemPrompt(),
          generationConfig: {
            temperature: 0.8,
            responseMimeType: 'application/json',
          },
        });

        const result = await model.generateContent(userPrompt);
        const rawResponse = result.response.text().trim();

        const jsonText = rawResponse
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        let parsed: any;
        try {
          parsed = JSON.parse(jsonText);
        } catch {
          throw new Error(`[GeminiAiGenerator] Respuesta no es JSON válido: ${rawResponse.substring(0, 200)}`);
        }

        if (typeof parsed === 'object' && parsed !== null) {
          parsed.category = params.category;
          if (typeof parsed.text === 'string' && parsed.text.length > 500) {
            parsed.text = parsed.text.substring(0, 497) + '...';
          }
        }

        const draft = GeneratedContentDraftSchema.parse(parsed);
        const usage = result.response.usageMetadata;

        return {
          draft,
          model: modelName,
          promptVersion: this.promptVersion,
          promptText: userPrompt,
          rawResponse,
          tokensPrompt: usage?.promptTokenCount ?? undefined,
          tokensCompletion: usage?.candidatesTokenCount ?? undefined,
        };
      } catch (err: any) {
        lastError = err;
        // Si es 503 (alta demanda) o 429 (rate limit), intentamos con el siguiente modelo en la lista
        const isTransient = err?.message?.includes('503') || err?.message?.includes('429');
        if (isTransient) {
          continue;
        }
        throw err;
      }
    }

    throw lastError;
  }
}
