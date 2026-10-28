import { config } from 'dotenv';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.test');
const result = config({ path: envPath, override: true });

if (result.error) {
  throw new Error(`Abortando tests: no se pudo leer ${envPath}. Creá .env.test en la raíz del repo.`);
}

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
  throw new Error('Abortando tests: DATABASE_URL no está definida en .env.test.');
}

let dbName: string;
try {
  dbName = new URL(rawUrl).pathname.replace(/^\//, '');
} catch {
  throw new Error('Abortando tests: DATABASE_URL no es una URL válida.');
}

if (!dbName.endsWith('_test')) {
  throw new Error(
    `Abortando tests: la base configurada ("${dbName}") no termina en "_test". Los tests solo corren contra bases de test.`
  );
}

const requiredProviders = { AI_PROVIDER: 'mock', THREADS_PROVIDER: 'mock' } as const;

for (const [key, expected] of Object.entries(requiredProviders)) {
  const actual = process.env[key];
  if (actual !== expected) {
    throw new Error(
      `Abortando tests: ${key} debe ser "${expected}" en .env.test (actual: "${actual ?? 'undefined'}").`
    );
  }
}