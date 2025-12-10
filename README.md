# squad-summoner-v3

[![Vite](https://img.shields.io/badge/Vite-frontend-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Vue 3](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-backend-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-server-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![WhatsApp Bot](https://img.shields.io/badge/whatsapp--web.js-bot-25D366?logo=whatsapp&logoColor=white)](https://github.com/pedroslopez/whatsapp-web.js)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-IA-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)

Protocolo de Invocación Táctica v3.0 — *"No mandes un simple '¿jugamos?'. Manda una orden de movilización orbital."*

## 📖 ¿Qué es Squad Summoner?

**Squad Summoner** es una herramienta diseñada para gamers que necesitan **convencer a su escuadrón para jugar**.  
Olvídate de los mensajes aburridos. Esta aplicación utiliza la IA de **Google Gemini** para generar *discursos épicos*, *propaganda militar* o *misiones de caza inmersivas* y enviarlas automáticamente a tu grupo de WhatsApp.

## 🚀 Características Principales

- 🎭 **Motor de Rol con IA**: Genera mensajes únicos basados en el lore de tus juegos favoritos:
  - **Helldivers 2**: Propaganda satírica por la Democracia Gestionada.
  - **Space Marine 2**: Decretos góticos del Administratum (Warhammer 40k).
  - **Monster Hunter**: Llamadas a la caza desde la Cantina.
  - **Modo Libre**: Tú eliges el juego, la IA pone el rol.
- 📲 **Integración WhatsApp Real**: Backend dedicado que se conecta a tu cuenta y envía el mensaje al grupo elegido.
- 💻 **Terminal Táctica**: Interfaz visual reactiva con temas Claro/Oscuro y estética Cyberpunk/Militar.
- 🔒 **Gestión de API Key**: Usa tu propia Key de Gemini (guardada localmente) o configúrala en el entorno.

---

## 🛠️ Stack Tecnológico

```
┌─────────────────────────────────────────────────────────┐
│          SQUAD SUMMONER v3.0 — STACK COMPLETO          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🎨 FRONTEND                                            │
│  ├─ Vue 3 (Composition API + Script Setup)              │
│  ├─ TypeScript (Type Safety)                            │
│  ├─ Vite (Build Tool & Dev Server)                      │
│  ├─ Pinia (State Management)                            │
│  └─ CSS3 (Flex, Grid, Animations)                       │
│                                                         │
│  🤖 IA & PROCESAMIENTO                                  │
│  ├─ Google Gemini 2.5 Flash (Generación de Texto)       │
│  └─ Prompts + Role-Playing Tactics                      │
│                                                         │
│  🖥️  BACKEND                                             │
│  ├─ Node.js (Runtime)                                   │
│  ├─ Express (REST API Server)                           │
│  ├─ whatsapp-web.js (Bot Integration)                   │
│  └─ QR Code Terminal (Auth)                             │
│                                                         │
│  💾 UTILIDADES                                          │
│  ├─ Dotenv (Gestión de Secrets)                         │
│  ├─ CORS (Cross-Origin Requests)                        │
│  └─ Git (Version Control)                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Módulos Tácticos

- **Frontend (Centro de Mando)**: Hecho con **Vue 3 + TypeScript**. Es la interfaz donde seleccionas el juego, los reclutas y la hora.
- **Backend (Torre de Comunicaciones)**: Servidor **Node.js + Express** usando **whatsapp-web.js**. Gestiona la conexión QR y el envío de mensajes.

---

## ⚡ Guía de Despliegue Rápido

### 1. Prerrequisitos

- Node.js (v16 o superior).
- Una API Key de **Google Gemini** (Google AI Studio).
- Una cuenta de WhatsApp activa en tu móvil.

### 2. Instalación y Configuración

Clona el repositorio y prepara los suministros:

```sh
git clone https://github.com/tu-usuario/squad-summoner.git
cd squad-summoner
```

### A. Configurar el Frontend (Vue)

```sh
npm install
touch .env
```

Edita el archivo `.env` en la raíz y añade tu Key de Google (opcional, también se puede poner desde la UI):

```env
VITE_GOOGLE_API_KEY=tu_api_key_aqui
```

### B. Configurar el Backend (Servidor WhatsApp)

El backend suele vivir en una carpeta separada (ej. `server`) o en la raíz si es monorepo. Asumiendo que `index.js` es tu servidor:

```sh
npm install express whatsapp-web.js qrcode-terminal cors dotenv
```

Añade el ID de tu grupo de WhatsApp al `.env` (el backend puede leer el mismo `.env` o uno propio):

```env
WHATSAPP_GROUP_ID=123456789-group@g.us
PORT=3000
```

> 💡 Para saber el ID del grupo, el servidor hará log de los chats al iniciar.

---

## 🎮 Manual de Operaciones

### 1. Iniciar la Torre de Comunicaciones (Backend)

```sh
node index.js
```

- La primera vez, verás un **Código QR** en la terminal.  
- Escanéalo con tu WhatsApp (Dispositivos vinculados).  
- Una vez veas `✅ Cliente WhatsApp LISTO`, el sistema está en línea.

### 2. Lanzar el Centro de Mando (Frontend)

```sh
npm run dev
```

- Abre el navegador en la URL que te indique (ej. `http://localhost:5173`).

### 3. Ejecutar Misión

1. Selecciona el **Teatro de Operaciones** (Juego).  
2. Introduce los **Nombres de los Reclutas** y la **Hora de Inserción**.  
3. Pulsa **"📢 GENERAR TRANSMISIÓN"**.  
4. Observa cómo la IA redacta la orden en la terminal.  
5. El mensaje se enviará automáticamente a tu grupo de WhatsApp.

---

## 📂 Estructura de Archivos

```txt
/
├── src/
│   ├── components/
│   │   ├── GameSelector.vue   # Selección visual de juegos
│   │   ├── TerminalOutput.vue # Pantalla de texto retro
│   │   └── ...
│   ├── composables/
│   │   └── useGemini.ts       # Lógica de IA y Prompts
│   └── App.vue                # Núcleo de la aplicación
├── index.js                   # Servidor Express & Bot WhatsApp
├── .env                       # Secretos (No subir a GitHub)
└── package.json
```

---

## 🛡️ Aviso Legal

Este proyecto utiliza librerías de terceros para la automatización de WhatsApp. Úsalo con responsabilidad y evita el spam.  
El Administratum no se hace responsable de bloqueos por parte de Meta.

**SQUAD SUMMONER** no está afiliado con Arrowhead Game Studios, Capcom o Games Workshop.

---
