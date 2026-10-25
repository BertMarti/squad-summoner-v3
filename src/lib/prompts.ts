import type { Mission } from '@/types'
import { normalizeMission } from './mission'
import { TONE_PROMPTS } from './tones'

const DEFAULT_RECRUITS = 'Ciudadanos no alistados'
const DEFAULT_TIME = 'INMEDIATAMENTE'

/** Construye el prompt de Gemini según el juego y el tono elegidos (datos ya saneados). */
export function buildPrompt(raw: Partial<Mission>): string {
  const data = normalizeMission(raw)
  const tone = TONE_PROMPTS[data.tone]
  const base = buildGamePrompt(data)
  return tone ? `${base}\n${tone}` : base
}

function buildGamePrompt(data: Mission): string {
  const recruits = data.recruits || DEFAULT_RECRUITS
  const time = data.time || DEFAULT_TIME

  if (data.game === 'hd2') {
    return `
ROL: Eres un Oficial de la Verdad o el mismísimo General Brasch.
OBJETIVO: Movilizar a "${recruits}" a las ${time}.
INSTRUCCIONES:
1. TONO: PROPAGANDA MÁXIMA. Grita metafóricamente (Mayúsculas).
2. Insulta a los enemigos (Tostadoras, Bichos).
3. Usa frases como "LIBER-TÉ" y "Democracia Gestionada".
4. CIERRE: "¡POR LA SUPER TIERRA!".
FORMATO: Mensaje de WhatsApp corto y explosivo.`.trim()
  }

  if (data.game === 'sm2') {
    return `
ROL: Capellán de los Ultramarines o Comisario Imperial.
OBJETIVO: Convocar a "${recruits}" a las ${time}.
INSTRUCCIONES:
1. TONO: Grimdark, solemne, fanático. "EL EMPERADOR PROTEGE".
2. Impuntualidad = Herejía.
3. Insulta a Xenos (Tiránidos) y Herejes.
4. FORMATO DATA-SLATE: Usa "+++ TRANSMISIÓN +++".
5. CIERRE: "Pensamiento del día" y "¡CORAJE Y HONOR!".`.trim()
  }

  if (data.game === 'mh') {
    const version = data.subGame ? ` (${data.subGame})` : ''
    return `
ROL: Comandante o Encargada de Monster Hunter${version}.
OBJETIVO: Caza con "${recruits}" a las ${time}.
INSTRUCCIONES:
1. Tono aventurero y hambriento.
2. Menciona comer en la cantina y afilar armas.
3. CIERRE: "¡Feliz Caza!".`.trim()
  }

  if (data.game === 'drg') {
    return `
ROL: Controladora de misión de Deep Rock Galactic (la Compañía) hablando por radio con sus enanos mineros.
OBJETIVO: Bajar con "${recruits}" a las ${time}.
INSTRUCCIONES:
1. TONO: Camaradería minera, gritos de taberna espacial y burocracia corporativa.
2. Menciona la cervecería del Espacio de Puesta en Marcha, las cuotas de minerales y los bichos (glyphids).
3. Usa "¡Rock and Stone!" y que nadie se quede atrás en la cápsula de escape.
4. CIERRE: "¡ROCK AND STONE!".
FORMATO: Mensaje de WhatsApp corto y con energía.`.trim()
  }

  if (data.game === 'd2') {
    return `
ROL: Un Espectro (Ghost) o un comandante de la Torre de Destiny 2 hablando a sus Guardianes.
OBJETIVO: Reunir a "${recruits}" en la Torre a las ${time}.
INSTRUCCIONES:
1. TONO: Ciencia ficción épica y misteriosa, con la Luz como hilo conductor.
2. Menciona la escuadra de seis, el botín y que la Oscuridad no espera.
3. Pide puntualidad para no hacer cola en la órbita.
4. CIERRE: "Ojos arriba, Guardianes.".
FORMATO: Mensaje de WhatsApp corto.`.trim()
  }

  const gameName = data.customGameName || 'Videojuego Épico'
  return `Actúa como narrador de "${gameName}". Convoca a "${recruits}" a las ${time}. Sé inmersivo. Formato: mensaje de WhatsApp corto.`
}

/** Prompt para resumir un texto a guion de audio corto (TTS). */
export function buildAudioPrompt(fullText: string, gameId: string): string {
  let style = 'Estilo: Narrador épico de tráiler de cine.'
  if (gameId === 'sm2') style = 'Estilo: Transmisión Vox-caster militar distorsionada. Corto, grave, sin emojis.'
  else if (gameId === 'hd2') style = 'Estilo: Megafonía de propaganda eufórica. ¡Grita por la libertad! Sin emojis.'
  else if (gameId === 'mh') style = 'Estilo: Animado y aventurero. Sin emojis.'
  return `${style}
TAREA: Convierte el siguiente texto en un guion de audio MUY CORTO (máx 300 caracteres).
TEXTO ORIGINAL: """${fullText.slice(0, 4000)}"""
REGLA: Solo devuelve el texto plano a leer. Nada de formatos ni emojis.`
}
