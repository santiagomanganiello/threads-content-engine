/**
 * Script de prueba para el adaptador Gemini.
 * Uso: npx tsx src/scripts/test-gemini.ts
 */
import { config } from 'dotenv';
import { resolve } from 'path';

// Cargar .env desde la raíz del api
config({ path: resolve(process.cwd(), '.env') });

import { getAiGenerator } from '../adapters/index.js';
import { PostCategory } from '@threads-engine/contracts';

if (process.env.AI_PROVIDER?.toLowerCase() !== 'gemini') {
  throw new Error('Configurá AI_PROVIDER=gemini en apps/api/.env para probar Gemini.');
}

const categories: PostCategory[] = ['BASS_HISTORY', 'COMMUNITY', 'EDUCATION', 'GROWTH'];

const gen = getAiGenerator();
console.log(`\n✅ Generator: ${gen.constructor.name}\n`);

let hasErrors = false;

for (const category of categories) {
  console.log(`\n🎸 Generando categoría: ${category}...`);
  try {
    const result = await gen.generateDraft({ category, sectionName: category });
    console.log(`  Hook: ${result.draft.hook}`);
    console.log(`  Text (${result.draft.text.length} chars): ${result.draft.text.substring(0, 80)}...`);
    console.log(`  Question: ${result.draft.question ?? '(sin pregunta)'}`);
    console.log(`  FactCheck: ${result.draft.needsFactCheck}`);
    console.log(`  Tokens: ${result.tokensPrompt}p / ${result.tokensCompletion}c`);
  } catch (err) {
    hasErrors = true;
    console.error(`  ❌ Error:`, err instanceof Error ? err.message : err);
  }
}

if (hasErrors) {
  process.exitCode = 1;
} else {
  console.log('\n✅ Test completado.');
}
