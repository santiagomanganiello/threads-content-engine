import 'dotenv/config';
import { logger } from '../infrastructure/logger.js';

async function verifyThreadsConnection() {
  const token = process.env.THREADS_ACCESS_TOKEN;
  const configuredUserId = process.env.THREADS_USER_ID;
  const provider = process.env.THREADS_PROVIDER;

  console.log('\n--- VERIFICACIÓN DE CONEXIÓN CON THREADS API ---');
  console.log(`THREADS_PROVIDER: ${provider}`);

  if (provider !== 'meta') {
    console.log('⚠️  El proveedor actual está en modo "mock". Cambiá THREADS_PROVIDER=meta en tu .env para usar la API oficial.');
  }

  if (!token) {
    console.error('❌ Falta THREADS_ACCESS_TOKEN en el archivo .env.');
    process.exit(1);
  }

  try {
    console.log('Verificando token con la Graph API de Threads...');
    const url = `https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url&access_token=${token}`;
    const res = await fetch(url);
    const data = (await res.json()) as { id?: string; username?: string; error?: { message: string } };

    if (!res.ok || data.error) {
      console.error('❌ Error de autenticación con Threads:');
      console.error(data.error?.message || JSON.stringify(data));
      process.exit(1);
    }

    console.log('✅ ¡Conexión exitosa a Threads!');
    console.log(`   - Usuario: @${data.username}`);
    console.log(`   - Threads User ID: ${data.id}`);

    if (configuredUserId && configuredUserId !== data.id) {
      console.warn(`⚠️  Aviso: Tu THREADS_USER_ID configurado (${configuredUserId}) es distinto al devuelto por la API (${data.id}). Actualizalo en tu .env.`);
    } else {
      console.log('   - THREADS_USER_ID: Configurado y coincidente.');
    }

    console.log('\n🎉 ¡Tu cuenta está lista para publicar de forma real desde el panel!');
  } catch (err) {
    console.error('❌ Error de red al conectar con Threads:', err);
  }
}

verifyThreadsConnection();
