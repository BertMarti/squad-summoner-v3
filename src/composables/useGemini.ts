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

  // --- 1. CONSTRUCTOR DE PROMPTS DE TEXTO ---
  const buildPrompt = (data: any) => {
    const recruits = data.recruits || "Ciudadanos no alistados";
    const time = data.time || "INMEDIATAMENTE";
    
    // HELLDIVERS 2
    if (data.game === 'hd2') {
      return `
        ROL: Eres un Oficial de la Verdad o el mismísimo General Brasch.
        OBJETIVO: Movilizar a "${recruits}" a las ${time}.
        INSTRUCCIONES:
        1. TONO: PROPAGANDA MÁXIMA. Grita metafóricamente (Mayúsculas).
        2. Insulta a los enemigos (Tostadoras, Bichos).
        3. Usa frases como "LIBER-TÉ" y "Democracia Gestionada".
        4. CIERRE: "¡POR LA SUPER TIERRA!".
        FORMATO: Mensaje de WhatsApp corto y explosivo.
      `;
    }

    // SPACE MARINE 2
    if (data.game === 'sm2') {
      return `
        ROL: Capellán de los Ultramarines o Comisario Imperial.
        OBJETIVO: Convocar a "${recruits}" a las ${time}.
        INSTRUCCIONES:
        1. TONO: Grimdark, solemne, fanático. "EL EMPERADOR PROTEGE".
        2. Impuntualidad = Herejía.
        3. Insulta a Xenos (Tiránidos) y Herejes.
        4. FORMATO DATA-SLATE: Usa "+++ TRANSMISIÓN +++".
        5. CIERRE: "Pensamiento del día" y "¡CORAJE Y HONOR!".
      `;
    }

    // MONSTER HUNTER
    if (data.game === 'mh') {
      return `
        ROL: Comandante o Encargada de Monster Hunter.
        OBJETIVO: Caza con "${recruits}" a las ${time}.
        INSTRUCCIONES:
        1. Tono aventurero y hambriento.
        2. Menciona comer en la cantina y afilar armas.
        3. CIERRE: "¡Feliz Caza!".
      `;
    }

    // CUSTOM
    const gameName = data.customGameName || "Videojuego Épico";
    return `Actúa como narrador de ${gameName}. Convoca a ${recruits} a las ${time}. Sé inmersivo.`;
  };

  // --- 2. GENERAR TEXTO (WHATSAPP) ---
  const generateText = async (apiKey: string, data: any) => {
    if (!apiKey) throw new Error("Falta API KEY");
    
    isGenerating.value = true;
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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

  // --- 3. RESUMIR PARA AUDIO (Script de Radio) ---
  const summarizeForAudio = async (apiKey: string, fullText: string, gameId: string) => {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let styleInstruction = "";
    if (gameId === 'sm2') styleInstruction = "Estilo: Transmisión Vox-caster militar distorsionada. Corto, grave, sin emojis.";
    else if (gameId === 'hd2') styleInstruction = "Estilo: Megafonía de propaganda eufórica. ¡Grita por la libertad! Sin emojis.";
    else if (gameId === 'mh') styleInstruction = "Estilo: Animado y aventurero. Sin emojis.";
    else styleInstruction = "Estilo: Narrador épico de tráiler de cine.";

    const prompt = `
      ${styleInstruction}
      TAREA: Convierte el siguiente texto en un guion de audio MUY CORTO (máx 300 caracteres).
      TEXTO ORIGINAL: "${fullText}"
      REGLA: Solo devuelve el texto plano a leer. Nada de formatos ni emojis.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  };

  // --- 4. GENERAR AUDIO (TTS) ---
  const generateAudio = async (apiKey: string, textToSpeak: string) => {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: textToSpeak }] }],
      });

      const response = result.response;
      
      // SOLUCIÓN A LOS ERRORES DE TYPESCRIPT:
      // Usamos encadenamiento opcional (?.) para verificar cada nivel de profundidad
      // antes de intentar acceder al siguiente.
      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (audioData) {
         return audioData;
      }
      
      throw new Error("No se recibieron datos de audio válidos del modelo.");
      
    } catch (err) {
      console.error("Error TTS:", err);
      return null;
    }
  };

  return { isGenerating, generateText, summarizeForAudio, generateAudio, GAMES };
}