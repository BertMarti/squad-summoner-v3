'use strict';
/**
 * `npm run server:grupos`: vincula WhatsApp (QR), enseña tus grupos con su ID y, si quieres, guarda el elegido
 * como WHATSAPP_GROUP_ID en el .env de la raíz.
 */
const fs = require('node:fs');
const path = require('node:path');
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
} catch {
  /* sin dependencias instaladas: preflight lo explica justo abajo */
}
const { preflight, ROOT_DIR } = require('./lib/preflight');

if (!preflight({ needGroupId: false, needEnvFile: false })) process.exit(1);

const readline = require('node:readline/promises');
const qrcode = require('qrcode-terminal');
const { createWhatsappClient, QR_HELP } = require('./lib/whatsappClient');
const { setEnvValue } = require('./lib/envFile');
const { isValidGroupId } = require('./lib/security');
// Los nombres vienen de WhatsApp (no confiables): se limpian antes de imprimirlos.
const { safeTerminalText: safeName } = require('./lib/terminalText');

const LINK_TIMEOUT_MS = 3 * 60_000;

function saveGroupId(id) {
  const envPath = path.join(ROOT_DIR, '.env');
  const base = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, 'utf8')
    : fs.readFileSync(path.join(ROOT_DIR, '.env.example'), 'utf8');
  fs.writeFileSync(envPath, setEnvValue(base, 'WHATSAPP_GROUP_ID', id), { mode: 0o600 });
  fs.chmodSync(envPath, 0o600);
}

async function main() {
  console.log('🔎 Arrancando WhatsApp para listar tus grupos (puede tardar un minuto)…');
  const client = createWhatsappClient();
  client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log(QR_HELP);
  });
  // Ctrl+C: cerrar Chromium y salir sin dejar procesos colgados.
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      console.log('\nCancelado.');
      client
        .destroy()
        .catch(() => {})
        .finally(() => process.exit(130));
    });
  }
  let timer;
  const ready = new Promise((resolve, reject) => {
    client.once('ready', resolve);
    client.once('auth_failure', () =>
      reject(new Error('WhatsApp ha rechazado la vinculación. Borra server/.wwebjs_auth y vuelve a intentarlo.')),
    );
    timer = setTimeout(
      () =>
        reject(new Error('No se ha vinculado WhatsApp en 3 minutos. Vuelve a ejecutar el comando y escanea el QR.')),
      LINK_TIMEOUT_MS,
    );
  });
  try {
    await Promise.all([client.initialize(), ready]);
    clearTimeout(timer);
    const groups = (await client.getChats())
      .filter((chat) => chat.isGroup && isValidGroupId(chat.id && chat.id._serialized))
      .map((chat) => ({ name: safeName(chat.name), id: chat.id._serialized }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    if (groups.length === 0) {
      console.log('ℹ️ Esta cuenta no está en ningún grupo. Crea uno en WhatsApp y vuelve a ejecutar el comando.');
      return;
    }
    console.log('\n👥 Tus grupos:');
    groups.forEach((g, i) => console.log(`  ${String(i + 1).padStart(2)}) ${g.name} — ${g.id}`));
    if (!process.stdin.isTTY) {
      console.log('\nCopia el ID del grupo que quieras en WHATSAPP_GROUP_ID del archivo .env.');
      return;
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = (
      await rl.question('\n¿Qué número quieres usar para «📲 ENVIAR AL GRUPO»? (Enter para salir) ')
    ).trim();
    rl.close();
    const chosen = groups[Number(answer) - 1];
    if (!answer) return;
    if (!/^\d+$/.test(answer) || !chosen) {
      console.log('Número no válido: no he cambiado nada.');
      return;
    }
    saveGroupId(chosen.id);
    console.log(
      `✅ Guardado en .env: los mensajes irán a «${chosen.name}». Ahora arranca el servidor con: npm run server`,
    );
  } catch (error) {
    console.error(`❌ No se pudo vincular WhatsApp: ${error && error.message ? error.message : error}`);
    process.exitCode = 1;
  } finally {
    clearTimeout(timer);
    await client.destroy().catch(() => {});
  }
}

main();
