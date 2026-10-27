export const logger = {
  info: (msg: string, meta?: unknown) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, meta ? sanitize(meta) : '');
  },
  warn: (msg: string, meta?: unknown) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, meta ? sanitize(meta) : '');
  },
  error: (msg: string, meta?: unknown) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, meta ? sanitize(meta) : '');
  },
};

/**
 * Sanitiza objetos para evitar filtrar tokens, contraseñas o claves en logs
 */
function sanitize(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key of Object.keys(clone as Record<string, unknown>)) {
    const lower = key.toLowerCase();
    if (
      lower.includes('token') ||
      lower.includes('secret') ||
      lower.includes('password') ||
      lower.includes('key')
    ) {
      (clone as Record<string, unknown>)[key] = '***REDACTED***';
    }
  }
  return clone;
}
