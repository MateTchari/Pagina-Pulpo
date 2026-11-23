import 'dotenv/config';

const errors = [];
for (const key of ['DATABASE_URL', 'BETTER_AUTH_SECRET', 'BETTER_AUTH_URL', 'NEXT_PUBLIC_APP_URL']) {
  if (!process.env[key]?.trim()) errors.push(`Falta ${key} en las variables de entorno del despliegue.`);
}
for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
  const value = process.env[key];
  if (!value) continue;
  try {
    const url = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) errors.push(`${key} debe ser una conexión PostgreSQL compatible con el adaptador pg.`);
    if (['localhost', '127.0.0.1', '[::1]', '0.0.0.0'].includes(url.hostname)) errors.push(`${key} apunta a una base local. Vercel necesita PostgreSQL online.`);
  } catch { errors.push(`${key} no contiene una URL válida.`); }
}
for (const key of ['BETTER_AUTH_URL', 'NEXT_PUBLIC_APP_URL']) {
  if (!process.env[key]) continue;
  try {
    const url = new URL(process.env[key]);
    if (url.protocol !== 'https:' || url.username || url.password) errors.push(`${key} debe ser el dominio HTTPS de tu aplicación.`);
  } catch { errors.push(`${key} no contiene una URL válida.`); }
}
if (process.env.BETTER_AUTH_SECRET && (process.env.BETTER_AUTH_SECRET.length < 32 || process.env.BETTER_AUTH_SECRET === 'GENERAR_CON_SETUP')) errors.push('BETTER_AUTH_SECRET debe ser un secreto aleatorio de al menos 32 caracteres.');
if (errors.length) {
  console.error('Configuración de despliegue incompleta:\n' + errors.map(e => `- ${e}`).join('\n'));
  process.exit(1);
}
console.log('Variables de despliegue presentes y con formato válido. Prisma verificará la conexión al aplicar migraciones.');
