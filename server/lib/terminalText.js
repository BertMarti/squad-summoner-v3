'use strict';

/**
 * Texto que viene de fuera (nombres de grupos de WhatsApp) y se va a imprimir en la terminal: sin secuencias
 * ANSI/escape (podrían borrar la pantalla o falsear lo que ves), sin caracteres de control ni marcas bidi, y corto.
 */
function safeTerminalText(value, max = 60) {
  return (
    String(value || '(sin nombre)')
      // eslint-disable-next-line no-control-regex
      .replace(/[\u001b\u009b][[\]()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><~]/g, '')
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g, '')
      .slice(0, max) || '(sin nombre)'
  );
}

module.exports = { safeTerminalText };
