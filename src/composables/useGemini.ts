import { ref } from 'vue';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Lista de juegos centralizada
export const GAMES = [
  { id: 'sm2', title: 'Space Marine 2', icon: '⚔️', img: 'https://cdn.akamai.steamstatic.com/steam/apps/2183900/header.jpg' },
  { id: 'hd2', title: 'Helldivers 2', icon: '🏴', img: 'https://cdn.akamai.steamstatic.com/steam/apps/553850/header.jpg' },
  { id: 'mh', title: 'Monster Hunter', icon: '🐾', img: 'https://cdn.akamai.steamstatic.com/steam/apps/582010/header.jpg' },
  { id: 'custom', title: 'Personalizado', icon: '🖊️', img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=300' }
];

export function useGemini() {
  const isGenerating = ref(false);

  const buildPrompt = (data: any) => {
    const recruits = data.recruits || "Ciudadanos no alistados";
    const time = data.time || "INMEDIATAMENTE";
    
    // 1. HELLDIVERS 2 (VERSIÓN OPTIMIZADA: SÁTIRA MÁXIMA)
    if (data.game === 'hd2') {
      return `
        ROL: Eres un Oficial de la Verdad o el mismísimo General Brasch, sumamente intenso, fanático y saturado de patriotismo.
        OBJETIVO: Movilizar a los Helldivers "${recruits}" para una inmersión inmediata.

        INSTRUCCIONES DE SÁTIRA Y LORE (NIVEL MÁXIMO):
        1. TONO: Eres pura PROPAGANDA. Grita metafóricamente. Usa mayúsculas para conceptos sagrados como LIBERTAD, DEMOCRACIA GESTIONADA y SUPER TIERRA.
        2. LA HORA CERO: El despliegue es a las ${time}. Insinúa que llegar tarde es un acto de "Pensamiento Traidor" castigado con reeducación.
        3. ENEMIGOS: Insulta creativamente a los enemigos de la Libertad:
           - Autómatas: "Tostadoras socialistas", "Chatarra sin alma", "Calculadoras oxidadas".
           - Termínidos: "Bichos fascistas", "Fuente de E-710", "Plaga antidemocrática".
        4. REFERENCIAS OBLIGATORIAS (Usa al menos 2):
           - "Invítales a una taza de LIBER-TÉ bien caliente".
           - "¡Qué tal una buena taza de LIBER-TÉ!".
           - "Repartir votos a 900 disparos por minuto".
           - "Tu capa no se va a manchar sola de aceite".
        5. ESTRATAGEMAS: Si encaja, inserta códigos visuales como "⬆️➡️⬇️⬇️⬇️" (Bomba 500kg) o menciona pedir una Hellbomb.
        6. CIERRE OBLIGATORIO: "¡POR LA SUPER TIERRA!", "¡DULCE LIBERTAD!" o "¡NOS VEMOS EN EL INFIERNO, HELLDIVERS!".

        FORMATO: Genera un mensaje para WhatsApp corto, explosivo, divertido y absurdo. Que den ganas de alistarse o morir en el intento.
      `;
    }

    // 2. SPACE MARINE 2
    if (data.game === 'sm2') {
      return `
        Actúa estrictamente como un **Logos-Historican de Alto Rango del Adeptus Administratum** o un **Lord Inquisidor del Ordo Hereticus** (según el contexto del mensaje).

        **TUS REGLAS OBLIGATORIAS:**
        1.  **CERO DESCIPCIONES VISUALES:** Está terminantemente prohibido usar corchetes para describir imágenes (ej: NO USES [IMAGEN...], ni *Se ve un pergamino*).
        2.  **FORMATO DE DATA-SLATE:** El texto debe parecer una transmisión de datos puramente textual de una terminal cogitadora arcaica. Usa separadores como "+++", "///", o "===".
        3.  **TONO:** Autoritario, fanático, burocrático, oscuro y grandilocuente. Usa terminología de Warhammer 40k (Alto Gótico, referencias al Trono Dorado, niveles de autorización, sellos de pureza).
        4.  **FECHA IMPERIAL:** Usa siempre el formato de fecha imperial (ej: 0.145.024.M42).
        5.  **ENCABEZADO Y PIE:** Comienza siempre con credenciales de encriptación y termina con el "Pensamiento del Día".

        **OBJETIVO:**
        Generar un mensaje que parezca extraído directamente de un archivo confidencial de Terra. No describas el archivo, *escribe* el contenido del archivo.
      `;
    }

    // 3. MONSTER HUNTER
    if (data.game === 'mh') {
      const version = data.subGame ? `Monster Hunter ${data.subGame}` : "Monster Hunter";
      return `
        Actúa como el animado Comandante o la Encargada (Handler) de ${version}.
        Tu misión es reunir al equipo de caza formado por: "${recruits}".

        INSTRUCCIONES DE CAZA:
        1. El tono debe ser aventurero, cooperativo, hambriento y con sentido de urgencia.
        2. Cita a los cazadores a las ${time} en la Cantina o la Sala de Reunión.
        3. Referencias obligatorias: "Afilad vuestras armas", "Comed antes de salir", "No olvidéis las bombas boñiga".
        4. Menciona monstruos icónicos como Rathalos, Diablos o un Dragón Anciano.
        5. Haz bromas sobre "desmayarse" (el carrito de los gatos).
        6. Termina OBLIGATORIAMENTE con: "¡Feliz Caza!" o "¡Que la Estrella Azul os guíe!".

        Genera un mensaje divertido y motivador.
      `;
    }

    // 4. GENÉRICO / CUSTOM
    const gameName = data.customGameName || "un videojuego épico";
    return `
      Actúa como el personaje más icónico o narrador de "${gameName}".
      Tu misión es convencer a los jugadores "${recruits}" para entrar al juego a las ${time}.
      Sé muy inmersivo. No rompas el personaje. Usa jerga del juego.
    `;
  };

  // Llamada a la API
  const generateText = async (apiKey: string, data: any) => {
    if (!apiKey) throw new Error("Falta API KEY");
    
    isGenerating.value = true;
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = buildPrompt(data);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      throw new Error(error.message || "Error al conectar con la IA");
    } finally {
      isGenerating.value = false;
    }
  };

  return { isGenerating, generateText, GAMES };
}