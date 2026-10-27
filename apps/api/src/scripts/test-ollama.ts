import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

import { getAiGenerator } from '../adapters/index.js';

const gen = getAiGenerator();
console.log(`\n🚀 Generador activo: ${gen.constructor.name}\n`);

console.log('🎸 Solicitando borrador con Ollama (llama3.2)...');
const start = Date.now();
const res = await gen.generateDraft({
  category: 'BASS_HISTORY',
  sectionName: 'Bajos que cambiaron el mundo',
});
const duration = ((Date.now() - start) / 1000).toFixed(2);

console.log(`\n--- RESULTADO GENERADO EN ${duration}s ---`);
console.log('Modelo:', res.model);
console.log('Hook:', res.draft.hook);
console.log('Texto:', res.draft.text);
console.log('Largo del texto:', res.draft.text.length, 'caracteres');
console.log('Pregunta:', res.draft.question);
console.log('Claims:', res.draft.factualClaims);
console.log('NeedsFactCheck:', res.draft.needsFactCheck);
console.log('Tokens prompt/completion:', res.tokensPrompt, '/', res.tokensCompletion);
console.log('\n✅ ¡Generación con IA local completada con éxito!');
