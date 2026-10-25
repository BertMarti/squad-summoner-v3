#!/usr/bin/env node
/**
 * `npm run setup`: asistente de primera configuración.
 * - Comprueba Node y npm, instala lo que falte y crea el .env desde .env.example (permisos 600).
 * - Opcional: prepara el servidor de envío automático a WhatsApp (Chromium del sistema en Raspberry Pi,
 *   dependencias, ID del grupo) y explica el QR.
 * Nunca imprime el contenido del .env. Sin terminal interactiva (o con --yes) usa los valores por defecto.
 */
import { spawnSync } from 'node:child_process'
import { chmodSync, copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SERVER = join(ROOT, 'server')
const ENV_PATH = join(ROOT, '.env')

const args = new Set(process.argv.slice(2))
const HELP = `
Squad Summoner · asistente de configuración

Uso:  npm run setup            (pregunta lo mínimo)
      npm run setup -- --yes   (sin preguntas: solo prepara la web)

Qué hace:
  1. Comprueba que tienes Node.js 20.19+ y npm.
  2. Instala las dependencias de la web si faltan.
  3. Crea el archivo .env a partir de .env.example (si ya existe, no lo pisa).
  4. Opcional: prepara el envío automático a un grupo de WhatsApp
     (Chromium, dependencias del servidor, ID del grupo y cómo escanear el QR).

Tu clave de Gemini NO se configura aquí: se pega en la propia web (⚙️ CONFIGURAR API).
`
if (args.has('--help') || args.has('-h')) {
  console.log(HELP)
  process.exit(0)
}

const interactive = Boolean(process.stdin.isTTY) && !args.has('--yes') && !args.has('-y')
const rl = interactive ? createInterface({ input: process.stdin, output: process.stdout }) : null

/** Pregunta sí/no. Sin terminal interactiva devuelve el valor por defecto. */
async function ask(question, byDefault) {
  if (!rl) return byDefault
  const hint = byDefault ? '(S/n)' : '(s/N)'
  const answer = (await rl.question(`${question} ${hint} `)).trim().toLowerCase()
  if (!answer) return byDefault
  return ['s', 'si', 'sí', 'y', 'yes'].includes(answer)
}

async function askText(question) {
  if (!rl) return ''
  return (await rl.question(`${question} `)).trim()
}

const { npmCommand } = require(join(SERVER, 'lib', 'npmCommand.js'))
const NPM = npmCommand()

/** Ejecuta npm con argumentos constantes (nunca texto del usuario). */
function runNpm(npmArgs, { cwd = ROOT, env = {}, capture = false } = {}) {
  return spawnSync(NPM.cmd, [...NPM.prefix, ...npmArgs], {
    cwd,
    shell: NPM.shell,
    env: { ...process.env, ...env },
    ...(capture ? { encoding: 'utf8' } : { stdio: 'inherit' }),
  })
}

function run(cmdArgs, { cwd = ROOT, env = {} } = {}) {
  const cmd = 'npm'
  console.log(`\n$ npm ${cmdArgs.join(' ')}${cwd === ROOT ? '' : `   (en ${cwd.replace(ROOT, '.')})`}`)
  const result = runNpm(cmdArgs, { cwd, env })
  if (result.error) {
    console.error(`❌ No se pudo ejecutar ${cmd}: ${result.error.message}`)
    return false
  }
  if (result.status !== 0) {
    console.error(`❌ «${cmd} ${cmdArgs.join(' ')}» ha fallado (código ${result.status}). Revisa el mensaje de arriba.`)
    return false
  }
  return true
}

function finish(code = 0) {
  rl?.close()
  process.exit(code)
}

function step(title) {
  console.log(`\n━━ ${title} ━━`)
}

// --- 1. Node y npm ---------------------------------------------------------------------------
step('1/4 · Comprobando requisitos')
const [major, minor] = process.versions.node.split('.').map(Number)
if (major < 20 || (major === 20 && minor < 19) || (major === 22 && minor < 12) || major === 21) {
  console.error(`❌ Necesitas Node.js 20.19 o superior (o 22.12+). Tienes ${process.versions.node}.`)
  console.error('   Instálalo desde https://nodejs.org (versión LTS) o con nvm: nvm install --lts')
  finish(1)
}
const npmCheck = runNpm(['--version'], { capture: true })
if (npmCheck.status !== 0) {
  console.error('❌ No encuentro npm. Viene con Node.js: reinstala Node desde https://nodejs.org')
  finish(1)
}
console.log(`✅ Node.js ${process.versions.node} y npm ${npmCheck.stdout.trim()}`)

// --- 2. Dependencias de la web -----------------------------------------------------------------
step('2/4 · Web')
if (existsSync(join(ROOT, 'node_modules', 'vite'))) {
  console.log('✅ Dependencias de la web ya instaladas.')
} else if (await ask('Faltan las dependencias de la web. ¿Las instalo ahora con npm ci?', true)) {
  if (!run(['ci', '--no-audit', '--no-fund'])) finish(1)
} else {
  console.log('ℹ️ Cuando quieras: npm ci')
}

// --- 3. Archivo .env ---------------------------------------------------------------------------
step('3/4 · Archivo .env')
const { setEnvValue, parseEnv } = require(join(SERVER, 'lib', 'envFile.js'))
if (existsSync(ENV_PATH)) {
  console.log('✅ Ya tienes un .env: no lo sobrescribo (solo cambiaré lo que configures ahora).')
} else {
  copyFileSync(join(ROOT, '.env.example'), ENV_PATH)
  console.log('✅ Creado .env a partir de .env.example (solo tú puedes leerlo).')
}
try {
  chmodSync(ENV_PATH, 0o600)
} catch {
  /* sistemas sin permisos POSIX */
}
const setEnv = (key, value) => {
  writeFileSync(ENV_PATH, setEnvValue(readFileSync(ENV_PATH, 'utf8'), key, value), { mode: 0o600 })
}

// --- 4. Servidor de WhatsApp (opcional) -------------------------------------------------------------
step('4/4 · Envío automático a WhatsApp (opcional)')
console.log('La web ya comparte por WhatsApp sin esto (botón 🟢). El servidor solo hace falta si quieres que')
console.log('«📲 ENVIAR AL GRUPO» mande el mensaje solo, desde este ordenador.')
const wantsServer = await ask('¿Quieres configurar el envío automático a un grupo de WhatsApp?', false)
if (!wantsServer) {
  console.log('\n🎖️ Listo. Arranca la web con:  npm run dev   y abre http://localhost:5173')
  console.log('   Tu clave de Gemini se pega en la propia web (⚙️ CONFIGURAR API). Sin clave tienes el modo demo.')
  finish(0)
}

const { findChromium, needsSystemChromium } = require(join(SERVER, 'lib', 'chromium.js'))
const { isValidGroupId } = require(join(SERVER, 'lib', 'security.js'))
const envValues = parseEnv(readFileSync(ENV_PATH, 'utf8'))
const chromium = findChromium({
  env: { CHROMIUM_PATH: envValues.get('CHROMIUM_PATH') || process.env.CHROMIUM_PATH || '' },
})

if (needsSystemChromium() && !chromium) {
  console.log('\n⚠️ Este equipo es Linux ARM (por ejemplo una Raspberry Pi) y Puppeteer no trae navegador para él.')
  console.log('   Instala Chromium y vuelve a ejecutar el asistente:')
  console.log('     sudo apt install chromium')
  console.log('     npm run setup')
  finish(0)
}

if (existsSync(join(SERVER, 'node_modules', 'whatsapp-web.js'))) {
  console.log('✅ Dependencias del servidor ya instaladas.')
} else if (chromium) {
  console.log(`✅ Usaré el navegador del sistema: ${chromium}`)
  if (!run(['ci', '--no-audit', '--no-fund'], { cwd: SERVER, env: { PUPPETEER_SKIP_DOWNLOAD: 'true' } })) finish(1)
} else {
  console.log('ℹ️ No hay Chrome/Chromium en el sistema: Puppeteer descargará el suyo (unos 170 MB).')
  if (!(await ask('¿Continúo?', true))) finish(0)
  if (!run(['ci', '--no-audit', '--no-fund'], { cwd: SERVER })) finish(1)
}
if (chromium) setEnv('CHROMIUM_PATH', chromium)

// Token entre la web y el servidor: imprescindible si abres el servidor a la red (HOST=0.0.0.0).
const { ensureServerToken } = require(join(SERVER, 'lib', 'token.js'))
const tokenResult = ensureServerToken(readFileSync(ENV_PATH, 'utf8'))
if (tokenResult.created) {
  writeFileSync(ENV_PATH, tokenResult.text, { mode: 0o600 })
  console.log('✅ Generado un token secreto (SERVER_TOKEN) y compartido con la web local (VITE_SERVER_TOKEN).')
  console.log('   Si abres la web desde otro equipo, no copies el .env: pega el token en ⚙️ CONFIGURAR API → Servidor.')
} else {
  console.log('✅ Ya tienes un token del servidor (SERVER_TOKEN).')
}

let groupId = (envValues.get('WHATSAPP_GROUP_ID') || '').trim()
if (isValidGroupId(groupId)) {
  console.log('✅ Ya tienes un grupo configurado (WHATSAPP_GROUP_ID).')
} else {
  console.log('\nFalta el ID del grupo de WhatsApp (algo como 120363012345678901@g.us).')
  console.log('Si no lo sabes, pulsa Enter: «npm run server:grupos» te enseñará tus grupos y lo guardará por ti.')
  for (;;) {
    const answer = await askText('ID del grupo (Enter para saltar):')
    if (!answer) break
    if (isValidGroupId(answer)) {
      setEnv('WHATSAPP_GROUP_ID', answer)
      groupId = answer
      console.log('✅ Guardado.')
      break
    }
    console.log('❌ Ese ID no tiene el formato «…@g.us». Prueba otra vez o pulsa Enter.')
  }
}

console.log('\n📲 Sobre el código QR: la primera vez que arranques el servidor saldrá un QR en esta terminal.')
console.log('   En el móvil: WhatsApp → Ajustes (⋮ en Android) → Dispositivos vinculados → Vincular un dispositivo,')
console.log('   y apunta la cámara al QR. La sesión queda en server/.wwebjs_auth: es privada, no la compartas.')

console.log('\n🎖️ Listo. Siguientes pasos:')
let n = 1
if (!isValidGroupId(groupId)) console.log(`   ${n++}. npm run server:grupos   (escanea el QR y elige tu grupo)`)
console.log(`   ${n++}. npm run server          (déjalo abierto)`)
console.log(`   ${n}. En otra terminal: npm run dev   y abre http://localhost:5173`)
finish(0)
