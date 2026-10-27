import { GeneratedContentDraft, GeneratedContentDraftSchema, PostCategory } from '@threads-engine/contracts';
import { ContentGenerator, GenerateDraftParams, GenerationResult } from './ai-generator.interface.js';

const PROMPT_VERSION = 'v1.0-ollama-llama3.2-bass';
const DEFAULT_MODEL = 'llama3.2';
const DEFAULT_HOST = 'http://127.0.0.1:11434';

const CATEGORY_CONTEXT: Record<PostCategory, string> = {
  BASS_HISTORY:
    'Historia del bajo eléctrico: instrumentos icónicos, técnicas históricas, bajistas legendarios y anécdotas del mundo del bajo.',
  COMMUNITY:
    'Preguntas dilemáticas y debates para la comunidad bajista. Generá una pregunta polémica o divertida que invite a la participación y comentarios.',
  EDUCATION:
    'Tip práctico de técnica, sonido o setup de bajo. Contenido educativo concreto, directo y aplicable en un ensayo o estudio.',
  CULTURE:
    'Cultura musical relacionada al bajo: cómo el bajo moldeó géneros musicales, líneas sampleadas e influencias entre estilos.',
  HUMOR:
    'Post de humor para bajistas: situaciones cotidianas graciosas, ironías de la vida de músico, jokes de banda o prueba de sonido.',
  GROWTH:
    'Contenido de alto valor para guardar/compartir con llamado a la acción para seguir a @polagruv en Threads.',
};

function buildSystemPrompt(): string {
  return `Sos un redactor experto en contenido para Threads especializado en bajo eléctrico para la cuenta @polagruv.
Hablás en español rioplatense natural (argentino/uruguayo): "vos", "che", "tremendo", "bárbaro".
Tu tono es apasionado, conocedor, directo y conversacional.

REGLAS OBLIGATORIAS:
1. El campo "text" NO debe superar los 500 caracteres (contando espacios).
2. El "hook" es una frase inicial atractiva y corta (máximo 80 caracteres, sin punto final).
3. "question" es una pregunta breve al final para generar comentarios (o null si no aplica).
4. "factualClaims" es un array con datos históricos/técnicos específicos que se mencionen.
5. "needsFactCheck" es true si hay datos como años, nombres o modelos históricos; sino false.
6. Respondé ÚNICAMENTE un objeto JSON válido con los campos exactos, sin texto adicional, sin formato markdown.

FORMATO JSON:
{
  "category": "CATEGORIA",
  "hook": "texto del gancho",
  "text": "cuerpo del post menor a 500 caracteres",
  "question": "pregunta para debate o null",
  "factualClaims": ["afirmacion 1"],
  "needsFactCheck": false
}`;
}

function buildUserPrompt(params: GenerateDraftParams): string {
  const context = CATEGORY_CONTEXT[params.category] || '';
  const custom = params.customInstructions ? `\nInstrucciones adicionales: ${params.customInstructions}` : '';
  const section = params.sectionName ? `\nSección: "${params.sectionName}"` : '';

  return `Generá un borrador original para Threads de la categoría ${params.category}.${section}
Enfoque: ${context}${custom}

Recordá: máximo 500 caracteres en "text" y respuesta en JSON estricto.`;
}

export class OllamaAiGenerator implements ContentGenerator {
  private baseUrl: string;
  private model: string;
  private promptVersion = PROMPT_VERSION;

  constructor(options?: { baseUrl?: string; model?: string }) {
    this.baseUrl = options?.baseUrl || process.env.OLLAMA_BASE_URL || DEFAULT_HOST;
    this.model = options?.model || process.env.OLLAMA_MODEL || DEFAULT_MODEL;
  }

  async generateDraft(params: GenerateDraftParams): Promise<GenerationResult> {
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(params);

    const payload = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      format: 'json',
      stream: false,
      options: {
        temperature: 0.7,
      },
    };

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`[OllamaAiGenerator] Error HTTP ${response.status} de Ollama: ${errText}`);
    }

    const data = (await response.json()) as {
      message?: { content?: string };
      prompt_eval_count?: number;
      eval_count?: number;
    };

    const rawResponse = data.message?.content?.trim() || '';
    if (!rawResponse) {
      throw new Error('[OllamaAiGenerator] Ollama devolvió una respuesta vacía');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawResponse);
    } catch {
      // Intentar extraer si vino envuelto en markdown
      const cleaned = rawResponse.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(cleaned);
    }

    if (typeof parsed === 'object' && parsed !== null) {
      parsed.category = params.category;
      if (typeof parsed.text === 'string' && parsed.text.length > 500) {
        parsed.text = parsed.text.substring(0, 497) + '...';
      }
    }

    const draft = GeneratedContentDraftSchema.parse(parsed);

    return {
      draft,
      model: `ollama/${this.model}`,
      promptVersion: this.promptVersion,
      promptText: userPrompt,
      rawResponse,
      tokensPrompt: data.prompt_eval_count,
      tokensCompletion: data.eval_count,
    };
  }
}
