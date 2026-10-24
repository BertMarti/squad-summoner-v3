'use strict';
/**
 * Lectura y edición mínima del archivo .env (pura, con pruebas). La usan `npm run setup` y `npm run server:grupos`.
 * Nunca imprime valores: solo sustituye o añade líneas KEY=valor conservando comentarios y el resto.
 */

const KEY = /^[A-Za-z_][A-Za-z0-9_]*$/;
const LINE = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/;

/** Devuelve un Map clave → valor (sin comillas envolventes ni comentarios finales tras espacio). */
function parseEnv(text) {
  const values = new Map();
  for (const line of String(text).split(/\r?\n/)) {
    const match = LINE.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1);
    else value = value.replace(/\s+#.*$/, '');
    values.set(match[1], value);
  }
  return values;
}

/** Sustituye (o añade al final) la línea `key=value`. Rechaza claves raras y valores con saltos de línea. */
function setEnvValue(text, key, value) {
  if (!KEY.test(key)) throw new Error(`Nombre de variable no válido: ${key}`);
  const val = String(value);
  if (/[\r\n\0]/.test(val)) throw new Error('Los valores del .env no pueden contener saltos de línea.');
  const lines = String(text).split(/\r?\n/);
  let replaced = false;
  const out = lines.map((line) => {
    const match = LINE.exec(line);
    if (!match || match[1] !== key) return line;
    if (replaced) return `# ${line}`; // duplicada: se comenta para que no gane la antigua
    replaced = true;
    return `${key}=${val}`;
  });
  if (!replaced) {
    while (out.length > 0 && out[out.length - 1] === '') out.pop();
    out.push(`${key}=${val}`);
  }
  let result = out.join('\n');
  if (!result.endsWith('\n')) result += '\n';
  return result;
}

module.exports = { parseEnv, setEnvValue };
