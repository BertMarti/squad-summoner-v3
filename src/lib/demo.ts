import type { Mission } from '@/types'
import { GAME_TITLES, isGameId, normalizeMission, type GameId } from './mission'
import type { ToneId } from './tones'

/** Cabecera que marca SIEMPRE los textos de ejemplo (no generados por IA). */
export const DEMO_BANNER = '🧪 [MODO DEMO · texto de ejemplo, no generado por IA]'

type Template = (r: string, t: string, extra: string) => string

/** Plantillas de ejemplo por juego. `r` = reclutas, `t` = hora, `extra` = versión/juego. */
export const DEMO_TEMPLATES: Record<GameId, Template[]> = {
  hd2: [
    (r, t) =>
      `📢 ¡ATENCIÓN, ${r.toUpperCase()}! ¡LA SUPER TIERRA OS NECESITA!\n\nLas tostadoras avanzan y los bichos se reproducen mientras vosotros… ¿descansáis? ¡INACEPTABLE!\n\n🛰️ Despliegue orbital a las ${t}. Puntualidad = LIBER-TÉ. Retraso = reeducación democrática.\n\n¡POR LA SUPER TIERRA! 🦅`,
    (r, t) =>
      `⚠️ ALERTA DEL MINISTERIO DE LA VERDAD ⚠️\n\n${r}: vuestra Democracia Gestionada ha sido programada para las ${t}.\nTraed estratagemas, capas y cero miedo. Los bichos no se van a exterminar solos.\n\n¡POR LA SUPER TIERRA!`,
  ],
  sm2: [
    (r, t) =>
      `+++ TRANSMISIÓN DEL ADMINISTRATUM +++\n\nPor decreto del Capítulo, ${r} deben presentarse en el puente de mando a las ${t}.\nLa impuntualidad será tratada como herejía. Los xenos no esperan; el Emperador tampoco.\n\nPensamiento del día: «Un momento de duda es una vida de condenación».\n¡CORAJE Y HONOR! ⚔️`,
    (r, t) =>
      `+++ DATA-SLATE · PRIORIDAD EXTREMIS +++\n\nHermanos de batalla ${r}: la plaga tiránida se extiende.\nDespliegue a las ${t}. Purgad, quemad, matad.\n\nEL EMPERADOR PROTEGE. ¡CORAJE Y HONOR!`,
  ],
  mh: [
    (r, t, v) =>
      `🍖 ¡Cazadores ${r}! La Encargada tiene una misión urgente${v ? ` en ${v}` : ''}.\n\nNos vemos en la cantina a las ${t}: banquete, armas afiladas y pociones a rebosar.\nUn monstruo enorme ronda la zona y no se va a cazar solo.\n\n¡Feliz caza! 🐾`,
    (r, t, v) =>
      `📜 TABLÓN DE MISIONES${v ? ` · ${v.toUpperCase()}` : ''}\n\nSe busca: ${r}.\nHora de partida: ${t}.\nRecompensa: materiales raros y gloria eterna.\n\nAcordaos de comer antes de salir. ¡Feliz caza!`,
  ],
  drg: [
    (r, t) =>
      `⛏️ CONTROL DE MISIÓN A ENANOS ${r.toUpperCase()}\n\nLa Compañía exige su cuota de minerales y los glyphids no se van a exterminar solos.\nCápsula de descenso a las ${t}. La cerveza de la vuelta la pagan los que lleguen tarde.\n\n¡ROCK AND STONE! 🍺`,
    (r, t) =>
      `📻 AVISO DEL ESPACIO DE PUESTA EN MARCHA\n\n${r}: hay oro, hay nitra y hay bichos. Mucho de lo tercero.\nNos vemos en la cervecería a las ${t}. Nadie se queda atrás en la cápsula.\n\n¡Por Karl! ¡ROCK AND STONE!`,
  ],
  d2: [
    (r, t) =>
      `🌌 MENSAJE DE TU ESPECTRO\n\nGuardianes ${r}: la Oscuridad se mueve y la Torre os necesita.\nEscuadra en órbita a las ${t}. Traed munición pesada y vuestra mejor Luz.\n\nOjos arriba, Guardianes. ✨`,
    (r, t) =>
      `🛰️ ORDEN DE LA VANGUARDIA\n\n${r}: hay botín exótico esperando y no se va a saquear solo.\nReunión en la Torre a las ${t}. Quien llegue tarde se queda con los engramas comunes.\n\nOjos arriba, Guardianes.`,
  ],
  custom: [
    (r, t, g) =>
      `🎮 CONVOCATORIA ÉPICA · ${g.toUpperCase()}\n\n${r}: el destino del mundo de ${g} está en vuestras manos.\nLa partida empieza a las ${t}. Quien llegue tarde, se queda sin botín.\n\n¡A las armas! 🔥`,
  ],
}

type ToneTemplate = (r: string, t: string, game: string) => string

/** Plantillas por tono (válidas para cualquier juego). El tono épico usa las del juego. */
export const DEMO_TONE_TEMPLATES: Record<Exclude<ToneId, 'epico'>, ToneTemplate[]> = {
  cutre: [
    (r, t, g) =>
      `📢 CONVOCATORIA OFICIAL (más o menos) · ${g.toUpperCase()}\n\n${r}: a las ${t} se juega. El cuartel general es mi salón, la armadura es el pijama y el presupuesto de la misión son dos bolsas de pipas.\n\nSi venís, guay. Traed cascos que funcionen. 🪫`,
    (r, t, g) =>
      `🪫 TRANSMISIÓN DE SALDO\n\nAtención ${r}: partida de ${g} a las ${t}.\nNo hay épica, no hay música de tráiler, solo un micro que pita.\n\nAun así: ¡a las armas! (o al sofá, que pilla más cerca)`,
  ],
  pasivo: [
    (r, t, g) =>
      `🙂 Hola, ${r}.\n\nSolo comentar que hoy a las ${t} hay partida de ${g}. Sin presión, ¿eh? Si tenéis cosas más importantes lo entiendo perfectamente. Como la última vez.\n\nYo estaré ahí. Como siempre. 🙂`,
    (r, t, g) =>
      `📝 Recordatorio amistoso\n\n${r}: partida de ${g} a las ${t}.\nNo hace falta confirmar, ya sé que leer mensajes cuesta mucho. Dejaré vuestro hueco libre, por si acaso os acordáis.\n\nUn abrazo (de verdad, eh). 🙂`,
  ],
}

/**
 * Genera una transmisión de ejemplo sin IA ni red. `pick` permite elegir la
 * plantilla (útil en tests); por defecto es aleatoria.
 */
export function generateDemoMessage(
  raw: Partial<Mission>,
  pick: (n: number) => number = (n) => Math.floor(Math.random() * n),
): string {
  const m = normalizeMission(raw)
  const game: GameId = isGameId(m.game) ? m.game : 'custom'
  const templates = DEMO_TEMPLATES[game]
  const recruits = m.recruits || 'escuadrón'
  const time = m.time || 'YA MISMO'
  if (m.tone !== 'epico') {
    const toneTemplates = DEMO_TONE_TEMPLATES[m.tone]
    const i = Math.min(Math.max(pick(toneTemplates.length), 0), toneTemplates.length - 1)
    const gameName = game === 'custom' ? m.customGameName || 'tu juego' : GAME_TITLES[game]
    return `${DEMO_BANNER}\n\n${toneTemplates[i]!(recruits, time, gameName)}`
  }
  const index = Math.min(Math.max(pick(templates.length), 0), templates.length - 1)
  const extra = game === 'mh' ? m.subGame : m.customGameName || 'tu juego'
  return `${DEMO_BANNER}\n\n${templates[index]!(recruits, time, extra)}`
}
