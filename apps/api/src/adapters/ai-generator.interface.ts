import { GeneratedContentDraft, PostCategory } from '@threads-engine/contracts';

export interface GenerateDraftParams {
  category: PostCategory;
  sectionName?: string;
  topic?: string;
  recentContext?: string[];
  customInstructions?: string;
}

export interface GenerationResult {
  draft: GeneratedContentDraft;
  model: string;
  promptVersion: string;
  promptText: string;
  rawResponse: string;
  tokensPrompt?: number;
  tokensCompletion?: number;
}

export interface ContentGenerator {
  generateDraft(params: GenerateDraftParams): Promise<GenerationResult>;
}
