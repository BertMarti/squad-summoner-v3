'use strict';
/**
 * Cómo lanzar npm desde `npm run setup` sin depender de la plataforma.
 * - Si el script se ejecuta con `npm run`, npm deja su ruta en `npm_execpath`: se lanza `node <npm-cli.js> …`
 *   (sin shell, también en Windows).
 * - Si no (p. ej. `node scripts/setup.mjs`), se usa `npm` y, solo en Windows, `shell: true`: desde Node 20.12.2
 *   `spawnSync('npm.cmd')` sin shell falla con EINVAL. Los argumentos son siempre constantes del script.
 */
function npmCommand({ execPath = process.execPath, npmExecPath = process.env.npm_execpath, platform = process.platform } = {}) {
  if (npmExecPath && /\.(c|m)?js$/i.test(npmExecPath) && npmExecPath.split(/[\\/]/).pop().toLowerCase().startsWith('npm')) {
    return { cmd: execPath, prefix: [npmExecPath], shell: false };
  }
  return { cmd: 'npm', prefix: [], shell: platform === 'win32' };
}

module.exports = { npmCommand };
