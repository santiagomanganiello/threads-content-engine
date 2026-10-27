/**
 * Diagnóstico rápido de conectividad con la API de Gemini
 */
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env') });

const apiKey = process.env.GEMINI_API_KEY!;
console.log('Key prefix:', apiKey.substring(0, 10) + '...');

// Test con timeout de 10 segundos
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10_000);

try {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  console.log('Probando conectividad a:', url.replace(apiKey, '[KEY]'));

  const res = await fetch(url, { signal: controller.signal });
  clearTimeout(timeout);

  const text = await res.text();
  if (res.ok) {
    const data = JSON.parse(text);
    const models = data.models?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent')) ?? [];
    console.log(`✅ Conexión OK. Modelos disponibles (generateContent): ${models.length}`);
    models.slice(0, 5).forEach((m: any) => console.log(' -', m.name));
  } else {
    console.error('❌ Error HTTP', res.status);
    console.error(text.substring(0, 500));
  }
} catch (err: any) {
  clearTimeout(timeout);
  if (err.name === 'AbortError') {
    console.error('❌ TIMEOUT: La API no responde en 10 segundos. Problema de red o clave inválida.');
  } else {
    console.error('❌ Error de red:', err.message);
  }
}
