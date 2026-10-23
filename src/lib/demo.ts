import type { Mission } from '@/types'
import { normalizeMission, type GameId } from './mission'

/** Cabecera que marca SIEMPRE los textos de ejemplo (no generados por IA). */
export const DEMO_BANNER = '🧪 [MODO DEMO · texto de ejemplo, no generado por IA]'

type Template = (r: string, t: string, extra: string) => string

/** Plantillas de ejemplo por juego. `r` = reclutas, `t` = hora, `extra` = versión/juego. */
export const DEMO_TEMPLATES: Record<GameId, Template[]> = {
  hd2: [
    (r, t) => `📢 ¡ATENCIÓN, ${r.toUpperCase()}! ¡LA SUPER TIERRA OS NECESITA!\n\nLas tostadoras avanzan y los bichos se reproducen mientras vosotros… ¿descansáis? ¡INACEPTABLE!\n\n🛰️ Despliegue orbital a las ${t}. Puntualidad = LIBER-TÉ. Retraso = reeducación democrática.\n\n¡POR LA SUPER TIERRA! 🦅`,
    (r, t) => `⚠️ ALERTA DEL MINISTERIO DE LA VERDAD ⚠️\n\n${r}: vuestra Democracia Gestionada ha sido programada para las ${t}.\nTraed estratagemas, capas y cero miedo. Los bichos no se van a exterminar solos.\n\n¡POR LA SUPER TIERRA!`,
  ],
  sm2: [
    (r, t) => `+++ TRANSMISIÓN DEL ADMINISTRATUM +++\n\nPor decreto del Capítulo, ${r} deben presentarse en el puente de mando a las ${t}.\nLa impuntualidad será tratada como herejía. Los xenos no esperan; el Emperador tampoco.\n\nPensamiento del día: «Un momento de duda es una vida de condenación».\n¡CORAJE Y HONOR! ⚔️`,
    (r, t) => `+++ DATA-SLATE · PRIORIDAD EXTREMIS +++\n\nHermanos de batalla ${r}: la plaga tiránida se extiende.\nDespliegue a las ${t}. Purgad, quemad, matad.\n\nEL EMPERADOR PROTEGE. ¡CORAJE Y HONOR!`,
  ],
  mh: [
    (r, t, v) => `🍖 ¡Cazadores ${r}! La Encargada tiene una misión urgente${v ? ` en ${v}` : ''}.\n\nNos vemos en la cantina a las ${t}: banquete, armas afiladas y pociones a rebosar.\nUn monstruo enorme ronda la zona y no se va a cazar solo.\n\n¡Feliz caza! 🐾`,
    (r, t, v) => `📜 TABLÓN DE MISIONES${v ? ` · ${v.toUpperCase()}` : ''}\n\nSe busca: ${r}.\nHora de partida: ${t}.\nRecompensa: materiales raros y gloria eterna.\n\nAcordaos de comer antes de salir. ¡Feliz caza!`,
  ],
  custom: [
    (r, t, g) => `🎮 CONVOCATORIA ÉPICA · ${g.toUpperCase()}\n\n${r}: el destino del mundo de ${g} está en vuestras manos.\nLa partida empieza a las ${t}. Quien llegue tarde, se queda sin botín.\n\n¡A las armas! 🔥`,
  ],
}

/**
 * Genera una transmisión de ejemplo sin IA ni red. `pick` permite elegir la
 * plantilla (útil en tests); por defecto es aleatoria.
 */
export function generateDemoMessage(raw: Partial<Mission>, pick: (n: number) => number = n => Math.floor(Math.random() * n)): string {
  const m = normalizeMission(raw)
  const game: GameId = m.game || 'custom'
  const templates = DEMO_TEMPLATES[game]
  const index = Math.min(Math.max(pick(templates.length), 0), templates.length - 1)
  const recruits = m.recruits || 'escuadrón'
  const time = m.time || 'YA MISMO'
  const extra = game === 'mh' ? m.subGame : m.customGameName || 'tu juego'
  return `${DEMO_BANNER}\n\n${templates[index]!(recruits, time, extra)}`
}
