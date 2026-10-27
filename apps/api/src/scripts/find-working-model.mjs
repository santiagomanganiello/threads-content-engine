import 'dotenv/config';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY no está configurada. Definila en apps/api/.env o como variable de entorno.');
}

async function testModel(modelName) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: "Responde exactamente la palabra OK" }] }]
  };
  
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timer);
    const data = await res.json();
    if (res.ok) {
      console.log(`✅ [${modelName}] ÉXITO:`, data.candidates?.[0]?.content?.parts?.[0]?.text?.trim());
      return true;
    } else {
      console.log(`❌ [${modelName}] HTTP ${res.status}:`, data.error?.message?.slice(0, 120));
      return false;
    }
  } catch (err) {
    clearTimeout(timer);
    console.log(`❌ [${modelName}] Error:`, err.name === 'AbortError' ? 'TIMEOUT (8s)' : err.message);
    return false;
  }
}

const candidates = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemma-4-31b-it'
];

for (const m of candidates) {
  const ok = await testModel(m);
  if (ok) {
    console.log(`\n🎉 MODELO ELEGIDO: ${m}`);
    break;
  }
}
